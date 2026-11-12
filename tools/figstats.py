# 図の割合を測る（D-129〜D-131 の進みを見る）：見本に図、答える問題に図、ヒントに図、図が 1 枚もない単元
#   python tools/figstats.py            … 段ごと・記号の頭ごとの表
#   python tools/figstats.py A-001 …    … 単元ごと
import sys, collections
from pathlib import Path
import yaml
yload = lambda s: yaml.load(s, Loader=getattr(yaml, "CSafeLoader", yaml.SafeLoader))  # C 版の読み込み口（libyaml）があれば使う。Python 版の約 9 倍速く、全部の YAML で結果が同じ（D-132）
ROOT = Path(__file__).resolve().parents[1]
data = yload((ROOT / 'roadmap.yaml').read_text(encoding='utf-8'))
U = {u['id']: u for u in data['units']}


def measure(uid):
    d = yload((ROOT / 'units' / f'{uid}.yaml').read_text(encoding='utf-8')) or {}
    its = [it for day in d.get('days') or [] for it in (day.get('items') or []) + (day.get('extra') or [])] + list(d.get('ri') or [])
    fig = lambda it: bool(it.get('svg') or it.get('figure') or it.get('balance'))
    mihon = [it for it in its if it.get('part') == '見本']
    ans = [it for it in its if it.get('part') not in ('見本', 'わけ')]
    hints = [h for it in ans for h in it.get('hints') or []]
    return {'items': len(its), 'mihon': len(mihon), 'mihon_fig': sum(map(fig, mihon)), 'ans': len(ans), 'ans_fig': sum(map(fig, ans)),
            'hints': len(hints), 'hint_svg': sum(1 for h in hints if isinstance(h, dict) and h.get('svg')),
            'nofig': not any(it.get('svg') or it.get('figure') for it in its)}


pct = lambda a, b: f'{100 * a / b:.0f}%' if b else '—'
ids = [a for a in sys.argv[1:]] or sorted(p.stem for p in (ROOT / 'units').glob('*.yaml'))
M = {i: measure(i) for i in ids}
print(f"{'':<12}{'単元':>5}{'問題':>7}{'見本に図':>9}{'問題に図':>9}{'ヒントに図':>10}{'図なし':>7}")


def row(name, xs):
    s = lambda k: sum(M[i][k] for i in xs)
    print(f"{name:<12}{len(xs):>5}{s('items'):>7}{pct(s('mihon_fig'), s('mihon')):>9}{pct(s('ans_fig'), s('ans')):>9}{pct(s('hint_svg'), s('hints')):>10}{sum(M[i]['nofig'] for i in xs):>7}")


if sys.argv[1:]:
    for i in ids:
        row(i, [i])
else:
    row('全部', ids)
    by = collections.defaultdict(list)
    for i in ids:
        st = U.get(i, {}).get('stage')
        by[f'段 {st}'].append(i)
    for k in sorted(by, key=lambda k: (len(k), k)):
        row(k, by[k])
    by = collections.defaultdict(list)
    for i in ids:
        by[f'記号 {i.split("-")[0]}'].append(i)
    for k in sorted(by, key=lambda k: -len(by[k])):
        row(k, by[k])
