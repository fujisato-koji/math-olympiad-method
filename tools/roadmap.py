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
yload = lambda s: yaml.load(s, Loader=getattr(yaml, "CSafeLoader", yaml.SafeLoader))  # C 版の読み込み口（libyaml）があれば使う。Python 版の約 9 倍速く、全部の YAML で結果が同じ（D-132）

sys.path.insert(0, str(Path(__file__).parent))
import combination  # noqa: E402  組み合わせの指標（D-031）
import space  # noqa: E402  知の宇宙の位置（D-037）

ROOT = Path(__file__).resolve().parent.parent
ID_RE = re.compile(r"^([A-Z])-(\d{3})$")
PARTS = ("見本", "思い出す", "今日", "挑戦", "わけ", "離")
# 難しさの種類（D-047）：挑戦と離の問題に付ける。総動員は合わせる駅（uses）を書く
RI_KINDS = ("総動員", "数", "道筋", "手数", "読み取り", "最難関")


def balanced_delims(text: str) -> bool:
    """()、[]、（）の対応を見る。区間の [a, b) と (a, b] は正しい書き方として通す。"""
    stack = []
    pairs = {")": "(", "]": "[", "）": "（"}
    for ch in str(text):
        if ch in "([（":
            stack.append(ch)
        elif ch in ")]）":
            if not stack:
                return False
            op = stack.pop()
            if pairs[ch] != op and (op, ch) not in (("[", ")"), ("(", "]")):
                return False
    return not stack


def kanji_warnings(units, problems, glossary, levels):
    """水準の字の範囲より上の漢字が残る単元を警告する（D-110、D-220）。誤りにはしない。
    字の範囲は roadmap.yaml の levels の kanji：教育漢字の学年（その学年まで）、joyo（常用漢字）、null（決まりなし）。"""
    kpath, jpath = ROOT / "tools" / "kanji-grades.json", ROOT / "tools" / "kanji-joyo.json"
    if not kpath.exists():
        return
    grades = json.loads(kpath.read_text(encoding="utf-8"))
    joyo = set(json.loads(jpath.read_text(encoding="utf-8"))) if jpath.exists() else None
    upto = lambda g: set().union(*[set(grades.get(str(k), [])) for k in range(1, g + 1)])
    allowed_by_level = {}
    for lv in levels:
        k = lv.get("kanji")
        if isinstance(k, int):
            allowed_by_level[lv["id"]] = upto(k)
        elif k == "joyo" and joyo is not None:
            allowed_by_level[lv["id"]] = joyo
    term_chars = set()
    for t in glossary or []:
        term_chars |= {ch for ch in str(t.get("term", "")) if is_kanji(ch)}
    bad_units = []
    for uid, (_, level, _u) in units.items():
        if level not in allowed_by_level:
            continue
        head_chars = set()
        upath = ROOT / "units" / f"{uid}.yaml"
        if upath.exists():
            for no, line in enumerate(upath.read_text(encoding="utf-8").splitlines()):
                # 頭注の 1 行目は題（「必勝法」など）なので除き、2 行目からをことばの説明とみなす
                if no and line.startswith("#"):
                    head_chars |= {ch for ch in line if is_kanji(ch)}
        ok = allowed_by_level[level] | term_chars | head_chars
        bad = set()

        def walk(x, key=None):
            if isinstance(x, str):
                if key == "svg":
                    # 図の中の文字（<text>）も子が読むので数える（D-129）
                    x = re.sub(r"<[^>]+>", "", " ".join(re.findall(r"<text\b[^>]*>(.*?)</text>", x, re.S)))
                elif key in ("check", "figure", "part", "kinds", "uses", "type", "like"):
                    return
                bad.update(ch for ch in x if is_kanji(ch) and ch not in ok)
            elif isinstance(x, dict):
                for k, v in x.items():
                    walk(v, k)
            elif isinstance(x, list):
                # 一覧の中は、その一覧の名前で決める（kinds: [読み取り] の字は子に見せない）
                for v in x:
                    walk(v, key)

        walk(problems.get(uid, {}))
        if bad:
            bad_units.append((uid, sorted(bad)))
    if bad_units:
        sample = "、".join(f"{uid}（{'・'.join(chs[:3])}）" for uid, chs in bad_units[:8])
        more = "…" if len(bad_units) > 8 else ""
        print(f"警告: 水準の字の範囲より上の漢字が残る単元が {len(bad_units)} 個：{sample}{more}")


def is_kanji(ch):
    return "一" <= ch <= "鿿" or "㐀" <= ch <= "䶿"

GOAL_KINDS = ("大会", "検定", "修了試験", "入試", "資格", "研究の頂点", "第一線の仕事", "未解決問題")  # 目標の種類。画面ではこの順にまとめる（2.12）
# 研究の頂点と第一線の仕事の分野。どちらも分野ごとに 1〜2（研究の頂点はその分野の国際的な最高の賞、2.12、D-032）
GOAL_FIELDS = ("数学", "物理", "化学", "生物", "医学", "地球科学", "天文学", "生態学", "神経科学", "材料", "計算機科学", "統計学", "工学", "農学と獣医学", "心理学", "経済学")
PEAK_LIMIT = {"研究の頂点": 2, "第一線の仕事": 2}
# 水準（D-220、docs/thinking-levels.md）は roadmap.yaml の levels に書く（名前、中身、1 日の分、日の並び、わけの深さ、字の範囲、分かち書き、文体）


def default_plan(n):
    """既定の日の並び。どの単元にも、わけを示す日を 1 日入れる（D-016）。"""
    # 4 日以下でも練習の日を入れ、わけの日は 1 日にする（前は「導入・わけ・わけ・確認」になっていた）
    if n <= 2:
        return ["導入", "確認"][-n:]
    if n < 5:
        return ["導入"] + ["練習"] * (n - 3) + ["わけ", "確認"]
    return ["導入"] + ["練習"] * (n - 4) + ["わけ", "混ぜる", "確認"]


def load():
    data = yload((ROOT / "roadmap.yaml").read_text(encoding="utf-8"))
    problems = {}
    for p in sorted((ROOT / "units").glob("*.yaml")):
        problems[p.stem] = yload(p.read_text(encoding="utf-8"))
    # 目標ごとの網羅表（goals の coverage が指すファイル）
    data["coverages"] = {}
    for g in data.get("goals", []):
        cov = ROOT / g["coverage"]
        if cov.exists():
            data["coverages"][g["id"]] = yload(cov.read_text(encoding="utf-8"))
    # 古今東西の問題の記録（problems/*.yaml。組み合わせの型つき、D-020）
    data["catalog"] = []
    pdir = ROOT / "problems"
    for f in sorted(pdir.glob("*.yaml")) if pdir.exists() else []:
        for it in yload(f.read_text(encoding="utf-8")) or []:
            it["_set"] = f.stem
            data["catalog"].append(it)
    ren = ROOT / "renamed.yaml"
    data["renamed"] = yload(ren.read_text(encoding="utf-8")) if ren.exists() else {}
    # 用語の説明（D-063）。原稿の《用語》を確かめるための唯一の情報源
    gfile = ROOT / "glossary.yaml"
    data["glossary"] = yload(gfile.read_text(encoding="utf-8")) if gfile.exists() else []
    # 概念の目録（D-231）：定義・定理・法則などを 1 つに 1 項目。原稿の《名前》が指す。種類ごとの欄と、使う概念の順を check が確かめる
    # 初めて教える単元ごとに concepts/<単元>.yaml に分ける（D-240。並んで作る係と作業ツリーが 1 つのファイルでかち合わない）
    # 単元の確かめの段（D-248）：tools/verification.py が git の履歴から作る。blind は解き直し済み、human は人が確かめた
    vfile = ROOT / "verification.yaml"
    data["verification"] = (yload(vfile.read_text(encoding="utf-8")) or {}) if vfile.exists() else {}
    data["concepts"], data["concept_file"] = [], {}
    for cf in sorted((ROOT / "concepts").glob("*.yaml")):
        for c in (yload(cf.read_text(encoding="utf-8")) or {}).get("concepts") or []:
            data["concepts"].append(c)
            data["concept_file"].setdefault(str(c.get("id")), cf.stem)
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


CHOICE_LABEL = re.compile(r"^([ア-ン]|[A-Z]|[①-⑳])(\s|$)")
CHOICE_LAST = ("どれでもない", "どちらでもない", "どれも ちがう", "どれも ちがう。")


def show_choices(key, item):
    """画面に出す選択肢の順（D-134）。書いた順は正解が 1 番目にかたよる（中身の選択肢 3,129 問の 62%、2026-11-13）ので、
    問題の記号 key を種に、いつも同じ順に混ぜる。図の印（ア・イ・ウ、A・B、①②）だけの選択肢と order: fixed の問題はそのまま、
    「どれでもない」などは最後に置く。答えは文字で比べる（app.js の isRight）ので、並びを変えても正誤と記録は変わらない。"""
    cs = item.get("choices")
    if not cs or item.get("order") == "fixed" or all(CHOICE_LABEL.match(str(c).strip()) for c in cs):
        return cs
    last = [c for c in cs if str(c).strip() in CHOICE_LAST]
    rest = [c for c in cs if str(c).strip() not in CHOICE_LAST]
    return sorted(rest, key=lambda c: hashlib.sha1(f"{key}|{c}".encode("utf-8")).hexdigest()) + last


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
    level_ids = {l["id"] for l in data["levels"]}
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
        lane, level = m.group(1), u.get("level")
        if lane not in lanes:
            errors.append(f"{uid}: 流れ {lane} がない")
        if "stage" in u:
            errors.append(f"{uid}: 段（stage）は使わない。水準（level）だけを書く（D-220）")
        if level not in level_ids:
            errors.append(f"{uid}: 水準 {level} がない")
        if regions and u.get("region") not in regions:
            errors.append(f"{uid}: 領域 {u.get('region')} がない")
        if "plan" in u and "days" in u and len(u["plan"]) != u["days"]:
            errors.append(f"{uid}: plan と days の日数が違う")
        if "plan" not in u and u.get("days", 0) < 3:
            errors.append(f"{uid}: 日数は 3 日以上")
        for d in expand(u):
            if d["kind"] not in kinds:
                errors.append(f"{uid}: 日の種類 {d['kind']} がない")
        units[uid] = (lane, level, u)
    # 前提より低くしない（docs/thinking-levels.md の決まり 11）
    for uid, (_, level, u) in units.items():
        for need in u.get("needs", []):
            if need not in units:
                errors.append(f"{uid}: 前提 {need} がない")
            elif isinstance(units[need][1], int) and isinstance(level, int) and units[need][1] > level:
                errors.append(f"{uid}: 前提 {need} の水準 {units[need][1]} がこの単元の水準 {level} より高い（決まり 11）")
    # 代わりになる前提（alt、D-035）：{A: [B, ...]} は「前提 A の代わりに B を済ませていてもよい」。
    # 道のりは既定の前提（needs）でたどり、alt は「次にできる」の判定と関係図にだけ使う
    def ups(x, seen=None):
        seen = set() if seen is None else seen
        for y in units[x][2].get("needs", []):
            if y in units and y not in seen:
                seen.add(y)
                ups(y, seen)
        return seen
    for uid, (_, level, u) in units.items():
        for need, alts in (u.get("alt") or {}).items():
            if need not in u.get("needs", []):
                errors.append(f"{uid}: alt の {need} が前提にない")
            for b in alts:
                if b not in units:
                    errors.append(f"{uid}: alt の {b} がない")
                elif b == need or b == uid:
                    errors.append(f"{uid}: alt の {b} が自分か元の前提と同じ")
                elif isinstance(units[b][1], int) and isinstance(level, int) and units[b][1] > level:
                    errors.append(f"{uid}: alt の {b} の水準が高い")
                elif uid in ups(b):
                    errors.append(f"{uid}: alt の {b} が {uid} を前提にたどる（輪）")
    # 一度に上がるのは 1 つまで（決まり 12、警告）。前提の最大 + 1 を超える単元は、間の単元が抜けているか、付けすぎ
    jump = []
    for uid, (_, level, u) in units.items():
        hi = max([units[n][1] for n in u.get("needs", []) if n in units and isinstance(units[n][1], int)] or [0])
        if isinstance(level, int) and hi and level > hi + 1:
            jump.append(f"{uid}（{level}）＞ 前提の {hi} + 1")
    if jump:
        print(f"警告: 前提から 2 つ以上上がる水準 {len(jump)}：" + "、".join(jump[:10]) + ("…" if len(jump) > 10 else ""))
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
    # 用語の説明（D-063）：原稿で《用語》と囲んだ所だけに説明が付く。ここにない語は誤り
    gloss = {}
    for g in data.get("glossary", []):
        term, text = g.get("term"), g.get("text")
        if not term or not text:
            errors.append(f"glossary.yaml: term と text の両方が要る（{g}）")
            continue
        if term in gloss:
            errors.append(f"glossary.yaml: 用語 {term} が重なっている")
        if g.get("unit") and g["unit"] not in units:
            errors.append(f"glossary.yaml: {term} の単元 {g['unit']} が地図にない")
        gloss[term] = g

    # 概念の目録（D-231）。種類ごとに要る欄（docs/concepts.md の第 3 節）
    need = {"定義": ["why"], "公理": ["system", "consequences"], "定理": ["proof"], "法則": ["scope", "evidence"], "原理": ["scope", "evidence"],
            "経験則": ["data", "scope"], "実験式": ["data", "scope"], "モデル": ["scope"], "近似": ["scope"], "予想": ["evidence"], "仮説": ["evidence"],
            "約束": [], "方法": []}
    concepts, cname = {}, {}
    for c in data.get("concepts", []):
        cid = c.get("id")
        if not cid or not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", str(cid)):
            errors.append(f"目録: 記号の形が違う（{cid}）")
            continue
        if cid in concepts:
            errors.append(f"目録: 記号 {cid} が重なっている")
        for k in ("name", "kind", "claim", "home"):
            if not c.get(k):
                errors.append(f"目録: {cid} に {k} が要る")
        kind = c.get("kind")
        if kind not in need:
            errors.append(f"目録: {cid} の種類 {kind} がない")
        else:
            for k in need[kind]:
                if not c.get(k):
                    errors.append(f"目録: {cid}（{kind}）に {k} が要る")
        h = c.get("home") or {}
        if data.get("concept_file", {}).get(str(cid)) not in (None, h.get("unit")):
            errors.append(f"目録: {cid} は初めて教える単元のファイル concepts/{h.get('unit')}.yaml に置く（いまは concepts/{data['concept_file'][str(cid)]}.yaml）")
        if h.get("unit") not in units:
            errors.append(f"目録: {cid} の初めて教える単元 {h.get('unit')} が地図にない")
        elif not isinstance(h.get("day"), int) or not 1 <= h["day"] <= units[h["unit"]][2].get("days", 0):
            errors.append(f"目録: {cid} の初めて教える日 {h.get('day')} が {h['unit']} にない")
        for nm in [c.get("name")] + list(c.get("aka") or []):
            if not nm:
                continue
            if nm in cname and cname[nm] != cid:
                errors.append(f"目録: 名前「{nm}」が {cname[nm]} と {cid} で重なっている")
            cname[nm] = cid
        concepts[cid] = c
    # 使う概念は、使う側より前に教える（C-6）：前提の道の上流の単元か、同じ単元の同じ日かそれより前。
    # 目録の外の単元を使うのに、その単元が前提の道にないときは、地図の前提の抜けとして警告にまとめる
    cgaps = []
    for cid, c in concepts.items():
        h = c.get("home") or {}
        if h.get("unit") not in units:
            continue
        up = ups(h["unit"])
        for x in c.get("uses") or []:
            if x in concepts:
                hx = concepts[x].get("home") or {}
                if not (hx.get("unit") in up or (hx.get("unit") == h["unit"] and isinstance(hx.get("day"), int) and hx["day"] <= h.get("day", 0))):
                    errors.append(f"目録: {cid}（{h['unit']} の {h.get('day')} 日目）が使う {x} は {hx.get('unit')} の {hx.get('day')} 日目で教えるので、前にない")
            elif x in units:
                if x != h["unit"] and x not in up:
                    cgaps.append(f"{cid}（{h['unit']}）→ {x}")
            else:
                errors.append(f"目録: {cid} の uses の {x} が、目録にも地図にもない")
    # 定義と定理を分ける（D-235）：定義の主張には名付けの言い方が要り、定理・法則の主張には名付けを入れない
    dmix = [f"{cid}（定義に名付けがない）" for cid, c in concepts.items() if c.get("kind") == "定義" and not re.search(r"(という|といい|と呼|と書|とする|とします|とは|と定め|と決め)", str(c.get("claim", "")))]
    dmix += [f"{cid}（{c['kind']}に名付けが混ざる）" for cid, c in concepts.items() if c.get("kind") in ("定理", "法則", "原理") and re.search(r"(といい|という。|と呼)", str(c.get("claim", "")))]
    if dmix:
        print("警告: 目録の定義と定理が混ざっている " + str(len(dmix)) + "：" + "、".join(dmix))
    if cgaps:
        print(f"警告: 目録の概念が、前提の道にない単元を使う {len(cgaps)}：" + "、".join(cgaps[:8]) + ("…" if len(cgaps) > 8 else ""))
    # 使う概念の輪がないこと
    state = {}
    def cvisit(x, path):
        if state.get(x) == 2:
            return
        if state.get(x) == 1:
            errors.append(f"目録: 使う概念が輪になっている（{' → '.join(path + [x])}）")
            return
        state[x] = 1
        for y in concepts[x].get("uses") or []:
            if y in concepts:
                cvisit(y, path + [x])
        state[x] = 2
    for cid in concepts:
        cvisit(cid, [])

    def strings(x):
        if isinstance(x, str):
            yield x
        elif isinstance(x, dict):
            for v in x.values():
                yield from strings(v)
        elif isinstance(x, list):
            for v in x:
                yield from strings(v)

    # 問題
    for uid, doc in problems.items():
        if uid not in units:
            errors.append(f"units/{uid}.yaml: 地図にない単元")
            continue
        for s in strings(doc):
            for m in re.finditer(r"《([^》\n]+)》", s):
                if m.group(1) not in gloss and m.group(1) not in cname:
                    errors.append(f"units/{uid}.yaml: 用語《{m.group(1)}》が glossary.yaml にも目録（concepts/）にもない")
            # 積分区間は ∫(a→b) と書く。∫a^b は画面で上下の端に組めない
            for m in re.finditer(r"∫([^\s(]{1,12})\^([^\s,，。]{1,12})", s):
                errors.append(f"units/{uid}.yaml: 積分区間は ∫(a→b) と書く（{m.group(0)}）")
            # 平方根は √(...) と書く。√⟨...⟩ は画面で全体にかからない
            if re.search(r"√(?=[⟨|∑∫∂])", s):
                errors.append(f"units/{uid}.yaml: 平方根は √(...) と書いて中身全体にかける")
            # 上付き・下付きは画面が組める ^(...) / _(...) の形にする
            if "^{" in s or "_{" in s:
                errors.append("units/" + uid + ".yaml: 上付き・下付きは ^{...} / _{...} ではなく ^(...) / _(...) と書く")
        # 初見の用語を問題でいきなり使わない（D-068）。その単元で導入する用語は、
        # 見本で説明するか《用語》で囲む。見本より前の裸の使用は誤り。
        own_terms = [t for t, g in gloss.items() if g.get("unit") == uid]
        title = units[uid][2].get("title", "")
        introduced = set()
        for d in doc.get("days", []):
            for it in d.get("items", []):
                if it.get("part") == "見本":
                    s = "\n".join(x for k in ("text", "explain", "note", "hints") for x in strings(it.get(k)))
                    introduced |= {t for t in own_terms if t in s}
            for i, it in enumerate(d.get("items", []), 1):
                if it.get("part") == "見本":
                    continue
                s = "\n".join(x for k in ("text", "note", "choices", "hints") for x in strings(it.get(k)))
                marked = {m.group(1) for m in re.finditer(r"《([^》\n]+)》", s)}
                for t in own_terms:
                    if t not in s or t in introduced or t in title or t in marked:
                        continue
                    # 長い用語の一部として出ているだけなら、その長い用語で判断する
                    if any(t != u and t in u and u in s for u in own_terms):
                        continue
                    errors.append(f"{uid} {d.get('day')} 日目 {i} 問目: 用語 {t} を、見本で説明するか《{t}》と囲む")
        plan = expand(units[uid][2])
        days = doc.get("days", [])
        if [d.get("day") for d in days] != list(range(1, len(days) + 1)):
            errors.append(f"{uid}: 日は 1 から順に並べる")
        # 後ろの日に置いた概念を、前の日の問題で先取りしない（D-077）
        title = units[uid][2].get("title", "")
        first_plan = {}
        # plan は expand で [{kind, aim}] にそろえてある（前は entry.items() を「種類: ねらい」と読み、どの日も当たらなかった）
        for di, entry in enumerate(plan, start=1):
            if entry["kind"] not in ("導入", "練習"):
                continue
            for term in re.split(r"[、・（）()]", str(entry["aim"])):
                term = term.strip()
                if len(term) >= 3 and term not in title:
                    first_plan.setdefault(term, di)
        seen_intro = ""
        for d in days:
            di = d.get("day")
            seen_intro += "\n" + "\n".join(
                x for it in d.get("items", []) if it.get("part") == "見本"
                for k in ("text", "explain", "note", "hints") for x in strings(it.get(k))
            )
            for it in d.get("items", []):
                if it.get("part") == "見本":
                    continue
                used = "\n".join(x for k in ("text", "choices", "answer", "hints", "paths") for x in strings(it.get(k)))
                for term, fd in first_plan.items():
                    if fd > di and term in used and term not in seen_intro:
                        errors.append(f"{uid} {di} 日目: 「{term}」は {fd} 日目の内容なので、前の日の問題で使わない")
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
                # 記号を固定する id（D-044）は文字列。数字だけの指紋を引用符なしで書くと数（0 始まりは 8 進）に読まれて記号が変わる（D-131）
                if "id" in item and not isinstance(item["id"], str):
                    errors.append(f"{where}: id は引用符でかこんだ文字列にする（id: \"0465205161\" の形）")
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
                        errors.append(f"{where}: uses の {x} は水準 {units[x][1]} で、この単元（水準 {units[uid][1]}）より高い")
                for tid in item.get("type") or []:
                    if tid not in units:
                        errors.append(f"{where}: 組み合わせの型の単元 {tid} が地図にない")
                if item.get("part") in ("見本", "わけ"):
                    if "explain" not in item:
                        errors.append(f"{where}: {item.get('part')}には explain が要る")
                    if item.get("part") == "わけ" and len(item.get("hints", [])) != 3:
                        errors.append(f"{where}: ヒントは 3 つ")
                    continue
                if "answer" not in item:
                    errors.append(f"{where}: answer がない")
                elif item.get("choices"):
                    if str(item["answer"]) not in [str(c) for c in item["choices"]]:
                        errors.append(f"{where}: 答え {item['answer']} が選択肢にない")
                else:
                    # 鍵盤で打てる形（D-039、D-220）：水準 1 は 3 けたまでの数字、水準 2 から「.」「−」と 8 字まで、水準 3 から「/」
                    # 単元の keys（例：水準 1 の負の数の単元に [−]）で鍵を足せる。site/app.js の padKeys と同じ決まり
                    st, extra = units[uid][1], set(units[uid][2].get("keys") or [])
                    sign = "−?" if st >= 2 or "−" in extra else ""
                    dec = r"(\.\d+)?" if st >= 2 or "." in extra else ""
                    frac = r"(/\d+)?" if st >= 3 or "/" in extra else ""
                    long = st >= 2 or bool(extra & {".", "/"})
                    ok = sign + (r"\d+" if long else r"\d{1,3}") + dec + frac
                    for a in [item["answer"], *(item.get("accept") or [])]:
                        if not re.fullmatch(ok, str(a)) or len(str(a)) > (8 if long else (4 if sign else 3)):
                            errors.append(f"{where}: 答え {a} は水準 {st} の鍵盤で打てない（選ぶ問題にするか、形を直すか、単元の keys で鍵を足す）")
                if len(item.get("hints", [])) != 3:
                    errors.append(f"{where}: ヒントは 3 つ")
                # ヒントは文か、図の付いた {text, svg}（D-129）。図の決まりは問題の svg と同じ
                for hint in item.get("hints") or []:
                    if isinstance(hint, dict):
                        if set(hint) - {"text", "svg"} or not isinstance(hint.get("text"), str):
                            errors.append(f"{where}: 図の付いたヒントは {{text, svg}} にする")
                        hs = str(hint.get("svg", ""))
                        if hs and (not re.match(r'\s*<svg\b[^>]*\bviewBox="[^"]+"', hs) or not hs.rstrip().endswith("</svg>")):
                            errors.append(f"{where}: ヒントの svg は viewBox のある <svg>…</svg> にする")
                        if re.search(r"<script|<foreignObject|\son[a-z]+\s*=|href\s*=|url\(", hs, re.I):
                            errors.append(f"{where}: ヒントの svg に script、on…= の属性、外への参照は書かない")
                # ヒントに答えそのものを書かない（R-14）。「5 になります。」のような文を止める
                ans_n = str(item.get("answer", "")).replace("−", "-").replace(" ", "").replace("　", "").replace("、", ",").rstrip("。")
                if ans_n:
                    for hint in item.get("hints") or []:
                        hint = hint.get("text", "") if isinstance(hint, dict) else hint
                        if not isinstance(hint, str):
                            continue
                        h_n = hint.replace("−", "-").replace(" ", "").replace("　", "").replace("、", ",").rstrip("。")
                        unit = r"(?:[a-zA-Z/Ω・^0-9]+|倍|個|通り|こ|まい|人|秒|分|時間|m|cm|mm|km|g|kg|V|A|W|J|N|Hz|eV|℃|°|π)?"
                        m = re.match(r"^(.*?)(です|になります|でした|となります|になる)$", h_n)
                        pure = bool(m and m.group(1).startswith(ans_n)
                                    and (m.group(1)[len(ans_n):] == ""
                                         or re.fullmatch(unit, m.group(1)[len(ans_n):])))
                        eq = re.search(r"=" + re.escape(ans_n) + unit + r"(です|になります|でした|となります|になる)$", h_n)
                        said = ("答えは" + ans_n) in h_n or (ans_n + "が答え") in h_n
                        if pure or eq or said:
                            errors.append(f"{where}: ヒントが答えをそのまま書いている（{hint}）")
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
                for pi, path in enumerate(item.get("paths") or [], 1):
                    for si, step in enumerate(path, 1):
                        if not balanced_delims(step):
                            errors.append(f"{where}: paths の {pi} 本目 {si} 番目のかっこが合わない（{step}）")
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
        if (u.get("level") or 1) >= 3 and not u.get("needs"):
            print(f"警告: 単元 {uid}: 水準 {u['level']} なのに前提がない（決まり 12。入口の単元を置くか、前提を書く）")
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
    # 外の物差し（yardsticks/*.yaml、D-117）：公開の分類の項目ごとに、受け持つ単元・入れない理由・足りないのどれか
    import yardstick
    errors += yardstick.check(set(units))
    # 前提の線の種類と強さ（relations/needs.yaml、D-117）：地図の前提の線と合っているか（合わなければ警告。直すのは取りまとめ）
    rel = ROOT / "relations" / "needs.yaml"
    if rel.exists():
        typed = set((yload(rel.read_text(encoding="utf-8")) or {}).get("lines") or {})
        now = {f"{m}>{u['id']}" for u in data["units"] for m in u.get("needs", [])}
        if typed != now:
            print(f"警告: relations/needs.yaml と地図の前提の線が合わない（種類のない線 {len(now - typed)}、地図にない線 {len(typed - now)}）")
    # どの単元も、どれかの目標の道のりに入るか、物差しの大会のため（measure）であること
    if data["coverages"]:
        on_path = set().union(*goal_units(data).values())
        # 外の物差し（yardsticks/、D-117）が受け持つとした単元と、その前提も、道のりに入っているとみなす（D-119）。
        # 物差しは「収録する知の範囲」の外の基準なので、目標がまだなくても、網羅のために足した単元は地図に置いてよい
        needs_of = {u["id"]: u.get("needs", []) for u in data["units"]}
        stack = [uid for y in yardstick.load().values() for it in y.get("items") or [] for uid in it.get("units") or []]
        while stack:
            uid = stack.pop()
            if uid in on_path or uid not in needs_of:
                continue
            on_path.add(uid)
            stack += needs_of[uid]
        # 網羅表がそろったので誤りに戻した（2026-11-08、D-036）。道のりの外の単元は、合う目標の論題に当てるか外す
        off = [uid for uid, (_, _, u) in units.items() if uid not in on_path and not u.get("measure")]
        if off:
            errors.append(f"どの目標の道のりにも入らない単元 {len(off)}：" + "、".join(off[:10]) + ("…" if len(off) > 10 else ""))
    # 大学院の目標の論題が水準 2 以下の単元だけを指すなら、記号の取り違えを疑う（語の部分一致の誤りがあった）
    levels = {g["id"]: str(g.get("level", "")) for g in data.get("goals", [])}
    for gid, cov in data["coverages"].items():
        if not levels.get(gid, "").startswith("大学院"):
            continue
        for item in cov.get("items", []):
            us = [u for u in item.get("units") or [] if u in units]
            if us and max(units[u][1] for u in us) <= 2:
                print(f"警告: [{gid}] {item.get('id')} 「{item.get('topic', '')[:30]}」が水準 2 以下の単元だけを指す（取り違えの疑い）")
    # 2 本目の道筋がまだない問題を一覧にする（第 2 期の手がかり。いまは警告だけ）
    one_path = 0
    for uid, doc in problems.items():
        for d in doc.get("days", []):
            for it in d.get("items", []):
                if it.get("part") in ("挑戦", "わけ") and len(it.get("paths") or []) < 2:
                    one_path += 1
        for it in doc.get("ri") or []:
            if len(it.get("paths") or []) < 2:
                one_path += 1
    if one_path:
        print(f"警告: paths が 1 本だけの挑戦・わけ・腕だめしが {one_path} 問")
    # 引用符のない小数（4.0、2e-07）は画面（JavaScript）で 4、2e-7 になる（D-135）。直す係が unitqc.py で誤りとして直すまで、ここでは警告
    jsbad = lambda v: isinstance(v, float) and (v.is_integer() or "e" in repr(v))
    fl = sorted({uid for uid, doc in problems.items()
                 for it in [x for d in doc.get("days", []) for x in d.get("items", []) + d.get("extra", [])] + list(doc.get("ri") or [])
                 for k in ("answer", "choices", "accept")
                 for v in (it.get(k) if isinstance(it.get(k), list) else [it.get(k)]) if jsbad(v)})
    if fl:
        print(f"警告: 画面で表し方が変わる小数（4.0 → 4）を引用符なしで書いた単元が {len(fl)} 個：" + "、".join(fl[:10]))
    # 同じ問題のくり返し（D-191）。直す係は unitqc.py で誤りとして直す。ここでは単元の数を警告で出す（全部の回のあとにまとめて直す）
    rep = {}
    for uid, doc in problems.items():
        seen, n = set(), 0
        for it in [x for d in doc.get("days", []) for x in d.get("items", []) + d.get("extra", [])] + list(doc.get("ri") or []):
            if it.get("part") == "見本":
                continue
            k = json.dumps([it.get("text"), it.get("svg"), it.get("choices"), str(it.get("answer"))], ensure_ascii=False)
            n += k in seen
            seen.add(k)
        if n:
            rep[uid] = n
    if rep:
        print(f"警告: 同じ問題をくり返している単元が {len(rep)} 個（{sum(rep.values())} 問）：" + "、".join(sorted(rep, key=lambda u: -rep[u])[:10]))
    kanji_warnings(units, problems, data.get("glossary", []), data["levels"])
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


def load_fields():
    """関係から見つけた分野（D-122）と、2D の地図の行の並び（分野と細かい分野、D-124）を読む。どちらも tools/fields/ が作り、build は読むだけ。"""
    fy, ro = ROOT / "relations" / "fields.yaml", ROOT / "relations" / "row-order.yaml"
    F = (yload(fy.read_text(encoding="utf-8")) or {}).get("fields", []) if fy.exists() else []
    f_of, s_of = {}, {}
    for f in F:
        for s in f["subs"]:
            for x in s["units"]:
                f_of[x], s_of[x] = f["id"], s["id"]
    fields = [{"id": f["id"], "name": f["name"], "en": f.get("name_en") or "", "about": f.get("about") or "", "c": f.get("color") or k + 1,
               "subs": [{"id": s["id"], "name": s["name"]} for s in f["subs"]]} for k, f in enumerate(F)]
    RO = (yload(ro.read_text(encoding="utf-8")) or {}).get("rows", []) if ro.exists() else []
    rows = [[g["field"], g["subs"]] for g in RO] or [[f["id"], [s["id"] for s in f["subs"]]] for f in F]
    return fields, f_of, s_of, rows


RI_KEEP = ("qid", "part", "kinds", "uses", "level")  # 地図と単元のページが使う腕だめしの項目（星の数、並べ方、使う単元）


def split_content(out_units):
    """問題の中身を単元ごとのファイル site/u/<記号>.json に分け、data.js には数だけを残す（D-190）。
    data.js が 50 MB を超え、GitHub の 1 ファイル 100 MB の上限に近づいた（9 割以上が問題の中身）。画面は日のページを開くときに
    その単元のファイルだけを読む。日ごとに n（見本でない問題の数）、m（問題の数）、x（予備の数）を残し、腕だめしは RI_KEEP だけ残す。"""
    out = ROOT / "site" / "u"
    out.mkdir(exist_ok=True)
    keep = set()
    for u in out_units:
        days = u.get("days") or []
        ri = u.get("ri") or []
        if not any(d.get("items") or d.get("extra") for d in days) and not ri:
            continue
        content = {"days": [{"items": d.get("items") or [], **({"extra": d["extra"]} if d.get("extra") else {})} for d in days], "ri": ri}
        (out / f"{u['id']}.json").write_text(json.dumps(content, ensure_ascii=False, separators=(",", ":"), default=str),
                                              encoding="utf-8", newline="\n")
        keep.add(f"{u['id']}.json")
        for d in days:
            its = d.pop("items", None) or []
            ex = d.pop("extra", None) or []
            if its:
                d["m"] = len(its)
                d["n"] = sum(1 for x in its if x.get("part") != "見本")
            if ex:
                d["x"] = len(ex)
        if ri:
            u["ri"] = [{k: it[k] for k in RI_KEEP if k in it} for it in ri]
        u["c"] = 1  # 中身のファイルがある
    for p in out.glob("*.json"):  # 消えた単元のファイルを残さない
        if p.name not in keep:
            p.unlink()


def build(data, problems):
    # 確かめの段（D-248）：人 > 解き直し > 確かめの式だけ。問題のない単元には付けない（画面が「問題はまだ」と出す）
    vb, vh = (data.get("verification") or {}).get("blind") or {}, (data.get("verification") or {}).get("human") or {}
    def vf_of(uid):
        if uid in vh: return {"s": "human", **{k: str(v) for k, v in vh[uid].items() if k in ("by", "date", "note")}}
        if uid in vb: return {"s": "blind", "date": str(vb[uid].get("date", ""))}
        return {"s": "ai"}
    lanes = {l["id"]: l for l in data["lanes"]}
    out_units = []
    comb = combination.measure(data["units"])
    # 知の宇宙の位置（D-037）：tools/space.py が作った配置を読む。新しい単元は前提の近くに置き、作り直すよう促す
    lay = ROOT / "tools" / "space-layout.json"
    pos, added = space.place_missing(data["units"], json.loads(lay.read_text(encoding="utf-8")) if lay.exists() else {})
    if added:
        print(f"警告: 知の宇宙の配置にない単元 {len(added)}（仮に前提の近くに置いた。python tools/fields/run.py と python tools/fields/place3d.py --site で作り直す）：" + "、".join(added[:10]))
    fields, f_of, s_of, rows = load_fields()
    # 前提の線の強さ（relations/needs.yaml、3・2・1）を、地図の線の太さと濃さに使う（D-116 の追記）
    ny = ROOT / "relations" / "needs.yaml"
    NW = ((yload(ny.read_text(encoding="utf-8")) or {}).get("lines") or {}) if ny.exists() else {}
    for u in data["units"]:
        m = ID_RE.match(u["id"])
        days = expand(u)
        doc = problems.get(u["id"], {})
        for d in doc.get("days", []):
            days[d["day"] - 1]["items"] = [dict(it) for it in d.get("items", [])]  # 写しに qid と画面の並びを書く（元のデータは変えない）
            if d.get("extra"):
                days[d["day"] - 1]["extra"] = [dict(it) for it in d["extra"]]
        ver = mark_ids(u["id"], days)
        ri = [dict(it, qid=qid(u["id"], it)) for it in doc.get("ri") or []]
        for it in [x for d in days for x in d.get("items", []) + d.get("extra", [])] + ri:
            if it.get("choices"):
                it["choices"] = show_choices(it["qid"], it)  # 正解が 1 番目にかたよらないよう混ぜる（D-134）
        out_units.append({"id": u["id"], "title": u["title"], "lane": m.group(1),
                          "level": u["level"], "region": u.get("region"), "needs": u.get("needs", []), "days": days, **({"ver": ver} if ver else {}), **({"ri": ri} if ri else {}),
                          **({"measure": True} if u.get("measure") else {}),
                          **({"alt": u["alt"]} if u.get("alt") else {}),
                          **({"keys": u["keys"]} if u.get("keys") else {}),
                          **({"vf": vf_of(u["id"])} if u["id"] in problems else {}),
                          **({"f": f_of[u["id"]], "s": s_of[u["id"]]} if u["id"] in f_of else {}),
                          **({"nw": [(NW.get(f"{n}>{u['id']}") or {}).get("strength", 2) for n in u["needs"]]} if u.get("needs") else {}),
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
    split_content(out_units)
    cons = [dict(c) for c in data.get("concepts", [])]
    cname = {nm: c["id"] for c in cons for nm in [c.get("name")] + list(c.get("aka") or []) if nm}
    used_in = {c["id"]: set() for c in cons}
    for uid, doc in problems.items():
        for m in re.finditer(r"《([^》\n]+)》", json.dumps(doc, ensure_ascii=False)):
            if m.group(1) in cname:
                used_in[cname[m.group(1)]].add(uid)
    for c in cons:
        c["used_in"] = sorted(used_in[c["id"]] - {(c.get("home") or {}).get("unit")})
        c["used_by"] = sorted(x["id"] for x in cons if c["id"] in (x.get("uses") or []))
    payload = {"lanes": data["lanes"], "regions": data.get("regions", []), "kinds": data["kinds"], "fields": fields, "rows": rows,
               "glossary": data.get("glossary", []), "concepts": cons,
               "goals": goals, "levels": data["levels"],
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
             "| 水準 | 名前 | 主な内容 | 1 日 | 単元 | 日数 |", "|---|---|---|---|---|---|"]
    for s in data["levels"]:
        us = [u for u in out_units if u["level"] == s["id"]]
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
    lines += ["", f"目標には要らないが、物差しの大会のために置く単元：{len(measure)}。", ""]
    lines += [f"- {u['id']} {u['title']}" for u in measure]
    lines += ["", f"どの目標の道のりにも入らず、大会のためでもない単元：{len(off)}。"
              "あれば、網羅表への当て漏れか、要らない単元かを見直します。", ""]
    lines += [f"- {u['id']} {u['title']}" for u in off]
    lines.append("")
    for s in data["levels"]:
        lines += [f"## 水準 {s['id']} {s['name']}", "", "| 単元 | 流れ | 前提 | 日数 | 問題 |",
                  "|---|---|---|---|---|"]
        for u in out_units:
            if u["level"] != s["id"]:
                continue
            # 問題の中身は split_content で単元ごとのファイルに移したので、残した数（m、x）で数える（D-190）
            ready = sum(1 for d in u["days"] if d.get("items") or d.get("m"))
            extra = sum(len(d.get("extra", [])) or d.get("x", 0) for d in u["days"])
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
