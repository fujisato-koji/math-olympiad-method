# 図の確かめ（D-138 の試し）：単元の図（問題・ヒント・腕だめし）を画面なしのブラウザで描いて測り、
# 文字の重なり・枠からのはみ出し・小さい字を文字で出す。画像は作らないので、係が画像を見ずに直せる。
#   python tools/figlint.py <記号…>
import sys, os, json, html, subprocess, tempfile
from pathlib import Path
import yaml
yload = lambda s: yaml.load(s, Loader=getattr(yaml, "CSafeLoader", yaml.SafeLoader))
REPO = Path(__file__).resolve().parents[1]
sys.stdout.reconfigure(encoding='utf-8')
OUT = Path(tempfile.gettempdir()) / 'michisuji-work' / REPO.name
OUT.mkdir(parents=True, exist_ok=True)


def figs(uid):
    d = yload((REPO / 'units' / f'{uid}.yaml').read_text(encoding='utf-8')) or {}
    def item(lab, it):
        if it.get('svg'):
            yield lab, it['svg']
        for k, h in enumerate(it.get('hints') or [], 1):
            if isinstance(h, dict) and h.get('svg'):
                yield f'{lab} ヒント {k}', h['svg']
    for day in d.get('days') or []:
        for i, it in enumerate((day.get('items') or []) + (day.get('extra') or []), 1):
            yield from item(f"{day.get('day')} 日目 {i} {it.get('part', '')}", it)
    for i, it in enumerate(d.get('ri') or [], 1):
        yield from item(f'腕だめし {i}', it)


for uid in sys.argv[1:]:
    fs = list(figs(uid))
    cells = ''.join(f'<div class="c" data-where="{html.escape(w)}">{s}</div>' for w, s in fs)
    page = OUT / f'figlint-{uid}.html'
    # 確かめの PNG（unitqc）と同じ大きさ：1 枚 326px で描く
    page.write_text('<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:12px;font-family:"Yu Gothic UI",sans-serif;color:#1d2433}'
                    '.c{display:inline-block;width:340px;margin:6px;vertical-align:top}.c svg{width:326px;height:auto;display:block}</style>' + cells,
                    encoding='utf-8')
    r = subprocess.run(['node', str(REPO / 'tools' / 'figlint.mjs'), str(page)], capture_output=True, text=True, encoding='utf-8',
                       env={**os.environ, 'MSYS_NO_PATHCONV': '1'})
    page.unlink(missing_ok=True)
    try:
        res = json.loads(r.stdout.strip().splitlines()[-1])
    except Exception:
        print(f'== {uid}：測れなかった {r.stderr[-300:]}')
        continue
    n = sum(len(x['issues']) for x in res)
    print(f'== {uid}（図 {len(fs)} 枚）：直すところ {n}')
    for x in res:
        print(f"  - {x['where']}：" + '、'.join(x['issues'][:4]) + (f' ほか {len(x["issues"]) - 4}' if len(x['issues']) > 4 else ''))
