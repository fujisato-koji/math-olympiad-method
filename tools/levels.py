"""理解の水準（7 段、D-220、docs/thinking-levels.md）を単元に付けるための道具。

    python tools/levels.py packet <out.md> <記号> ...   付ける人に渡す単元の資料を書く（段と水準は書かない）
    python tools/levels.py stats <a.json> <b.json>      2 人の付け方の一致（完全一致、1 つ違い、重み付き κ、AC1、境ごとの κ、95% の区間）
    python tools/levels.py hubs [上位の数]               子孫の多い単元と、流れをまたぐ前提の一覧
    python tools/levels.py check <levels.json>          付けた水準（{記号: 水準}）を前提と照らす（前提より低い、飛び越し、入口）
    python tools/levels.py apply <levels.json> [--write] roadmap.yaml の段を水準に置き換える（水準の表と単元の level）

付け方の json は [{"id": "N-009", "level": 2, ...}, ...]（ほかの項目は記録として残し、ここでは見ない）。
"""
import glob, json, random, re, sys
from collections import Counter, defaultdict
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
Y = getattr(yaml, 'CSafeLoader', yaml.SafeLoader)
LEVELS = range(1, 8)


def load_roadmap():
    rm = yaml.load((ROOT / 'roadmap.yaml').read_text(encoding='utf-8'), Loader=Y)
    U = {u['id']: u for u in rm['units']}
    lanes = {l['id']: l['name'] for l in rm['lanes']}
    return rm, U, lanes


def topics_by_unit():
    """網羅表の論題（目標の名前と論題）を、単元ごとに集める。"""
    out = defaultdict(list)
    for p in sorted(glob.glob(str(ROOT / 'coverage*.yaml'))):
        c = yaml.load(open(p, encoding='utf-8'), Loader=Y) or {}
        name = Path(p).stem.replace('coverage-', '').replace('coverage', 'IMO')
        for it in c.get('items') or []:
            for u in it.get('units') or []:
                out[u].append(f"{name}：{it.get('topic', '')}")
    return out


STAGE_LEVEL = re.compile(r'(段\s*\d+\s*・\s*)?水準\s*\d+\s*・?\s*')


def unit_file_summary(uid):
    """単元のファイルの頭の 3 行目（この単元で扱うこと）と、確認の日（最後の日）の問題と、腕だめしを 2 問。段と水準の書き込みは外す。"""
    p = ROOT / 'units' / f'{uid}.yaml'
    if not p.exists():
        return None, [], []
    lines = p.read_text(encoding='utf-8').splitlines()
    head = ''
    for ln in lines[1:6]:
        if re.search(r'段\s*\d|水準\s*\d|\d+\s*日。', ln):
            head = re.sub(r'^#\s*', '', ln)
            head = re.sub(r'段\s*\d+\s*・?', '', head)
            head = STAGE_LEVEL.sub('', head)
            head = re.sub(r'^\s*\d+\s*日。\s*', '', head)
            break
    d = yaml.load(p.read_text(encoding='utf-8'), Loader=Y) or {}
    days = d.get('days') or []
    last = days[-1] if days else {}
    items = [it for it in (last.get('items') or []) if it.get('part') != '見本'][:6]
    ri = (d.get('ri') or [])[:2]
    fmt = lambda it: (str(it.get('text', '')).strip()
                      + (f"　選択肢：{it['choices']}" if it.get('choices') else '')
                      + (f"　答え：{it['answer']}" if it.get('answer') not in (None, '') else '')
                      + ('　（図あり）' if it.get('svg') or it.get('figure') else ''))
    return head, [fmt(it) for it in items], [fmt(it) for it in ri]


def packet(out, ids):
    rm, U, lanes = load_roadmap()
    T = topics_by_unit()
    L = ['# 単元の資料（水準を付けるため）', '',
         '段と水準は書いていません。docs/thinking-levels.md の決まりで付けてください。', '']
    for uid in ids:
        u = U[uid]
        L.append(f"## {uid} {u['title']}")
        L.append('')
        L.append(f"- 流れ：{lanes.get(u.get('lane', uid[0]), uid[0])}、日数：{u.get('days', '')}")
        needs = u.get('needs') or []
        L.append('- 前提：' + ('、'.join(f"{n} {U[n]['title'].split('（')[0]}" for n in needs if n in U) or 'なし'))
        if u.get('plan'):
            L.append('- 日ごとのねらい：' + ' → '.join(f'{k}：{v}' for d in u['plan'] for k, v in d.items()))
        ts = T.get(uid, [])
        if ts:
            L.append(f'- この単元を指す網羅表の論題（{len(ts)} のうち 4 まで）：' + '／'.join(ts[:4]))
        head, items, ri = unit_file_summary(uid)
        if head:
            L.append(f'- 単元のファイルの頭の注：{head}')
        if items:
            L.append('- 確認の日（最後の日）の問題：')
            L += [f'  - {x}' for x in items]
        if ri:
            L.append('- 腕だめし（遠い場面の問題）：')
            L += [f'  - {x}' for x in ri]
        if not items:
            L.append('- 問題はまだない（題・前提・網羅表の論題から確認の日を想定する。決まり 1）')
        L.append('')
    Path(out).write_text('\n'.join(L), encoding='utf-8', newline='\n')
    print(f'{out}：{len(ids)} 単元')


def _kappa_w(a, b, k=7):
    """二次の重み付き κ（Cohen）。"""
    n = len(a)
    if n == 0:
        return float('nan')
    w = lambda i, j: 1 - ((i - j) ** 2) / ((k - 1) ** 2)
    po = sum(w(x, y) for x, y in zip(a, b)) / n
    pa, pb = Counter(a), Counter(b)
    pe = sum(w(i, j) * pa[i] * pb[j] for i in LEVELS for j in LEVELS) / (n * n)
    return (po - pe) / (1 - pe) if pe < 1 else 1.0


def _kappa(a, b):
    """2 値・多値の Cohen の κ（重みなし）。"""
    n = len(a)
    po = sum(x == y for x, y in zip(a, b)) / n
    cats = set(a) | set(b)
    pa, pb = Counter(a), Counter(b)
    pe = sum(pa[c] * pb[c] for c in cats) / (n * n)
    return (po - pe) / (1 - pe) if pe < 1 else 1.0


def _ac1(a, b):
    """Gwet の AC1（分布が偏っても安定）。"""
    n = len(a)
    cats = sorted(set(a) | set(b))
    q = len(cats)
    if q < 2:
        return 1.0
    po = sum(x == y for x, y in zip(a, b)) / n
    pi = {c: (a.count(c) + b.count(c)) / (2 * n) for c in cats}
    pe = sum(p * (1 - p) for p in pi.values()) / (q - 1)
    return (po - pe) / (1 - pe)


def _stats(a, b):
    n = len(a)
    s = {'n': n, 'exact': sum(x == y for x, y in zip(a, b)) / n, 'within1': sum(abs(x - y) <= 1 for x, y in zip(a, b)) / n,
         'kappa_w': _kappa_w(a, b), 'ac1': _ac1(a, b)}
    for k in range(1, 7):
        aa, bb = [x > k for x in a], [y > k for y in b]
        if 0 < sum(aa) + sum(bb) < 2 * n:
            s[f'{k}|{k + 1}'] = _kappa(aa, bb)
    return s


def stats(pa, pb, boot=2000, seed=20261120):
    A = {x['id']: int(x['level']) for x in json.load(open(pa, encoding='utf-8'))}
    B = {x['id']: int(x['level']) for x in json.load(open(pb, encoding='utf-8'))}
    ids = sorted(set(A) & set(B))
    a, b = [A[i] for i in ids], [B[i] for i in ids]
    s = _stats(a, b)
    rnd = random.Random(seed)
    samples = defaultdict(list)
    for _ in range(boot):
        idx = [rnd.randrange(len(ids)) for _ in ids]
        t = _stats([a[i] for i in idx], [b[i] for i in idx])
        for k, v in t.items():
            samples[k].append(v)
    ci = {k: (sorted(v)[int(.025 * len(v))], sorted(v)[int(.975 * len(v)) - 1]) for k, v in samples.items() if k != 'n'}
    print(f"単元 {s['n']}（片方だけ：{len(set(A) ^ set(B))}）")
    for k, v in s.items():
        if k == 'n':
            continue
        lo, hi = ci.get(k, (float('nan'), float('nan')))
        print(f'  {k:8s} {v:.3f}  （95%：{lo:.3f}〜{hi:.3f}）')
    print('  分布 A：', dict(sorted(Counter(a).items())), ' B：', dict(sorted(Counter(b).items())))
    diff = [(i, A[i], B[i]) for i in ids if A[i] != B[i]]
    print(f'  食い違い {len(diff)}：' + '、'.join(f'{i} {x}/{y}' for i, x, y in diff))
    return s, ci


def check(path):
    """付けた水準（{記号: 水準} の json）を前提のつながりと照らす（決まり 11、12）。
    低い：前提の最大より低い単元（上げるか、強すぎる前提として外すか、入口を置く）。
    飛び：前提の最大 + 1 を超える単元（間の単元が抜けているか、付けすぎか）。
    入口：前提のない単元で水準 3 以上。"""
    rm, U, lanes = load_roadmap()
    L = {k: int(v) for k, v in json.load(open(path, encoding='utf-8')).items()}
    miss = [i for i in U if i not in L]
    low, jump, entry = [], [], []
    for i, u in U.items():
        if i not in L:
            continue
        if not u.get('needs'):
            if L[i] >= 3:
                entry.append(i)
            continue
        ps = [(n, L[n]) for n in u['needs'] if n in L]
        if not ps:
            continue  # 前提にまだ水準がない
        m = max(l for _, l in ps)
        if L[i] < m:
            low.append((i, L[i], [(n, l) for n, l in ps if l > L[i]]))
        elif L[i] > m + 1:
            jump.append((i, L[i], m))
    print(f'水準のない単元 {len(miss)}' + (f'：{miss[:20]}' if miss else ''))
    print(f'分布：{dict(sorted(Counter(L.values()).items()))}')
    print(f'前提より低い {len(low)}、飛び越し {len(jump)}、前提のない入口で 3 以上 {len(entry)}')
    for i, l, ps in low:
        print(f"  低い {i} {U[i]['title'].split('（')[0][:20]} {l} ＜ " + '、'.join(f'{n}:{x}' for n, x in ps))
    for i, l, m in jump:
        print(f"  飛び {i} {U[i]['title'].split('（')[0][:20]} {l}（前提の最大 {m}）")
    for i in entry:
        print(f"  入口 {i} {U[i]['title'].split('（')[0][:20]} {L[i]}")
    return low, jump, entry


LEVEL_TABLE = [
    # id, 名前, 中身, 1 日の分, 思い出す・今日・挑戦, わけの深さ, 字の範囲（教育漢字の学年、joyo＝常用漢字、None＝決まりなし）, 分かち書き, 文体
    (1, '具体どうしを結ぶ', '目の前の物や絵を 1 つずつ結ぶ。数える、2 つを比べる、「〜すると〜になる」を言う', 15, (2, 3, 1), (1, 1), 1, True, 'です・ます（話しかけ）'),
    (2, '具体の仕組みをとらえる', 'いくつもの具体の関係を同時に保つ。位とくり上がり、てんびん 2 回で重さの順、表に整理して比べる', 20, (2, 3, 1), (1, 2), 2, True, 'です・ます（話しかけ）'),
    (3, '抽象をつかむ', '目に見えない 1 つのもの（分数、文字、密度、偶数と奇数、書かれた基準）を、1 つのものとして使う', 30, (2, 3, 1), (2, 2), 4, False, 'です・ます'),
    (4, '抽象どうしを結ぶ', '2 つの抽象の関係を使う。比例、関数、1 つの法則で予想する、公式を順に使う', 45, (2, 2, 1), (2, 3), 6, False, 'です・ます'),
    (5, '抽象の仕組みをとらえる', '互いに効き合う関係のまとまりを同時に扱う。平衡、衝突、需要と供給、いくつもの条件を同時に満たす', 60, (1, 2, 1), (3, 3), 'joyo', False, 'です・ます'),
    (6, '原理をつかむ', '公理や理論のもとから組み立て、一般の結果を導く', 90, (1, 1, 1), (4, 4), None, False, 'である'),
    (7, '原理どうしを結ぶ', '理論どうしの対応を使う。研究の最前線で新しい定義・問い・方法を立てる', 120, (0, 1, 1), (5, 5), None, False, 'である'),
]


def levels_block():
    out = ['levels:']
    for i, name, about, mins, (a, b, c), (r1, r2), kanji, sp, style in LEVEL_TABLE:
        k = 'null' if kanji is None else kanji
        out.append(f'  - {{id: {i}, name: {name}, about: {about}, minutes: {mins}, day: {{思い出す: {a}, 今日: {b}, 挑戦: {c}}}, '
                   f'reason: [{r1}, {r2}], kanji: {k}, spacing: {"true" if sp else "false"}, style: {style}}}')
    return '\n'.join(out)


def apply(path, write=False):
    """roadmap.yaml の段（stages、単元の stage）を水準（levels、単元の level）に置き換える（D-220）。
    path は {記号: 水準} の json。すべての単元に水準が要る。write を付けなければ変化を数えるだけ。"""
    rm, U, lanes = load_roadmap()
    L = {k: int(v) for k, v in json.load(open(path, encoding='utf-8')).items()}
    miss = [i for i in U if i not in L]
    if miss:
        raise SystemExit(f'水準のない単元が {len(miss)}：{miss[:20]}')
    src = (ROOT / 'roadmap.yaml').read_text(encoding='utf-8')
    lines = src.split('\n')
    out, cur, n_flow, n_block, skip_stages = [], None, 0, 0, False
    for ln in lines:
        if ln.startswith('stages:'):
            out.append(levels_block())
            skip_stages = True
            continue
        if skip_stages:
            if ln.startswith('  - {id:'):
                continue
            skip_stages = False
        m = re.match(r'(\s*- \{id: )([A-Z]-\d{3})(, .*)$', ln)
        if m:
            uid = m.group(2)
            body, k = re.subn(r', stage: \d+, level: \d+', f', level: {L[uid]}', m.group(3), count=1)
            if not k:
                body, k = re.subn(r', stage: \d+', f', level: {L[uid]}', m.group(3), count=1)
            if not k:
                raise SystemExit(f'{uid}：stage が見つからない')
            out.append(m.group(1) + uid + body)
            n_flow += 1
            continue
        m = re.match(r'\s*- id: ([A-Z]-\d{3})\s*$', ln)
        if m:
            cur = m.group(1)
        if cur and re.match(r'\s+stage: \d+\s*$', ln):
            out.append(re.sub(r'stage: \d+', f'level: {L[cur]}', ln))
            n_block += 1
            continue
        if cur and re.match(r'\s+level: \d+\s*$', ln):
            continue  # 前の水準（ブロックの書き方）は消す。水準は stage の行の位置に書いた
        m = re.match(r'(\s*# ---- )段 (\d+) (.*) ----\s*$', ln)
        if m:
            out.append(f'{m.group(1)}前の段 {m.group(2)}（{m.group(3)}）の並び ----')
            continue
        out.append(ln)
    print(f'流れの書き方 {n_flow}、ブロックの書き方 {n_block}、合わせて {n_flow + n_block} / {len(U)}')
    head_fix = {
        '段は stage に書く（D-016）。': '水準は level に書く（D-220、docs/thinking-levels.md。前の段 stage はやめた）。',
        '目標には要らないが、段の物差しの大会': '目標には要らないが、物差しの大会',
    }
    for k2, v2 in head_fix.items():
        out = [x.replace(k2, v2) if x.startswith('#') else x for x in out]
    if n_flow + n_block != len(U):
        raise SystemExit('書き換えた単元の数が合わない')
    n_head = apply_headers(L, write)
    print(f'単元のファイルの頭の注を直す：{n_head} ファイル')
    if write:
        (ROOT / 'roadmap.yaml').write_text('\n'.join(out), encoding='utf-8', newline='\n')
        print('roadmap.yaml を書きかえた')


def apply_headers(L, write=False):
    """単元のファイルの頭の注（id: より前の # の行）の段を直す（D-220）。子には見せない書き方の記録なので、
    決まった形「# 段 k・水準 m・d 日。」は新しい水準に、ほかの行の「段 k」は「前の段 k」、前の 5 段の「水準 m」は「前の水準 m」にする。"""
    n = 0
    for p in sorted((ROOT / 'units').glob('*.yaml')):
        uid = p.stem
        if uid not in L:
            continue
        lines = p.read_text(encoding='utf-8').split('\n')
        changed = False
        for k, ln in enumerate(lines):
            if not ln.startswith('#'):
                if ln.startswith('id:'):
                    break
                continue
            new = re.sub(r'^# 段 \d+・水準 \d+・', f'# 水準 {L[uid]}・', ln)
            if new == ln and ('段' in ln or '水準' in ln):
                new = re.sub(r'(?<!前の)段 (\d+)', r'前の段 \1', ln)
                new = re.sub(r'(?<!前の)段（stage）', '前の段（stage）', new)
                new = re.sub(r'(?<!前の)水準 (\d)(?![\d|])', r'前の水準 \1', new)
                new = re.sub(r'(?<!前の)水準は (\d)(?!\d)', r'前の水準は \1', new)
            if new != ln:
                lines[k] = new
                changed = True
        if changed:
            n += 1
            if write:
                p.write_text('\n'.join(lines), encoding='utf-8', newline='\n')
    return n


def hubs(top=40):
    rm, U, lanes = load_roadmap()
    kids = defaultdict(set)
    for u in rm['units']:
        for n in u.get('needs') or []:
            kids[n].add(u['id'])
    memo = {}

    def desc(i):
        if i not in memo:
            s = set()
            for k in kids[i]:
                s.add(k)
                s |= desc(k)
            memo[i] = s
        return memo[i]
    rows = sorted(U, key=lambda i: -len(desc(i)))
    print('子孫の多い単元：')
    for i in rows[:top]:
        ds = desc(i)
        cross = Counter(d[0] for d in ds if d[0] != i[0])
        print(f"  {i} {U[i]['title'].split('（')[0][:24]}  子孫 {len(ds)}（ほかの流れ {sum(cross.values())}：" + ' '.join(f'{k}{v}' for k, v in cross.most_common(5)) + '）')


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'packet':
        packet(sys.argv[2], sys.argv[3:])
    elif cmd == 'stats':
        stats(sys.argv[2], sys.argv[3])
    elif cmd == 'check':
        check(sys.argv[2])
    elif cmd == 'apply':
        apply(sys.argv[2], write='--write' in sys.argv)
    elif cmd == 'hubs':
        hubs(int(sys.argv[2]) if len(sys.argv) > 2 else 40)
    else:
        print(__doc__)
