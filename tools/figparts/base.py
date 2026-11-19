# 図の部品の土台（D-189）。線・形・文字・矢印・表・棒グラフなど、どの分野でも使うもの。
# 決まりは docs/problem-figures.md の「図とイラスト」：線は currentColor 太さ 2、ぬりは色見本に fill-opacity、
# viewBox 320×200、文字は 13〜16（ここで 13〜16 に丸める）。部品は svg の断片（文字列）を返し、fig() か svg() で 1 枚にまとめる。
import math

YEL, SKY, GRN, RED, BRN, PUR, GRY = '#f3c969', '#7fc8f8', '#7bc96f', '#f08080', '#c9a36b', '#b39ddb', '#c8ccd6'
# 色は名前でも渡せる（fill='黄' や fill='yellow'）
COLORS = {'黄': YEL, '空': SKY, '空色': SKY, '緑': GRN, '赤': RED, '茶': BRN, '紫': PUR, '灰': GRY,
          'yellow': YEL, 'sky': SKY, 'green': GRN, 'red': RED, 'brown': BRN, 'purple': PUR, 'gray': GRY}
CC = 'currentColor'


def col(c):
    return COLORS.get(c, c) if c else None


def n(x):
    """座標を短く書く（1 けたの小数まで、.0 は落とす）"""
    s = '%.1f' % x
    return s[:-2] if s.endswith('.0') else s


def esc(s):
    return str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def _paint(fill, op, w, dash, stroke=CC):
    f = col(fill)
    a = f' fill="{f}" fill-opacity="{op}"' if f else ' fill="none"'
    a += f' stroke="{stroke}" stroke-width="{n(w)}"' if stroke and w else ''
    if dash:
        a += f' stroke-dasharray="{dash if isinstance(dash, str) else "6 4"}"'
    return a


def svg(*parts, w=320, h=200):
    """部品を並べて 1 枚の svg にする（width と height は書かない）"""
    return f'<svg viewBox="0 0 {w} {h}" xmlns="http://www.w3.org/2000/svg">' + ''.join(flat(parts)) + '</svg>'


def flat(parts):
    for p in parts:
        if isinstance(p, (list, tuple)):
            yield from flat(p)
        elif p:
            yield str(p)


def g(*parts, x=0, y=0, s=1, rot=0):
    """部品のまとまりを動かす（x, y だけずらし、s 倍し、rot 度まわす）"""
    t = []
    if x or y:
        t.append(f'translate({n(x)} {n(y)})')
    if s != 1:
        t.append(f'scale({s})')
    if rot:
        t.append(f'rotate({n(rot)})')
    return (f'<g transform="{" ".join(t)}">' if t else '<g>') + ''.join(flat(parts)) + '</g>'


def line(x1, y1, x2, y2, w=2, dash=None, color=CC):
    return f'<line x1="{n(x1)}" y1="{n(y1)}" x2="{n(x2)}" y2="{n(y2)}"' + _paint(None, 0, w, dash, col(color)) + '/>'


def circle(cx, cy, r, fill=None, op=.5, w=2, dash=None):
    return f'<circle cx="{n(cx)}" cy="{n(cy)}" r="{n(r)}"' + _paint(fill, op, w, dash) + '/>'


def dot(cx, cy, r=4, fill=CC):
    """塗りつぶした小さな点（電子、つぶ、印）"""
    return f'<circle cx="{n(cx)}" cy="{n(cy)}" r="{n(r)}" fill="{col(fill)}"/>'


def ellipse(cx, cy, rx, ry, fill=None, op=.5, w=2, dash=None, rot=0):
    t = f' transform="rotate({n(rot)} {n(cx)} {n(cy)})"' if rot else ''
    return f'<ellipse cx="{n(cx)}" cy="{n(cy)}" rx="{n(rx)}" ry="{n(ry)}"' + _paint(fill, op, w, dash) + t + '/>'


def rect(x, y, w, h, fill=None, op=.5, rx=0, sw=2, dash=None):
    r = f' rx="{n(rx)}"' if rx else ''
    return f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}"{r}' + _paint(fill, op, sw, dash) + '/>'


def poly(pts, fill=None, op=.5, w=2, dash=None, closed=True):
    p = ' '.join(f'{n(x)},{n(y)}' for x, y in pts)
    return f'<{"polygon" if closed else "polyline"} points="{p}"' + _paint(fill, op if fill else 0, w, dash) + '/>'


def path(d, fill=None, op=.5, w=2, dash=None):
    return f'<path d="{d}"' + _paint(fill, op, w, dash) + '/>'


def text(x, y, s, size=14, anchor='middle', bold=False, color=CC):
    """文字（size は 13〜16 に丸める。y は字の下の線）"""
    size = max(13, min(16, size))
    b = ' font-weight="bold"' if bold else ''
    return f'<text x="{n(x)}" y="{n(y)}" font-size="{size}" text-anchor="{anchor}" fill="{col(color)}"{b}>{esc(s)}</text>'


def label(x, y, s, size=14, anchor='middle', box=None, op=.35):
    """文字を淡い札の上に置く（box に色を渡すと札を描く）。札は字の大きさから見積もる"""
    size = max(13, min(16, size))
    wd = sum(size * (0.6 if ord(c) < 128 else 1.0) for c in str(s)) + 8
    x0 = x - wd / 2 if anchor == 'middle' else (x - 4 if anchor == 'start' else x - wd + 4)
    bg = rect(x0, y - size - 1, wd, size + 7, fill=box, op=op, rx=4, sw=1) if box else ''
    return bg + text(x, y, s, size, anchor)


def arrow(x1, y1, x2, y2, w=2, dash=None, head=10, both=False, color=CC):
    """矢印（線と小さな三角。marker は使わない）"""
    L = math.hypot(x2 - x1, y2 - y1) or 1
    ux, uy = (x2 - x1) / L, (y2 - y1) / L

    def tip(px, py, dx, dy):
        bx, by = px - head * dx, py - head * dy
        hw = head * .5
        return f'<polygon points="{n(px)},{n(py)} {n(bx - hw * dy)},{n(by + hw * dx)} {n(bx + hw * dy)},{n(by - hw * dx)}" fill="{col(color)}"/>'
    sx, sy = (x1 + head * ux, y1 + head * uy) if both else (x1, y1)
    out = line(sx, sy, x2 - head * ux, y2 - head * uy, w, dash, color) + tip(x2, y2, ux, uy)
    return out + (tip(x1, y1, -ux, -uy) if both else '')


def curved_arrow(x1, y1, x2, y2, bend=30, w=2, dash=None, head=10):
    """弓なりの矢印（bend は中ほどのふくらみ。正で進む向きの左へ）"""
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    L = math.hypot(x2 - x1, y2 - y1) or 1
    cx, cy = mx + bend * (y2 - y1) / L, my - bend * (x2 - x1) / L
    # 終わりの向き（制御点から終点へ）
    dx, dy = x2 - cx, y2 - cy
    dl = math.hypot(dx, dy) or 1
    dx, dy = dx / dl, dy / dl
    bx, by = x2 - head * dx, y2 - head * dy
    hw = head * .5
    return (path(f'M{n(x1)} {n(y1)} Q{n(cx)} {n(cy)} {n(bx)} {n(by)}', w=w, dash=dash)
            + f'<polygon points="{n(x2)},{n(y2)} {n(bx - hw * dy)},{n(by + hw * dx)} {n(bx + hw * dy)},{n(by - hw * dx)}" fill="{CC}"/>')


def ring(cx, cy, r=22, color=RED):
    """ヒントで見るところを囲む、色の点線の輪"""
    return f'<circle cx="{n(cx)}" cy="{n(cy)}" r="{n(r)}" fill="none" stroke="{col(color)}" stroke-width="3" stroke-dasharray="6 4"/>'


def box_mark(x, y, w, h, color=RED):
    """ヒントで見るところを囲む、色の点線の四角"""
    return f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}" rx="6" fill="none" stroke="{col(color)}" stroke-width="3" stroke-dasharray="6 4"/>'


def qmark(x, y, size=16):
    """「？」の札（答えの場所を伏せる）"""
    return rect(x - 13, y - 13, 26, 26, fill=GRY, op=.5, rx=6) + text(x, y + 5, '？', size)


def table(x, y, rows, cw=48, rh=26, fills=None, size=14, header=True, widths=None):
    """表。rows は行の並び（文字のリスト）。fills は {(行, 列): 色}。widths で列ごとの幅を変えられる"""
    fills = fills or {}
    ws = widths or [cw] * max(len(r) for r in rows)
    out = []
    for i, row in enumerate(rows):
        cx = x
        for j, v in enumerate(row):
            f = fills.get((i, j)) or (GRY if header and i == 0 else None)
            out.append(rect(cx, y + i * rh, ws[j], rh, fill=f, op=.4, sw=1.5))
            if v not in (None, ''):
                out.append(text(cx + ws[j] / 2, y + i * rh + rh / 2 + size * .35, v, size))
            cx += ws[j]
    return ''.join(out)


def bars(x, y, w, h, values, labels=None, top=None, fill=SKY, marks=None, show=False, unit='', size=13):
    """棒グラフ（x, y は左上、w, h は描く範囲。下に labels、marks は {番号: 色} で棒の色を変える、show で値を棒の上に）"""
    top = top or max(v for v in values if v is not None) * 1.1
    k = len(values)
    bw = w / k
    out = [line(x, y + h, x + w, y + h)]
    for i, v in enumerate(values):
        bx = x + i * bw + bw * .18
        if v is None:
            continue
        bh = h * v / top
        out.append(rect(bx, y + h - bh, bw * .64, bh, fill=(marks or {}).get(i, fill), op=.6, sw=1.5))
        if show:
            out.append(text(bx + bw * .32, y + h - bh - 4, f'{v}{unit}', size))
        if labels:
            out.append(text(bx + bw * .32, y + h + 16, labels[i], size))
    return ''.join(out)


def plot(x, y, w, h, values, labels=None, top=None, bottom=0, marks=None, size=13, dots=True):
    """折れ線（値の並び。None は飛ばす）。marks は {番号: 色} で点を大きく色付きに"""
    vs = [v for v in values if v is not None]
    top = top or max(vs) * 1.1
    k = len(values)
    px = lambda i: x + (i + .5) * w / k
    py = lambda v: y + h - h * (v - bottom) / (top - bottom)
    out = [line(x, y + h, x + w, y + h), line(x, y, x, y + h)]
    pts = [(px(i), py(v)) for i, v in enumerate(values) if v is not None]
    out.append(poly(pts, closed=False, w=2))
    for i, v in enumerate(values):
        if v is None:
            continue
        m = (marks or {}).get(i)
        out.append(circle(px(i), py(v), 6, fill=m, op=.9, w=1.5) if m else dot(px(i), py(v), 3.5))
        if labels:
            out.append(text(px(i), y + h + 16, labels[i], size))
    return ''.join(out)


def panels(*figs, labels=None, arrows=False, gap=10, w=320, h=200, size=14):
    """2〜4 つの小さな絵を横に並べる。figs は、それぞれ 0〜w, 0〜h で描いた部品（縮めて置く）。
    labels で下に名前（ア・イ・ウ など）、arrows=True で間に → を描く（変わる前と後）"""
    k = len(figs)
    pw = (w - gap * (k + 1)) / k
    s = min(pw / w, (h - 24) / h)
    out = []
    for i, f in enumerate(figs):
        x0 = gap + i * (pw + gap) + (pw - w * s) / 2
        out.append(g(f, x=x0, y=4, s=round(s, 3)))
        if labels:
            out.append(text(gap + i * (pw + gap) + pw / 2, h - 6, labels[i], size))
        if arrows and i < k - 1:
            ax = gap + (i + 1) * (pw + gap) - gap / 2
            out.append(arrow(ax - 9, h / 2 - 10, ax + 9, h / 2 - 10, head=7))
    return ''.join(out)


def choice_row(*fns, labels='アイウエ', cy=86, ly=176, size=16, s=1):
    """選ぶ図を 2〜4 つ横に並べ、下に ア・イ・ウ の札。fns は (cx, cy) を受けて部品を返す関数（lambda cx, cy: circle(cx, cy, 30) など）。
    s で縮める（各図は (0, 0) のまわりに描いて g で動かす形でもよい）"""
    k = len(fns)
    out = []
    for i, f in enumerate(fns):
        cx = 320 * (i + .5) / k
        out.append(f(cx, cy) if s == 1 else g(f(0, 0), x=cx, y=cy, s=s))
        if labels:
            out.append(text(cx, ly, labels[i], size))
    return ''.join(flat(out))


def fig(*parts):
    """部品の並びから 1 枚の svg（fig: の式が並びを返したときも、これで包む）"""
    return svg(*parts)
