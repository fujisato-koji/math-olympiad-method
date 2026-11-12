# 関係から見つけた分野を relations/fields.yaml に書く。10 単元に満たない塊は、線のいちばん多い大きな塊に入れる。
import os, sys, json, collections
from pathlib import Path
import numpy as np
import yaml
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import relations as R
from vos import W_LAYERS
HERE = os.path.dirname(os.path.abspath(__file__))
H = os.path.join(HERE, 'out')
REPO = Path(__file__).resolve().parents[2]
F = json.load(open(os.path.join(H, 'fields.json')))
ids = F['ids']; l1 = np.array(F['labels']); l2 = np.array(F['labels2']); sure = np.array(F['sure'])
order = sorted(np.unique(l1), key=lambda c: -(l1 == c).sum())
WRITE = '--write' in sys.argv
# 名前の引き継ぎ：旧の relations/fields.yaml の分野・細かい分野と、単元の集まりの Jaccard が最大で 0.5 以上なら名前を引き継ぐ。なければ name を null（要命名）にする。
old_path = REPO / 'relations' / 'fields.yaml'
old = (yaml.safe_load(open(old_path, encoding='utf-8')) or {}).get('fields') or []
old_f = [({u for s in f['subs'] for u in s['units']}, f) for f in old]
old_s = [(set(s['units']), s) for f in old for s in f['subs']]
def best(units, pool):
    units = set(units); bj, bo = 0.0, None
    for us, o in pool:
        j = len(units & us) / len(units | us) if units | us else 0.0
        if j > bj:
            bj, bo = j, o
    return (bo, bj) if bj >= 0.5 else (None, bj)
S = R.combine(R.layers(alpha=1.0, typed=True), W_LAYERS).tocsr()
big = [c for c in order if (l1 == c).sum() >= 10]
merged = {}
for c in order:
    if c in big:
        continue
    mem = np.where(l1 == c)[0]
    w = collections.Counter()
    for i in mem:
        row = S.getrow(i)
        for j, x in zip(row.indices, row.data):
            if l1[j] in big:
                w[int(l1[j])] += x
    merged[int(c)] = w.most_common(1)[0][0]
final = np.array([merged.get(int(c), int(c)) for c in l1])
rm = yaml.safe_load(open(os.path.join(REPO, 'roadmap.yaml'), encoding='utf-8'))
U = {u['id']: u for u in rm['units']}
out = []
todo = []
named_f = 0
for n, c in enumerate(sorted(big, key=lambda c: -(final == c).sum())):
    mem = [ids[i] for i in np.where(final == c)[0]]
    subs = []
    for sb_ in sorted(set(l2[l1 == c].tolist())):
        sm = [ids[i] for i in np.where(l2 == sb_)[0]]
        o, j = best(sm, old_s)
        subs.append({'id': f'F{n + 1:02d}-{len(subs) + 1:02d}', 'name': o['name'] if o else None, 'name_en': o['name_en'] if o else None, 'about': o['about'] if o else None, 'units': sm})
        if not o:
            todo.append(f'F{n + 1:02d}-{len(subs):02d}（{len(sm)} 単元、重なり最大 {j:.2f}）')
    extra = [ids[i] for i in np.where((final == c) & (l1 != c))[0]]
    if extra:
        subs.append({'id': f'F{n + 1:02d}-{len(subs) + 1:02d}', 'name': '小さな塊', 'name_en': '', 'about': '10 単元に満たない塊で、関係のいちばん多いこの分野に入れた', 'units': extra})
    of, jf = best(mem, old_f)
    if not of:
        todo.append(f'F{n + 1:02d}（{len(mem)} 単元、重なり最大 {jf:.2f}）')
    out.append({'id': f'F{n + 1:02d}', 'name': of['name'] if of else None, 'name_en': of['name_en'] if of else None, 'about': of['about'] if of else None, 'note': of.get('note') if of else None,
                'size': len(mem), 'boundary': [ids[i] for i in np.where((final == c) & ~sure)[0]], 'subs': subs})
head = """# 関係から見つけた分野（D-117、D-118）。地図の流れ（lanes）とは独立に、単元どうしの関係だけから見つけた塊に名前を付けたもの。
# 作り方（2026-11-12）：関係を 4 層（前提の線は relations/needs.yaml の強さと種類で重み、代わりの前提、網羅表の同じ論題、問題が使う単元）にし、
#   同じ論題の重みを変えた 3 つの設定それぞれで Louvain を 30 回回した合意をとり、3 設定の合意をもう一度とった（1 段目）。
#   1 段目の塊ごとに、もう一度合意をとって細かく分けた（2 段目）。10 単元に満たない塊は、関係のいちばん多い分野に入れた。
#   boundary は境目の単元（3 設定のどれかで仲間がかわるか、関係を 1 割抜くゆさぶりで 8 割未満しか同じ塊に残らない）。
# 名前：塊ごとに 2 つの係が別々に付け、3 つ目の係がくらべて決めた（確立した分野名、「〇と〇」で寄せ集めない）。
# くわしくは docs/research/relation-structure.md。地図の画面にはまだ使っていない（施主の確認のあと）。
"""
head += "# 再作成（tools/fields/run.py）：3 設定はどれも前提の線を強さ×種類で重み付けした。名前は旧の分野との単元の重なり（Jaccard 0.5 以上）で引き継ぎ、引き継げない塊は name が null（要命名）。\n"
body = head + '\n' + yaml.safe_dump({'fields': out}, allow_unicode=True, sort_keys=False, width=10000, default_flow_style=None)
open(os.path.join(H, 'fields.yaml'), 'w', encoding='utf-8', newline='\n').write(body)
if WRITE:
    open(old_path, 'w', encoding='utf-8', newline='\n').write(body)
for f in out:
    print(f["id"], f["name"], f["size"], '境目', len(f["boundary"]), '細かい', len(f['subs']))
print('合計', sum(f['size'] for f in out), '分野', len(out), '細かい分野', sum(len(f['subs']) for f in out), 'relations/fields.yaml を書きかえた' if WRITE else '(out/fields.yaml のみ)')
# 旧の分野との ARI（旧の relations/fields.yaml、単元の所属）
from clusters import ari
if old:
    ou = {u: f['id'] for f in old for s in f['subs'] for u in s['units']}
    nu = {u: f['id'] for f in out for s in f['subs'] for u in s['units']}
    com = sorted(set(ou) & set(nu))
    print('旧の分野との ARI', round(ari(np.array([ou[u] for u in com]), np.array([nu[u] for u in com])), 3), '単元', len(com))
print('名前を引き継げた分野', sum(1 for f in out if f['name']), '/', len(out), '細かい分野', sum(1 for f in out for s in f['subs'] if s['name']), '/', sum(len(f['subs']) for f in out))
print('要命名', len(todo)); [print('  ', t) for t in todo]
# 3D の配置と分野を、プレビュー用に書き出す
X = np.load(os.path.join(H, 'X_vos.npy'))
fid = {}
for f in out:
    for sb in f['subs']:
        for u in sb['units']:
            fid[u] = (f['id'], sb['id'])
bset = set(u for f in out for u in f['boundary'])
NL = yaml.safe_load(open(os.path.join(REPO, 'relations', 'needs.yaml'), encoding='utf-8'))['lines']
ix = {u: i for i, u in enumerate(ids)}
edges = [[ix[m], ix[u['id']], (NL.get(f"{m}>{u['id']}") or {}).get('strength', 1)] for u in rm['units'] for m in (u.get('needs') or []) if m in ix]
json.dump({'fields': [{'id': f['id'], 'name': f['name'], 'name_en': f['name_en'], 'size': f['size'], 'subs': [{'id': sb['id'], 'name': sb['name']} for sb in f['subs']]} for f in out],
           'units': [{'id': u, 't': U[u]['title'].split('（')[0][:40], 'lane': u[0], 'f': fid[u][0], 's': fid[u][1], 'b': u in bset, 'p': [round(float(x), 3) for x in X[i]]} for i, u in enumerate(ids)],
           'edges': edges},
          open(os.path.join(H, 'preview-data.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('preview ok', len(edges))
