# 関係から見つけた分野の手直し（relations/field-moves.yaml、D-198）を当てる。
#   python tools/fields/moves.py           … いまの relations/fields.yaml に当てたときの変化を数えるだけ（書かない）
#   python tools/fields/moves.py --write   … relations/fields.yaml を書きかえる。そのあと order2d.py と python tools/roadmap.py build
# save_fields.py も、塊を書く前にこれを当てる（作りなおしても手直しが消えない）。同じ手直しを何度当てても変わらない。
import collections, sys
from pathlib import Path
import yaml
REPO = Path(__file__).resolve().parents[2]
MOVES = REPO / 'relations' / 'field-moves.yaml'
FIELDS = REPO / 'relations' / 'fields.yaml'


def _find(f, name):
    return next((s for s in f['subs'] if s['name'] == name), None) if f else None


def _next_id(f):
    n = max([int(s['id'].rsplit('-', 1)[1]) for s in f['subs'] if s['id'].startswith(f['id'] + '-')] or [0])
    return f"{f['id']}-{n + 1:02d}"


def apply(fields, moves=None):
    """fields（relations/fields.yaml の fields の並び）をその場で直し、(数, 当てられなかったものの一覧) を返す。"""
    if moves is None:
        moves = yaml.safe_load(MOVES.read_text(encoding='utf-8')) if MOVES.exists() else {}
    F = {f['name']: f for f in fields}
    n, miss = collections.Counter(), []
    for r in moves.get('rename') or []:
        f = F.get(r['field'])
        s = _find(f, r['sub'])
        if s:
            s.update(name=r['name'], name_en=r.get('name_en', s.get('name_en')), about=r.get('about', s.get('about')))
            n['名前を変えた'] += 1
        elif not _find(f, r['name']):
            miss.append(f"名前を変える {r['field']}/{r['sub']}")
    for x in moves.get('new') or []:
        f = F.get(x['field'])
        if not f:
            miss.append(f"新しい細かい分野 {x['field']}/{x['name']}（分野がない）")
        elif not _find(f, x['name']):
            f['subs'].append({'id': _next_id(f), 'name': x['name'], 'name_en': x.get('name_en'), 'about': x.get('about'), 'units': []})
            n['新しい細かい分野'] += 1
    for m in moves.get('subs') or []:
        src, dst = F.get(m['from']), F.get(m['to'])
        s = _find(src, m['sub'])
        if s and dst:
            src['subs'].remove(s)
            s['id'] = _next_id(dst)
            dst['subs'].append(s)
            n['細かい分野ごと移した'] += 1
        elif not _find(dst, m['sub']):
            miss.append(f"細かい分野を移す {m['from']}/{m['sub']} → {m['to']}")
    where = {u: s for f in fields for s in f['subs'] for u in s['units']}
    for target, us in (moves.get('units') or {}).items():
        fname, sname = target.split('/', 1)
        dst = _find(F.get(fname), sname)
        if not dst:
            miss.append(f"行き先 {target} がない（{len(us)} 単元）")
            continue
        for u in us:
            s = where.get(u)
            if s is None:
                miss.append(f"単元 {u} がどの分野にもない")
            elif s is not dst:
                s['units'].remove(u)
                dst['units'].append(u)
                where[u] = dst
                n['単元を移した'] += 1
    # 空になった細かい分野を外し、分野の大きさと境目を数えなおす
    for f in fields:
        if any(not s['units'] for s in f['subs']):
            n['空になって外した細かい分野'] += sum(1 for s in f['subs'] if not s['units'])
        f['subs'] = [s for s in f['subs'] if s['units']]
        mem = {u for s in f['subs'] for u in s['units']}
        f['size'] = len(mem)
        f['boundary'] = [u for u in f.get('boundary') or [] if u in mem]
    seen = collections.Counter(u for f in fields for s in f['subs'] for u in s['units'])
    dup = [u for u, k in seen.items() if k > 1]
    if dup:
        raise SystemExit(f'2 つ以上の細かい分野に入った単元がある：{dup[:10]}')
    return n, miss


def split_head(text):
    """relations/fields.yaml の頭の注記（fields: より前）と本体を分ける。"""
    i = text.index('\nfields:')
    return text[:i + 1], text[i + 1:]


def dump(fields):
    return yaml.safe_dump({'fields': fields}, allow_unicode=True, sort_keys=False, width=10000, default_flow_style=None)


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    text = FIELDS.read_text(encoding='utf-8')
    head, _ = split_head(text)
    fields = yaml.load(text, Loader=getattr(yaml, 'CSafeLoader', yaml.SafeLoader))['fields']
    n, miss = apply(fields)
    print('、'.join(f'{k} {v}' for k, v in n.items()) or '変化なし（もう当ててある）')
    for m in miss:
        print('  当てられなかった：', m)
    if '--write' in sys.argv:
        mark = '# 手直し：relations/field-moves.yaml'
        if mark not in head:
            head = head.rstrip('\n') + '\n' + mark + '（中身で見て明らかに違う単元と細かい分野を移す、D-198）を当ててある。tools/fields/moves.py。\n\n'
        FIELDS.write_text(head + dump(fields), encoding='utf-8', newline='\n')
        print('relations/fields.yaml を書きかえた。次は python tools/fields/order2d.py と python tools/roadmap.py build')
