# 図の部品の見本を PNG にする（D-189。部品を作った人が目で確かめるため。単元を作る係は使わない）。
#   python tools/figparts/gallery.py <式のファイル> <png>   … ファイルの 1 行に 1 つの fig の式。4 列に並べて撮る
import sys, os, json, html, subprocess, tempfile
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from expand import namespace, to_svg  # noqa: E402

src, png = Path(sys.argv[1]), Path(sys.argv[2])
ns = namespace()
cells = []
for l in src.read_text(encoding='utf-8').splitlines():
    if not l.strip() or l.startswith('#'):
        continue
    try:
        s = to_svg(l.strip(), ns)
    except Exception as x:  # noqa: BLE001
        s = f'<pre>{html.escape(str(x))}</pre>'
    cells.append(f'<div class="c"><div class="k">{html.escape(l.strip()[:70])}</div>{s}</div>')
page = Path(tempfile.gettempdir()) / f'figgallery-{os.getpid()}.html'
page.write_text('<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:10px;font-family:"Yu Gothic UI",sans-serif;color:#1d2433;background:#fff}'
                '.g{display:grid;grid-template-columns:repeat(3,340px);gap:8px}.c{border:1px solid #ccd}.k{font-size:11px;color:#667;height:28px;overflow:hidden}'
                '.c svg{width:326px;height:auto;display:block}</style><div class="g">' + ''.join(cells) + '</div>', encoding='utf-8')
rows = (len(cells) + 2) // 3
r = subprocess.run(['node', str(HERE.parent / 'headless.mjs'), page.as_uri(), str(png), '1060', str(40 + rows * 248), '1'],
                   capture_output=True, text=True, encoding='utf-8', env={**os.environ, 'MSYS_NO_PATHCONV': '1'})
page.unlink(missing_ok=True)
print(png if png.exists() else r.stderr[-400:])
