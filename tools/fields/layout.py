# 一意に近い 3D 配置：古典的 MDS（固有値問題で一意）から始め、近い関係を重く見る応力を SMACOF で下げる（毎回同じ道を通り、応力は単調に下がる）。
# ゆさぶりの試験：関係を 1 割抜いて作りなおし、回転をそろえてから、どれだけ動くか・近所がどれだけ同じかを見る。
import os, sys, json
import numpy as np
from scipy.sparse.csgraph import shortest_path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out'); os.makedirs(OUT, exist_ok=True)
from graph import build
from embed import mds, fix_gauge, knn_preservation

def geodesic(W):
    Wa = W.toarray()
    L = np.where(Wa > 0, 1.0 / np.maximum(Wa, 1e-9), 0)
    return shortest_path(L, directed=False), Wa

def smacof(D, X0, power=-2.0, iters=400, tol=1e-7):
    """重み w = D^power の応力を、Guttman 変換で下げる（初めの X0 が決まれば結果も決まる）。"""
    n = len(D)
    Wt = np.where(D > 0, D ** power, 0.0)
    np.fill_diagonal(Wt, 0)
    V = -Wt.copy()
    np.fill_diagonal(V, Wt.sum(1))
    Vp = np.linalg.pinv(V)
    X = X0.copy()
    def stress(X):
        E = np.sqrt(((X[:, None] - X[None]) ** 2).sum(-1))
        return float((Wt * (E - D) ** 2).sum() / 2), E
    s, E = stress(X)
    hist = [s]
    for it in range(iters):
        with np.errstate(divide='ignore', invalid='ignore'):
            Bm = np.where(E > 0, -Wt * D / E, 0.0)
        np.fill_diagonal(Bm, 0)
        np.fill_diagonal(Bm, -Bm.sum(1))
        X = Vp @ (Bm @ X)
        s2, E = stress(X)
        hist.append(s2)
        if abs(s - s2) / max(s, 1e-12) < tol:
            break
        s = s2
    return X, hist

def procrustes(A, B):
    """B を回転・裏返し・拡大で A に合わせる。"""
    A0, B0 = A - A.mean(0), B - B.mean(0)
    U, S, Vt = np.linalg.svd(B0.T @ A0)
    R = U @ Vt
    sc = S.sum() / (B0 ** 2).sum()
    return B0 @ R * sc + A.mean(0)

def knn_sets(X, k=10):
    D2 = ((X[:, None] - X[None]) ** 2).sum(-1)
    np.fill_diagonal(D2, np.inf)
    return np.argsort(D2, 1)[:, :k]

def make(W, power=-2.0):
    D, Wa = geodesic(W)
    X0, _ = mds(D)
    X, hist = smacof(D, X0, power=power)
    return fix_gauge(X), hist

if __name__ == '__main__':
    power = float(sys.argv[1]) if len(sys.argv) > 1 else -2.0
    W, ids, units, rm = build()
    X, hist = make(W, power)
    print(f'応力の重み D^{power}：くり返し {len(hist) - 1}、応力 {hist[0]:.1f} → {hist[-1]:.1f}（単調に下がったか {all(b <= a + 1e-9 for a, b in zip(hist, hist[1:]))}）')
    print('近傍の保存（k=10）', round(knn_preservation(X, W), 3))
    base_nn = knn_sets(X)
    rms = np.sqrt(((X - X.mean(0)) ** 2).sum(1).mean())
    disp, share = [], []
    for rep in range(6):
        rng = np.random.default_rng(1000 + rep)
        W2, *_ = build(drop=0.10, rng=rng)
        from graph import components
        if components(W2)[0] != 1:
            print('ゆさぶり', rep, 'つながりが切れた（とばす）'); continue
        Y, _ = make(W2, power)
        Y = procrustes(X, Y)
        disp.append(float(np.median(np.linalg.norm(Y - X, axis=1)) / rms))
        nn = knn_sets(Y)
        share.append(float(np.mean([len(set(a) & set(b)) / 10 for a, b in zip(base_nn, nn)])))
    print('ゆさぶり（関係を 1 割抜く）：動いた距離の中央値 / 半径の二乗平均', np.round(disp, 3), ' 近所 10 この重なり', np.round(share, 3))
    np.save(os.path.join(OUT, f'X_smacof{int(-power)}.npy'), X)
