# 1 つの単元の問題を速く確かめる（D-129）（check の決まり、段の学年より上の漢字）。図とイラストを 1 枚の PNG にまとめて見られるようにする。
#   python tools/unitqc.py <単元の記号…>            … 誤りと漢字を出し、図（日の問題とヒント、腕だめし）を <一時フォルダ>/michisuji-shots/<作業ツリーの名>/shot-<記号>.png にまとめる（同じ名前に上書き。18 図を越えると shot-<記号>-1.png、-2.png … に分ける）
#   python tools/unitqc.py --no-shot <記号…>        … 図の PNG を作らない
#   python tools/unitqc.py --clean <記号…>          … 図の PNG を消す（見たら消す。画像をためない）
import sys, os, re, json, subprocess, html, tempfile
from pathlib import Path
REPO = Path(__file__).resolve().parents[1]
# 画像はリポジトリの外に置き、見たら --clean で消す（画像をためない）
HERE = Path(tempfile.gettempdir()) / 'michisuji-shots' / REPO.name
HERE.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(REPO / 'tools'))
args = sys.argv[1:]
def shots(uid):
    # 図の PNG（1 枚のとき shot-<記号>.png、多いときは shot-<記号>-1.png、-2.png … に分ける）
    pat = re.compile(rf'shot-{re.escape(uid)}(-\d+)?\.png$')
    return [p for p in HERE.glob(f'shot-{uid}*.png') if pat.match(p.name)]
if '--clean' in args:
    for uid in [a for a in args if not a.startswith('--')]:
        for p in shots(uid):
            p.unlink(); print('消した', p)
    sys.exit(0)
shot = '--no-shot' not in args
ids = [a for a in args if not a.startswith('--')]
import yaml
import roadmap as RM
data, problems = RM.load()
missing = [u for u in ids if u not in problems]
if missing:
    sys.exit(f'units/<記号>.yaml がない：{missing}')
errs = RM.check(data, {u: problems[u] for u in ids})
mine = [e for e in errs if any(u in e for u in ids)]
grades = json.loads((REPO / 'tools' / 'kanji-grades.json').read_text(encoding='utf-8'))
term_chars = {ch for t in data.get('glossary') or [] for ch in str(t.get('term', '')) if RM.is_kanji(ch)}
U = {u['id']: u for u in data['units']}
for uid in ids:
    print(f'== {uid}（段 {U[uid]["stage"]}）')
    e = [x for x in mine if uid in x]
    # 天びんは svg で描く。balance:（D-042）は答えを見ない係の道具（blind.py）にも図の PNG にも出ない（D-132 の追記）
    pu = problems[uid]
    nb = [f"{d.get('day')} 日目 {i}" for d in pu.get('days') or [] for i, it in enumerate((d.get('items') or []) + (d.get('extra') or []), 1)
          if it.get('balance') and not it.get('svg')]
    nb += [f'腕だめし {i}' for i, it in enumerate(pu.get('ri') or [], 1) if it.get('balance') and not it.get('svg')]
    e += [f'{uid} {w}：天びんを balance: でなく svg で描く（答えを見ない係に見えない。check が bal を使うなら式も直す）' for w in nb]
    print(f'  誤り {len(e)}')
    for x in e:
        print('   -', x)
    st = U[uid]['stage']
    if isinstance(st, int) and st <= 6:
        ok = set()
        for g in range(1, min(st, 6) + 1):
            ok |= set(grades.get(str(g), []))
        head = {ch for no, line in enumerate((REPO / 'units' / f'{uid}.yaml').read_text(encoding='utf-8').splitlines()) if no and line.startswith('#') for ch in line if RM.is_kanji(ch)}
        ok |= term_chars | head
        bad = {}
        def walk(x, key=None, where=''):
            if isinstance(x, str):
                if key == 'svg':  # 図の中の文字も子が読むので数える
                    x = re.sub(r'<[^>]+>', '', ' '.join(re.findall(r'<text\b[^>]*>(.*?)</text>', x, re.S)))
                    where = where + '（図の文字）'
                elif key in ('check', 'figure', 'part', 'kinds', 'uses', 'type', 'like'):
                    return
                for ch in x:
                    if RM.is_kanji(ch) and ch not in ok:
                        bad.setdefault(ch, where)
            elif isinstance(x, dict):
                for k, v in x.items():
                    walk(v, k, where)
            elif isinstance(x, list):
                for v in x:  # 一覧の中は一覧の名前で決める（kinds: [読み取り] は子に見せない）
                    walk(v, key, where)
        for d in problems[uid].get('days') or []:
            for i, it in enumerate((d.get('items') or []) + (d.get('extra') or []), 1):
                walk(it, None, f"{d.get('day')} 日目 {i}")
        walk(problems[uid].get('ri') or [], None, '腕だめし')
        print(f'  段 {st} の学年より上の漢字 {len(bad)}' + ('：' + '、'.join(f'{c}（{w}）' for c, w in list(bad.items())[:20]) if bad else ''))
    if shot:
        cells = []
        def add(label, s):
            cells.append(f'<div class="c"><div class="l">{html.escape(label)}</div><div class="f">{s}</div></div>')
        def add_item(lab, it):
            if it.get('svg'):
                add(lab, it['svg'])
            for k, h in enumerate(it.get('hints') or [], 1):
                if isinstance(h, dict) and h.get('svg'):
                    add(f'{lab} ヒント {k}', h['svg'])
        for d in problems[uid].get('days') or []:
            for i, it in enumerate((d.get('items') or []) + (d.get('extra') or []), 1):
                add_item(f"{d.get('day')} 日目 {i} {it.get('part', '')}", it)
        for i, it in enumerate(problems[uid].get('ri') or [], 1):
            add_item(f"腕だめし {i} {it.get('part', '')}", it)
        for p in shots(uid):  # 前の回の PNG を残さない
            p.unlink()
        if cells:
            per = 3 * 6  # 1 枚の PNG に 6 段（18 図）まで。多いときは分ける（高さで切れて後ろが見えなくならないように）
            chunks = [cells[i:i + per] for i in range(0, len(cells), per)]
            made, fail, jobs, pages = [], '', [], []
            for n, ch in enumerate(chunks, 1):
                stem = f'shot-{uid}' if len(chunks) == 1 else f'shot-{uid}-{n}'
                page = HERE / f'{stem}.html'
                page.write_text('<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:12px;background:#fff;color:#1d2433;font-family:"Yu Gothic UI","Hiragino Sans",sans-serif}'
                                '.g{display:grid;grid-template-columns:repeat(3,340px);gap:12px}.c{border:1px solid #ccd;border-radius:8px;padding:6px}'
                                '.l{font-size:12px;color:#556;margin-bottom:4px}.f svg{width:326px;height:auto;display:block}</style><div class="g">' + ''.join(ch) + '</div>',
                                encoding='utf-8')
                rows = (len(ch) + 2) // 3
                pages.append(page)
                jobs.append({'url': page.as_uri(), 'png': str(HERE / f'{stem}.png'), 'width': 1080, 'height': 40 + rows * 260, 'sec': 3})
            # ブラウザは 1 回だけ立てて全部の PNG を撮る（PC を軽くする。D-132）
            jf = HERE / f'jobs-{uid}.json'
            jf.write_text(json.dumps(jobs, ensure_ascii=False), encoding='utf-8')
            r = subprocess.run(['node', str(REPO / 'tools' / 'headless.mjs'), '--jobs', str(jf)],
                               capture_output=True, text=True, encoding='utf-8', env={**os.environ, 'MSYS_NO_PATHCONV': '1'})
            jf.unlink(missing_ok=True)
            for page in pages:
                page.unlink(missing_ok=True)
            for j in jobs:
                png = Path(j['png'])
                if png.exists():
                    made.append(png)
                else:
                    fail = r.stderr[-300:]
            for png in made:
                print(f'  図 → {png}')
            print(f'  図 {len(cells)} 枚、PNG {len(made)} 枚（見たら python tools/unitqc.py --clean {uid} で消す）' + (f'。作れなかった PNG がある：{fail}' if fail else ''))
        else:
            print('  図 0 枚')
