# 種類と強さの結果をまとめ、抜け・誤りを調べ、付けなおし（1 割）との一致を測る
import os, json, glob, collections
import yaml
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'needs-batches')
TYPES = ['土台', '道具', '一般化', '応用', '深める', '成熟', '疑い']
want = {}
for p in sorted(glob.glob(os.path.join(D, 'in-*.json'))):
    for e in json.load(open(p, encoding='utf-8')):
        want[e['key']] = e
got, bad = {}, []
for p in sorted(glob.glob(os.path.join(D, 'out-*.json'))):
    try:
        arr = json.load(open(p, encoding='utf-8'))
    except Exception as ex:
        bad.append((os.path.basename(p), 'JSON を読めない', str(ex)[:80])); continue
    for r in arr:
        k = r.get('key')
        if k not in want:
            bad.append((os.path.basename(p), '知らない key', k)); continue
        if r.get('type') not in TYPES or r.get('strength') not in (1, 2, 3):
            bad.append((os.path.basename(p), '値が決まりの外', k, r.get('type'), r.get('strength'))); continue
        got[k] = r
missing = [k for k in want if k not in got]
print('線', len(want), '答え', len(got), '抜け', len(missing), '誤り', len(bad))
for b in bad[:8]:
    print('  ', b)
tc = collections.Counter(r['type'] for r in got.values())
sc = collections.Counter(r['strength'] for r in got.values())
print('種類', dict(tc.most_common()))
print('強さ', dict(sorted(sc.items())))
# 付けなおしとの一致
sam = {}
for p in sorted(glob.glob(os.path.join(D, 'sample-out-*.json'))):
    for r in json.load(open(p, encoding='utf-8')):
        if r.get('key') in got and r.get('type') in TYPES and r.get('strength') in (1, 2, 3):
            sam[r['key']] = r
ks = sorted(sam)
a = [got[k]['type'] for k in ks]; b = [sam[k]['type'] for k in ks]
po = sum(x == y for x, y in zip(a, b)) / len(ks)
ca, cb = collections.Counter(a), collections.Counter(b)
pe = sum(ca[t] * cb[t] for t in TYPES) / len(ks) ** 2
kappa = (po - pe) / (1 - pe)
sa = [got[k]['strength'] for k in ks]; sb = [sam[k]['strength'] for k in ks]
print(f'付けなおし {len(ks)} 本：種類の一致 {po:.2f}（κ {kappa:.2f}）、強さの一致 {sum(x == y for x, y in zip(sa, sb)) / len(ks):.2f}、強さの差 1 以内 {sum(abs(x - y) <= 1 for x, y in zip(sa, sb)) / len(ks):.2f}')
conf = collections.Counter((x, y) for x, y in zip(a, b) if x != y)
print('種類の食いちがい（多い順）', conf.most_common(8))
sus = [k for k, r in got.items() if r['type'] == '疑い']
print('疑い', len(sus), '（付けなおしでも疑い：', sum(1 for k in sus if k in sam and sam[k]['type'] == '疑い'), '/', sum(1 for k in sus if k in sam), '）')
json.dump({'got': got, 'sample': sam}, open(os.path.join(D, 'merged.json'), 'w', encoding='utf-8'), ensure_ascii=False)
