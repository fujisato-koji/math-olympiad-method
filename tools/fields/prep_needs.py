# 前提の線 3,927 本に種類と強さを付けるための入力を、先の単元ごとにまとめて束にする。
# 各線に、前と先の単元の名前・流れ・段と、先の単元の頭注で前提にふれた行（単元のファイルがあるとき）を付ける。
import os, json, re, hashlib
from pathlib import Path
import yaml
REPO = Path(__file__).resolve().parents[2]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'needs-batches')
os.makedirs(OUT, exist_ok=True)
rm = yaml.safe_load(open(os.path.join(REPO, 'roadmap.yaml'), encoding='utf-8'))
lanes = {l['id']: l['name'] for l in rm['lanes']}
U = {u['id']: u for u in rm['units']}
heads = {}
for u in rm['units']:
    p = os.path.join(REPO, 'units', f"{u['id']}.yaml")
    if os.path.exists(p):
        heads[u['id']] = [l for l in open(p, encoding='utf-8').read().splitlines() if l.startswith('#')]
def brief(uid):
    u = U[uid]
    return {'id': uid, 'title': u['title'], 'field': lanes.get(uid[0], uid[0]), 'stage': u['stage']}
edges = []
for u in rm['units']:
    for m in u.get('needs') or []:
        if m not in U:
            continue
        hint = [l.lstrip('# ').strip()[:220] for l in heads.get(u['id'], []) if m in l][:3]
        edges.append({'key': f"{m}>{u['id']}", 'pre': brief(m), 'post': brief(u['id']), 'other_needs': [x for x in u['needs'] if x != m][:8], 'note': hint})
# 先の単元ごとにまとめ、60 本ほどの束にする
edges.sort(key=lambda e: (e['post']['id'], e['pre']['id']))
batches, cur = [], []
last = None
for e in edges:
    if len(cur) >= 60 and e['post']['id'] != last:
        batches.append(cur); cur = []
    cur.append(e); last = e['post']['id']
if cur:
    batches.append(cur)
for i, b in enumerate(batches):
    json.dump(b, open(os.path.join(OUT, f'in-{i:03d}.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
# 確かめ用の抜き出し：線の名前のハッシュで 1 割を決める（乱数を使わない）
sample = [e for e in edges if int(hashlib.sha1(e['key'].encode()).hexdigest(), 16) % 10 == 0]
sb = [sample[i:i + 60] for i in range(0, len(sample), 60)]
for i, b in enumerate(sb):
    json.dump(b, open(os.path.join(OUT, f'sample-{i:02d}.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('線', len(edges), '束', len(batches), '抜き出し', len(sample), '束', len(sb), '頭注つき', sum(1 for e in edges if e['note']))
