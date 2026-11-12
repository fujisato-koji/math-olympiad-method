# 大きな塊（1 段目）の中を、もう一段細かく分ける（2 段目）。塊ごとの部分グラフで、合意の Louvain を解像度を上げて回す。
import os, sys, json
import numpy as np
import networkx as nx
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import relations as R
from clusters import ari
from cluster2 import to_nx, consensus
H = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
F = json.load(open(os.path.join(H, 'fields.json')))
lab1 = np.array(F['labels'])
L = R.layers(alpha=1.0, typed=True)
G = to_nx(R.combine(L, {'need': 1, 'alt': .5, 'topic': 1.5, 'use': .5}))
ids = L['ids']
lab2 = np.full(len(ids), -1)
nxt = 0
info = []
for c in np.unique(lab1):
    mem = np.where(lab1 == c)[0]
    if len(mem) < 40:
        lab2[mem] = nxt; nxt += 1
        info.append((int(c), len(mem), 1, 1.0)); continue
    sub = nx.convert_node_labels_to_integers(G.subgraph(mem.tolist()), label_attribute='orig')
    orig = np.array([sub.nodes[v]['orig'] for v in sub.nodes()])
    best = None
    for gamma in (1.0, 1.5, 2.0):
        lab, agree, it = consensus(sub, gamma, runs=20)
        sizes = np.bincount(lab)
        if best is None or (sizes.max() / len(mem) > 0.5 and len(sizes) > len(np.bincount(best[0]))):
            best = (lab, gamma, agree)
        if sizes.max() / len(mem) <= 0.5:
            best = (lab, gamma, agree); break
    lab, gamma, agree = best
    for k in np.unique(lab):
        lab2[orig[lab == k]] = nxt; nxt += 1
    info.append((int(c), len(mem), len(np.unique(lab)), gamma))
print('1 段目', len(np.unique(lab1)), '→ 2 段目', len(np.unique(lab2)))
for c, n, k, g in info:
    print(f'  塊 {c}：{n} 単元 → {k}（γ={g}）')
F['labels2'] = lab2.tolist()
json.dump(F, open(os.path.join(H, 'fields.json'), 'w'), ensure_ascii=False)
