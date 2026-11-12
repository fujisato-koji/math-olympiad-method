# 高い次元の関係の空間（拡散写像の座標）で、分野の塊を決める。Ward の階層クラスタで、乱数を使わない。
# 塊の数 K ごとに、ゆさぶり（関係を抜く）での安定と、いまの流れ（N、A、C…）との一致を測る。
import os, sys, json
import numpy as np
from scipy.cluster.hierarchy import linkage, fcluster
from scipy.sparse.csgraph import connected_components
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out'); os.makedirs(OUT, exist_ok=True)
import graph
from embed import diffusion

def build_protected(drop, seed):
    """疎な単元を守って関係を抜く：両はしが 4 本以上つながる前提の線と、論題の共起だけを抜く。つながりが切れたら次の種で引きなおす。"""
    W0, ids, units, rm = graph.build()
    deg = np.asarray((W0 > 0).sum(1)).ravel()
    idx = {u: i for i, u in enumerate(ids)}
    for s in range(seed, seed + 50):
        rng = np.random.default_rng(s)
        rows, cols, vals = [], [], []
        def add(a, b, w):
            rows.extend((a, b)); cols.extend((b, a)); vals.extend((w, w))
        for u in units:
            for m in u.get('needs') or []:
                if m in idx:
                    a, b = idx[u['id']], idx[m]
                    if deg[a] >= 4 and deg[b] >= 4 and rng.random() < drop:
                        continue
                    add(a, b, 1.0)
        for f, tid, us in graph.topic_lists():
            us = [x for x in us if x in idx]
            k = len(us)
            if k < 2:
                continue
            w = 1.0 / (k - 1)
            for i in range(k):
                for j in range(i + 1, k):
                    a, b = idx[us[i]], idx[us[j]]
                    if deg[a] >= 4 and deg[b] >= 4 and rng.random() < drop:
                        continue
                    add(a, b, w)
        from scipy import sparse
        W = sparse.csr_matrix((vals, (rows, cols)), shape=(len(ids), len(ids)))
        W.sum_duplicates()
        if connected_components(W, directed=False)[0] == 1:
            return W, s
    raise RuntimeError('つながったグラフが作れない')

def coords(W, t, dims):
    lam, psi, d = diffusion(W, k=dims + 1)
    return psi[:, 1:dims + 1] * lam[1:dims + 1] ** t

def ari(a, b):
    a, b = np.asarray(a), np.asarray(b)
    _, ai = np.unique(a, return_inverse=True)
    _, bi = np.unique(b, return_inverse=True)
    C = np.zeros((ai.max() + 1, bi.max() + 1))
    np.add.at(C, (ai, bi), 1)
    c2 = lambda x: x * (x - 1) / 2
    s = c2(C).sum(); sa = c2(C.sum(1)).sum(); sb = c2(C.sum(0)).sum(); n = c2(len(a))
    e = sa * sb / n
    return float((s - e) / (0.5 * (sa + sb) - e))

def nmi(a, b):
    a, b = np.asarray(a), np.asarray(b)
    _, ai = np.unique(a, return_inverse=True)
    _, bi = np.unique(b, return_inverse=True)
    C = np.zeros((ai.max() + 1, bi.max() + 1)); np.add.at(C, (ai, bi), 1)
    P = C / C.sum(); pa = P.sum(1); pb = P.sum(0)
    nz = P > 0
    I = (P[nz] * np.log(P[nz] / (pa[:, None] * pb[None, :])[nz])).sum()
    H = lambda p: -(p[p > 0] * np.log(p[p > 0])).sum()
    return float(2 * I / (H(pa) + H(pb)))

if __name__ == '__main__':
    t = float(sys.argv[1]) if len(sys.argv) > 1 else 10
    dims = int(sys.argv[2]) if len(sys.argv) > 2 else 40
    W, ids, units, rm = graph.build()
    lanes = [i[0] for i in ids]
    X = coords(W, t, dims)
    Z = linkage(X, 'ward')
    pert = []
    for rep in range(5):
        W2, s = build_protected(0.10, 2000 + 97 * rep)
        Z2 = linkage(coords(W2, t, dims), 'ward')
        pert.append(Z2)
    print(f't={t} 次元={dims}')
    print(' K   流れとの一致 ARI  NMI   ゆさぶりでの安定 ARI（5 回の平均と最小）  いちばん大きい塊の割合')
    res = {}
    for K in (8, 12, 16, 20, 24, 30, 40):
        lab = fcluster(Z, K, 'maxclust')
        st = [ari(lab, fcluster(Z2, K, 'maxclust')) for Z2 in pert]
        big = np.bincount(lab).max() / len(lab)
        res[K] = (ari(lab, lanes), nmi(lab, lanes), float(np.mean(st)), float(np.min(st)), float(big))
        print(f'{K:3d}   {res[K][0]:.3f}  {res[K][1]:.3f}      {res[K][2]:.3f}  {res[K][3]:.3f}        {big:.2f}')
    np.save(os.path.join(OUT, f'Z_t{int(t)}_d{dims}.npy'), Z)
