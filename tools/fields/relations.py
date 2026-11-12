# 関係を種類ごとの層に分けて作る（Mucha ら 2010 の多層の考え。語は ISO 25964・SKOS・CASE にならう）。
#   need：前提（必須、向きあり。知識空間理論の surmise 関係）
#   alt ：代わりになる前提（択一、向きあり）
#   topic：網羅表で同じ論題に並ぶ（関連、向きなし）。分数で数え、association strength で正規化し（van Eck と Waltman 2009）、
#          disparity filter で単元ごとに有意な線だけ残す（Serrano ら 2009）
#   use ：問題が使う単元（CbKST の「問題 → 要る技能」、向きあり）
import os, glob, math
from pathlib import Path
import numpy as np
import yaml
from scipy import sparse
REPO = Path(__file__).resolve().parents[2]

def load_units():
    rm = yaml.safe_load(open(os.path.join(REPO, 'roadmap.yaml'), encoding='utf-8'))
    units = rm['units']
    ids = [u['id'] for u in units]
    return rm, units, ids, {u: i for i, u in enumerate(ids)}

TYPED = None
def typed_weight(a_id, b_id):
    global TYPED
    if TYPED is None:
        TYPED = (yaml.safe_load(open(os.path.join(REPO, 'relations', 'needs.yaml'), encoding='utf-8')) or {}).get('lines') or {}
    r = TYPED.get(f'{a_id}>{b_id}')
    if not r:
        return 1.0
    w = {3: 1.0, 2: 0.6, 1: 0.3}[r['strength']]
    return w * {'疑い': 0.3, '成熟': 0.5}.get(r['type'], 1.0)

def layers(alpha=0.05, drop=None, rng=None, protect_deg=None, typed=False):
    rm, units, ids, idx = load_units()
    n = len(ids)
    keep = lambda a, b: not (drop and rng.random() < drop and (protect_deg is None or (protect_deg[a] >= 4 and protect_deg[b] >= 4)))
    # need と alt（i → j は「i が j の前提」）
    need, alt = sparse.lil_matrix((n, n)), sparse.lil_matrix((n, n))
    for u in units:
        j = idx[u['id']]
        for m in u.get('needs') or []:
            if m in idx and keep(idx[m], j):
                need[idx[m], j] = typed_weight(m, u['id']) if typed else 1.0
        for group in (u.get('alt') or {}).values():
            for m in group if isinstance(group, list) else [group]:
                if m in idx and keep(idx[m], j):
                    alt[idx[m], j] = 1.0
    # topic：分数で数えた共起
    C = np.zeros((n, n))
    for p in sorted(glob.glob(os.path.join(REPO, 'coverage*.yaml'))):
        d = yaml.safe_load(open(p, encoding='utf-8'))
        for it in d.get('items') or []:
            us = sorted({idx[x] for x in (it.get('units') or []) if x in idx})
            k = len(us)
            if k < 2:
                continue
            w = 1.0 / (k - 1)
            for a in range(k):
                for b in range(a + 1, k):
                    if keep(us[a], us[b]):
                        C[us[a], us[b]] += w; C[us[b], us[a]] += w
    s = C.sum(1); m = s.sum() / 2
    with np.errstate(divide='ignore', invalid='ignore'):
        AS = np.where((s[:, None] > 0) & (s[None, :] > 0), C * (2 * m) / (s[:, None] * s[None, :]), 0.0)
    # disparity filter（重みは分数で数えた共起 C で検定し、残った線に AS を付ける）
    T = np.zeros((n, n))
    for i in range(n):
        nz = np.nonzero(C[i])[0]
        k = len(nz)
        if k == 0:
            continue
        if k == 1:
            T[i, nz] = AS[i, nz]; continue
        pw = C[i, nz] / C[i, nz].sum()
        pval = (1 - pw) ** (k - 1)
        sel = nz[pval < alpha]
        T[i, sel] = AS[i, sel]
    T = np.maximum(T, T.T)   # どちらかの端で有意なら残す
    # use：問題の uses（その単元の問題が使う別の単元）
    use = sparse.lil_matrix((n, n))
    for p in glob.glob(os.path.join(REPO, 'units', '*.yaml')):
        uid = os.path.basename(p)[:-5]
        if uid not in idx:
            continue
        d = yaml.safe_load(open(p, encoding='utf-8'))
        items = [it for day in (d.get('days') or []) for it in (day.get('items') or []) + (day.get('extra') or [])] + (d.get('ri') or [])
        for it in items:
            for v in it.get('uses') or []:
                if v in idx and v != uid and keep(idx[v], idx[uid]):
                    use[idx[v], idx[uid]] += 1.0
    return dict(ids=ids, units=units, need=need.tocsr(), alt=alt.tocsr(), topic=sparse.csr_matrix(T), use=use.tocsr(), C=C)

def combine(L, w=None):
    """層を 1 つの対称な類似度にする。各層は平均の重みが 1 になるようにそろえてから、層の比 w でたす。"""
    w = w or {'need': 1.0, 'alt': 0.5, 'topic': 1.0, 'use': 0.5}
    n = len(L['ids'])
    S = sparse.csr_matrix((n, n))
    for k, wk in w.items():
        A = L[k]
        A = (A + A.T).tocsr()
        if A.nnz == 0 or wk == 0:
            continue
        A = A / A.data.mean()
        S = S + wk * A
    S.setdiag(0); S.eliminate_zeros()
    return S

if __name__ == '__main__':
    L = layers()
    for k in ('need', 'alt', 'topic', 'use'):
        A = L[k]
        print(k, '線', A.nnz if k != 'topic' else A.nnz // 2, ' 端の単元', int(((A + A.T) > 0).sum(1).astype(bool).sum()))
    print('共起（分数）の線', int((L['C'] > 0).sum() // 2), '→ disparity filter のあと', L['topic'].nnz // 2)
    S = combine(L)
    from scipy.sparse.csgraph import connected_components
    print('合わせた類似度の線', S.nnz // 2, ' 成分', connected_components(S, directed=False)[0])
