# 物理の図の部品（D-205）：力学（床・壁・天井・箱・台車・玉・力と速度の矢印・つるしたおもり・ばね・斜面・円運動・振り子）、
# 波と振動（正弦の波・軸・光線）、グラフ（x-t・v-t）、流体（水そう・細い管・太さの変わる管・寸法）、電磁気（電流の印・磁場の印・電荷・コイル）。
# 物理の 12 単元（P-001〜P-032）の parts.py で何度も書かれた似た部品を、いちばん多く通る形にまとめた。
# 位置は 320×200 の中の座標で渡す（cx, cy は中心）。線は currentColor、文字は 13〜16、ぬりは淡い色。
import math
from base import *  # noqa: F401,F403  土台の部品も同じ名前で使える


def _m(s):
    return str(s).replace('-', '−')


# ---------- 力学 ----------
def floor(y=130, x1=20, x2=300):
    """床（横線とななめの斜線）。y は床の高さ、x1〜x2 は左右のはし"""
    s = line(x1, y, x2, y)
    for x in range(int(x1) + 10, int(x2), 14):
        s += line(x, y, x - 8, y + 9, w=1)
    return s


def ceil(y=20, x1=20, x2=300):
    """天井（横線と上向きの斜線）。y は天井の高さ、x1〜x2 は左右のはし"""
    s = line(x1, y, x2, y)
    for x in range(int(x1) + 10, int(x2), 14):
        s += line(x, y, x - 8, y - 9, w=1)
    return s


def wall(x=300, y1=20, y2=180, side=1):
    """壁（縦線と斜線）。x は壁の位置、y1〜y2 は上下のはし、side=1 は右がわに斜線、-1 は左がわ"""
    s = line(x, y1, x, y2)
    for y in range(int(y1) + 10, int(y2), 14):
        s += line(x, y, x + 9 * side, y - 8, w=1)
    return s


def blk(cx, base=150, w=70, h=44, s='', fill=BRN, op=.5, dash=None):
    """字の入る箱（物体）。cx は中心の x、base は底の y（箱は底から上へ）、s は箱の中の字、dash を渡すと点線（もとの位置など）"""
    r = rect(cx - w / 2, base - h, w, h, fill=fill, op=op, dash=dash)
    if s:
        r += text(cx, base - h / 2 + 5, s)
    return r


def cart(cx, base=150, w=84, h=30, s='', fill=SKY):
    """台車（箱と車輪 2 つ）。cx は中心の x、base は地面の y、w・h は箱の大きさ、s は箱の中の字"""
    top = base - 16 - h
    r = rect(cx - w / 2, top, w, h, fill=fill, op=.5) + circle(cx - w / 4, base - 8, 8, fill=GRY, op=.7) \
        + circle(cx + w / 4, base - 8, 8, fill=GRY, op=.7)
    if s:
        r += text(cx, top + h / 2 + 5, s)
    return r


def ball(cx, cy, r=14, s='', fill=YEL, op=.6):
    """玉（円）。cx, cy は中心、r は半径、s は中の字、fill はぬりの色"""
    return circle(cx, cy, r, fill=fill, op=op) + (text(cx, cy + 5, s, size=14) if s else '')


def fa(x, y, dx, dy, s='', color='#d9534f', size=14, side=False):
    """力の矢印と札。(x, y) が根もと、(dx, dy) が向きと長さ、s は札の字、side=True なら たての矢印の札を先の右に置く"""
    r = arrow(x, y, x + dx, y + dy, w=3, color=color)
    if s:
        if abs(dx) >= abs(dy):
            if dx >= 0:
                r += text(x + dx + 6, y + dy + 5, s, size=size, anchor='start')
            else:
                r += text(x + dx - 6, y + dy + 5, s, size=size, anchor='end')
        elif side:
            r += text(x + dx + 8, y + dy + 5, s, size=size, anchor='start')
        elif dy < 0:
            r += text(x + dx, y + dy - 8, s, size=size)
        else:
            r += text(x + dx, y + dy + 18, s, size=size)
    return r


def vel(cx, y, s='', d=1, L=25, color='currentColor'):
    """速度の矢印と札。cx は中心の x、y は矢印の高さ、s は札の字（矢印の上）、d=1 は右向き・-1 は左向き、L は半分の長さ"""
    r = arrow(cx - L * d, y, cx + L * d, y, color=color)
    if s:
        r += text(cx, y - 8, s)
    return r


def hang(s='', cx=160, cy=105, w=60, h=50, top=20):
    """天井から糸でつるしたおもり。cx は糸の x、cy はおもりの中心の y、w・h はおもりの大きさ、s は中の字、top は天井の y"""
    return ceil(top, cx - 70, cx + 70) + line(cx, top, cx, cy - h / 2) \
        + rect(cx - w / 2, cy - h / 2, w, h, fill=BRN, op=.6) + (text(cx, cy + 5, s) if s else '')


def zig(x1, y1, x2, y2, n=6, amp=9):
    """ばね（ぎざぎざの線）。(x1, y1) から (x2, y2) まで、どの向きでもよい。n は山の数、amp はふれ幅"""
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy) or 1
    ux, uy = dx / L, dy / L
    px, py = -uy, ux
    lead = 0.15 * L
    body = L - 2 * lead
    pts = [(x1, y1), (x1 + ux * lead, y1 + uy * lead)]
    for i in range(n * 2):
        t = lead + body * (i + 0.5) / (2 * n)
        sg = amp if i % 2 == 0 else -amp
        pts.append((x1 + ux * t + px * sg, y1 + uy * t + py * sg))
    pts.append((x1 + ux * (L - lead), y1 + uy * (L - lead)))
    pts.append((x2, y2))
    return poly(pts, closed=False, w=2)


def springmass(x=170, y=130, wall_x=40, bw=44, bh=34, s=''):
    """壁につないだばねと、台の上のおもり。x はおもりの左はし、y はおもりの上、wall_x は壁の x、bw・bh はおもりの大きさ、s は中の字"""
    r = line(wall_x, y - 60, wall_x, y + bh, w=4) + line(wall_x - 10, y + bh, 300, y + bh, w=2)
    r += zig(wall_x, y + bh / 2, x, y + bh / 2, n=7) + rect(x, y, bw, bh, fill=YEL, op=.8)
    if s:
        r += text(x + bw / 2, y + bh / 2 + 5, s)
    return r


def slope(x0=50, y0=170, w=200, h=150, t=0.5, bw=44, bh=28, fill=BRN):
    """斜面と、その上の物体。(x0, y0) は左下の角、w・h は底辺とたかさ、t は斜面の上の位置（0〜1）、bw・bh は物体の大きさ"""
    L = math.hypot(w, h)
    ux, uy = w / L, -h / L
    nx, ny = -h / L, -w / L
    px, py = x0 + t * w, y0 - t * h
    a, b = bw / 2, bh
    pts = [(px - ux * a, py - uy * a), (px + ux * a, py + uy * a),
           (px + ux * a + nx * b, py + uy * a + ny * b), (px - ux * a + nx * b, py - uy * a + ny * b)]
    return poly([(x0, y0), (x0 + w, y0), (x0 + w, y0 - h)], fill=GRY, op=.5) + poly(pts, fill=fill, op=.7)


def _polar(cx, cy, r, deg):
    a = math.radians(deg)
    return cx + r * math.cos(a), cy - r * math.sin(a)


def orbit(cx=160, cy=100, r=60, deg=0, vel=False, acc=False, rad=True, lab=None, mcol=YEL, al=34):
    """円の上を回る物。中心 (cx, cy)・半径 r・角 deg（反時計まわり、右が 0）。vel=True で速さの矢印（接線）、acc=True で中心向きの矢印、rad で半径の線、lab は半径の字"""
    px, py = _polar(cx, cy, r, deg)
    s = circle(cx, cy, r, dash='4 4') + dot(cx, cy, 3)
    if rad:
        s += line(cx, cy, px, py, w=1.5)
    a = math.radians(deg)
    if lab:
        mx, my = _polar(cx, cy, r / 2, deg)
        d = 10 + 12 * abs(math.sin(a))
        s += label(mx - d * math.sin(a), my - d * math.cos(a) + 4, lab, size=13)
    if vel:
        s += arrow(px, py, px - al * math.sin(a), py - al * math.cos(a), color='#2a6fb0')
    if acc:
        s += arrow(px, py, px - al * math.cos(a), py + al * math.sin(a), color='#d04040')
    return s + circle(px, py, 9, fill=mcol, op=.9)


def pendulum(px=160, py=30, L=120, deg=30, br=11, cw=100):
    """天井からの振り子。(px, py) が支点、L は糸の長さ、deg は鉛直からの角（右が正）、br はおもりの半径、cw は天井の長さ"""
    bx = px + L * math.sin(math.radians(deg))
    by = py + L * math.cos(math.radians(deg))
    return line(px - cw / 2, py, px + cw / 2, py, w=3) + line(px, py, bx, by, w=1.5) + circle(bx, by, br, fill=YEL, op=.9)


def numline(x0, x1, y, lo, hi, step=1, size=13):
    """数直線（矢印と目盛りの数）。x0〜x1 が lo〜hi の長さ、y は高さ、step は目盛りの間"""
    out = arrow(x0 - 12, y, x1 + 12, y, w=2)
    v = lo
    while v <= hi + 1e-9:
        px = x0 + (v - lo) * (x1 - x0) / (hi - lo)
        out += line(px, y - 5, px, y + 5, w=2) + text(px, y + 22, _m(v), size=size)
        v += step
    return out


def car(cx, cy, s=1, ghost=False, fill=SKY):
    """横から見た自動車。cx, cy は地面の中心、s は大きさの倍率、ghost=True でうすい点線（もとの位置）"""
    op = .2 if ghost else .6
    d = '3 3' if ghost else None
    return g(rect(-24, -22, 48, 14, fill=fill, op=op, rx=4, dash=d), rect(-13, -32, 26, 11, fill=fill, op=op, rx=3, dash=d),
             circle(-13, -6, 6, fill=GRY, op=.8), circle(13, -6, 6, fill=GRY, op=.8), x=cx, y=cy, s=s)


# ---------- 波と振動 ----------
def sine(x0, y0, w, amp, cycles=2, phase=0.0, n=80, dash=None):
    """正弦の波 y = amp sin(...)。(x0, y0) は左はしの中心の高さ、w は横の長さ、amp は山の高さ、cycles は波の数、phase はずれ（ラジアン）"""
    pts = [(x0 + w * i / n, y0 - amp * math.sin(2 * math.pi * cycles * i / n + phase)) for i in range(n + 1)]
    return poly(pts, closed=False, w=2.5, dash=dash)


def axes(x0, y0, w, h):
    """時間と変位の軸。(x0, y0) は原点、w は横軸（矢印）の長さ、h は縦軸の上下それぞれの長さ"""
    return arrow(x0, y0, x0 + w, y0, head=8) + line(x0, y0 - h, x0, y0 + h, w=1.5)


def ray(x, y, deg, L=40, lab=None, color='currentColor'):
    """光線（矢印）。(x, y) から角 deg（反時計まわり、右が 0）の向きに長さ L、lab は先の字"""
    a = math.radians(deg)
    ex, ey = x + L * math.cos(a), y - L * math.sin(a)
    s = arrow(x, y, ex, ey, color=color)
    if lab:
        s += text(x + (L + 13) * math.cos(a), y - (L + 13) * math.sin(a) + 5, lab, size=15)
    return s


# ---------- グラフ ----------
def gr(curves, xmax, ymin, ymax, ox=56, ow=244, oy=24, oh=136, xs=1, ys=1,
       fill=None, dots=(), xl='t (s)', yl='v (m/s)'):
    """x-t・v-t のグラフ。curves は折れ線の並び（各線は (t, 値) の点の並び）、横は 0〜xmax、たては ymin〜ymax、xs・ys は目盛りの間、
    fill は 1 本目の線と横軸の間をぬる色、dots は (t, 値) の点の並び、xl・yl は軸の字、ox・oy・ow・oh は枠の位置と大きさ"""
    def X(t):
        return ox + t * ow / xmax

    def Y(v):
        return oy + (ymax - v) * oh / (ymax - ymin)

    y0 = Y(0)
    out = arrow(ox - 6, y0, ox + ow + 8, y0, w=2) + arrow(ox, oy + oh + 4, ox, oy - 10, w=2)
    t = xs
    while t <= xmax + 1e-9:
        out += line(X(t), y0 - 4, X(t), y0 + 4, w=1) + text(X(t), y0 + 18, _m(t), size=13)
        t += xs
    v = ymin
    while v <= ymax + 1e-9:
        if abs(v) > 1e-9:
            out += line(ox - 4, Y(v), ox + 4, Y(v), w=1) + text(ox - 8, Y(v) + 5, _m(v), size=13, anchor='end')
        v += ys
    out += text(ox + ow + 6, y0 + 32, xl, size=13, anchor='end') + text(ox + 8, oy - 8, yl, size=13, anchor='start')
    if fill:
        p = curves[0]
        out += poly([(X(a), Y(b)) for a, b in p] + [(X(p[-1][0]), y0), (X(p[0][0]), y0)], fill=fill, op=.45, w=1)
    for p in curves:
        out += poly([(X(a), Y(b)) for a, b in p], closed=False, w=3)
    for (a, b) in dots:
        out += dot(X(a), Y(b), r=5, fill='#d9534f')
    return out


# ---------- 流体と寸法 ----------
def tank(cx, y, w, h, lv, fill=SKY):
    """水そう（上があいた入れ物）と水。cx は中心の x、y は上のはし、w・h は幅と高さ、lv は水の深さ（底から）"""
    x0 = cx - w / 2
    return rect(x0, y + h - lv, w, lv, fill=fill, op=.45, sw=0) + path(f"M{x0} {y} L{x0} {y + h} L{x0 + w} {y + h} L{x0 + w} {y}", w=2)


def ctube(cx, y, w, h, up, fill=SKY, base=None):
    """細い管（左右の線）と中の水面。cx は中心の x、y は上のはし、w・h は幅と長さ、up は水面の高さ（管の下のはしから上へ）"""
    x0, x1 = cx - w / 2, cx + w / 2
    return line(x0, y, x0, y + h) + line(x1, y, x1, y + h) + rect(x0, y + h - up, w, up, fill=fill, op=.5, sw=0)


def pipe(y=100, a=40, b=20, x1=30, x2=290, xa=110, xb=170):
    """太さの変わる管（横向き）。y は中心線、a は太い所の半分の幅、b は細い所の半分の幅、x1〜x2 は管の左右、xa〜xb は細くなる区間"""
    return poly([(x1, y - a), (xa, y - a), (xb, y - b), (x2, y - b)], closed=False) \
        + poly([(x1, y + a), (xa, y + a), (xb, y + b), (x2, y + b)], closed=False)


def dim(x, y1, y2, s, side=8):
    """たての寸法（両向きの矢印と字）。x は矢印の x、y1〜y2 は矢印の両はし、s は字（矢印の右に置く）、side は字までの間"""
    return arrow(x, y1, x, y2, both=True) + text(x + side, (y1 + y2) / 2 + 5, s, anchor='start')


def span(x1, x2, y, s):
    """よこの寸法（両向きの矢印と字）。x1〜x2 は矢印の両はし、y は高さ、s は字（矢印の上）"""
    return arrow(x1, y, x2, y, both=True, head=8) + text((x1 + x2) / 2, y - 6, s, size=13)


# ---------- 電磁気 ----------
def wire(cx, cy, kind='out', r=13, label=None, fill=GRY):
    """紙面に出入りする電流の印（導線の切り口）。kind='out' は手前向き（点）、'in' は奥向き（×）、r は半径、label は下に置く字"""
    s = circle(cx, cy, r, fill=fill, op=.6)
    if kind == 'out':
        s += dot(cx, cy, 4)
    else:
        s += line(cx - 6, cy - 6, cx + 6, cy + 6) + line(cx - 6, cy + 6, cx + 6, cy - 6)
    if label:
        s += text(cx, cy + r + 16, label)
    return s


def bmark(x, y, kind='in', r=6):
    """磁場の向きの印。kind='in' は奥向き（×）、'out' は手前向き（⊙）、r は大きさ"""
    if kind == 'in':
        return line(x - r, y - r, x + r, y + r, w=1.5) + line(x - r, y + r, x + r, y - r, w=1.5)
    return circle(x, y, r, w=1.5) + dot(x, y, 2)


def bgrid(x0, y0, cols, rows, d, kind='in'):
    """磁場の印の並び。左上の印が (x0, y0)、cols 列 rows 行、間は d、kind は 'in'（×）か 'out'（⊙）"""
    return ''.join(bmark(x0 + i * d, y0 + j * d, kind) for i in range(cols) for j in range(rows))


def charge(cx, cy, sign='+', r=11):
    """電荷（＋は赤、−は青の円）。cx, cy は中心、sign は '+' か '-'、r は半径"""
    return circle(cx, cy, r, fill=RED if sign == '+' else SKY, op=.6) + text(cx, cy + 5, '＋' if sign == '+' else '−', size=14)


def coil(x, y, w, h, n=6):
    """ソレノイド（コイル）を横から見た絵。左上が (x, y)、w・h は大きさ、n は輪の数"""
    d = w / n
    return ''.join(ellipse(x + d / 2 + i * d, y + h / 2, d * 0.35, h / 2, w=2) for i in range(n))


def loops(cx, cy, radii, ccw=True, arrows=True):
    """導線のまわりの磁場の輪（点線の同心円）。中心 (cx, cy)、radii は半径の並び、ccw=True で反時計まわり、arrows で一番上に矢印"""
    s = ''
    for r in radii:
        s += circle(cx, cy, r, dash='4 4', w=1.5)
        if arrows:
            d = -1 if ccw else 1
            s += arrow(cx - 7 * d, cy - r, cx + 7 * d, cy - r, w=1.5, head=8)
    return s
