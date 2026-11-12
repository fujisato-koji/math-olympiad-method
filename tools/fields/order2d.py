# 2D の地図の縦の並び（D-124）：行は関係から見つけた細かい分野（施主「分野と領域を統一できないのか」）。
# 分野ごとにまとめ、前提の線が縦に短くなる順に、分野と、分野の中の細かい分野を並べる。
#   python tools/fields/order2d.py           … 並びを作って relations/row-order.yaml に書き、relations/fields.yaml のままの並びとくらべる
# 分野の並びと、分野の中の細かい分野の並びは、どちらも「線の数 × 縦の距離」の和（線形配置の費用）を小さくする順にする。
# 初めはラプラシアンの第 2 固有ベクトル（スペクトルの並べ方）、そのあと 1 つずつ別の場所へ差しこむ動きで、費用が下がらなくなるまで直す。乱数は使わない。
# 上下の向きは、段の平均が低い分野の端を上にする。行の高さは site/app.js の drawMap と同じ（同じ深さに並ぶ単元の数 × 18 + 26、行の間 8、分野の見出し 26）。
import os, sys, collections
from pathlib import Path
import numpy as np
import yaml
REPO = Path(__file__).resolve().parents[2]

def load():
    rm = yaml.safe_load(open(REPO / 'roadmap.yaml', encoding='utf-8'))
    F = yaml.safe_load(open(REPO / 'relations' / 'fields.yaml', encoding='utf-8'))['fields']
    units = rm['units']; U = {u['id']: u for u in units}
    sof = {u: s['id'] for f in F for s in f['subs'] for u in s['units'] if u in U}
    fof = {u: f['id'] for f in F for s in f['subs'] for u in s['units'] if u in U}
    dep = {}
    def dp(i):
        if i not in dep:
            dep[i] = 1 + max([dp(m) for m in U[i].get('needs') or [] if m in U] or [0])
        return dep[i]
    for u in units:
        dp(u['id'])
    return rm, F, units, U, sof, fof, dep

class Cost:
    """行の中ほどの高さの差 × 線の数の和（単位は px）。numpy で速く数える。"""
    def __init__(self, items, h, w):
        self.items = list(items); self.ix = {r: i for i, r in enumerate(self.items)}
        self.h = np.array([h[r] for r in self.items], float)
        e = [(self.ix[a], self.ix[b], c) for (a, b), c in w.items() if a in self.ix and b in self.ix]
        self.a = np.array([x[0] for x in e], int); self.b = np.array([x[1] for x in e], int); self.c = np.array([x[2] for x in e], float)
    def idx(self, order):
        hh = self.h[order]
        pos = np.empty(len(order)); pos[order] = np.cumsum(hh) - hh / 2
        return float((self.c * np.abs(pos[self.a] - pos[self.b])).sum()) if len(self.c) else 0.0
    def __call__(self, order):
        return self.idx(np.array([self.ix[r] for r in order], int))

def improve(order, f):
    """1 つを抜いていちばんよい場所へ差しこむ動きを、費用が下がらなくなるまでくり返す。"""
    order = list(order); best = f(order)
    while True:
        moved = False
        for k in range(len(order)):
            x = order[k]; rest = order[:k] + order[k + 1:]
            c, j = min((f(rest[:j] + [x] + rest[j:]), j) for j in range(len(rest) + 1))
            if c < best - 1e-9:
                order, best, moved = rest[:j] + [x] + rest[j:], c, True
        if not moved:
            return order, best

def spectral(items, w):
    items = list(items)
    if len(items) <= 2:
        return items
    ix = {r: i for i, r in enumerate(items)}
    W = np.full((len(items), len(items)), 1e-6)   # 線のない組も少しつなぐ（つながらない成分があっても並べられる）
    for (a, b), c in w.items():
        if a in ix and b in ix:
            W[ix[a], ix[b]] += c; W[ix[b], ix[a]] += c
    np.fill_diagonal(W, 0)
    v = np.linalg.eigh(np.diag(W.sum(1)) - W)[1][:, 1]
    if v[np.argmax(np.abs(v))] < 0:
        v = -v
    return [items[i] for i in np.lexsort((np.arange(len(items)), v))]

def main():
    rm, F, units, U, sof, fof, dep = load()
    subs = [s['id'] for f in F for s in f['subs'] if any(sof.get(u) == s['id'] for u in s['units'])]
    h = {}
    for s in subs:
        c = collections.Counter(dep[u['id']] for u in units if sof.get(u['id']) == s)
        h[s] = max(c.values()) * 18 + 26 + 8
    w = collections.Counter()
    for u in units:
        for m in (u.get('needs') or []) + [x for g in (u.get('alt') or {}).values() for x in (g if isinstance(g, list) else [g])]:
            a, b = sof.get(m), sof.get(u['id'])
            if a and b and a != b:
                w[tuple(sorted((a, b)))] += 1
    sf = {s['id']: f['id'] for f in F for s in f['subs']}
    groups = {f['id']: [s for s in subs if sf[s] == f['id']] for f in F}
    inner = {f: improve(spectral(g, w), Cost(g, h, w))[0] for f, g in groups.items() if g}
    allc = Cost(subs, h, w)
    head = 26
    def total(forder):
        return allc([s for f in forder for s in inner[f]])
    fw = collections.Counter()
    for (a, b), c in w.items():
        if sf[a] != sf[b]:
            fw[tuple(sorted((sf[a], sf[b])))] += c
    forder = spectral(list(inner), fw)
    while True:
        forder, c = improve(forder, total)
        moved = False
        for f in forder:
            inner[f] = inner[f][::-1]
            c2 = total(forder)
            if c2 < c - 1e-9:
                c, moved = c2, True
            else:
                inner[f] = inner[f][::-1]
        if not moved:
            break
    mean_stage = lambda f: np.mean([U[u]['stage'] for u in fof if fof[u] == f])
    if mean_stage(forder[-1]) < mean_stage(forder[0]):
        forder = forder[::-1]; inner = {f: o[::-1] for f, o in inner.items()}
    new = [s for f in forder for s in inner[f]]
    base = [s for f in F for s in groups.get(f['id'], [])]
    n = sum(w.values())
    print(f"細かい分野 {len(subs)}、分野 {len(forder)}、細かい分野をまたぐ前提の線 {n} 本")
    for name, o in (('relations/fields.yaml のままの並び', base), ('線が短くなる並び', new)):
        print(f'  {name}：1 本あたりの縦の長さ {allc(o) / n:.0f} px（見出しの分は入れない）')
    names = {f['id']: f['name'] for f in F}
    out = {'note': 'tools/fields/order2d.py が relations/fields.yaml と roadmap.yaml から作る。2D の地図の縦の並び（分野と、その中の細かい分野、D-124）。手で直さない。',
           'rows': [{'field': f, 'name': names[f], 'subs': inner[f]} for f in forder]}
    if '--dry' not in sys.argv:
        (REPO / 'relations' / 'row-order.yaml').write_text(yaml.safe_dump(out, allow_unicode=True, sort_keys=False, width=200), encoding='utf-8', newline='\n')
        print('relations/row-order.yaml を書いた')
    print(' → '.join(names[f] for f in forder))

if __name__ == '__main__':
    main()
