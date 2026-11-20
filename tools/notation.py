#!/usr/bin/env python3
"""作ってある単元の表記を、単元の水準の決まり（字・区切り・文体、docs/thinking-levels.md の第 5 節）に合わせる道具（D-225）。

子に見える文字列（問題文、ヒント、選択肢、答え、accept、explain、paths、order、図の中の文字）だけを書きかえる。
ファイルの書き方（並び、注、引用符）は保ったまま、文字列の節点の位置で置きかえ、書いたあと全体を読み直して、
ねらった文字列のほかに何も変わっていないことを確かめる。

  python tools/notation.py measure [記号…]                 … 決まりとのずれを数える（字・分かち書き・空白・文体）
  python tools/notation.py despace [記号…] [--write]       … 水準 3 以上の、日本語の字のあいだの空白を外す（機械で。図の中は外さない）
  python tools/notation.py packets <出す所> [記号…]        … 書きかえの要る文字列を、係に渡す束（JSON）にする
  python tools/notation.py apply <答えの JSON> [--write]   … 係の書きかえ（[{unit, i, t}] と束）を当てる。骨組み（数・記号・英字）が変わるものは当てない

文が変わると問題の記号（qid）が変わるので、id のない問題には前の指紋を id: に書いて記録を引き継ぐ（D-044）。
答えが変わったら、check の式の中の同じ文字列（引用符の中）も同じに変える。
"""
from __future__ import annotations

import json
import os
import re
import sys
from collections import Counter
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import roadmap as RM  # noqa: E402

CY = getattr(yaml, "CSafeLoader", yaml.SafeLoader)
JP = r"[぀-ヿ一-鿿々ー]"
CHILD = {"text", "hints", "choices", "answer", "accept", "explain", "paths", "svg", "order"}
TEXT_RE = re.compile(r"(<text\b[^>]*>)(.*?)(</text>)", re.S)
LABEL = re.compile(r"^([ア-ン]|[A-Z]|[①-⑳])\s")


def load_rules():
    rm = yaml.load((ROOT / "roadmap.yaml").read_text(encoding="utf-8"), Loader=CY)
    U = {u["id"]: u for u in rm["units"]}
    LV = {l["id"]: l for l in rm["levels"]}
    grades = json.loads((ROOT / "tools" / "kanji-grades.json").read_text(encoding="utf-8"))
    joyo = set(json.loads((ROOT / "tools" / "kanji-joyo.json").read_text(encoding="utf-8")))
    gl = yaml.load((ROOT / "glossary.yaml").read_text(encoding="utf-8"), Loader=CY)
    gl = (gl.get("terms") if isinstance(gl, dict) else gl) or []
    terms = sorted({str(t.get("term", "")) for t in gl if any(RM.is_kanji(c) for c in str(t.get("term", "")))}, key=len, reverse=True)

    def allowed(lv):
        k = LV[lv].get("kanji")
        if isinstance(k, int):
            return set().union(*[set(grades.get(str(g), [])) for g in range(1, k + 1)])
        if k == "joyo":
            return joyo
        return None
    return U, LV, allowed, terms


def item_paths(root):
    """問題の節点（日の items・extra、ri）を (path, MappingNode) で返す"""
    out = []
    top = dict((k.value, v) for k, v in root.value)
    for di, dn in enumerate(top.get("days").value if top.get("days") else []):
        dd = dict((k.value, v) for k, v in dn.value)
        for part in ("items", "extra"):
            for ii, it in enumerate(dd[part].value if part in dd and isinstance(dd[part], yaml.SequenceNode) else []):
                out.append((("days", di, part, ii), it))
    for ii, it in enumerate(top["ri"].value if "ri" in top and isinstance(top["ri"], yaml.SequenceNode) else []):
        out.append((("ri", ii), it))
    return out


def scalars(node, path=(), parent=None):
    if isinstance(node, yaml.MappingNode):
        for k, v in node.value:
            yield from scalars(v, path + (k.value,), node)
    elif isinstance(node, yaml.SequenceNode):
        for i, v in enumerate(node.value):
            yield from scalars(v, path + (i,), node)
    else:
        yield path, node, parent


def kind_of(rel):
    """問題の中の相対 path から、子に見える欄の種類（なければ None）"""
    keys = [p for p in rel if isinstance(p, str)]
    if not keys or keys[0] not in CHILD:
        return None
    if keys[-1] == "svg":
        return "svg"
    if keys[0] == "hints" and keys[-1] not in ("hints", "text"):
        return None
    return keys[0]


def child_scalars(root):
    """(問題の path, 相対 path, 種類, 節点, 親) を、子に見える文字列の節点について返す。check の節点も種類 check で返す"""
    for ip, it in item_paths(root):
        for rel, node, parent in scalars(it):
            if rel == ("check",):
                yield ip, rel, "check", node, parent
                continue
            k = kind_of(rel)
            if k is None:
                continue
            if k in ("answer", "accept", "choices", "order") and node.tag != "tag:yaml.org,2002:str":
                continue
            yield ip, rel, k, node, parent


NAME_H = set("あいうえおかきくけ")  # 図の名に使うひらがな 1 字（あ〜け）


def despace(s):
    """日本語の字のあいだの半角の空白を外す。残すのは次のとき：選択肢の頭の「ア 」、1 字の名（ア と イ、あ と い）のまわり、
    数のあとの「こ」（個）と続くひらがなのあいだ（「x こ とすると」が「こと」に読めないように）"""
    lab = LABEL.match(s)
    head, body = (s[: lab.end()], s[lab.end():]) if lab else ("", s)
    isjp = lambda j: 0 <= j < len(body) and bool(re.match(JP, body[j]))
    lone = lambda j: isjp(j) and not isjp(j - 1) and not isjp(j + 1)
    name = lambda j: lone(j) and (bool(re.match(r"[ア-ン]", body[j])) or body[j] in NAME_H)
    out = []
    for i, ch in enumerate(body):
        if ch == " " and isjp(i - 1) and isjp(i + 1):
            keep = name(i - 1) or name(i + 1) or (lone(i - 1) and body[i - 1] == "こ" and re.match(r"[ぁ-ん]", body[i + 1]))
            if not keep:
                continue
        out.append(ch)
    return head + "".join(out)


def skeleton(s):
    """数・記号・英字・句読点の並び（かな・漢字・空白を除いたもの）。書きかえで変わってはいけない"""
    return re.sub(r"[぀-ヿ一-鿿々ー\s　]", "", s)


def svg_map(v, f):
    """svg の <text> の中の字の部分だけに f を当てる"""
    def one(m):
        parts = re.split(r"(<[^>]+>)", m.group(2))
        return m.group(1) + "".join(p if p.startswith("<") else f(p) for p in parts) + m.group(3)
    return TEXT_RE.sub(one, v)


def svg_texts(v):
    return [p for m in TEXT_RE.finditer(v) for p in re.split(r"(<[^>]+>)", m.group(2)) if p and not p.startswith("<")]


def emit(t, node, parent, src_tail_nl):
    flow = isinstance(parent, (yaml.SequenceNode, yaml.MappingNode)) and parent.flow_style
    if node.style in (None, "") and "\n" not in t and t == t.strip() and t:
        try:
            ok = yaml.load(f"[{t}]", Loader=CY) == [t] if flow else yaml.load(f"k: {t}", Loader=CY) == {"k": t}
        except yaml.YAMLError:
            ok = False
        if ok:
            return t
    if node.style == "'" and "\n" not in t:
        return "'" + t.replace("'", "''") + "'"
    s = json.dumps(t, ensure_ascii=False)
    return s + ("\n" if src_tail_nl else "")


def rewrite(text, uid, fstr, fcheck=None, add_ids=True):
    """fstr(value, kind) で子に見える文字列を、fcheck(value) で check を書きかえた新しい文を返す。
    返り値：(新しい文, 書きかえた節点の数, id を足した問題の数)"""
    root = yaml.compose(text, Loader=CY)  # C 版（libyaml）の位置は文字の位置。Python 版は「 ? 」を含む流れの書き方を読めない単元がある
    old_obj = yaml.load(text, Loader=CY)
    old_items = {ip: it for ip, it in item_paths_obj(old_obj)}
    edits, touched = [], set()
    for ip, rel, kind, node, parent in child_scalars(root):
        v = node.value
        nv = (fcheck(v) if fcheck else v) if kind == "check" else fstr(v, kind)
        if nv != v:
            a, b = node.start_mark.index, node.end_mark.index
            tail_nl = node.style in ("|", ">") and text[b - 1:b] == "\n"
            edits.append((a, b, emit(nv, node, parent, tail_nl)))
            touched.add(ip)
    for a, b, s in sorted(edits, reverse=True):
        text = text[:a] + s + text[b:]
    # 読み直して、ねらいどおりか（ほかに何も変わっていないか）を確かめる
    new_obj = yaml.load(text, Loader=CY)
    exp = expected(old_obj, fstr, fcheck)
    if new_obj != exp:
        raise ValueError(f"{uid}: 書きかえたあとの中身が、ねらいと違う")
    n_ids = 0
    if add_ids:
        root2 = yaml.compose(text, Loader=CY)
        ins = []
        for ip, it in item_paths(root2):
            if ip not in touched:
                continue
            old = old_items[ip]
            if old.get("id"):
                continue
            newd = get_path(new_obj, ip)
            if RM.qid(uid, old) == RM.qid(uid, newd):
                continue
            k0, v0 = it.value[0]
            line_end = text.index("\n", v0.end_mark.index) + 1 if "\n" in text[v0.end_mark.index:] else len(text)
            h = RM.qid(uid, old).split(":", 1)[1]
            ins.append((line_end, " " * k0.start_mark.column + f'id: "{h}"\n', ip, h))
        for pos, s, _, _ in sorted(ins, key=lambda x: -x[0]):
            text = text[:pos] + s + text[pos:]
        n_ids = len(ins)
        chk = yaml.load(text, Loader=CY)
        for _, _, ip, h in ins:
            get_path(exp, ip)["id"] = h
        if chk != exp:
            raise ValueError(f"{uid}: id を足したあとの中身が、ねらいと違う")
        for ip, it in item_paths_obj(chk):
            if ip in touched and RM.qid(uid, it) != RM.qid(uid, old_items[ip]):
                raise ValueError(f"{uid} {ip}: 記号を引き継げていない")
    return text, len(edits), n_ids


def item_paths_obj(d):
    out = []
    for di, dd in enumerate(d.get("days") or []):
        for part in ("items", "extra"):
            for ii, it in enumerate(dd.get(part) or []):
                out.append((("days", di, part, ii), it))
    for ii, it in enumerate(d.get("ri") or []):
        out.append((("ri", ii), it))
    return out


def get_path(d, p):
    for k in p:
        d = d[k]
    return d


def expected(obj, fstr, fcheck):
    import copy
    o = copy.deepcopy(obj)

    def walk(x, rel):
        if isinstance(x, dict):
            for k in list(x):
                if rel == () and k == "check":
                    if fcheck and isinstance(x[k], str):
                        x[k] = fcheck(x[k])
                    continue
                x[k] = walk(x[k], rel + (k,))
            return x
        if isinstance(x, list):
            return [walk(v, rel + (i,)) for i, v in enumerate(x)]
        if isinstance(x, str):
            k = kind_of(rel)
            return fstr(x, k) if k else x
        return x
    for ip, it in item_paths_obj(o):
        walk(it, ())
    return o


def units_with_files(ids):
    ids = ids or sorted(p.stem for p in (ROOT / "units").glob("*.yaml"))
    return [u for u in ids if (ROOT / "units" / f"{u}.yaml").exists()]


def unit_terms(uid, U, text):
    """単元の用語：単元の名前と、頭注の「ことば」「用語」の行にある、2 字以上の漢字の語（水準 3 以上で漢字のまま残してよい）"""
    lines = [U[uid]["title"]] + [l for l in text.splitlines() if l.startswith("#") and ("ことば" in l or "用語" in l)]
    words = {m.group(0) for l in lines for m in re.finditer(r"[一-鿿々]{2,}", l)}
    # 用語の一部（2 字以上）も許す（質量数・質量欠損を教える単元の「質量」、核融合の「融合」）
    words |= {w[i:j] for w in words for i in range(len(w)) for j in range(i + 2, len(w) + 1)}
    return sorted(words, key=len, reverse=True)


def needs_of(s, kind, L, LV, allowed, terms, uterms=(), run=11):
    """この文字列に要る直し：(範囲の外の字, 分かち書きが要るか, 文体の直しが要るか)。
    水準 3 以上では、用語集の語と単元の用語（uterms）を語ごと許す。run は分かち書きの抜けとみなす長さ"""
    ok = allowed(L)
    t = s
    if L >= 3:
        for w in sorted(set(terms) | set(uterms), key=len, reverse=True):
            if w in t:
                t = t.replace(w, "・")
    texts = svg_texts(t) if kind == "svg" else [t]
    bad = sorted({c for x in texts for c in x if RM.is_kanji(c) and ok is not None and c not in ok})
    # 分かち書きの抜け：中黒の並び（あたま・むね・はら）は分けてから、run 字以上つづく日本語の字を探す
    sp = bool(LV[L].get("spacing")) and kind != "svg" and any(re.search(JP + "{%d,}" % run, x) for x in s.split("・"))
    st = L >= 6 and kind in ("text", "hints", "explain") and bool(re.search(r"(です|ます|でした|ました|でしょう|ましょう)(。|か|」|、|$)", s))
    return bad, sp, st


def cmd_measure(ids):
    U, LV, allowed, terms = load_rules()
    tot = Counter()
    for uid in units_with_files(ids):
        text = (ROOT / "units" / f"{uid}.yaml").read_text(encoding="utf-8")
        d = yaml.load(text, Loader=CY)
        L = U[uid]["level"]
        ut = unit_terms(uid, U, text)
        c = Counter()
        for ip, it in item_paths_obj(d):
            for s, kind in strings_of(it):
                bad, sp, st = needs_of(s, kind, L, LV, allowed, terms, ut)
                c["字"] += bool(bad)
                c["分かち書き"] += sp
                c["文体"] += st
                c["空白"] += kind != "svg" and LV[L].get("spacing") is False and despace(s) != s
        if any(c.values()):
            print(f"{uid}（水準 {L}）" + "、".join(f"{k} {v}" for k, v in c.items() if v))
        tot.update({k: v for k, v in c.items()})
        tot["単元"] += any(c.values())
    print("合わせて", dict(tot))


def strings_of(it):
    """問題の中の、子に見える文字列 (値, 種類)"""
    out = []

    def walk(x, rel):
        if isinstance(x, dict):
            for k, v in x.items():
                walk(v, rel + (k,))
        elif isinstance(x, list):
            for i, v in enumerate(x):
                walk(v, rel + (i,))
        elif isinstance(x, str):
            k = kind_of(rel)
            if k:
                out.append((x, k))
    walk(it, ())
    return out


def cmd_despace(ids, write):
    U, LV, _, _ = load_rules()
    n_u = n_e = n_i = 0
    for uid in units_with_files(ids):
        L = U[uid]["level"]
        if LV[L].get("spacing") is not False:
            continue
        p = ROOT / "units" / f"{uid}.yaml"
        text = p.read_text(encoding="utf-8")
        d = yaml.load(text, Loader=CY)
        mapping = {s: despace(s) for _, it in item_paths_obj(d) for s, kind in strings_of(it) if kind != "svg" and despace(s) != s}
        if not mapping:
            continue
        new, ne, ni = rewrite(text, uid, lambda v, k: v if k == "svg" else mapping.get(v, v), lambda c: sync_check(c, mapping))
        if ne:
            n_u += 1
            n_e += ne
            n_i += ni
            print(f"{uid}（水準 {L}）書きかえ {ne}、id を足した問題 {ni}")
            if write:
                p.write_text(new, encoding="utf-8", newline="\n")
    print(f"単元 {n_u}、書きかえ {n_e}、id {n_i}" + ("（書いた）" if write else "（試し。--write で書く）"))


def sync_check(c, mapping):
    """check の式の中の、引用符でくくった文字列が書きかえの対象なら、同じに書きかえる"""
    for old, new in sorted(mapping.items(), key=lambda x: -len(x[0])):
        if "'" in new or '"' in new or "\\" in new:
            continue
        for q in ("'", '"'):
            c = c.replace(q + old + q, q + new + q)
    return c


def cmd_packets(outdir, ids, chunk_chars=14000, chunk_n=140):
    U, LV, allowed, terms = load_rules()
    outdir = Path(outdir)
    outdir.mkdir(parents=True, exist_ok=True)
    index = []
    for uid in units_with_files(ids):
        text = (ROOT / "units" / f"{uid}.yaml").read_text(encoding="utf-8")
        d = yaml.load(text, Loader=CY)
        L = U[uid]["level"]
        ut = unit_terms(uid, U, text) if L >= 3 else []
        seen, rows = {}, []
        for ip, it in item_paths_obj(d):
            for s, kind in strings_of(it):
                if kind == "svg":
                    for lab in svg_texts(s):
                        bad, _, _ = needs_of(lab, "text", L, LV, allowed, terms, ut)
                        if bad and ("svg", lab) not in seen:
                            seen[("svg", lab)] = len(rows)
                            rows.append({"i": len(rows), "kind": "svg", "s": lab, "kanji": "".join(bad), "spacing": False, "style": False})
                    continue
                bad, sp, st = needs_of(s, kind, L, LV, allowed, terms, ut)
                if (bad or sp or st) and ("t", s) not in seen:
                    seen[("t", s)] = len(rows)
                    rows.append({"i": len(rows), "kind": kind, "s": s, "kanji": "".join(bad), "spacing": sp, "style": st})
        if not rows:
            continue
        head = [l for l in text.splitlines() if l.startswith("#")]
        words = [l for l in head if "ことば" in l or "用語" in l][:6]
        used = " ".join(r["s"] for r in rows)
        uterms = [w for w in ut if w in used and any(c not in (allowed(L) or set()) for c in w)]
        gterms = [w for w in terms if L >= 3 and w in used and any(c not in (allowed(L) or set()) for c in w)]
        # 束に分ける
        packs, cur, size = [], [], 0
        for r in rows:
            if cur and (size + len(r["s"]) > chunk_chars or len(cur) >= chunk_n):
                packs.append(cur)
                cur, size = [], 0
            cur.append(r)
            size += len(r["s"])
        if cur:
            packs.append(cur)
        for k, pk in enumerate(packs, 1):
            name = f"{uid}-{k}.json"
            body = {"unit": uid, "title": U[uid]["title"], "level": L, "part": k, "parts": len(packs),
                    "words": words, "terms": sorted(set(uterms) | set(gterms), key=len, reverse=True), "rows": pk}
            (outdir / name).write_text(json.dumps(body, ensure_ascii=False, indent=0), encoding="utf-8")
            index.append({"file": name, "unit": uid, "level": L, "n": len(pk), "chars": sum(len(r["s"]) for r in pk),
                          "kanji": sum(1 for r in pk if r["kanji"]), "spacing": sum(r["spacing"] for r in pk), "style": sum(r["style"] for r in pk)})
    (outdir / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"束 {len(index)}、単元 {len({x['unit'] for x in index})}、文字列 {sum(x['n'] for x in index)}、字数 {sum(x['chars'] for x in index)}")
    lv = Counter()
    for x in index:
        lv[x["level"]] += x["n"]
    print("水準ごとの文字列", dict(sorted(lv.items())))


PARTICLE = set("のはがをにでともやへ")


def mixed_spots(old, new, keep=()):
    """交ぜ書きの疑い：もとの 2 字以上の漢字の語（あとに送りがなの続かないもの）が、書きかえで漢字とかなのまじりになった所。
    和語の動詞（見比べる → 見くらべる）は、あとにひらがなの送りがなが続くので数えない。単元の用語（keep）の中は見ない"""
    import difflib
    ops = difflib.SequenceMatcher(None, old, new, autojunk=False).get_opcodes()

    def mp(x, end=False):
        for tag, i1, i2, j1, j2 in ops:
            if i1 <= x < i2 or (end and x == i2 and i2 > i1):
                if tag == "equal":
                    return j1 + (x - i1)
                return j2 if end else j1
        return len(new)
    out = []
    for m in re.finditer(r"[一-鿿々]{2,}", old):
        a, b = m.span()
        w = m.group(0)
        if any(k in w or w in k for k in keep):
            continue
        if re.fullmatch(r"[何数]?[個枚匹冊羽頭杯台][分目]?", w):  # 何個 → 何こ、個分 → こ分 は助数詞のかなで、いまの書き方
            continue
        nxt = old[b:b + 1]
        if nxt and re.match(r"[ぁ-ん]", nxt) and nxt not in PARTICLE:
            continue
        seg = new[mp(a):mp(b, end=True)]
        if re.search(r"[一-鿿々]", seg) and re.search(r"[ぁ-ゖ]", seg):
            out.append((w, seg.strip()))
    return out


def cmd_apply(ans_path, write, packdir=None):
    """答え（[{file, rows: [{i, t}]}] か {file: [{i, t}]}）を、束の元の文字列に当てる"""
    U, LV, allowed, terms = load_rules()
    ans = json.loads(Path(ans_path).read_text(encoding="utf-8"))
    packdir = Path(packdir or Path(ans_path).parent)
    if isinstance(ans, dict):
        ans = [{"file": k, "rows": v} for k, v in ans.items()]
    by_unit, rejected, review = {}, [], []
    for a in ans:
        pk = json.loads((packdir / a["file"]).read_text(encoding="utf-8"))
        rows = {r["i"]: r for r in pk["rows"]}
        L = pk["level"]
        m = by_unit.setdefault(pk["unit"], {"t": {}, "svg": {}})
        for x in a["rows"]:
            r = rows.get(x["i"])
            if r is None:
                continue
            t = x["t"]
            why = []
            if skeleton(t) != skeleton(r["s"]):
                why.append("骨組み（数・記号・英字・句読点）が変わった")
            bad, sp, st = needs_of(t, "text", L, LV, allowed, terms, pk.get("terms") or [], run=16)
            if bad:
                why.append("範囲の外の字が残る：" + "".join(bad))
            if sp and r["kind"] != "svg":
                why.append("分かち書きが足りない")
            if st and r["style"]:
                why.append("文体（である）になっていない")
            if not t.strip() and r["s"].strip():
                why.append("空になった")
            if why:
                rejected.append({"file": a["file"], "unit": pk["unit"], "i": x["i"], "s": r["s"], "t": t, "why": why})
                continue
            spots = mixed_spots(r["s"], t, pk.get("terms") or [])
            why2 = ["交ぜ書きの疑い：" + "、".join(f"{o}→{n}" for o, n in spots)] if spots else []
            # 助数詞の「こ」のあとにひらがなが続き「こと」「こを」と読める（1 個とりこむ → 1 ことりこむ）
            if re.search(r"個[とをがはにでも]", r["s"]) and re.search(r"(\d|何|[A-Za-z]) ?こ[とをがはにでも]", t) and not re.search(r"こ [ぁ-ん]", t):
                why2.append("「こ」のあとにひらがなが続いて読みちがえる（こ のあとに空白を入れる）")
            if why2:
                review.append({"file": a["file"], "unit": pk["unit"], "i": x["i"], "s": r["s"], "t": t, "why": why2})
            m["svg" if r["kind"] == "svg" else "t"][r["s"]] = t
    tot_e = tot_i = 0
    for uid, m in sorted(by_unit.items()):
        p = ROOT / "units" / f"{uid}.yaml"
        text = p.read_text(encoding="utf-8")
        tmap, smap = m["t"], m["svg"]

        def f(v, kind):
            if kind == "svg":
                return svg_map(v, lambda s: smap.get(s, s))
            return tmap.get(v, v)
        new, ne, ni = rewrite(text, uid, f, lambda c: sync_check(c, tmap))
        tot_e += ne
        tot_i += ni
        if write and ne:
            p.write_text(new, encoding="utf-8", newline="\n")
    print(f"単元 {len(by_unit)}、書きかえた節点 {tot_e}、id を足した問題 {tot_i}、当てなかった書きかえ {len(rejected)}" + ("（書いた）" if write else "（試し）"))
    out = Path(ans_path).with_suffix(".rejected.json")
    out.write_text(json.dumps(rejected, ensure_ascii=False, indent=1), encoding="utf-8")
    Path(ans_path).with_suffix(".review.json").write_text(json.dumps(review, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"交ぜ書きの疑い（当てたが見直す）{len(review)}：", Path(ans_path).with_suffix(".review.json"))
    for r in review[:6]:
        print(" ", r["unit"], r["i"], r["why"][0][:60])
    if rejected:
        print("当てなかったもの：", out)
        for r in rejected[:8]:
            print(" ", r["unit"], r["i"], "／".join(r["why"]), "｜", r["s"][:30], "→", r["t"][:30])


def main():
    a = sys.argv[1:]
    if not a:
        print(__doc__)
        return
    cmd, rest = a[0], [x for x in a[1:] if not x.startswith("--")]
    write = "--write" in a
    if cmd == "measure":
        cmd_measure(rest)
    elif cmd == "despace":
        cmd_despace(rest, write)
    elif cmd == "packets":
        cmd_packets(rest[0], rest[1:])
    elif cmd == "apply":
        cmd_apply(rest[0], write, rest[1] if len(rest) > 1 else None)
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
