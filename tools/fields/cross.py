# 重みのかけ方を変えても変わらない塊：設定ごとの分け方（γ=0.5）をくらべ、設定をまたいだ合意を作る
import os, sys, json
import numpy as np
import networkx as nx
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import relations as R
from clusters import ari, nmi
from cluster2 import to_nx, louvain_runs
H = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
# 合意に使う 3 設定は、どれも前提の線を強さ×種類で重み付けし（typed）、層の比だけ変える。base（重みなし）は感度を見る参考で、合意には入れない。
cfg = {'typed': 'cl_typed_a1.0.json', 'typed_topic2': 'cl_typed_topic2_a1.0.json', 'typed_use2': 'cl_typed_use2_a1.0.json', 'base': 'cl_base_a1.0.json'}
labs, keeps = {}, {}
for k, f in cfg.items():
    if not os.path.exists(os.path.join(H, f)):
        continue  # base（重みなし）は参考で、run.py では作らない（cluster2.py main base 1.0 --gammas 0.5 で作れる）
    d = json.load(open(os.path.join(H, f)))
    g = d.get('0.5') or d.get(0.5)
    if labs and len(g['labels']) != len(next(iter(labs.values()))):
        print(f'  {k}：単元の数がちがう古い結果なので飛ばす'); continue
    labs[k] = np.array(g['labels']); keeps[k] = np.array(g['keep'])
ks = list(labs)
print('設定どうしの分け方の一致（ARI）')
for i, a in enumerate(ks):
    print(' ', a, ' '.join(f'{b}:{ari(labs[a], labs[b]):.2f}' for b in ks[i + 1:]))
# 設定をまたいだ合意：もとのグラフ（4 層、しぼらない）の線の上で、設定の何割が同じ塊にしたか
L = R.layers(alpha=1.0, typed=True)
G = to_nx(R.combine(L, {'need': 1, 'alt': .5, 'topic': 1.5, 'use': .5}))
use = ['typed', 'typed_topic2', 'typed_use2']
Hc = nx.Graph(); Hc.add_nodes_from(G.nodes())
for i, j in G.edges():
    f = np.mean([labs[k][i] == labs[k][j] for k in use])
    if f >= 2 / 3:
        Hc.add_edge(i, j, weight=f)
runs = louvain_runs(Hc, 1.0, 30)
agree = np.mean([ari(runs[0], r) for r in runs[1:]])
final = runs[0]
sizes = np.bincount(final)
# 単元ごとの確かさ：3 設定とも同じ仲間と一緒か（設定ごとに、最終の塊の仲間のいちばん多い塊に入っているか）、ゆさぶりの保たれ方の平均
core = np.zeros(len(final))
for k in use:
    for c in np.unique(final):
        mem = np.where(final == c)[0]
        vals, cnt = np.unique(labs[k][mem], return_counts=True)
        core[mem] += (labs[k][mem] == vals[np.argmax(cnt)])
core /= len(use)
kp = np.mean([keeps[k] for k in use], 0)
sure = (core == 1) & (kp >= .8)
print(f'合意の分け方：塊 {len(sizes)}（10 以上 {int((sizes >= 10).sum())}）、30 回の一致 {agree:.3f}')
print(f'3 設定とも同じ仲間 {float((core == 1).mean()):.2f}、そのうえゆさぶりで 8 割以上保たれる単元 {float(sure.mean()):.2f}（境目の単元 {int((~sure).sum())}）')
ids = L['ids']; lanes = np.array([i[0] for i in ids])
print('いまの流れとの一致 ARI', round(ari(final, lanes), 3), 'NMI', round(nmi(final, lanes), 3))
json.dump({'ids': ids, 'labels': final.tolist(), 'core': core.tolist(), 'keep': kp.tolist(), 'sure': sure.tolist()}, open(os.path.join(H, 'fields.json'), 'w'), ensure_ascii=False)
# 塊ごとの流れの内わけ
for c in np.argsort(-sizes):
    if sizes[c] < 10:
        continue
    mem = np.where(final == c)[0]
    v, n = np.unique(lanes[mem], return_counts=True)
    top = sorted(zip(n, v), reverse=True)[:4]
    print(f'塊 {c}: {sizes[c]} 単元、確か {int(sure[mem].sum())}、流れ ' + '、'.join(f'{x}{y}' for y, x in top))
