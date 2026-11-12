# 答えを見ずに解く係のための道具（D-131）。答え・ヒント・筋道・check を抜いた問題を、文と選択肢と図だけで見せる。
#   python tools/blind.py build <記号…>    … <一時フォルダ>/michisuji-blind/<作業ツリーの名>/<記号>.json を作る（答える問題だけ。key は d<日>-<番>、予備は d<日>-x<番>、腕だめしは ri-<番>）
#   python tools/blind.py render <記号> <係の名>   … <一時フォルダ>/michisuji-blind/<作業ツリーの名>/<記号>-<係の名>-1.png、-2.png … に、問題を 8 問ずつ画像にする（見たら clean で消す）
#   python tools/blind.py clean <記号> <係の名>    … その係の画像を消す
#   python tools/blind.py key <記号…>      … 主会話だけが使う：key ごとの答え（係には見せない）
import sys, os, json, html, subprocess, tempfile
from pathlib import Path
import yaml
REPO = Path(__file__).resolve().parents[1]
# 答えを抜いた問題と画像はリポジトリの外に置く（係が答えを見ないように、画像をためないように）
OUT = Path(tempfile.gettempdir()) / 'michisuji-blind' / REPO.name
OUT.mkdir(parents=True, exist_ok=True)


def items(uid):
    d = yaml.safe_load((REPO / 'units' / f'{uid}.yaml').read_text(encoding='utf-8'))
    for day in d.get('days') or []:
        for i, it in enumerate(day.get('items') or [], 1):
            yield f"d{day['day']}-{i}", it
        for i, it in enumerate(day.get('extra') or [], 1):
            yield f"d{day['day']}-x{i}", it
    for i, it in enumerate(d.get('ri') or [], 1):
        yield f'ri-{i}', it


def answerable(it):
    return it.get('part') not in ('見本', 'わけ') and 'answer' in it


cmd, ids = sys.argv[1], sys.argv[2:]
if cmd == 'build':
    for uid in ids:
        rows = [{'key': k, 'part': it.get('part'), 'text': it.get('text', ''), 'choices': it.get('choices'),
                 'figure': it.get('figure'), 'svg': it.get('svg')} for k, it in items(uid) if answerable(it)]
        (OUT / f'{uid}.json').write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding='utf-8')
        print(uid, len(rows), '問', OUT / f'{uid}.json')
elif cmd == 'key':
    for uid in ids:
        print(json.dumps({k: str(it['answer']) for k, it in items(uid) if answerable(it)}, ensure_ascii=False))
elif cmd == 'clean':
    uid, tag = ids[0], ids[1] if len(ids) > 1 else ''
    for p in OUT.glob(f'{uid}-{tag}-*.png' if tag else f'{uid}-*.png'):
        p.unlink(); print('消した', p.name)
elif cmd == 'render':
    uid, tag = ids[0], ids[1] if len(ids) > 1 else 'x'
    for p in OUT.glob(f'{uid}-{tag}-*.png'):
        p.unlink()
    rows = json.loads((OUT / f'{uid}.json').read_text(encoding='utf-8'))
    per = 8
    for n in range(0, len(rows), per):
        cells = []
        for r in rows[n:n + per]:
            ch = '　'.join(f'［{html.escape(str(c))}］' for c in r['choices']) if r.get('choices') else '（数で答える）'
            fig = f"<pre>{html.escape(r['figure'])}</pre>" if r.get('figure') else ''
            cells.append(f"<div class='c'><div class='k'>{r['key']}（{html.escape(str(r['part']))}）</div><div class='t'>{html.escape(r['text'])}</div>"
                         f"<div class='f'>{r.get('svg') or ''}</div>{fig}<div class='ch'>{ch}</div></div>")
        page = OUT / f'{uid}-{tag}-{n // per + 1}.html'
        page.write_text("<!doctype html><meta charset='utf-8'><style>body{margin:0;padding:12px;background:#fff;color:#1d2433;font-family:'Yu Gothic UI',sans-serif}"
                        ".g{display:grid;grid-template-columns:repeat(2,520px);gap:12px}.c{border:1px solid #ccd;border-radius:8px;padding:8px}"
                        ".k{font-size:13px;color:#556}.t{font-size:16px;margin:4px 0}.f svg{width:500px;height:auto;display:block}.ch{font-size:16px;margin-top:4px}"
                        "pre{font-size:15px}</style><div class='g'>" + ''.join(cells) + '</div>', encoding='utf-8')
        png = OUT / f'{uid}-{tag}-{n // per + 1}.png'
        rows_n = (len(cells) + 1) // 2
        subprocess.run(['node', str(REPO / 'tools' / 'headless.mjs'), page.as_uri(), str(png), '1090', str(40 + rows_n * 470), '3'],
                       capture_output=True, text=True, encoding='utf-8', env={**os.environ, 'MSYS_NO_PATHCONV': '1'})
        page.unlink(missing_ok=True)
        print('画像', png if png.exists() else '（作れなかった）')
