# 3D の配置（D-121）。関係の強い組ほど引き合い、どの組も押し合うエネルギー
#   E = Σ_{i<j} a_ij d_ij^A / A − Σ_{i<j} d_ij^R / R   （R = 0 は −Σ log d_ij）
# を最も小さくする（Noack 2007・2009 の (a, r) エネルギーの族。式の指数はエネルギーの指数で、Noack 2009 の力の指数より 1 大きい）。
# 引き合いの重み a_ij は association strength（van Eck と Waltman 2009）、押し合いは一様。
# いまの VOS（van Eck ら 2010）は (A, R) = (2, 1) にあたる。押し合いが距離によらず同じ強さで、どの次元で解いても 3 本目の軸が細い
# （1 : 0.72 : 0.22、4 次元でも 4 本目は 0）。押し合いが近いほど強い形にすると、詰まった向きがふくらむ（Chen と Buja 2013）。
# 解き方：初めの位置は古典的 MDS。まず (2, 0)（押し合いが距離の対数）を解き、その答えから目当ての形を L-BFGS で解く。どれも決まった手順で、乱数を使わない。
# 回転と裏返しは主軸と 3 次のモーメントで決める（embed.fix_gauge）。
#   python place3d.py [--a 1 --r -1] [--check] [--site]   … --check で、乱数の初めと関係を 1 割抜いた配置とくらべる。--site でサイトの 3D の配置（tools/space-layout.json）も書く（D-124）
import os, sys, json, time
import numpy as np
from scipy.optimize import minimize
from scipy.sparse.csgraph import shortest_path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import relations as R
from embed import mds, fix_gauge
from layout import procrustes, knn_sets

W_LAYERS = {'need': 1, 'alt': .5, 'topic': 1.5, 'use': .5}
# (2, 0) を選ぶ（D-121）。引き合いが距離の 2 乗なら、すべての次元で解く問題は位置の内積の行列（グラム行列）の上で凸になり、
# いちばん小さい答えが 1 つに決まる（d² は内積の行列の 1 次式、−log d は凸）。引き合いが距離に比例する形（LinLog、(1, −1)）は凸にならず、
# 試しでは乱数の初め 3 回とも別の配置になり、全体が 7〜21% 動いた。(2, 0) は 2 回に 1 回以上同じ配置に着き、ちがっても近所の重なり 0.95。
A_EXP, R_EXP = 2.0, 0.0

def assoc(S):
    S = S.toarray() if hasattr(S, 'toarray') else S.copy()
    k = S.sum(1); m = k.sum() / 2
    with np.errstate(divide='ignore', invalid='ignore'):
        A = np.where((k[:, None] > 0) & (k[None, :] > 0), S * 2 * m / (k[:, None] * k[None, :]), 0.0)
    np.fill_diagonal(A, 0)
    return A

def init_mds(S):
    S = S.toarray() if hasattr(S, 'toarray') else S
    D = shortest_path(np.where(S > 0, 1.0 / np.maximum(S, 1e-12), 0), directed=False)
    return mds(D)[0]

def energy_fn(A, a, r):
    n = len(A)
    def f(x):
        X = x.reshape(n, -1)
        sq = (X ** 2).sum(1)
        D2 = np.maximum(sq[:, None] + sq[None] - 2 * X @ X.T, 1e-12)
        np.fill_diagonal(D2, 1.0)
        d = np.sqrt(D2)
        att = A * d ** a / a
        rep = np.log(d) if r == 0 else d ** r / r
        np.fill_diagonal(att, 0); np.fill_diagonal(rep, 0)
        C = A * d ** (a - 2) - d ** (r - 2)
        np.fill_diagonal(C, 0)
        return att.sum() / 2 - rep.sum() / 2, (C.sum(1)[:, None] * X - C @ X).ravel()
    return f

def solve(A, a, r, X0, maxiter=6000):
    f = energy_fn(A, a, r)
    X0 = X0 - X0.mean(0)
    X0 = X0 / np.sqrt((X0 ** 2).sum(1).mean())
    c = min((0.3, 1, 3, 10, 30), key=lambda c: f((X0 * c).ravel())[0])   # 初めの大きさを、つり合いの近くにそろえる
    res = minimize(f, (X0 * c).ravel(), jac=True, method='L-BFGS-B', options=dict(maxiter=maxiter, maxcor=30, ftol=1e-13, gtol=1e-9))
    return res.x.reshape(len(A), -1), float(res.fun), int(res.nit), bool(res.success)

def make(L, a=A_EXP, r=R_EXP, X0=None):
    S = R.combine(L, W_LAYERS)
    A = assoc(S)
    X = init_mds(S) if X0 is None else X0
    info = {}
    if X0 is None and (a, r) != (2, 0):
        X, e, it, ok = solve(A, 2, 0, X)
        info['warm'] = dict(energy=e, iters=it, ok=ok)
    X, e, it, ok = solve(A, a, r, X)
    info.update(energy=e, iters=it, ok=ok)
    return fix_gauge(X), info, S, A

def compare(X, Y):
    Y = procrustes(X, fix_gauge(Y))
    rms = np.sqrt(((X - X.mean(0)) ** 2).sum(1).mean())
    return round(float(np.median(np.linalg.norm(Y - X, axis=1)) / rms), 3), round(float(np.mean([len(set(p) & set(q)) / 10 for p, q in zip(knn_sets(X), knn_sets(Y))])), 3)

def spreads(X):
    w = np.sort(np.linalg.eigvalsh(np.cov((X - X.mean(0)).T)))[::-1]
    return (np.sqrt(np.maximum(w, 0)) / np.sqrt(w[0])).round(3).tolist()

def knn_pres(X, S, k=10):
    S = S.toarray() if hasattr(S, 'toarray') else S
    nn = knn_sets(X, k)
    hit = []
    for i in range(len(X)):
        g = [j for j in np.argsort(-S[i])[:k] if S[i, j] > 0]
        if g:
            hit.append(len(set(g) & set(nn[i])) / len(g))
    return round(float(np.mean(hit)), 3)

if __name__ == '__main__':
    args = sys.argv[1:]
    a = float(args[args.index('--a') + 1]) if '--a' in args else A_EXP
    r = float(args[args.index('--r') + 1]) if '--r' in args else R_EXP
    H = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out'); os.makedirs(H, exist_ok=True)
    t = time.time()
    L = R.layers(alpha=1.0, typed=True)
    X, info, S, A = make(L, a, r)
    out = dict(a=a, r=r, sec=round(time.time() - t), spreads=spreads(X), knn_pres=knn_pres(X, S), **info)
    print(f'3D の配置 (A, R) = ({a:g}, {r:g})：{out}', flush=True)
    if '--check' in args:
        rnd = []
        for s in range(2):
            Y, e, it, ok = solve(A, a, r, np.random.default_rng(200 + s).normal(size=X.shape))
            rnd.append(dict(seed=200 + s, d_energy=round(e - info['energy'], 3), iters=it, vs=compare(X, Y)))
            print('  乱数の初め', rnd[-1], flush=True)
        deg = np.asarray(((L['need'] + L['need'].T) > 0).sum(1)).ravel()
        drop = []
        for s in range(2):
            Lb = R.layers(alpha=1.0, drop=0.10, rng=np.random.default_rng(3000 + 31 * s), protect_deg=deg, typed=True)
            Y, _, _, _ = make(Lb, a, r)
            drop.append(dict(seed=3000 + 31 * s, vs=compare(X, Y)))
            print('  関係を 1 割抜く', drop[-1], flush=True)
        out.update(random=rnd, drop10=drop)
    np.save(os.path.join(H, 'X_3d.npy'), X)
    if '--site' in args:
        # サイトの 3D の地図（D-124）：tools/space-layout.json に書く。大きさは、はじめの知の宇宙（D-037）の半径の中央値 48.6 にそろえ、カメラや霧の決まりをそのまま使う
        r = np.linalg.norm(X - X.mean(0), axis=1)
        Y = (X - X.mean(0)) * (48.6 / np.median(r))
        out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'space-layout.json')
        # 向きは、いま公開している配置に合わせる（回転と裏返しだけで、形と大きさは変えない）。主軸で決める向きは、データが少し変わると入れかわることがあり、
        # そのままだと見なれた地図が回ったり鏡に映ったりする（2026-11-12、地図を広げたとき回さずにくらべると半径の 110% 動いた）
        if os.path.exists(out):
            prev = json.load(open(out, encoding='utf-8'))
            com = [k for k, i in enumerate(L['ids']) if i in prev]
            if len(com) >= 10:
                Pm = np.array([prev[L['ids'][k]] for k in com], float); Pm = Pm - Pm.mean(0)
                Ua, _, Vt = np.linalg.svd(Y[com].T @ Pm)
                Y = Y @ (Ua @ Vt)
        pos = {i: [round(float(v), 2) for v in Y[k]] for k, i in enumerate(L['ids'])}
        open(out, 'w', encoding='utf-8', newline='\n').write(json.dumps(pos, ensure_ascii=False, separators=(',', ':'), sort_keys=True) + '\n')
        print(f'サイトの 3D の配置を書いた：{len(pos)} 単元 → tools/space-layout.json', flush=True)
    json.dump(out, open(os.path.join(H, 'place3d.json'), 'w'), ensure_ascii=False, indent=1)
