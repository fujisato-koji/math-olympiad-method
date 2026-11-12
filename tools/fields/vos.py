# VOS の 3D 配置（van Eck ら 2010）：min Σ s_ij d_ij² − Σ d_ij（強い組は引き合い、どの組もすこし押し合う）。
# 上界で押さえて下げる方法（majorization）で解く：X ← ½ L_s⁺ B(Y) Y。応力は単調に下がり、初めの位置が決まれば結果も決まる。
# 初めの位置は古典的 MDS（固有値問題）。回転と裏返しは主軸と 3 次のモーメントで決める。
import os, sys, json
import numpy as np
from scipy.sparse.csgraph import shortest_path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import relations as R
from embed import mds, fix_gauge, knn_preservation
from layout import procrustes, knn_sets

W_LAYERS = {'need': 1, 'alt': .5, 'topic': 1.5, 'use': .5}

def assoc(S):
    S = S.toarray() if hasattr(S, 'toarray') else S.copy()
    k = S.sum(1); m = k.sum() / 2
    with np.errstate(divide='ignore', invalid='ignore'):
        A = np.where((k[:, None] > 0) & (k[None, :] > 0), S * 2 * m / (k[:, None] * k[None, :]), 0.0)
    np.fill_diagonal(A, 0)
    return A

def init_mds(S):
    A = S.toarray() if hasattr(S, 'toarray') else S
    Lm = np.where(A > 0, 1.0 / np.maximum(A, 1e-12), 0)
    D = shortest_path(Lm, directed=False)
    X, _ = mds(D)
    return X

def vos(A, X0, iters=600, tol=1e-9):
    n = len(A)
    Ls = -A.copy(); np.fill_diagonal(Ls, A.sum(1))
    Lp = np.linalg.pinv(Ls)
    X = X0 / np.sqrt(((X0 - X0.mean(0)) ** 2).sum(1).mean())
    def f(X):
        E = np.sqrt(((X[:, None] - X[None]) ** 2).sum(-1))
        return float((A * E ** 2).sum() / 2 - E.sum() / 2), E
    val, E = f(X)
    hist = [val]
    for it in range(iters):
        with np.errstate(divide='ignore'):
            Bw = np.where(E > 0, 1.0 / E, 0.0)
        np.fill_diagonal(Bw, 0)
        Bm = -Bw; np.fill_diagonal(Bm, Bw.sum(1))
        X = 0.5 * Lp @ (Bm @ X)
        v2, E = f(X)
        hist.append(v2)
        if abs(val - v2) / max(abs(val), 1e-12) < tol:
            break
        val = v2
    return X, hist

def make(L):
    S = R.combine(L, W_LAYERS)
    A = assoc(S)
    X, hist = vos(A, init_mds(S))
    return fix_gauge(X), hist, S

if __name__ == '__main__':
    H = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
    L = R.layers(alpha=1.0, typed=True)
    X, hist, S = make(L)
    print(f'VOS：くり返し {len(hist) - 1}、目的 {hist[0]:.1f} → {hist[-1]:.1f}、単調に下がった {all(b <= a + 1e-9 for a, b in zip(hist, hist[1:]))}')
    print('近傍の保存（k=10）', round(knn_preservation(X, S), 3))
    rms = np.sqrt(((X - X.mean(0)) ** 2).sum(1).mean())
    base_nn = knn_sets(X)
    # 初めの位置を少しずらしても同じ所に着くか（初めの位置への一意性）
    A = assoc(S)
    X0 = init_mds(S)
    for s in range(3):
        rng = np.random.default_rng(10 + s)
        Y, _ = vos(A, X0 + rng.normal(0, 0.3 * X0.std(), X0.shape))
        Y = procrustes(X, fix_gauge(Y))
        print(f'  初めをずらす {s}：動いた距離の中央値 / 半径 {np.median(np.linalg.norm(Y - X, axis=1)) / rms:.3f}、近所 10 この重なり {np.mean([len(set(a) & set(b)) / 10 for a, b in zip(base_nn, knn_sets(Y))]):.3f}')
    # 関係を 1 割抜いても同じか（データへの一意性）
    deg = np.asarray(((L['need'] + L['need'].T) > 0).sum(1)).ravel()
    for s in range(3):
        rng = np.random.default_rng(3000 + 31 * s)
        Lb = R.layers(alpha=1.0, drop=0.10, rng=rng, protect_deg=deg, typed=True)
        Y, _, _ = make(Lb)
        Y = procrustes(X, Y)
        print(f'  関係を 1 割抜く {s}：動いた距離の中央値 / 半径 {np.median(np.linalg.norm(Y - X, axis=1)) / rms:.3f}、近所 10 この重なり {np.mean([len(set(a) & set(b)) / 10 for a, b in zip(base_nn, knn_sets(Y))]):.3f}')
    np.save(os.path.join(H, 'X_vos.npy'), X)
