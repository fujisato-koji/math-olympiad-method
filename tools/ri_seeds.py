# 腕だめしの種（D-138 の試し）：単元とその前提（たどれるところまで）だけで解ける過去の大会問題の骨組み（gist と key）と、
# 構造の一覧（docs/hardest-structures.md の S01〜S33）、いまの腕だめしを出す。問題文は収録していないので写せない。種は構造と鍵だけ借りる。
#   python tools/ri_seeds.py <記号> [何問まで（省くと 12）]
import sys, re
from pathlib import Path
import yaml
yload = lambda s: yaml.load(s, Loader=getattr(yaml, "CSafeLoader", yaml.SafeLoader))
REPO = Path(__file__).resolve().parents[1]
sys.stdout.reconfigure(encoding='utf-8')
uid = sys.argv[1]
top = int(sys.argv[2]) if len(sys.argv) > 2 else 12
road = yload((REPO / 'roadmap.yaml').read_text(encoding='utf-8'))
U = {u['id']: u for u in road['units']}
u = U[uid]
reach, todo = set(), list(u.get('needs') or [])
while todo:
    x = todo.pop()
    if x in reach or x not in U:
        continue
    reach.add(x)
    todo += U[x].get('needs') or []
print(f"== {uid} {u['title']}（水準 {u.get('level')}、{u.get('days') or len(u.get('plan') or [])} 日）")
print('前提（直接）：' + '、'.join(f"{n} {U[n]['title']}" for n in u.get('needs') or [] if n in U))
print(f'たどれる前提の単元：{len(reach)}')
ok = reach | {uid}
seeds = []
for p in sorted((REPO / 'problems').glob('*.yaml')):
    for it in yload(p.read_text(encoding='utf-8')) or []:
        us = set(it.get('units') or [])
        # この単元か、同じ流れ（記号の頭の字）の単元を使うものだけ（前提の数学だけを使う問題は、理科の単元の種にならない）
        if us and us <= ok and not it.get('missing') and it.get('gist') and any(x == uid or x[0] == uid[0] for x in us):
            seeds.append((uid in us, len(us), it))
seeds.sort(key=lambda s: (not s[0], -s[1]))  # この単元を使うもの、使う単元の多いもの（組み合わせが多い）を先に
print(f'\n■ 種：この範囲の単元だけで解ける過去問 {len(seeds)} 問（上から {min(top, len(seeds))} 問。問題文は写さない）' if seeds
      else '\n■ 種：なし（下の構造の一覧と、段に合う大会・入試の考え方から自分で組み立てる）')
for has, n, it in seeds[:top]:
    print(f"- {it.get('id')}（{it.get('source', '')}）units={','.join(it.get('units') or [])}{'' if has else '（この単元を使わない）'}")
    print(f"    骨組み：{it.get('gist')}")
    if it.get('key'):
        print(f"    鍵：{it.get('key')}")
st = (REPO / 'docs' / 'hardest-structures.md').read_text(encoding='utf-8')
rows = re.findall(r'^\| (S\d\d) \| ([^|]+) \|', st, re.M)
print('\n■ 構造の一覧（見方を変える一手の手がかり）：' + '、'.join(f'{a} {b.strip()}' for a, b in rows))
d = yload((REPO / 'units' / f'{uid}.yaml').read_text(encoding='utf-8')) if (REPO / 'units' / f'{uid}.yaml').exists() else {}
ri = (d or {}).get('ri') or []
if ri:
    print(f'\n■ いまの腕だめし {len(ri)} 問（これより難しくする。同じ型にしない）')
    for it in ri:
        print('- [' + ','.join(it.get('kinds') or []) + '] ' + ' '.join(str(it.get('text', '')).split())[:110])
