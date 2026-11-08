#!/usr/bin/env python3
"""地図（roadmap.yaml）と問題（units/*.yaml）を確かめ、表示用のデータを作る。

  python tools/roadmap.py check   確かめるだけ
  python tools/roadmap.py build   確かめてから site/data.js と docs/roadmap.md を作り直す
"""
import hashlib
import json
import re
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).parent))
import combination  # noqa: E402  組み合わせの指標（D-031）
import space  # noqa: E402  知の宇宙の位置（D-037）

ROOT = Path(__file__).resolve().parent.parent
ID_RE = re.compile(r"^([A-Z])-(\d{3})$")
PARTS = ("見本", "思い出す", "今日", "挑戦", "わけ", "離")
# 難しさの種類（D-047）：挑戦と離の問題に付ける。総動員は合わせる駅（uses）を書く
RI_KINDS = ("総動員", "数", "道筋", "手数", "読み取り")
GOAL_KINDS = ("大会", "検定", "修了試験", "入試", "資格", "研究の頂点", "第一線の仕事", "未解決問題")  # 目標の種類。画面ではこの順にまとめる（2.12）
# 研究の頂点と第一線の仕事の分野。どちらも分野ごとに 1〜2（研究の頂点はその分野の国際的な最高の賞、2.12、D-032）
GOAL_FIELDS = ("数学", "物理", "化学", "生物", "医学", "地球科学", "天文学", "生態学", "神経科学", "材料", "計算機科学", "統計学", "工学", "農学と獣医学", "心理学", "経済学")
PEAK_LIMIT = {"研究の頂点": 2, "第一線の仕事": 2}
# 考え方の水準（D-028、docs/thinking-levels.md の第 2 節）。画面の水準のページと目盛りに使う
THINKING_LEVELS = [
    {"id": 1, "name": "体で分かる", "about": "目の前の物と動き、観察したこと。数や言葉は物に結びついたまま使う"},
    {"id": 2, "name": "記号で扱う", "about": "物から切り離した数・量・式・単位・決まった手順。決まりを当てはめて答えを出す"},
    {"id": 3, "name": "関係とモデルで考える", "about": "変化、関数、法則、モデル、具体的な構造。与えられた枠組みの中で、定義と定理を使って計算し、モデルを立て、個々の命題を示す"},
    {"id": 4, "name": "定義や原理から体系として組み立てる", "about": "公理や第一原理で定めた対象と、理論の体系そのもの。枠組みを選び、そこから主な結果を導き、どの仮定が要るかを調べる"},
    {"id": 5, "name": "研究の最前線で新しくつくる", "about": "ここ数十年の研究で形になり、いまも動いている理論。それを道具にして、新しい定義・問い・方法を立てる"},
]


def default_plan(n):
    """既定の日の並び。どの単元にも、わけを示す日を 1 日入れる（D-016）。"""
    # 4 日以下でも練習の日を入れ、わけの日は 1 日にする（前は「導入・わけ・わけ・確認」になっていた）
    if n <= 2:
        return ["導入", "確認"][-n:]
    if n < 5:
        return ["導入"] + ["練習"] * (n - 3) + ["わけ", "確認"]
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


def goal_units(data, choice=False):
    """目標ごとに、網羅表が指す単元とその前提をすべてたどった単元の集まり。
    choice（選んで解く論題の組。網羅表の choices に名前と選ぶ数）の論題は道のりに入れない。
    choice=True なら、選んで解く論題の単元とその前提だけをたどる（関係図に薄く描く）。"""
    needs = {u["id"]: u.get("needs", []) for u in data["units"]}
    out = {}
    for gid, cov in data["coverages"].items():
        seen, stack = set(), [uid for i in cov.get("items", []) if bool(i.get("choice")) == choice for uid in i.get("units") or []]
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


# 記録の引き継ぎ（D-044）：問題の記号は中身の指紋から作る（単元のファイルは書き換えない）。
# 問題に id を書けば、それを記号にする（中身を直しても記録を引き継ぎたいとき）。
QID_FIELDS = ("part", "text", "figure", "svg", "balance", "choices", "answer")


def qid(unit_id, item):
    if item.get("id"):
        return f"{unit_id}:{item['id']}"
    body = json.dumps({k: item.get(k) for k in QID_FIELDS if item.get(k) is not None}, ensure_ascii=False, sort_keys=True)
    return f"{unit_id}:{hashlib.sha1(body.encode('utf-8')).hexdigest()[:10]}"


def mark_ids(unit_id, days):
    """各問題に qid、各日に key（日のねらい、なければ種類と何番目か）を付け、単元の版（問題の記号の指紋）を返す。"""
    seen, kinds, all_ids = {}, {}, []
    for d in days:
        kinds[d["kind"]] = kinds.get(d["kind"], 0) + 1
        d["key"] = d.get("aim") or f"{d['kind']}#{kinds[d['kind']]}"
        for it in [*d.get("items", []), *d.get("extra", [])]:
            q = qid(unit_id, it)
            seen[q] = seen.get(q, 0) + 1
            it["qid"] = q if seen[q] == 1 else f"{q}-{seen[q]}"  # 同じ問題が 2 度あれば番号を足す
            all_ids.append(it["qid"])
    return hashlib.sha1("|".join(all_ids).encode("utf-8")).hexdigest()[:10] if all_ids else ""


def expand(unit):
    """plan を [{kind, aim}] にそろえる。"""
    if "plan" in unit:
        return [{"kind": k, "aim": v} for d in unit["plan"] for k, v in d.items()]
    return [{"kind": k, "aim": ""} for k in default_plan(unit["days"])]


def run_check(item, fig):
    """問題の check 式を評価する。fig は図の文字列、n(c) は図の中の c の数。bal は天秤（balance、D-042）。"""
    # 総当たりで確かめられるように、計算の部品（math、itertools、fractions）も使える
    import fractions
    import itertools
    import math
    env = {"__builtins__": {}, "fig": fig, "bal": item.get("balance"), "n": lambda c: fig.count(c), "min": min, "max": max, "len": len,
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
    # 代わりになる前提（alt、D-035）：{A: [B, ...]} は「前提 A の代わりに B を済ませていてもよい」。
    # 道のりは既定の前提（needs）でたどり、alt は「次にできる」の判定と関係図にだけ使う
    def ups(x, seen=None):
        seen = set() if seen is None else seen
        for y in units[x][2].get("needs", []):
            if y in units and y not in seen:
                seen.add(y)
                ups(y, seen)
        return seen
    for uid, (_, stage, u) in units.items():
        for need, alts in (u.get("alt") or {}).items():
            if need not in u.get("needs", []):
                errors.append(f"{uid}: alt の {need} が前提にない")
            for b in alts:
                if b not in units:
                    errors.append(f"{uid}: alt の {b} がない")
                elif b == need or b == uid:
                    errors.append(f"{uid}: alt の {b} が自分か元の前提と同じ")
                elif units[b][1] > stage or (units[b][2].get("level") or 0) > (u.get("level") or 5):
                    errors.append(f"{uid}: alt の {b} が後の段か高い水準にある")
                elif uid in ups(b):
                    errors.append(f"{uid}: alt の {b} が {uid} を前提にたどる（輪）")
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
        # 腕だめし（離、D-047）は ri に置く。日の問題と同じ決まりで確かめる
        for d in [*days, {"day": "腕だめし", "items": doc.get("ri") or [], "ri": True}]:
            pool = [(f"{i} 問目", it) for i, it in enumerate(d.get("items", []), 1)]
            pool += [(f"予備 {i} 問目", it) for i, it in enumerate(d.get("extra", []), 1)]
            for i, item in pool:
                where = f"{uid} 腕だめし {i}" if d.get("ri") else f"{uid} {d.get('day')} 日目 {i}"
                if item.get("part") not in PARTS:
                    errors.append(f"{where}: part は {'、'.join(PARTS)} のどれか")
                if "time" in item and not (isinstance(item["time"], int) and 10 <= item["time"] <= 3600):
                    errors.append(f"{where}: time は目安の秒（10〜3600 の整数）")
                if bool(d.get("ri")) != (item.get("part") == "離"):
                    errors.append(f"{where}: 離の問題は ri に、ri には離の問題だけを置く")
                bad = [k for k in item.get("kinds") or [] if k not in RI_KINDS]
                if bad:
                    errors.append(f"{where}: kinds は {'、'.join(RI_KINDS)} から選ぶ（{'、'.join(bad)}）")
                if item.get("part") == "離" and not item.get("kinds"):
                    errors.append(f"{where}: 離の問題には kinds（難しさの種類）が要る")
                if item.get("kinds") and item.get("part") not in ("挑戦", "離"):
                    errors.append(f"{where}: kinds は挑戦と離の問題だけに付ける")
                if item.get("uses") and item.get("part") != "離":
                    errors.append(f"{where}: uses は離の問題だけに付ける")
                if "総動員" in (item.get("kinds") or []) and not item.get("uses"):
                    errors.append(f"{where}: 総動員の問題には uses（合わせる駅）が要る")
                for x in item.get("uses") or []:
                    if x not in units or x == uid:
                        errors.append(f"{where}: uses の {x} が地図にないか、この単元そのもの")
                    elif units[x][1] > units[uid][1]:
                        errors.append(f"{where}: uses の {x} は段 {units[x][1]} で、この単元（段 {units[uid][1]}）より後ろ")
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
                elif item.get("choices"):
                    if str(item["answer"]) not in [str(c) for c in item["choices"]]:
                        errors.append(f"{where}: 答え {item['answer']} が選択肢にない")
                else:
                    # 鍵盤で打てる形（D-039）：段 1〜2 は 3 けたまでの数字、段 3 から「.」「/」、段 4 から「−」、8 字まで
                    # 単元の keys（例：段 2 の負の数の単元に [−]）で鍵を足せる
                    st, extra = units[uid][1], set(units[uid][2].get("keys") or [])
                    sign = "−?" if st >= 4 or "−" in extra else ""
                    ok = (sign + r"\d{1,3}") if st <= 2 else (sign + r"\d+(\.\d+)?(/\d+)?")
                    for a in [item["answer"], *(item.get("accept") or [])]:
                        if not re.fullmatch(ok, str(a)) or len(str(a)) > ((4 if sign else 3) if st <= 2 else 8):
                            errors.append(f"{where}: 答え {a} は段 {st} の鍵盤で打てない（選ぶ問題にするか、形を直す）")
                if len(item.get("hints", [])) != 3:
                    errors.append(f"{where}: ヒントは 3 段")
                if "balance" in item:
                    # 天秤（D-042）：{left, right, tilt: left|right|level}、または その並び
                    bs = item["balance"] if isinstance(item["balance"], list) else [item["balance"]]
                    for b in bs:
                        if not isinstance(b, dict) or b.get("tilt") not in ("left", "right", "level") or not ({"left", "right"} <= set(b)):
                            errors.append(f"{where}: balance は {{left, right, tilt: left|right|level}} にする")
                if "svg" in item:
                    # SVG の図（D-040）：<svg> で始まり viewBox がある。script、on…= の属性、外への参照は使わない
                    s = str(item["svg"])
                    if not re.match(r'\s*<svg\b[^>]*\bviewBox="[^"]+"', s) or not s.rstrip().endswith("</svg>"):
                        errors.append(f"{where}: svg は viewBox のある <svg>…</svg> にする")
                    if re.search(r"<script|<foreignObject|\son[a-z]+\s*=|href\s*=|url\(", s, re.I):
                        errors.append(f"{where}: svg に script、on…= の属性、外への参照は書かない")
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
        # 網羅表がそろったので誤りに戻した（2026-11-08、D-036）。道のりの外の単元は、合う目標の論題に当てるか外す
        off = [uid for uid, (_, _, u) in units.items() if uid not in on_path and not u.get("measure")]
        if off:
            errors.append(f"どの目標の道のりにも入らない単元 {len(off)}：" + "、".join(off[:10]) + ("…" if len(off) > 10 else ""))
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
    # 知の宇宙の位置（D-037）：tools/space.py が作った配置を読む。新しい単元は前提の近くに置き、作り直すよう促す
    lay = ROOT / "tools" / "space-layout.json"
    pos, added = space.place_missing(data["units"], json.loads(lay.read_text(encoding="utf-8")) if lay.exists() else {})
    if added:
        print(f"警告: 知の宇宙の配置にない単元 {len(added)}（仮に前提の近くに置いた。python tools/space.py で作り直す）：" + "、".join(added[:10]))
    for u in data["units"]:
        m = ID_RE.match(u["id"])
        days = expand(u)
        doc = problems.get(u["id"], {})
        for d in doc.get("days", []):
            days[d["day"] - 1]["items"] = d.get("items", [])
            if d.get("extra"):
                days[d["day"] - 1]["extra"] = d["extra"]
        ver = mark_ids(u["id"], days)
        ri = [dict(it, qid=qid(u["id"], it)) for it in doc.get("ri") or []]
        out_units.append({"id": u["id"], "title": u["title"], "lane": m.group(1),
                          "stage": u["stage"], **({"level": u["level"]} if u.get("level") else {}), "region": u.get("region"), "needs": u.get("needs", []), "days": days, **({"ver": ver} if ver else {}), **({"ri": ri} if ri else {}),
                          **({"measure": True} if u.get("measure") else {}),
                          **({"alt": u["alt"]} if u.get("alt") else {}),
                          **({"keys": u["keys"]} if u.get("keys") else {}),
                          "p": pos[u["id"]],
                          # 組み合わせ：b は広さ、r は珍しさ、rg は前提の領域、pr はいちばん珍しい組
                          **({"comb": {"b": comb[u["id"]]["breadth"], "r": comb[u["id"]]["rarity"],
                                       "rg": comb[u["id"]]["regions"], "pr": comb[u["id"]]["pair"]}}
                             if len(comb[u["id"]]["regions"]) > 1 else {})})
    gu, gc = goal_units(data), goal_units(data, choice=True)
    goals = []
    for g in data.get("goals", []):
        cov = data["coverages"].get(g["id"], {})
        items = [{k: i[k] for k in ("id", "field", "topic", "units", "none", "axis", "choice") if k in i} for i in cov.get("items", [])]
        goals.append({**{k: g[k] for k in ("id", "name", "kind", "field", "fields", "level", "region", "note", "basis", "beyond") if k in g},
                      **({"choices": cov["choices"]} if cov.get("choices") else {}),
                      "units": sorted(gu.get(g["id"], [])), "items": items,
                      **({"choiceUnits": sorted(gc[g["id"]] - gu[g["id"]])} if gc.get(g["id"], set()) - gu.get(g["id"], set()) else {})})
    payload = {"lanes": data["lanes"], "stages": data["stages"], "regions": data.get("regions", []), "kinds": data["kinds"],
               "goals": goals, "levels": THINKING_LEVELS,
               "combLayer": combination.layer(data["units"], data.get("catalog", []), comb), "goalKinds": list(GOAL_KINDS), "goalFields": list(GOAL_FIELDS), "units": out_units, "renamed": data["renamed"]}
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
