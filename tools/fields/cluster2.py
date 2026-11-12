# 分野の塊：Louvain を種を変えて何度も回し、合意の分け方を作る（Lancichinetti と Fortunato 2012）。
# 解像度 γ を動かし（Traag ら 2019、解像度の限界 Fortunato と Barthélemy 2007）、関係を抜いたゆさぶりで単元ごとの保たれ方を測る（Rosvall と Bergstrom 2010）。
import os, sys, json
import numpy as np
import networkx as nx
from scipy import sparse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import relations as R
from clusters import ari, nmi

def to_nx(S):
    S = sparse.coo_matrix(S)
    G = nx.Graph()
    G.add_nodes_from(range(S.shape[0]))
    G.add_weighted_edges_from((int(i), int(j), float(w)) for i, j, w in zip(S.row, S.col, S.data) if i < j)
    return G

def louvain_runs(G, gamma, runs, seed0=0):
    out = []
    for s in range(runs):
        cs = nx.community.louvain_communities(G, weight='weight', resolution=gamma, seed=seed0 + s)
        lab = np.empty(G.number_of_nodes(), dtype=int)
        for k, c in enumerate(cs):
            lab[list(c)] = k
        out.append(lab)
    return out

def consensus(G, gamma, runs=30, tau=0.5, iters=6):
    """合意の分け方。合意行列の τ 未満を消して Louvain をかけなおし、全部の回がそろうまでくり返す。"""
    n = G.number_of_nodes()
    labs = louvain_runs(G, gamma, runs)
    for it in range(iters):
        # 合意行列（もとのグラフの線の上だけで数える：大きさを抑える）
        H = nx.Graph(); H.add_nodes_from(range(n))
        for i, j in G.edges():
            f = np.mean([l[i] == l[j] for l in labs])
            if f >= tau:
                H.add_edge(i, j, weight=f)
        agree = np.mean([ari(labs[0], l) for l in labs[1:]])
        if agree > 0.999:
            break
        labs = louvain_runs(H, 1.0, runs, seed0=1000 * (it + 1))
    return labs[0], float(agree), it

def keep_rate(base, boots):
    """単元ごとの保たれ方：ゆさぶりの分け方で、もとの塊の仲間のいちばん多い塊に、その単元が入っている割合。"""
    n = len(base); kept = np.zeros(n)
    for b in boots:
        for c in np.unique(base):
            mem = np.where(base == c)[0]
            vals, cnt = np.unique(b[mem], return_counts=True)
            m = vals[np.argmax(cnt)]
            kept[mem] += (b[mem] == m)
    return kept / len(boots)

def planted_test():
    G = nx.LFR_benchmark_graph(1500, 2.5, 1.5, 0.3, average_degree=6, max_degree=60, min_community=20, seed=7, max_iters=500)
    truth = {}
    for v in G:
        truth.setdefault(frozenset(G.nodes[v]['community']), len(truth))
    t = np.array([truth[frozenset(G.nodes[v]['community'])] for v in G])
    G2 = nx.convert_node_labels_to_integers(G)
    nx.set_edge_attributes(G2, 1.0, 'weight')
    lab, agree, it = consensus(G2, 1.0)
    one = louvain_runs(G2, 1.0, 1)[0]
    return len(set(t)), len(set(lab)), nmi(lab, t), nmi(one, t), agree

if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'main'
    if mode == 'planted':
        print('植えた分け方の試し（LFR、1500 点、平均次数 6、混ざり 0.3）：', planted_test())
        sys.exit()
    wname = sys.argv[2] if len(sys.argv) > 2 else 'base'
    alpha = float(sys.argv[3]) if len(sys.argv) > 3 else 0.05
    # run.py 用：--gammas 0.5 で解像度をしぼる、--quick でゆさぶりを省く（前の結果の keep を使う）
    gammas = (0.5, 1.0, 2.0, 4.0)
    quick = '--quick' in sys.argv
    if '--gammas' in sys.argv:
        gammas = tuple(float(x) for x in sys.argv[sys.argv.index('--gammas') + 1].split(','))
    OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out'); os.makedirs(OUT, exist_ok=True)
    prev_path = os.path.join(OUT, f'cl_{wname}_a{alpha}.json')
    prev = json.load(open(prev_path)) if quick and os.path.exists(prev_path) else {}
    TYPED_RUN = wname.startswith('typed')
    W = {'typed': {'need': 1, 'alt': .5, 'topic': 1, 'use': .5}, 'base': {'need': 1, 'alt': .5, 'topic': 1, 'use': .5}, 'need': {'need': 1, 'alt': .5}, 'topic2': {'need': 1, 'alt': .5, 'topic': 2, 'use': .5}, 'typed_topic2': {'need': 1, 'alt': .5, 'topic': 2, 'use': .5}, 'typed_use2': {'need': 1, 'alt': .5, 'topic': 1, 'use': 2}, 'use2': {'need': 1, 'alt': .5, 'topic': 1, 'use': 2}}[wname]
    L = R.layers(alpha=alpha, typed=TYPED_RUN)
    ids = L['ids']; lanes = [i[0] for i in ids]
    deg = np.asarray(((L['need'] + L['need'].T) > 0).sum(1)).ravel()
    G = to_nx(R.combine(L, W))
    out = {}
    for gamma in gammas:
        base, agree, it = consensus(G, gamma)
        boots = []
        for rep in range(0 if quick else 5):
            rng = np.random.default_rng(3000 + 31 * rep)
            Lb = R.layers(alpha=alpha, drop=0.10, rng=rng, protect_deg=deg, typed=TYPED_RUN)
            bl, _, _ = consensus(to_nx(R.combine(Lb, W)), gamma, runs=20)
            boots.append(bl)
        if quick:
            pk = prev.get(str(gamma))
            kr = np.array(pk['keep']) if pk and len(pk['keep']) == len(base) else np.ones(len(base))
            if not pk:
                print('  (前の結果がないので keep は 1 とした)')
            boots = [base]
        else:
            kr = keep_rate(base, boots)
        sizes = np.bincount(base)
        big = sizes[sizes >= 10]
        st = [ari(base, b) for b in boots]
        out[gamma] = dict(k=int(len(sizes)), k10=int(len(big)), agree=agree, iters=it, ari_lanes=ari(base, lanes), nmi_lanes=nmi(base, lanes),
                          boot_ari=float(np.mean(st)), boot_min=float(np.min(st)), kept95=float((kr >= .95).mean()), kept80=float((kr >= .8).mean()), labels=base.tolist(), keep=kr.tolist())
        print(f'{wname} α={alpha} γ={gamma}: 塊 {len(sizes)}（10 以上 {len(big)}）、合意 {agree:.3f}、流れと ARI {out[gamma]["ari_lanes"]:.3f} NMI {out[gamma]["nmi_lanes"]:.3f}、'
              f'ゆさぶり ARI 平均 {np.mean(st):.3f} 最小 {np.min(st):.3f}、保たれる単元 95% 以上 {out[gamma]["kept95"]:.2f} 80% 以上 {out[gamma]["kept80"]:.2f}', flush=True)
    json.dump(out, open(prev_path, 'w'))
