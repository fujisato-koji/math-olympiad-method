#!/usr/bin/env python3
"""地図（roadmap.yaml）と問題（units/*.yaml）を確かめ、表示用のデータを作る。

  python tools/roadmap.py check   確かめるだけ
  python tools/roadmap.py build   確かめてから site/data.js と docs/roadmap.md を作り直す
"""
import json
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
ID_RE = re.compile(r"^([A-Z])(\d)-(\d\d)$")
PARTS = ("見本", "思い出す", "今日", "挑戦")


def default_plan(n):
    return ["導入"] + ["練習"] * (n - 3) + ["混ぜる", "確認"]


def load():
    data = yaml.safe_load((ROOT / "roadmap.yaml").read_text(encoding="utf-8"))
    problems = {}
    for p in sorted((ROOT / "units").glob("*.yaml")):
        problems[p.stem] = yaml.safe_load(p.read_text(encoding="utf-8"))
    cov = ROOT / "coverage.yaml"
    data["coverage"] = yaml.safe_load(cov.read_text(encoding="utf-8")) if cov.exists() else None
    return data, problems


def check_coverage(cov, units):
    """網羅表：どの論題にも、受け持つ単元（units）か、入れない理由（none）がある。"""
    errors, seen = [], set()
    for item in cov.get("items", []):
        iid = item.get("id", "?")
        if iid in seen:
            errors.append(f"網羅表 {iid}: 二重")
        seen.add(iid)
        if bool(item.get("units")) == bool(item.get("none")):
            errors.append(f"網羅表 {iid}: units か none のどちらか一方を書く")
        for uid in item.get("units") or []:
            if uid not in units:
                errors.append(f"網羅表 {iid}: 単元 {uid} が地図にない")
        for s in item.get("sources") or []:
            if s not in cov.get("sources", {}):
                errors.append(f"網羅表 {iid}: 出典 {s} が sources にない")
    return errors


def expand(unit):
    """plan を [{kind, aim}] にそろえる。"""
    if "plan" in unit:
        return [{"kind": k, "aim": v} for d in unit["plan"] for k, v in d.items()]
    return [{"kind": k, "aim": ""} for k in default_plan(unit["days"])]


def run_check(item, fig):
    """問題の check 式を評価する。fig は図の文字列、n(c) は図の中の c の数。"""
    env = {"__builtins__": {}, "fig": fig, "n": lambda c: fig.count(c), "min": min,
           "max": max, "len": len, "sorted": sorted, "sum": sum, "range": range}
    return eval(item["check"], env)


def check(data, problems):
    errors = []
    lanes = {l["id"] for l in data["lanes"]}
    stages = {s["id"] for s in data["stages"]}
    kinds = set(data["kinds"])
    units = {}
    for u in data["units"]:
        uid = u["id"]
        m = ID_RE.match(uid)
        if not m:
            errors.append(f"{uid}: 記号の形が違う")
            continue
        if uid in units:
            errors.append(f"{uid}: 二重")
        lane, stage = m.group(1), int(m.group(2))
        if lane not in lanes:
            errors.append(f"{uid}: 流れ {lane} がない")
        if stage not in stages:
            errors.append(f"{uid}: 段 {stage} がない")
        if "plan" in u and "days" in u and len(u["plan"]) != u["days"]:
            errors.append(f"{uid}: plan と days の日数が違う")
        if "plan" not in u and u.get("days", 0) < 3:
            errors.append(f"{uid}: 日数は 3 日以上")
        for d in expand(u):
            if d["kind"] not in kinds:
                errors.append(f"{uid}: 日の種類 {d['kind']} がない")
        units[uid] = (lane, stage, u)
    for uid, (_, stage, u) in units.items():
        for need in u.get("needs", []):
            if need not in units:
                errors.append(f"{uid}: 前提 {need} がない")
            elif units[need][1] > stage:
                errors.append(f"{uid}: 前提 {need} が後の段にある")
    # 前提の輪
    state = {}

    def visit(uid, path):
        if state.get(uid) == 1:
            errors.append("前提が輪になっている: " + " → ".join(path + [uid]))
            return
        if state.get(uid) == 2 or uid not in units:
            return
        state[uid] = 1
        for need in units[uid][2].get("needs", []):
            visit(need, path + [uid])
        state[uid] = 2

    for uid in units:
        visit(uid, [])
    # 問題
    for uid, doc in problems.items():
        if uid not in units:
            errors.append(f"units/{uid}.yaml: 地図にない単元")
            continue
        plan = expand(units[uid][2])
        days = doc.get("days", [])
        if [d.get("day") for d in days] != list(range(1, len(days) + 1)):
            errors.append(f"{uid}: 日は 1 から順に並べる")
        if len(days) > len(plan):
            errors.append(f"{uid}: 地図の日数より多い")
        for d in days:
            for i, item in enumerate(d.get("items", []), 1):
                where = f"{uid} {d.get('day')} 日目 {i} 問目"
                if item.get("part") not in PARTS:
                    errors.append(f"{where}: part は {'、'.join(PARTS)} のどれか")
                if item.get("part") == "見本":
                    if "explain" not in item:
                        errors.append(f"{where}: 見本には explain が要る")
                    continue
                if "answer" not in item:
                    errors.append(f"{where}: answer がない")
                if len(item.get("hints", [])) != 3:
                    errors.append(f"{where}: ヒントは 3 段")
                if "check" in item:
                    try:
                        got = run_check(item, str(item.get("figure", "")))
                    except Exception as e:  # 式の誤りも報告する
                        errors.append(f"{where}: check の式が評価できない（{e}）")
                        continue
                    if str(got) != str(item.get("answer")):
                        errors.append(f"{where}: 答え {item.get('answer')} と check の値 {got} が違う")
    if data.get("coverage"):
        errors += check_coverage(data["coverage"], units)
    return errors


def build_coverage(cov, titles):
    lines = ["# 網羅表", "",
             "この頁は `tools/roadmap.py build` が `coverage.yaml` から作ります。手で直さないでください。",
             "IMO と JMO に要る論題ごとに、受け持つ単元か、入れない理由を書いています（R-09）。", ""]
    items = cov.get("items", [])
    covered = sum(1 for i in items if i.get("units"))
    lines += [f"論題 {len(items)} のうち、単元が受け持つもの {covered}、入れないもの {len(items) - covered}。", ""]
    fields = []
    for i in items:
        if i["field"] not in fields:
            fields.append(i["field"])
    for f in fields:
        lines += [f"## {f}", "", "| 記号 | 論題 | 受け持つ単元 | 出典 |", "|---|---|---|---|"]
        for i in items:
            if i["field"] != f:
                continue
            where = "、".join(f"{u} {titles[u]}" for u in i["units"]) if i.get("units") else f"入れない（{i['none']}）"
            lines.append(f"| {i['id']} | {i['topic']} | {where} | {'、'.join(i.get('sources') or [])} |")
        lines.append("")
    lines += ["## 出典", "", "| 記号 | 題名 | URL | 取得日 |", "|---|---|---|---|"]
    for k, s in cov.get("sources", {}).items():
        lines.append(f"| {k} | {s['title']} | {s['url']} | {s.get('date', '')} |")
    (ROOT / "docs" / "coverage.md").write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")


def build(data, problems):
    lanes = {l["id"]: l for l in data["lanes"]}
    out_units = []
    for u in data["units"]:
        m = ID_RE.match(u["id"])
        days = expand(u)
        doc = problems.get(u["id"], {})
        for d in doc.get("days", []):
            days[d["day"] - 1]["items"] = d.get("items", [])
        out_units.append({"id": u["id"], "title": u["title"], "lane": m.group(1),
                          "stage": int(m.group(2)), "needs": u.get("needs", []), "days": days})
    payload = {"lanes": data["lanes"], "stages": data["stages"], "kinds": data["kinds"],
               "units": out_units}
    js = "// tools/roadmap.py build が roadmap.yaml と units/ から作る。手で直さない。\n"
    js += "window.ROADMAP = " + json.dumps(payload, ensure_ascii=False, indent=1) + ";\n"
    (ROOT / "site" / "data.js").write_text(js, encoding="utf-8", newline="\n")

    lines = ["# 地図の一覧", "",
             "この頁は `tools/roadmap.py build` が `roadmap.yaml` から作ります。手で直さないでください。",
             "画面で見るときは `site/index.html` を開きます。", "",
             "| 段 | 名前 | 物差し | 1 日 | 単元 | 日数 |", "|---|---|---|---|---|---|"]
    for s in data["stages"]:
        us = [u for u in out_units if u["stage"] == s["id"]]
        lines.append(f"| {s['id']} | {s['name']} | {s['measure']} | {s['minutes']} 分 | "
                     f"{len(us)} | {sum(len(u['days']) for u in us)} |")
    total = sum(len(u["days"]) for u in out_units)
    lines += ["", f"合わせて {len(out_units)} 単元、{total} 日分です。", ""]
    for s in data["stages"]:
        lines += [f"## 段 {s['id']} {s['name']}", "", "| 単元 | 流れ | 前提 | 日数 | 問題 |",
                  "|---|---|---|---|---|"]
        for u in out_units:
            if u["stage"] != s["id"]:
                continue
            ready = sum(1 for d in u["days"] if d.get("items"))
            lines.append(f"| {u['id']} {u['title']} | {lanes[u['lane']]['name']} | "
                         f"{'、'.join(u['needs']) or '—'} | {len(u['days'])} | "
                         f"{f'{ready} 日分' if ready else '—'} |")
        lines.append("")
    (ROOT / "docs" / "roadmap.md").write_text("\n".join(lines), encoding="utf-8", newline="\n")
    if data.get("coverage"):
        build_coverage(data["coverage"], {u["id"]: u["title"] for u in out_units})
    return len(out_units), total


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "check"
    data, problems = load()
    errors = check(data, problems)
    for e in errors:
        print("誤り:", e)
    if errors:
        sys.exit(1)
    if cmd == "build":
        n, total = build(data, problems)
        print(f"作った: {n} 単元、{total} 日分")
    else:
        print("誤りなし")


if __name__ == "__main__":
    main()
