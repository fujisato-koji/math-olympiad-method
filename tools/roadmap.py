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

sys.path.insert(0, str(Path(__file__).parent))
import combination  # noqa: E402  組み合わせの指標（D-031）

ROOT = Path(__file__).resolve().parent.parent
ID_RE = re.compile(r"^([A-Z])-(\d{3})$")
PARTS = ("見本", "思い出す", "今日", "挑戦", "わけ")
GOAL_KINDS = ("大会", "検定", "修了試験", "入試", "資格", "研究の頂点", "第一線の仕事", "未解決問題")  # 目標の種類。画面ではこの順にまとめる（2.12）
# 研究の頂点と第一線の仕事の分野。研究の頂点は分野ごとに 1 つ（その分野の国際的な最高の賞）、第一線の仕事は 1〜2（2.12、D-032）
GOAL_FIELDS = ("数学", "物理", "化学", "生物", "医学", "地球科学", "天文学", "生態学", "神経科学", "材料", "計算機科学", "統計学", "工学", "農学と獣医学", "心理学", "経済学")
PEAK_LIMIT = {"研究の頂点": 1, "第一線の仕事": 2}


def default_plan(n):
    """既定の日の並び。どの単元にも、わけを示す日を 1 日入れる（D-016）。"""
    if n < 5:
        return ["導入"] + ["わけ"] * (n - 2) + ["確認"]
    return ["導入"] + ["練習"] * (n - 4) + ["わけ", "混ぜる", "確認"]


def load():
    data = yaml.safe_load((ROOT / "roadmap.yaml").read_text(encoding="utf-8"))
    problems = {}
    for p in sorted((ROOT / "units").glob("*.yaml")):
        problems[p.stem] = yaml.safe_load(p.read_text(encoding="utf-8"))
    # 目標ごとの網羅表（goals の coverage が指すファイル）
    data["coverages"] = {}
    for g in data.get("goals", []):
        cov = ROOT / g["coverage"]
        if cov.exists():
            data["coverages"][g["id"]] = yaml.safe_load(cov.read_text(encoding="utf-8"))
    # 古今東西の問題の記録（problems/*.yaml。組み合わせの型つき、D-020）
    data["catalog"] = []
    pdir = ROOT / "problems"
    for f in sorted(pdir.glob("*.yaml")) if pdir.exists() else []:
        for it in yaml.safe_load(f.read_text(encoding="utf-8")) or []:
            it["_set"] = f.stem
            data["catalog"].append(it)
    ren = ROOT / "renamed.yaml"
    data["renamed"] = yaml.safe_load(ren.read_text(encoding="utf-8")) if ren.exists() else {}
    return data, problems


def goal_units(data):
    """目標ごとに、網羅表が指す単元とその前提をすべてたどった単元の集まり。
    choice（選んで解く論題の組。網羅表の choices に名前と選ぶ数）の論題は道のりに入れない。"""
    needs = {u["id"]: u.get("needs", []) for u in data["units"]}
    out = {}
    for gid, cov in data["coverages"].items():
        seen, stack = set(), [uid for i in cov.get("items", []) if not i.get("choice") for uid in i.get("units") or []]
        while stack:
            uid = stack.pop()
            if uid in seen or uid not in needs:
                continue
            seen.add(uid)
            stack += needs[uid]
        out[gid] = seen
    return out


def check_coverage(cov, units):
    """網羅表：どの論題にも、受け持つ単元（units）、入れない理由（none）、すべての単元に通る軸（axis）のどれか 1 つがある。"""
    errors, seen = [], set()
    for item in cov.get("items", []):
        iid = item.get("id", "?")
        if iid in seen:
            errors.append(f"網羅表 {iid}: 二重")
        seen.add(iid)
        if sum(bool(item.get(k)) for k in ("units", "none", "axis")) != 1:
            errors.append(f"網羅表 {iid}: units、none、axis のどれか 1 つを書く")
        for uid in item.get("units") or []:
            if uid not in units:
                errors.append(f"網羅表 {iid}: 単元 {uid} が地図にない")
        if item.get("choice") and item["choice"] not in (cov.get("choices") or {}):
            errors.append(f"網羅表 {iid}: 選択の組 {item['choice']} が choices にない")
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
    # 総当たりで確かめられるように、計算の部品（math、itertools、fractions）も使える
    import fractions
    import itertools
    import math
    env = {"__builtins__": {}, "fig": fig, "n": lambda c: fig.count(c), "min": min, "max": max, "len": len,
           "sorted": sorted, "sum": sum, "range": range, "abs": abs, "all": all, "any": any, "set": set,
           "divmod": divmod, "pow": pow, "math": math, "itertools": itertools, "Fraction": fractions.Fraction}
    return eval(item["check"], env)


def check(data, problems):
    errors = []
    lanes = {l["id"] for l in data["lanes"]}
    stages = {s["id"] for s in data["stages"]}
    kinds = set(data["kinds"])
    regions = {r["id"] for r in data.get("regions", [])}
    units = {}
    for u in data["units"]:
        uid = u["id"]
        m = ID_RE.match(uid)
        if not m:
            errors.append(f"{uid}: 記号の形が違う")
            continue
        if uid in units:
            errors.append(f"{uid}: 二重")
        lane, stage = m.group(1), u.get("stage")
        if lane not in lanes:
            errors.append(f"{uid}: 流れ {lane} がない")
        if stage not in stages:
            errors.append(f"{uid}: 段 {stage} がない")
        if regions and u.get("region") not in regions:
            errors.append(f"{uid}: 領域 {u.get('region')} がない")
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
    # 考え方の水準（D-028、docs/thinking-levels.md）。付け直しの途中は、付いた単元だけを確かめる
    low = []
    for uid, (_, _, u) in units.items():
        lv = u.get("level")
        if lv is None:
            continue
        if lv not in (1, 2, 3, 4, 5):
            errors.append(f"{uid}: 考え方の水準 {lv} は 1〜5 のどれでもない")
            continue
        hi = max([units[n][2].get("level") or 0 for n in u.get("needs", []) if n in units] or [0])
        if lv < hi:
            low.append(f"{uid}（{lv}）＜ 前提の {hi}")
    if low:
        # 前提が強すぎる（道のりの膨らみ）か、水準が低すぎるかのどちらか
        print(f"警告: 前提より低い考え方の水準 {len(low)}：" + "、".join(low[:10]) + ("…" if len(low) > 10 else ""))
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
            pool = [(f"{i} 問目", it) for i, it in enumerate(d.get("items", []), 1)]
            pool += [(f"予備 {i} 問目", it) for i, it in enumerate(d.get("extra", []), 1)]
            for i, item in pool:
                where = f"{uid} {d.get('day')} 日目 {i}"
                if item.get("part") not in PARTS:
                    errors.append(f"{where}: part は {'、'.join(PARTS)} のどれか")
                for tid in item.get("type") or []:
                    if tid not in units:
                        errors.append(f"{where}: 組み合わせの型の単元 {tid} が地図にない")
                if item.get("part") in ("見本", "わけ"):
                    if "explain" not in item:
                        errors.append(f"{where}: {item.get('part')}には explain が要る")
                    if item.get("part") == "わけ" and len(item.get("hints", [])) != 3:
                        errors.append(f"{where}: ヒントは 3 段")
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
        if not any(it.get("part") == "わけ" for d in days for it in d.get("items", [])):
            errors.append(f"{uid}: わけを示す問題（part: わけ）が 1 つもない（D-016）")
    seen_p = set()
    for it in data.get("catalog", []):
        if it.get("id") in seen_p:
            errors.append(f"問題 {it.get('id')}: 記号が重なっている")
        seen_p.add(it.get("id"))
        for u in it.get("units") or []:
            if u not in units:
                errors.append(f"問題 {it.get('id')}: 単元 {u} が地図にない")
        if it.get("text") and not it.get("pd"):
            errors.append(f"問題 {it.get('id')}: 著作権のある問題の問題文は収録しない")
    for uid, (_, _, u) in units.items():
        if u.get("stage", 1) > 2 and not u.get("needs"):
            errors.append(f"単元 {uid}: 段 {u['stage']} なのに前提がない（地図にない分野なら代わりの前提を書く）")
    for g in data.get("goals", []):
        if g["id"] not in data["coverages"]:
            errors.append(f"目標 {g['id']}: 網羅表 {g['coverage']} がない")
        if g.get("kind") not in GOAL_KINDS:
            errors.append(f"目標 {g['id']}: 種類 {g.get('kind')} は {'、'.join(GOAL_KINDS)} のどれでもない")
        if g.get("kind") in PEAK_LIMIT and g.get("field") not in GOAL_FIELDS:
            errors.append(f"目標 {g['id']}: 分野 {g.get('field')} は {'、'.join(GOAL_FIELDS)} のどれでもない")
    # 水準をそろえるため、分野ごとの頂点の数は上限まで（まとめる前の途中は警告）
    for kind, cap in PEAK_LIMIT.items():
        for fd in GOAL_FIELDS:
            n = [g["id"] for g in data.get("goals", []) if g.get("kind") == kind and g.get("field") == fd]
            if len(n) > cap:
                print(f"警告: {kind}の{fd}が {len(n)}（上限 {cap}）：{'、'.join(n)}")
    for gid, cov in data["coverages"].items():
        errors += [f"[{gid}] {e}" for e in check_coverage(cov, units)]
    # どの単元も、どれかの目標の道のりに入るか、段の物差しの大会のため（measure）であること
    if data["coverages"]:
        on_path = set().union(*goal_units(data).values())
        # 大学以降を組み込む途中は、目標の網羅表がまだない単元があるので、誤りでなく警告にする（一覧は docs/roadmap.md）
        off = [uid for uid, (_, _, u) in units.items() if uid not in on_path and not u.get("measure")]
        if off:
            print(f"警告: どの目標の道のりにも入らない単元 {len(off)}（網羅表がそろったら誤りに戻す）")
    # 大学院の目標の論題が段 3 以下の単元だけを指すなら、記号の取り違えを疑う（語の部分一致の誤りがあった）
    levels = {g["id"]: str(g.get("level", "")) for g in data.get("goals", [])}
    for gid, cov in data["coverages"].items():
        if not levels.get(gid, "").startswith("大学院"):
            continue
        for item in cov.get("items", []):
            us = [u for u in item.get("units") or [] if u in units]
            if us and max(units[u][1] for u in us) <= 3:
                print(f"警告: [{gid}] {item.get('id')} 「{item.get('topic', '')[:30]}」が段 3 以下の単元だけを指す（取り違えの疑い）")
    return errors


def build_coverage(goal, cov, titles):
    lines = [f"# 網羅表：{goal['name']}", "",
             f"この頁は `tools/roadmap.py build` が `{goal['coverage']}` から作ります。手で直さないでください。",
             f"{goal['name']}に要る論題ごとに、受け持つ単元か、入れない理由を書いています（R-09）。", ""]
    if goal.get("basis"):
        lines[-1:-1] = ["", f"範囲の根拠：{goal['basis']}"]
    items = cov.get("items", [])
    covered = sum(1 for i in items if i.get("units"))
    axis = sum(1 for i in items if i.get("axis"))
    lines += [f"論題 {len(items)} のうち、単元が受け持つもの {covered}、すべての単元に通る軸が受け持つもの {axis}、"
              f"入れないもの {len(items) - covered - axis}。", ""]
    fields = []
    for i in items:
        if i["field"] not in fields:
            fields.append(i["field"])
    for f in fields:
        lines += [f"## {f}", "", "| 記号 | 論題 | 受け持つ単元 | 出典 |", "|---|---|---|---|"]
        for i in items:
            if i["field"] != f:
                continue
            where = ("、".join(f"{u} {titles[u]}" for u in i["units"]) if i.get("units")
                     else f"すべての単元（{i['axis']}の軸）" if i.get("axis") else f"入れない（{i['none']}）")
            pick = f"（選択：{cov['choices'][i['choice']]['label']}）" if i.get("choice") else ""
            lines.append(f"| {i['id']} | {i['topic']}{pick} | {where} | {'、'.join(i.get('sources') or [])} |")
        lines.append("")
    lines += ["## 出典", "", "| 記号 | 題名 | URL | 取得日 |", "|---|---|---|---|"]
    for k, s in cov.get("sources", {}).items():
        note = f"（{s['note']}）" if s.get("note") else ""
        lines.append(f"| {k} | {s['title']}{note} | {s['url']} | {s.get('date', '')} |")
    name = Path(goal["coverage"]).stem + ".md"
    (ROOT / "docs" / name).write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")


def build(data, problems):
    lanes = {l["id"]: l for l in data["lanes"]}
    out_units = []
    comb = combination.measure(data["units"])
    for u in data["units"]:
        m = ID_RE.match(u["id"])
        days = expand(u)
        doc = problems.get(u["id"], {})
        for d in doc.get("days", []):
            days[d["day"] - 1]["items"] = d.get("items", [])
            if d.get("extra"):
                days[d["day"] - 1]["extra"] = d["extra"]
        out_units.append({"id": u["id"], "title": u["title"], "lane": m.group(1),
                          "stage": u["stage"], **({"level": u["level"]} if u.get("level") else {}), "region": u.get("region"), "needs": u.get("needs", []), "days": days,
                          **({"measure": True} if u.get("measure") else {}),
                          # 組み合わせ：b は広さ、r は珍しさ、rg は前提の領域、pr はいちばん珍しい組
                          **({"comb": {"b": comb[u["id"]]["breadth"], "r": comb[u["id"]]["rarity"],
                                       "rg": comb[u["id"]]["regions"], "pr": comb[u["id"]]["pair"]}}
                             if len(comb[u["id"]]["regions"]) > 1 else {})})
    gu = goal_units(data)
    goals = []
    for g in data.get("goals", []):
        cov = data["coverages"].get(g["id"], {})
        items = [{k: i[k] for k in ("id", "field", "topic", "units", "none", "axis", "choice") if k in i} for i in cov.get("items", [])]
        goals.append({**{k: g[k] for k in ("id", "name", "kind", "field", "fields", "level", "region", "note", "basis", "beyond") if k in g},
                      **({"choices": cov["choices"]} if cov.get("choices") else {}),
                      "units": sorted(gu.get(g["id"], [])), "items": items})
    payload = {"lanes": data["lanes"], "stages": data["stages"], "regions": data.get("regions", []), "kinds": data["kinds"],
               "goals": goals, "goalKinds": list(GOAL_KINDS), "goalFields": list(GOAL_FIELDS), "units": out_units, "renamed": data["renamed"]}
    js = "// tools/roadmap.py build が roadmap.yaml と units/ から作る。手で直さない。\n"
    js += "window.ROADMAP = " + json.dumps(payload, ensure_ascii=False, indent=1) + ";\n"
    (ROOT / "site" / "data.js").write_text(js, encoding="utf-8", newline="\n")
    keys = {"id": "id", "_set": "set", "source": "src", "year": "y", "number": "no", "field": "f", "gist": "g",
            "units": "u", "key": "k", "url": "url", "pd": "pd", "text": "text", "answer": "a", "paths": "paths"}
    cat = [{v: it[k] for k, v in keys.items() if k in it and it[k] not in (None, "", [])}
           for it in data.get("catalog", [])]
    (ROOT / "site" / "problems.js").write_text(
        "// tools/roadmap.py build が problems/ から作る。手で直さない。\n"
        "window.PROBLEMS = " + json.dumps(cat, ensure_ascii=False, separators=(",", ":"), default=str) + ";\n",
        encoding="utf-8", newline="\n")

    lines = ["# 地図の一覧", "",
             "この頁は `tools/roadmap.py build` が `roadmap.yaml` から作ります。手で直さないでください。",
             "画面で見るときは `site/index.html` を開きます。", "",
             "| 段 | 名前 | 主な内容 | 1 日 | 単元 | 日数 |", "|---|---|---|---|---|---|"]
    for s in data["stages"]:
        us = [u for u in out_units if u["stage"] == s["id"]]
        lines.append(f"| {s['id']} | {s['name']} | {s['about']} | {s['minutes']} 分 | "
                     f"{len(us)} | {sum(len(u['days']) for u in us)} |")
    total = sum(len(u["days"]) for u in out_units)
    lines += ["", f"合わせて {len(out_units)} 単元、{total} 日分です。", "",
              "## 目標ごとの道のり", "",
              "網羅表が指す単元と、その前提をすべてたどった単元の数です。", "",
              "| 目標 | 単元 | 日数 |", "|---|---|---|"]
    days_of = {u["id"]: len(u["days"]) for u in out_units}
    for g in goals:
        lines.append(f"| {g['name']} | {len(g['units'])} | {sum(days_of[x] for x in g['units'])} |")
    on_path = set().union(*[set(g["units"]) for g in goals]) if goals else set()
    measure = [u for u in out_units if u["id"] not in on_path and u.get("measure")]
    off = [u for u in out_units if u["id"] not in on_path and not u.get("measure")]
    lines += ["", f"目標には要らないが、段の物差しの大会のために置く単元：{len(measure)}。", ""]
    lines += [f"- {u['id']} {u['title']}" for u in measure]
    lines += ["", f"どの目標の道のりにも入らず、大会のためでもない単元：{len(off)}。"
              "あれば、網羅表への当て漏れか、要らない単元かを見直します。", ""]
    lines += [f"- {u['id']} {u['title']}" for u in off]
    lines.append("")
    for s in data["stages"]:
        lines += [f"## 段 {s['id']} {s['name']}", "", "| 単元 | 流れ | 前提 | 日数 | 問題 |",
                  "|---|---|---|---|---|"]
        for u in out_units:
            if u["stage"] != s["id"]:
                continue
            ready = sum(1 for d in u["days"] if d.get("items"))
            extra = sum(len(d.get("extra", [])) for d in u["days"])
            note = f"{ready} 日分" + (f"、予備 {extra} 問" if extra else "") if ready else "—"
            lines.append(f"| {u['id']} {u['title']} | {lanes[u['lane']]['name']} | "
                         f"{'、'.join(u['needs']) or '—'} | {len(u['days'])} | {note} |")
        lines.append("")
    (ROOT / "docs" / "roadmap.md").write_text("\n".join(lines), encoding="utf-8", newline="\n")
    titles = {u["id"]: u["title"] for u in out_units}
    for g in data.get("goals", []):
        if g["id"] in data["coverages"]:
            build_coverage(g, data["coverages"][g["id"]], titles)
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
