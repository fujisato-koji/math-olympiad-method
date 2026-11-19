# 化学の図の部品（D-200）：原子の模型（核と電子の殻）、イオン、周期表、電子式、分子（構造式と球）、共有の重なり、
# イオンの結晶、金属と自由電子、ビーカーの中のつぶ、電気が通るかの道具。元素のデータ（原子番号 1〜20 と よく出る金属）も持つ。
# 位置は 320×200 の中の座標で渡す（cx, cy は中心）。大きさは r などで変える。文字は 13〜16。
# 元素のデータの出典（2026-11-19 に照らした。値は事実のデータ）：第 1 イオン化エネルギー（kJ/mol、整数に丸め）は
#   https://en.wikipedia.org/wiki/Molar_ionization_energies_of_the_elements 、電気陰性度（ポーリング）は
#   https://en.wikipedia.org/wiki/Electronegativities_of_the_elements_(data_page) の表（WebElements・CRC Handbook の値）と 1〜20 番で一致。貴ガスの電気陰性度は None。
import math
from base import *  # noqa: F401,F403  土台の部品も同じ名前で使える

SYM = [None, 'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca']
Z = {s: i for i, s in enumerate(SYM) if s}
Z.update({'Fe': 26, 'Cu': 29, 'Zn': 30, 'Ag': 47, 'Au': 79, 'Br': 35, 'I': 53})
# 子に見せる名前（段 4 までの字で書けないものはかな）
NAME = {'H': 'すいそ', 'He': 'ヘリウム', 'Li': 'リチウム', 'Be': 'ベリリウム', 'B': 'ホウそ', 'C': 'たんそ', 'N': 'ちっそ',
        'O': 'さんそ', 'F': 'フッそ', 'Ne': 'ネオン', 'Na': 'ナトリウム', 'Mg': 'マグネシウム', 'Al': 'アルミニウム', 'Si': 'ケイそ',
        'P': 'リン', 'S': 'いおう', 'Cl': 'えんそ', 'Ar': 'アルゴン', 'K': 'カリウム', 'Ca': 'カルシウム',
        'Fe': '鉄', 'Cu': 'どう', 'Zn': 'あえん', 'Ag': '銀', 'Au': '金', 'Br': 'しゅうそ', 'I': 'ヨウそ'}
IE = {'H': 1312, 'He': 2372, 'Li': 520, 'Be': 900, 'B': 801, 'C': 1086, 'N': 1402, 'O': 1314, 'F': 1681, 'Ne': 2081,
      'Na': 496, 'Mg': 738, 'Al': 578, 'Si': 787, 'P': 1012, 'S': 1000, 'Cl': 1251, 'Ar': 1521, 'K': 419, 'Ca': 590}
EN = {'H': 2.20, 'He': None, 'Li': 0.98, 'Be': 1.57, 'B': 2.04, 'C': 2.55, 'N': 3.04, 'O': 3.44, 'F': 3.98, 'Ne': None,
      'Na': 0.93, 'Mg': 1.31, 'Al': 1.61, 'Si': 1.90, 'P': 2.19, 'S': 2.58, 'Cl': 3.16, 'Ar': None, 'K': 0.82, 'Ca': 1.00}
# 短い周期表（1〜20）の列：族 1, 2, 13〜18 を 8 列に
GROUP = {'H': 1, 'He': 18, 'Li': 1, 'Be': 2, 'B': 13, 'C': 14, 'N': 15, 'O': 16, 'F': 17, 'Ne': 18,
         'Na': 1, 'Mg': 2, 'Al': 13, 'Si': 14, 'P': 15, 'S': 16, 'Cl': 17, 'Ar': 18, 'K': 1, 'Ca': 2}
COL8 = {1: 0, 2: 1, 13: 2, 14: 3, 15: 4, 16: 5, 17: 6, 18: 7}
# 球の模型の色
BALL = {'H': GRY, 'C': BRN, 'N': SKY, 'O': RED, 'F': GRN, 'Cl': GRN, 'Na': PUR, 'K': PUR, 'Mg': YEL, 'Ca': YEL,
        'S': YEL, 'Al': GRY, 'Cu': BRN, 'Fe': GRY, 'Ag': GRY, 'Zn': GRY, 'Li': PUR}


def zof(x):
    return x if isinstance(x, int) else Z[x]


def period(x):
    z = zof(x)
    return 1 if z <= 2 else 2 if z <= 10 else 3 if z <= 18 else 4


def config(e):
    """電子 e 個の殻への入り方（1〜20 の範囲：K 2、L 8、M 8、N の残り）。例 config(11) → [2, 8, 1]"""
    out = []
    for cap in (2, 8, 8, 18):
        if e <= 0:
            break
        out.append(min(cap, e))
        e -= cap
    return out


def valence(x):
    """価電子の数（貴ガスは 0）"""
    z = zof(x)
    if SYM[z] in ('He', 'Ne', 'Ar'):
        return 0
    return config(z)[-1]


def config_text(x, e=None):
    """「2, 8, 1」の形の文字"""
    return ', '.join(str(k) for k in config(zof(x) if e is None else e))


def _sign(charge):
    if not charge:
        return ''
    s = '+' if charge > 0 else '−'
    return (f'{abs(charge)}{s}' if abs(charge) > 1 else s)


def atom(x, cx=160, cy=100, r=80, e=None, nucleus='charge', label=None, paired=False, val=None, holes=0, extra=0,
         shells=None, size=14):
    """原子の模型（ボーアの模型）。x は元素記号か原子番号。
    e：電子の数（省くと原子番号＝原子。イオンは e を変える）。nucleus：'charge'（核に +11）、'sym'（核に記号）、'pn'（陽子と中性子の玉、8 番まで）、'' （何も書かない）。
    label：下に書く字（'Na' や 'ナトリウム'。True なら元素記号）。paired：いちばん外の殻の電子を上右下左の 4 か所に組で置く（電子式とつなげるとき）。
    val：いちばん外の殻の電子の色（'赤' など）。holes：いちばん外の殻に、出ていった電子の点線の丸を描く数。extra：入ってきた電子を色付きで描く数（val の色、なければ赤）。
    shells：殻の数を決めて描く（電子のない殻も輪だけ描く）"""
    z = zof(x)
    e = z if e is None else e
    cfg = config(e)
    # 出ていった電子の点線の丸は、いちばん外の殻が埋まっていれば その外の殻に、埋まっていなければ その殻に描く
    hk = (len(cfg) if (not cfg or cfg[-1] in (2, 8)) else len(cfg) - 1) if holes else None
    ns = max(shells or 0, len(cfg), (hk + 1) if hk is not None else 0, 1)
    rn = max(12, r * .2)
    step = (r - rn) / ns
    out = []
    for k in range(ns):
        out.append(circle(cx, cy, rn + step * (k + 1), w=1.5))
    out.append(circle(cx, cy, rn, fill=RED, op=.45))
    sym = SYM[z] if z < len(SYM) else next(s for s, v in Z.items() if v == z)
    if nucleus == 'charge':
        out.append(text(cx, cy + 5, f'+{z}', 13 if z >= 10 else 14))
    elif nucleus == 'sym':
        out.append(text(cx, cy + 5, sym, 14))
    elif nucleus == 'pn':
        nn = {1: 0, 2: 2, 3: 4, 4: 5, 5: 6, 6: 6, 7: 7, 8: 8}.get(z, z)
        balls = [RED] * z + [GRY] * nn
        rb = max(3.5, rn / (1.6 * math.sqrt(len(balls)) + .4))
        for i, c in enumerate(balls):
            a = i * 2.4
            d = rb * 1.1 * math.sqrt(i)
            out.append(circle(cx + d * math.cos(a), cy + d * math.sin(a), rb, fill=c, op=.9, w=1))
    rd = max(3.5, min(5, r / 16))
    for k in range(ns):
        m = cfg[k] if k < len(cfg) else 0
        last = k == len(cfg) - 1
        new = extra if last else 0
        cols = [None] * (m - new) + [col(val) or RED] * new
        if last and val and not extra:
            cols = [col(val)] * m
        cols += ['hole'] * (holes if k == hk else 0)
        if cols:
            out += _ring_dots(cx, cy, rn + step * (k + 1), cols, rd, paired and last)
    if label:
        out.append(text(cx, cy + r + 17, sym if label is True else label, size))
    return ''.join(out)


def _mark(x, y, rd, c):
    if c == 'hole':
        return f'<circle cx="{n(x)}" cy="{n(y)}" r="{n(rd + 1)}" fill="none" stroke="{CC}" stroke-width="1.5" stroke-dasharray="3 2"/>'
    return dot(x, y, rd, c or CC)


def _ring_dots(cx, cy, rr, cols, rd, paired):
    m = len(cols)
    out = []
    if paired:
        # 上・右・下・左に 1 つずつ置き、5 つ目から組にする（電子式と同じ置き方）
        slots = [[] for _ in range(4)]
        for i in range(m):
            slots[i % 4 if i < 4 else (i - 4) % 4].append(i)
        for s, idx in enumerate(slots):
            base = -math.pi / 2 + s * math.pi / 2
            for j, i in enumerate(idx):
                a = base + (0 if len(idx) == 1 else (-.16 if j == 0 else .16))
                out.append(_mark(cx + rr * math.cos(a), cy + rr * math.sin(a), rd, cols[i]))
    else:
        for i in range(m):
            a = -math.pi / 2 + 2 * math.pi * i / m
            out.append(_mark(cx + rr * math.cos(a), cy + rr * math.sin(a), rd, cols[i]))
    return out


# イオンの丸の大きさの既定（実際のイオン半径の大小に合わせ、陰イオンを大きく。H-014 の審査の直しと同じ）
ION_R = {'Li': 22, 'Na': 26, 'K': 30, 'Mg': 24, 'Ca': 28, 'Al': 22, 'Cu': 24, 'Zn': 24, 'Fe': 24, 'Ag': 28,
         'F': 30, 'Cl': 34, 'Br': 36, 'I': 38, 'O': 32, 'S': 36, 'H': 14}


def ion(sym, charge=0, cx=160, cy=100, r=None, fill=None, size=14, show='sym'):
    """イオン（または原子）の丸。charge は +1、−2 など。fill を省くと、陽イオンは赤、陰イオンは空色、0 は灰。
    r を省くと ION_R の大きさ（陰イオンは陽イオンより大きい。同じ図でイオンを比べるときは r を省くか、同じ比で縮める）。
    show：'sym'（Na と右上に +）、'sign'（+ や − だけ）、'none'（丸だけ）"""
    r = r or (ION_R.get(sym, 20) if charge else 20)
    f = fill or (RED if charge > 0 else SKY if charge < 0 else GRY)
    out = circle(cx, cy, r, fill=f, op=.5)
    if show == 'sym':
        sg = _sign(charge)
        w = len(sym) * size * .3
        out += text(cx - (len(sg) * 3.5 if sg else 0), cy + 5, sym, size)
        if sg:
            out += text(cx + w + 1, cy - 3, sg, 13, anchor='start')
    elif show == 'sign':
        out += text(cx, cy + 5, _sign(charge) or '0', 16)
    return out


def electron(cx, cy, r=5, label=False, color=None):
    """電子 1 つ（label=True で横に e⁻ と書く）"""
    return dot(cx, cy, r, col(color) or CC) + (text(cx + r + 3, cy + 5, 'e−', 13, anchor='start') if label else '')


def pt(x=34, y=26, cell=34, upto=20, show='sym', fills=None, q=None, mark_col=None, mark_row=None, heads=True, only=None):
    """短い周期表（原子番号 1〜upto、族 1・2・13〜18 の 8 列、周期 1〜4 の行）。
    show：'sym'（記号）、'z'（番号）、'zsym'（番号と記号）、'blank'（ます だけ）。fills：{記号: 色}。q：{記号: '？'} でますの字を伏せる。
    mark_col：族の数（1, 2, 13〜18）の列を点線で囲む。mark_row：周期の行を囲む。heads：上に族、左に周期の数を書く。only：描く元素を限る（記号の並び）"""
    fills, q = fills or {}, q or {}
    out = []
    if heads:
        for gnum, c in COL8.items():
            out.append(text(x + c * cell + cell / 2, y - 6, str(gnum), 13))
        rows = period(upto)
        for p in range(1, rows + 1):
            out.append(text(x - 10, y + (p - 1) * cell + cell / 2 + 5, str(p), 13))
    for zz in range(1, upto + 1):
        s = SYM[zz]
        if only and s not in only:
            continue
        cx0 = x + COL8[GROUP[s]] * cell
        cy0 = y + (period(zz) - 1) * cell
        out.append(rect(cx0, cy0, cell, cell, fill=fills.get(s), op=.55, sw=1.5))
        if s in q:
            out.append(text(cx0 + cell / 2, cy0 + cell / 2 + 5, q[s], 14))
        elif show == 'sym':
            out.append(text(cx0 + cell / 2, cy0 + cell / 2 + 5, s, 15))
        elif show == 'z':
            out.append(text(cx0 + cell / 2, cy0 + cell / 2 + 5, str(zz), 14))
        elif show == 'zsym' and cell >= 34:
            out.append(text(cx0 + cell / 2, cy0 + 14, str(zz), 13))
            out.append(text(cx0 + cell / 2, cy0 + cell - 5, s, 14))
    if mark_col:
        c = COL8[mark_col]
        out.append(box_mark(x + c * cell - 3, y - 3, cell + 6, period(upto) * cell + 6))
    if mark_row:
        out.append(box_mark(x - 3, y + (mark_row - 1) * cell - 3, 8 * cell + 6, cell + 6))
    return ''.join(out)


def card(x, cx=160, cy=100, w=96, h=110, name=True, z=True, extra=None, fill=None):
    """周期表の 1 ますを大きく（左上に原子番号、まん中に記号、下に名前、extra は下に足す字）"""
    zz = zof(x)
    s = SYM[zz] if zz < len(SYM) else x
    out = rect(cx - w / 2, cy - h / 2, w, h, fill=fill, op=.4, rx=6)
    if z:
        out += text(cx - w / 2 + 8, cy - h / 2 + 18, str(zz), 14, anchor='start')
    out += text(cx, cy + 6, s, 16, bold=True)
    if name:
        out += text(cx, cy + h / 2 - 22 if extra else cy + h / 2 - 10, NAME.get(s, s) if name is True else name, 13)
    if extra:
        out += text(cx, cy + h / 2 - 6, extra, 13)
    return out


def lewis(x, cx=160, cy=100, e=None, sides=None, size=16, color=None, gap=14):
    """電子式の 1 つの原子：記号のまわりの上・右・下・左に電子の点。e：点の数（省くと価電子の数）。
    sides：[上, 右, 下, 左] の数で置き方を決める（共有の組を向かい合わせるとき）。color：点の色"""
    s = x if isinstance(x, str) else SYM[x]
    if sides is None:
        k = valence(s) if e is None else e
        if s == 'He' and e is None:
            k = 2
        if s in ('Ne', 'Ar') and e is None:
            k = 8
        sides = [0, 0, 0, 0]
        for i in range(k):
            sides[i % 4 if i < 4 else (i - 4) % 4] += 1
        if s == 'He' and k == 2 and e is None:
            sides = [0, 2, 0, 0]
    out = [text(cx, cy + size * .35, s, size)]
    w = len(s) * size * .32 + 6
    pos = [(cx, cy - gap, 1, 0), (cx + w + 2, cy, 0, 1), (cx, cy + gap, 1, 0), (cx - w - 2, cy, 0, 1)]
    for (px, py, hx, vy), m in zip(pos, sides):
        if m == 1:
            out.append(dot(px, py, 2.6, col(color) or CC))
        elif m == 2:
            out.append(dot(px - 5 * hx, py - 5 * vy, 2.6, col(color) or CC))
            out.append(dot(px + 5 * hx, py + 5 * vy, 2.6, col(color) or CC))
    return ''.join(out)


def molecule(atoms, bonds=(), style='line', r=16, size=15, dash=()):
    """分子。atoms は [('H', x, y), ...]、bonds は [(i, j)] か [(i, j, 2)]（2 は二重、3 は三重）。
    style：'line'（構造式：記号と線）、'ball'（球と棒の模型）。dash：点線にする結合の番号（配位結合や水素結合の見せ方）"""
    out = []
    for k, b in enumerate(bonds):
        i, j, order = (b + (1,))[:3]
        _, x1, y1 = atoms[i]
        _, x2, y2 = atoms[j]
        L = math.hypot(x2 - x1, y2 - y1) or 1
        ux, uy = (x2 - x1) / L, (y2 - y1) / L
        cut = (r if style == 'ball' else 11)
        ax, ay, bx, by = x1 + cut * ux, y1 + cut * uy, x2 - cut * ux, y2 - cut * uy
        offs = [0] if order == 1 else [-3.5, 3.5] if order == 2 else [-6, 0, 6]
        for o in offs:
            out.append(line(ax - o * uy, ay + o * ux, bx - o * uy, by + o * ux, w=2, dash='4 3' if k in dash else None))
    for s, px, py in atoms:
        if style == 'ball':
            out.append(circle(px, py, r, fill=BALL.get(s, GRY), op=.6))
            out.append(text(px, py + 5, s, 14 if len(s) == 1 else 13))
        else:
            out.append(text(px, py + size * .35, s, size))
    return ''.join(out)


def shared(a, b, cx=160, cy=100, r=46, pairs=1, ea=None, eb=None, col_a=None, col_b=None, label=False):
    """共有結合の重なり：2 つの原子のいちばん外の殻を重ね、重なりに共有する電子の組を置く。
    ea, eb：それぞれの価電子の数（省くと元素から）。col_a, col_b：それぞれの原子から来た電子の色（どちらの電子かを見せる）"""
    ea = valence(a) if ea is None else ea
    eb = valence(b) if eb is None else eb
    d = r * 1.45
    xa, xb = cx - d / 2, cx + d / 2
    out = [circle(xa, cy, r, w=1.5), circle(xb, cy, r, w=1.5),
           circle(xa, cy, 13, fill=RED, op=.45), text(xa, cy + 5, a, 14),
           circle(xb, cy, 13, fill=RED, op=.45), text(xb, cy + 5, b, 14)]
    # 重なりの縦の線の上に、共有の組（a から 1、b から 1）
    hx = math.sqrt(max(r * r - (d / 2) ** 2, 1))
    ys = [cy - hx * .45 + k * (hx * .9 / max(pairs - 1, 1)) for k in range(pairs)] if pairs > 1 else [cy]
    for y in ys:
        out.append(dot(cx - 5, y, 4, col(col_a) or CC))
        out.append(dot(cx + 5, y, 4, col(col_b) or CC))
    # 残りの電子を外側に組で
    for (x0, rem, sgn, c) in ((xa, ea - pairs, -1, col_a), (xb, eb - pairs, 1, col_b)):
        spots = [math.pi if sgn < 0 else 0, -math.pi / 2, math.pi / 2]
        k = 0
        for sp in spots:
            for j in range(2):
                if k >= rem:
                    break
                a2 = sp + (-.17 if j == 0 else .17) * (1 if rem - k >= 2 or j else 0)
                out.append(dot(x0 + r * math.cos(a2), cy + r * math.sin(a2), 4, col(c) or CC))
                k += 1
    if label:
        out.append(text(cx, cy + r + 18, label if isinstance(label, str) else (f'{a}₂' if a == b else f'{a}{b}'), 14))
    return ''.join(out)


def lattice(cols=5, rows=3, a='Na', b='Cl', ca=1, cb=-1, x=None, y=None, d=40, r=16, show='sign', size=13):
    """イオンの結晶（陽イオンと陰イオンを交互に）。x, y は左上の丸の中心（省くとまん中に寄せる）。show は ion と同じ"""
    x = (320 - (cols - 1) * d) / 2 if x is None else x
    y = (200 - (rows - 1) * d) / 2 if y is None else y
    out = []
    for i in range(rows):
        out.append(line(x, y + i * d, x + (cols - 1) * d, y + i * d, w=1))
    for j in range(cols):
        out.append(line(x + j * d, y, x + j * d, y + (rows - 1) * d, w=1))
    for i in range(rows):
        for j in range(cols):
            s, c = (a, ca) if (i + j) % 2 == 0 else (b, cb)
            out.append(ion(s, c, x + j * d, y + i * d, r, show=show, size=size))
    return ''.join(out)


def metal(sym='Na', charge=1, cols=5, rows=3, x=None, y=None, d=44, r=15, electrons=None, show='sign'):
    """金属：陽イオンが並び、そのあいだを自由に動く電子（点）。electrons：電子の数（省くと 陽イオンの数 × charge）"""
    x = (320 - (cols - 1) * d) / 2 if x is None else x
    y = (200 - (rows - 1) * d) / 2 if y is None else y
    out = [rect(x - d * .6, y - d * .6, (cols - 1) * d + d * 1.2, (rows - 1) * d + d * 1.2, fill=GRY, op=.25, rx=8, sw=1.5)]
    for i in range(rows):
        for j in range(cols):
            out.append(ion(sym, charge, x + j * d, y + i * d, r, show=show))
    k = cols * rows * charge if electrons is None else electrons
    seed = 7
    spots = [(x + (j + .5) * d, y + (i + .5) * d) for i in range(-1, rows) for j in range(-1, cols)
             if -1 <= j < cols and -1 <= i < rows and not (j == -1 or i == -1)]
    spots += [(x + (j + .5) * d, y - d * .45) for j in range(cols - 1)] + [(x - d * .45, y + (i + .5) * d) for i in range(rows - 1)]
    for t in range(k):
        seed = (seed * 1103515245 + 12345) % 2 ** 31
        sx, sy = spots[t % len(spots)]
        jx, jy = ((seed >> 8) % 13 - 6), ((seed >> 16) % 13 - 6)
        out.append(dot(sx + jx, sy + jy, 4))
    return ''.join(out)


def beaker(cx=160, y=40, w=110, h=140, level=.7, fill=SKY, items=None, label=None, r=12, show='sign', seed=3):
    """ビーカーと液。items：[('Na', 1, 3), ('Cl', -1, 3)] のように（記号, 電荷, 数）。電荷 0 は灰の丸。
    つぶは液の中に重ならないように散らす（seed を変えると置き方が変わる）。label は下に書く字"""
    x0, x1 = cx - w / 2, cx + w / 2
    ly = y + h * (1 - level)
    out = [rect(x0, ly, w, y + h - ly, fill=fill, op=.35, sw=0),
           path(f'M{n(x0 - 6)} {n(y)} L{n(x0)} {n(y + 6)} L{n(x0)} {n(y + h)} L{n(x1)} {n(y + h)} L{n(x1)} {n(y + 6)} L{n(x1 + 6)} {n(y)}'),
           line(x0, ly, x1, ly, w=1.5)]
    parts = [(s, c) for s, c, k in (items or []) for _ in range(k)]
    if parts:
        cells = []
        nx = max(2, int((w - 10) // (2.6 * r)))
        ny = max(1, int((y + h - ly - 8) // (2.6 * r)))
        for i in range(ny):
            for j in range(nx):
                cells.append((x0 + 5 + (j + .5) * (w - 10) / nx, ly + 4 + (i + .5) * (y + h - ly - 8) / ny))
        s0 = seed
        order = list(range(len(cells)))
        for i in range(len(order) - 1, 0, -1):
            s0 = (s0 * 1103515245 + 12345) % 2 ** 31
            j = s0 % (i + 1)
            order[i], order[j] = order[j], order[i]
        if len(parts) > len(cells):
            raise ValueError(f'つぶ {len(parts)} こはビーカーに入りきらない（この大きさでは {len(cells)} こまで。r を小さくするか w・h を大きく）')
        for (s, c), ci in zip(parts, order):
            px, py = cells[ci]
            s0 = (s0 * 1103515245 + 12345) % 2 ** 31
            out.append(ion(s, c, px + (s0 >> 8) % 7 - 3, py + (s0 >> 16) % 7 - 3, r, show=show))
    if label:
        out.append(text(cx, y + h + 17, label, 14))
    return ''.join(out)


def bulb(cx, cy, lit=True, r=16):
    """豆電球（lit で光の線）"""
    out = [circle(cx, cy, r, fill=YEL if lit else None, op=.7),
           rect(cx - r * .45, cy + r * .8, r * .9, r * .6, fill=GRY, op=.6, sw=1.5),
           path(f'M{n(cx - 5)} {n(cy + 4)} L{n(cx - 2)} {n(cy - 4)} L{n(cx + 2)} {n(cy + 4)} L{n(cx + 5)} {n(cy - 4)}', w=1.5)]
    if lit:
        for k in range(7):
            a = -math.pi + k * math.pi / 6
            out.append(line(cx + (r + 4) * math.cos(a), cy + (r + 4) * math.sin(a), cx + (r + 11) * math.cos(a), cy + (r + 11) * math.sin(a), w=2))
    return ''.join(out)


def battery(cx, cy, w=36, h=18):
    """かん電池（横向き、右が +）"""
    return (rect(cx - w / 2, cy - h / 2, w, h, fill=GRY, op=.5, rx=3)
            + rect(cx + w / 2, cy - 4, 5, 8, fill=GRY, op=.8, sw=1.5)
            + text(cx + w / 2 - 8, cy + 5, '+', 13) + text(cx - w / 2 + 8, cy + 5, '−', 13))


def conduct(lit=True, items=None, label=None, liquid=SKY, level=.7, seed=3):
    """電気が通るかを調べる道具：ビーカーの液に 2 本の電極、上に豆電球とかん電池。
    lit：豆電球がつくか。items と label は beaker と同じ（液の中のつぶ）"""
    bx, by, bw, bh = 160, 80, 120, 100
    out = [beaker(bx, by, bw, bh, level=level, fill=liquid, items=items, label=label, r=11, seed=seed)]
    ex1, ex2 = bx - 28, bx + 28
    ey = by + bh - 18
    out += [rect(ex1 - 4, by - 20, 8, ey - by + 20, fill=GRY, op=.8, sw=1.5), rect(ex2 - 4, by - 20, 8, ey - by + 20, fill=GRY, op=.8, sw=1.5)]
    # 導線：左の電極 → 豆電球 → かん電池 → 右の電極
    out += [path(f'M{n(ex1)} {n(by - 20)} L{n(ex1)} 30 L118 30', w=2),
            bulb(134, 30, lit, 13),
            path(f'M150 30 L168 30', w=2), battery(190, 30),
            path(f'M213 30 L{n(ex2)} 30 L{n(ex2)} {n(by - 20)}', w=2)]
    return ''.join(out)


def atom_row(*specs, labels='アイウエ', cy=86, val=None, ring_outer=None, size=16, **kw):
    """原子を 2〜4 つ横に並べ、下に ア・イ・ウ の札（選ぶ問題）。specs は 記号 か (記号, 電子の数) か (記号, 電子の数, {atom の引数})。
    val：いちばん外の電子の色。ring_outer：いちばん外の殻を囲む輪の色（'空' など）。札は輪の外に書く"""
    k = len(specs)
    r = {1: 62, 2: 56, 3: 44, 4: 34}[k]
    out = []
    for i, sp in enumerate(specs):
        sp = sp if isinstance(sp, tuple) else (sp, None)
        cx = 320 * (i + .5) / k
        out.append(atom(sp[0], cx=cx, cy=cy, r=r, e=sp[1], val=val, **{**kw, **(sp[2] if len(sp) > 2 else {})}))
        if ring_outer:
            out.append(ring(cx, cy, r + 6, color=ring_outer))
        if labels:
            out.append(text(cx, cy + r + (28 if ring_outer else 22), labels[i], size))
    return out


def atom_change(a, b=None, say=None, labels=None, r=56, cy=88):
    """原子が変わるようす（原子 → イオン など）。a、b は 記号 か (記号, 電子の数) か (記号, 電子の数, {atom の引数})。
    b を省くと右は ？ の札。say は矢印の上の字、labels は左右の下の字 2 つ"""
    sp = lambda v: v if isinstance(v, tuple) else (v, None)
    a = sp(a)
    out = [atom(a[0], cx=70, cy=cy, r=r, e=a[1], **(a[2] if len(a) > 2 else {})), arrow(134, cy, 186, cy)]
    if say:
        out.append(text(160, cy - 12, say, 14))
    if b is None:
        out.append(qmark(250, cy))
    else:
        b = sp(b)
        out.append(atom(b[0], cx=250, cy=cy, r=r, e=b[1], **(b[2] if len(b) > 2 else {})))
    if labels:
        out += [text(70, cy + r + 22, labels[0], 15), text(250, cy + r + 22, labels[1], 15)]
    return out


def _slot8(sym, cx, cy, i, gap=14):
    """電子式の点の場所 0〜7：0 上・1 右・2 下・3 左（1 つずつ置く順）、4〜7 はその組の 2 つ目"""
    w = 13.1 if len(sym) == 1 else 18.2
    side, k = i % 4, i // 4
    d = -5 if k == 0 else 5
    return [(cx + d, cy - gap), (cx + w, cy + d), (cx + d, cy + gap), (cx - w, cy + d)][side]


def lewis8(sym, cx=160, cy=100, n=None, at=None, colors=None, holes=(), size=16, r=3.4):
    """電子式の 1 つの原子（点の場所を 8 か所から選べる形）。n：点の数（場所 0, 1, 2 … の順。省くと価電子の数）、at：置く場所の並び。
    colors：{場所: 色}（どの原子から来た電子かを色で見せる）。holes：空きの場所を点線の丸で見せる（もらう電子の場所）"""
    idx = list(at) if at is not None else list(range(valence(sym) if n is None else n))
    out = [text(cx, cy + 5.6, sym, size)]
    for i in idx:
        x, y = _slot8(sym, cx, cy, i)
        out.append(dot(x, y, r, fill=col((colors or {}).get(i)) or CC))
    for i in holes:
        x, y = _slot8(sym, cx, cy, i)
        out.append(circle(x, y, r + 1.4, dash='2 2', w=1.5))
    return ''.join(out)


def brackets(cx, cy, hw, hh, charge=''):
    """かっこ［ ］と右上の電気の数（イオンの電子式や組成式を囲む）。hw, hh は半分の幅と高さ"""
    t, u = cy - hh, cy + hh
    return (path(f'M{n(cx - hw + 8)} {n(t)} L{n(cx - hw)} {n(t)} L{n(cx - hw)} {n(u)} L{n(cx - hw + 8)} {n(u)}')
            + path(f'M{n(cx + hw - 8)} {n(t)} L{n(cx + hw)} {n(t)} L{n(cx + hw)} {n(u)} L{n(cx + hw - 8)} {n(u)}')
            + (text(cx + hw + 4, t + 8, charge, 14, anchor='start') if charge else ''))


def lewis_ion(sym, charge, cx=160, cy=100, n=8, at=None, colors=None):
    """かっこ付きのイオンの電子式（[ :Cl: ]⁻ の形）。charge は '−' や '2+' の字"""
    b = (13.1 if len(sym) == 1 else 18.2) + 11
    return lewis8(sym, cx, cy, n=n, at=at, colors=colors) + brackets(cx, cy, b, 25, charge)


def lewis_mol(atoms, bonds, r=3.4):
    """分子の電子式。atoms：[(記号, x, y, 共有に使わない点の場所の並び, 色)]、bonds：[(i, j, 共有電子対の数)]。
    共有の点は、出した原子の色で 2 つ並べる（色を分けると、どちらの電子かが見える）"""
    out = []
    for sym, x, y, lone, c in atoms:
        out.append(lewis8(sym, x, y, at=lone, r=r))
    for i, j, k in bonds:
        x1, y1, c1 = atoms[i][1], atoms[i][2], atoms[i][4]
        x2, y2, c2 = atoms[j][1], atoms[j][2], atoms[j][4]
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        horiz = abs(x2 - x1) >= abs(y2 - y1)
        for o in {1: [0], 2: [-6, 6], 3: [-12, 0, 12]}[k]:
            if horiz:
                out.append(dot(mx - 4.5, my + o, r, fill=col(c1) or CC) + dot(mx + 4.5, my + o, r, fill=col(c2) or CC))
            else:
                out.append(dot(mx + o, my - 4.5, r, fill=col(c1) or CC) + dot(mx + o, my + 4.5, r, fill=col(c2) or CC))
    return ''.join(out)


def trend(prop='ie', syms=None, x=30, y=20, w=280, h=140, kind='line', marks=None, show=False, top=None):
    """元素ごとの値のグラフ。prop：'ie'（第 1 イオン化エネルギー）、'en'（電気陰性度）、'z'（原子番号）、'val'（価電子の数）。
    syms：並べる元素（省くと 1〜20）。kind：'line'（折れ線）か 'bar'。marks：{記号: 色}。show：棒の上に値"""
    syms = syms or SYM[1:]
    get = {'ie': IE, 'en': EN}.get(prop)
    vals = [get.get(s) if get else (Z[s] if prop == 'z' else valence(s)) for s in syms]
    mk = {syms.index(s): col(c) for s, c in (marks or {}).items() if s in syms}
    if kind == 'bar':
        return bars(x, y, w, h, [v if v is not None else 0 for v in vals], labels=syms, top=top, marks=mk, show=show)
    return plot(x, y, w, h, vals, labels=syms, top=top, marks=mk)


# ── 段 5 の化学（分子の形と極性、結晶の単位格子、気体）。D-201 で足した ──
def wedge(x1, y1, x2, y2, w=7):
    """手前に出る結合（くさび。x1, y1 が細い側）"""
    L = math.hypot(x2 - x1, y2 - y1) or 1
    px, py = -(y2 - y1) / L * w / 2, (x2 - x1) / L * w / 2
    return f'<polygon points="{n(x1)},{n(y1)} {n(x2 + px)},{n(y2 + py)} {n(x2 - px)},{n(y2 - py)}" fill="{CC}"/>'


def hashed(x1, y1, x2, y2, w=8, k=6):
    """奥へ引っこむ結合（点線のくさび）"""
    L = math.hypot(x2 - x1, y2 - y1) or 1
    ux, uy = (x2 - x1) / L, (y2 - y1) / L
    out = []
    for i in range(1, k + 1):
        t = i / k
        mx, my = x1 + (x2 - x1) * t, y1 + (y2 - y1) * t
        h = w / 2 * t
        out.append(line(mx - uy * h, my + ux * h, mx + uy * h, my - ux * h, w=1.5))
    return ''.join(out)


# 中心からの向き（度、右が 0、上が 90）と結合の種類（'' ふつう、'w' 手前、'h' 奥）
SHAPES = {
    'linear': [(180, ''), (0, '')],
    'bent': [(215, ''), (325, '')],
    'trigonal': [(90, ''), (210, ''), (330, '')],
    'pyramidal': [(200, ''), (340, ''), (270, 'w')],
    'tetrahedral': [(90, ''), (200, ''), (300, 'w'), (340, 'h')],
}


def shape(kind, center='C', outer='H', cx=160, cy=100, r=62, lone=0, style='line', label=None, size=15):
    """分子の形（電子対の反発で決まる形）。kind：linear（直線 CO₂）、bent（折れ線 H₂O）、trigonal（平面三角 BF₃）、
    pyramidal（三角すい NH₃）、tetrahedral（四面体 CH₄）。outer：まわりの原子（記号 1 つか、向きの数だけの並び）。
    lone：中心の非共有電子対の数（上に点 2 つの組で描く）。style：'line'（記号と線、手前はくさび・奥は点線のくさび）か 'ball'"""
    dirs = SHAPES[kind]
    outs = outer if isinstance(outer, (list, tuple)) else [outer] * len(dirs)
    rb = 18 if style == 'ball' else 11
    out = []
    for (a, t), s in zip(dirs, outs):
        x, y = cx + r * math.cos(math.radians(a)), cy - r * math.sin(math.radians(a))
        ux, uy = (x - cx) / r, (y - cy) / r
        x0, y0, x1, y1 = cx + rb * ux, cy + rb * uy, x - rb * ux, y - rb * uy
        out.append(wedge(x0, y0, x1, y1) if t == 'w' else hashed(x0, y0, x1, y1) if t == 'h' else line(x0, y0, x1, y1))
        if style == 'ball':
            out.append(circle(x, y, rb, fill=BALL.get(s, GRY), op=.6) + text(x, y + 5, s, 13))
        else:
            out.append(text(x, y + size * .35, s, size))
    if style == 'ball':
        out.append(circle(cx, cy, rb + 2, fill=BALL.get(center, GRY), op=.6) + text(cx, cy + 5, center, 14))
    else:
        out.append(text(cx, cy + size * .35, center, size))
    for k in range(lone):
        a = math.radians(90 + (k - (lone - 1) / 2) * 50)
        bx, by = cx + 26 * math.cos(a), cy - 26 * math.sin(a)
        ox, oy = 4.5 * math.sin(a), 4.5 * math.cos(a)
        out.append(dot(bx - ox, by - oy, 3) + dot(bx + ox, by + oy, 3))
    if label:
        out.append(text(cx, min(cy + r + 30, 194), label, 14))
    return ''.join(out)


def dipole(x1, y1, x2, y2, w=2):
    """極性の矢印（＋の側に短い縦棒。矢の先が電子を強く引きつける側＝δ−）"""
    L = math.hypot(x2 - x1, y2 - y1) or 1
    px, py = -(y2 - y1) / L * 6, (x2 - x1) / L * 6
    bx, by = x1 + (x2 - x1) * .18, y1 + (y2 - y1) * .18
    return arrow(x1, y1, x2, y2, w=w, head=9) + line(bx - px, by - py, bx + px, by + py, w=w)


def delta(x, y, sign='+', size=14):
    """部分的な電荷の札 δ+ や δ−"""
    return text(x, y, 'δ' + ('+' if sign in ('+', 1) else '−'), size)


def cube_pts(cx=160, cy=104, a=100, k=.42):
    """斜めから見た立方体の 8 つの角（0〜3 が手前の面：左下・右下・右上・左上、4〜7 が同じ順の奥）、6 つの面の中心、体の中心"""
    dx, dy = a * k * .8, -a * k * .6
    f = [(cx - a / 2 - dx / 2, cy + a / 2 - dy / 2), (cx + a / 2 - dx / 2, cy + a / 2 - dy / 2),
         (cx + a / 2 - dx / 2, cy - a / 2 - dy / 2), (cx - a / 2 - dx / 2, cy - a / 2 - dy / 2)]
    c = f + [(x + dx, y + dy) for x, y in f]
    mid = lambda *i: (sum(c[j][0] for j in i) / len(i), sum(c[j][1] for j in i) / len(i))
    faces = {'front': mid(0, 1, 2, 3), 'back': mid(4, 5, 6, 7), 'left': mid(0, 3, 7, 4), 'right': mid(1, 2, 6, 5),
             'top': mid(3, 2, 6, 7), 'bottom': mid(0, 1, 5, 4)}
    return c, faces, mid(*range(8))


CUBE_E = [(0, 1), (1, 2), (2, 3), (3, 0), (4, 5), (5, 6), (6, 7), (7, 4), (0, 4), (1, 5), (2, 6), (3, 7)]


def cube(cx=160, cy=104, a=100, k=.42, fill=None):
    """斜めから見た立方体（奥の左下の角につながる 3 本の辺は点線）"""
    c, _, _ = cube_pts(cx, cy, a, k)
    back = {(4, 5), (7, 4), (0, 4)}
    out = [poly(c[:4], fill=fill, op=.15, w=0)] if fill else []
    for i, j in CUBE_E:
        out.append(line(*c[i], *c[j], w=1.5, dash='4 3' if (i, j) in back else None))
    return ''.join(out)


def unit_cell(kind='sc', cx=160, cy=104, a=100, r=11, fill=SKY, fill2=RED, k=.42):
    """結晶の単位格子：sc（単純立方：角に 8）、bcc（体心立方：角と体の中心）、fcc（面心立方：角と 6 つの面の中心）、
    nacl（塩化ナトリウム型：角と面の中心に fill、辺の中ほど 12 と体の中心に fill2）。奥の球から順に描く"""
    c, faces, body = cube_pts(cx, cy, a, k)
    pts = [(p, fill) for p in c]
    if kind == 'bcc':
        pts.append((body, fill2))
    if kind in ('fcc', 'nacl'):
        pts += [(p, fill) for p in faces.values()]
    if kind == 'nacl':
        pts += [(((c[i][0] + c[j][0]) / 2, (c[i][1] + c[j][1]) / 2), fill2) for i, j in CUBE_E] + [(body, fill2)]
    out = [cube(cx, cy, a, k)]
    for (x, y), f in sorted(pts, key=lambda p: (p[0][1] - p[0][0] * .2)):  # 奥（上・右）から先に
        out.append(circle(x, y, r, fill=f, op=.75, w=1.5))
    return ''.join(out)


def cylinder(cx=160, y=30, w=110, h=150, piston=.45, gas=12, seed=5, push=False, label=None, weight=None):
    """ピストンの付いた容器と気体のつぶ。piston：ピストンの高さ（上から 0〜1）、gas：つぶの数、
    push：上から押す矢印、weight：ピストンの上のおもりの字、label：下の字"""
    x0 = cx - w / 2
    py = max(y + h * piston, y + 12)  # ピストンの板（厚さ 10）が容器の上の端からはみ出さないように
    out = [path(f'M{n(x0)} {n(y)} L{n(x0)} {n(y + h)} L{n(x0 + w)} {n(y + h)} L{n(x0 + w)} {n(y)}'),
           rect(x0 + 2, py - 10, w - 4, 10, fill=GRY, op=.8, sw=1.5)]
    if not weight:  # おもりを載せるときは棒を描かない（札と重なる）
        out.append(line(cx, py - 10, cx, max(y - 6, py - 40), w=3))
    s0 = seed
    gh = max(int(y + h - py - 12), 1)
    for _ in range(gas):
        s0 = (s0 * 1103515245 + 12345) % 2 ** 31
        out.append(dot(x0 + 10 + (s0 >> 8) % max(int(w - 20), 1), py + 6 + (s0 >> 16) % gh, 4.5))
    if push:
        out.append(arrow(cx + 28, max(py - 46, 4), cx + 28, py - 14))
    if weight:
        out.append(rect(cx - 22, py - 34, 44, 22, fill=BRN, op=.6, rx=3) + text(cx, py - 18, weight, 13))
    if label:
        out.append(text(cx, min(y + h + 17, 196), label, 14))
    return ''.join(out)


def gauge(cx=260, cy=60, r=34, value=.5, label=None, ticks=5):
    """圧力計（針は 0〜1 の value の位置。目盛りは ticks 本）"""
    out = [circle(cx, cy, r, fill=GRY, op=.25)]
    for i in range(ticks + 1):
        a = math.radians(210 - 240 * i / ticks)
        out.append(line(cx + (r - 7) * math.cos(a), cy - (r - 7) * math.sin(a), cx + r * math.cos(a), cy - r * math.sin(a), w=1.5))
    a = math.radians(210 - 240 * max(0, min(1, value)))
    out.append(line(cx, cy, cx + (r - 10) * math.cos(a), cy - (r - 10) * math.sin(a), w=2.5) + dot(cx, cy, 3))
    if label:
        out.append(text(cx, cy + r + 17, label, 13))
    return ''.join(out)
