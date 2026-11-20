"""理解の水準（7 段、D-220、docs/thinking-levels.md）を単元に付けるための道具。

    python tools/levels.py packet <out.md> <記号> ...   付ける人に渡す単元の資料を書く（段と水準は書かない）
    python tools/levels.py stats <a.json> <b.json>      2 人の付け方の一致（完全一致、1 つ違い、重み付き κ、AC1、境ごとの κ、95% の区間）
    python tools/levels.py hubs [上位の数]               子孫の多い単元と、流れをまたぐ前提の一覧

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
    elif cmd == 'hubs':
        hubs(int(sys.argv[2]) if len(sys.argv) > 2 else 40)
    else:
        print(__doc__)
