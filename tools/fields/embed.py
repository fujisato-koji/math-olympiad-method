# 関係だけから 3D の配置を決める（固有値問題で、初めの置き方や乱数に頼らない）。
# 2 つの方法をくらべる：拡散写像（diffusion map）と、最短路の距離の古典的 MDS。
import os, sys, json
import numpy as np
from scipy.sparse.csgraph import shortest_path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out'); os.makedirs(OUT, exist_ok=True)
from graph import build

def diffusion(W, k=40):
    """P = D^-1 W の右固有ベクトル（自明なものを除く）と固有値。対称化した M で解く。"""
    W = W.toarray() if hasattr(W, 'toarray') else W
    d = W.sum(1)
    Dm = 1 / np.sqrt(d)
    M = Dm[:, None] * W * Dm[None, :]
    lam, U = np.linalg.eigh(M)
    order = np.argsort(-lam)
    lam, U = lam[order], U[:, order]
    psi = U * Dm[:, None]                      # 右固有ベクトル（D^-1/2 で戻す）
    psi = psi / np.sqrt((psi ** 2 * d[:, None]).sum(0))  # D で正規化
    return lam[:k], psi[:, :k], d

def fix_gauge(X, ref=None):
    """回転と裏返しの自由度をなくす：主軸を分散の大きい順にそろえ、各軸の 3 次のモーメントが正になる向きにする。"""
    X = X - X.mean(0)
    C = X.T @ X
    w, V = np.linalg.eigh(C)
    V = V[:, np.argsort(-w)]
    Y = X @ V
    s = np.sign((Y ** 3).sum(0)); s[s == 0] = 1
    return Y * s

def mds(Dist, dim=3):
    n = Dist.shape[0]
    J = np.eye(n) - 1.0 / n
    B = -0.5 * J @ (Dist ** 2) @ J
    w, V = np.linalg.eigh(B)
    o = np.argsort(-w)
    w, V = w[o], V[:, o]
    return V[:, :dim] * np.sqrt(np.maximum(w[:dim], 0)), w[:12]

def knn_preservation(X, W, k=10):
    """グラフで最も強く結ばれた k 個のうち、3D の近い k 個に入る割合（近傍の保存）。"""
    W = W.toarray() if hasattr(W, 'toarray') else W
    n = len(X)
    D2 = ((X[:, None, :] - X[None, :, :]) ** 2).sum(-1)
    np.fill_diagonal(D2, np.inf)
    near = np.argsort(D2, 1)[:, :k]
    hit = []
    for i in range(n):
        g = np.argsort(-W[i])[:k]
        g = [j for j in g if W[i, j] > 0]
        if g:
            hit.append(len(set(g) & set(near[i])) / len(g))
    return float(np.mean(hit))

if __name__ == '__main__':
    W, ids, units, rm = build()
    lam, psi, d = diffusion(W)
    print('拡散の固有値（自明な 1 を除く上位 10）', np.round(lam[1:11], 4))
    gaps = lam[1:10] - lam[2:11]
    print('となりの差', np.round(gaps, 4))
    t = 3
    Xd = fix_gauge(psi[:, 1:4] * lam[1:4] ** t)
    # 最短路：重みを長さ 1/w に
    Wa = W.toarray()
    L = np.where(Wa > 0, 1.0 / np.maximum(Wa, 1e-9), 0)
    Dist = shortest_path(L, directed=False)
    Xm, wm = mds(Dist)
    Xm = fix_gauge(Xm)
    print('MDS の固有値（上位 8）', np.round(wm[:8], 1))
    print('近傍の保存（k=10） 拡散', round(knn_preservation(Xd, W), 3), ' MDS', round(knn_preservation(Xm, W), 3))
    # 前提の深さとの相関（どの軸が深さに当たるか）
    byid = {u['id']: u for u in units}
    dep = {}
    def dp(i):
        if i not in dep:
            dep[i] = 1 + max([dp(n) for n in byid[i].get('needs', []) if n in byid] or [0])
        return dep[i]
    depth = np.array([dp(i) for i in ids])
    for name, X in (('拡散', Xd), ('MDS', Xm)):
        cs = [round(float(np.corrcoef(X[:, a], depth)[0, 1]), 2) for a in range(3)]
        r = np.linalg.norm(X - X[depth == 1].mean(0), axis=1)
        print(name, '軸と深さの相関', cs, ' 深さ 1 の重心からの距離と深さの相関', round(float(np.corrcoef(r, depth)[0, 1]), 2))
    np.save(os.path.join(OUT, 'psi.npy'), psi)
    np.save(os.path.join(OUT, 'lam.npy'), lam)
    np.save(os.path.join(OUT, 'Xd.npy'), Xd)
    np.save(os.path.join(OUT, 'Xm.npy'), Xm)
    np.save(os.path.join(OUT, 'dist.npy'), Dist)
    json.dump(ids, open(os.path.join(OUT, 'ids.json'), 'w'))
