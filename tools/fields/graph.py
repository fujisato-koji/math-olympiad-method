# 単元の関係のグラフを作る（分野の名前は入れない）。emerge の部品。
# 関係は 2 つ：前提の線（needs）と、網羅表で同じ論題の単元に並ぶこと（共起）。
import glob, os, math, json
from pathlib import Path
import numpy as np
import yaml
from scipy import sparse

REPO = Path(__file__).resolve().parents[2]

def load():
    rm = yaml.safe_load(open(os.path.join(REPO, 'roadmap.yaml'), encoding='utf-8'))
    units = rm['units']
    ids = [u['id'] for u in units]
    idx = {u: i for i, u in enumerate(ids)}
    return rm, units, ids, idx

def topic_lists():
    out = []
    for p in sorted(glob.glob(os.path.join(REPO, 'coverage*.yaml'))):
        d = yaml.safe_load(open(p, encoding='utf-8'))
        for it in d.get('items') or []:
            us = it.get('units') or []
            if len(us) >= 2:
                out.append((os.path.basename(p), it.get('id'), us))
    return out

def build(w_needs=1.0, w_topic=1.0, drop=None, rng=None):
    """重みつきの無向グラフ W（疎行列）。drop は関係を抜く割合（ゆさぶりの試験用）。"""
    rm, units, ids, idx = load()
    n = len(ids)
    rows, cols, vals = [], [], []
    def add(a, b, w):
        rows.append(a); cols.append(b); vals.append(w)
        rows.append(b); cols.append(a); vals.append(w)
    for u in units:
        for m in u.get('needs') or []:
            if m in idx:
                if drop and rng.random() < drop:
                    continue
                add(idx[u['id']], idx[m], w_needs)
    for f, tid, us in topic_lists():
        us = [x for x in us if x in idx]
        k = len(us)
        if k < 2:
            continue
        if drop and rng.random() < drop:
            continue
        w = w_topic / (k - 1)          # 大きな論題が強くなりすぎないように、1 つの単元が受け取る重みの合計を 1 にそろえる
        for a in range(k):
            for b in range(a + 1, k):
                add(idx[us[a]], idx[us[b]], w)
    W = sparse.csr_matrix((vals, (rows, cols)), shape=(n, n))
    W.sum_duplicates()
    return W, ids, units, rm

def components(W):
    from scipy.sparse.csgraph import connected_components
    return connected_components(W, directed=False)

if __name__ == '__main__':
    W, ids, units, rm = build()
    nc, lab = components(W)
    sizes = np.bincount(lab)
    print('単元', len(ids), '辺', W.nnz // 2, '成分', nc, '大きい順', sorted(sizes, reverse=True)[:8])
    tl = topic_lists()
    print('論題', len(tl), '論題の単元の合計', sum(len(x[2]) for x in tl))
    deg = np.asarray((W > 0).sum(1)).ravel()
    print('次数 0', int((deg == 0).sum()), '中央値', float(np.median(deg)), '最大', int(deg.max()))
