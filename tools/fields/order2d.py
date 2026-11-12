# 2D の地図の縦の並び（D-124）：領域（行）を、関係から見つけた分野ごとにまとめ、前提の線が縦に短くなる順に並べる。
#   python tools/fields/order2d.py           … 並びを作って relations/region-order.yaml に書き、いまの並びとくらべる
# 分野の並びと、分野の中の領域の並びは、どちらも「線の重み × 縦の距離」の和（線形配置の費用）を小さくする順にする。
# 初めはラプラシアンの第 2 固有ベクトル（スペクトルの並べ方）、そのあと 1 つずつ別の場所へ差しこむ動きで、費用が下がらなくなるまで直す。乱数は使わない。
# 行の高さは site/app.js の drawMap と同じ（同じ深さに並ぶ単元の数 × 18 + 26、行の間 8）。
import os, sys, collections
from pathlib import Path
import numpy as np
import yaml
REPO = Path(__file__).resolve().parents[2]

def load():
    rm = yaml.safe_load(open(REPO / 'roadmap.yaml', encoding='utf-8'))
    F = yaml.safe_load(open(REPO / 'relations' / 'fields.yaml', encoding='utf-8'))['fields']
    units = rm['units']; U = {u['id']: u for u in units}
    fof = {u: f['id'] for f in F for s in f['subs'] for u in s['units']}
    dep = {}
    def dp(i):
        if i not in dep:
            dep[i] = 1 + max([dp(m) for m in U[i].get('needs') or [] if m in U] or [0])
        return dep[i]
    for u in units:
        dp(u['id'])
    regions = [r['id'] for r in rm.get('regions', []) if any(u.get('region') == r['id'] for u in units)]
    return rm, F, units, U, fof, dep, regions

def heights(units, dep, regions):
    h = {}
    for r in regions:
        c = collections.Counter(dep[u['id']] for u in units if u.get('region') == r)
        h[r] = max(c.values()) * 18 + 26 + 8
    return h

def edge_weights(units, U):
    w = collections.Counter()
    for u in units:
        for m in (u.get('needs') or []) + [x for g in (u.get('alt') or {}).values() for x in (g if isinstance(g, list) else [g])]:
            if m in U and U[m].get('region') and u.get('region') and U[m]['region'] != u['region']:
                w[tuple(sorted((U[m]['region'], u['region'])))] += 1
    return w

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

def improve(order, f, flips=None):
    """1 つを抜いていちばんよい場所へ差しこむ動き（と、flips があれば向きの反転）を、費用が下がらなくなるまでくり返す。"""
    order = list(order); best = f(order)
    while True:
        moved = False
        for k in range(len(order)):
            x = order[k]; rest = order[:k] + order[k + 1:]
            cands = [(f(rest[:j] + [x] + rest[j:]), j) for j in range(len(rest) + 1)]
            c, j = min(cands)
            if c < best - 1e-9:
                order, best, moved = rest[:j] + [x] + rest[j:], c, True
        if flips:
            for k in range(len(order)):
                o = flips(order, k); c = f(o)
                if c < best - 1e-9:
                    order, best, moved = o, c, True
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
    rm, F, units, U, fof, dep, regions = load()
    h = heights(units, dep, regions)
    w = edge_weights(units, U)
    # 領域の分野：単元のいちばん多い分野（同じ数なら分野の記号の若い方）
    rf = {}
    for r in regions:
        c = collections.Counter(fof[u['id']] for u in units if u.get('region') == r)
        rf[r] = sorted(c.items(), key=lambda kv: (-kv[1], kv[0]))[0][0]
    fields = [f['id'] for f in F]
    groups = {f: [r for r in regions if rf[r] == f] for f in fields}
    allc = Cost(regions, h, w)
    # 分野の中の並び
    inner = {}
    for f in fields:
        if groups[f]:
            cf = Cost(groups[f], h, w)
            inner[f] = improve(spectral(groups[f], w), cf)[0]
    # 分野の並び：分野を 1 つの塊として動かし、塊の中の向きの反転もためす。費用は全体の領域で数える
    fw = collections.Counter()
    for (a, b), c in w.items():
        if rf[a] != rf[b]:
            fw[tuple(sorted((rf[a], rf[b])))] += c
    state = {'inner': dict(inner)}
    def flat(forder):
        return [r for f in forder for r in state['inner'][f]]
    def flip(forder, k):
        f = forder[k]; state['inner'][f] = state['inner'][f][::-1]
        return list(forder)
    def total(forder):
        return allc(flat(forder))
    forder = spectral(list(inner), fw)
    best = total(forder)
    while True:
        forder, c = improve(forder, total)
        moved = False
        for k in range(len(forder)):
            f = forder[k]; state['inner'][f] = state['inner'][f][::-1]
            c2 = total(forder)
            if c2 < c - 1e-9:
                c, moved = c2, True
            else:
                state['inner'][f] = state['inner'][f][::-1]
        if not moved or c >= best - 1e-9:
            best = min(best, c)
            if not moved:
                break
        best = c
    inner = state['inner']
    # 上下の向き：費用は逆さにしても同じなので、段の平均が低い分野の端を上にする（学ぶ人が入口から見られるように）
    mean_stage = lambda f: np.mean([U[u['id']]['stage'] for u in units if fof[u['id']] == f])
    if mean_stage(forder[-1]) < mean_stage(forder[0]):
        forder = forder[::-1]; inner = {f: o[::-1] for f, o in inner.items()}; state['inner'] = inner
    new = flat(forder)
    free = improve(spectral(regions, w), allc)[0]
    now = regions
    print(f'領域 {len(regions)}、分野 {len(forder)}、領域をまたぐ前提の線 {sum(w.values())} 本')
    for name, o in (('いまの並び（roadmap.yaml の順）', now), ('分野ごとにまとめた並び', new), ('分野にこだわらない並び（参考）', free)):
        c = allc(o)
        print(f'  {name}：線の縦の長さの和 {c / 1000:.0f} 千 px（1 本あたり {c / sum(w.values()):.0f} px）')
    out = {'note': 'tools/fields/order2d.py が relations/fields.yaml と roadmap.yaml から作る。2D の地図の縦の並び（D-124）。手で直さない。',
           'fields': [{'field': f, 'regions': inner[f]} for f in forder]}
    if '--dry' not in sys.argv:
        (REPO / 'relations' / 'region-order.yaml').write_text(yaml.safe_dump(out, allow_unicode=True, sort_keys=False, width=200), encoding='utf-8', newline='\n')
        print('relations/region-order.yaml を書いた')

if __name__ == '__main__':
    main()
