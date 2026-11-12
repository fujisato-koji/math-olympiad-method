# 問題の記号を固定する（D-044）：各問題の「- part:」の次の行に、いまの中身の指紋を id: として書く。
# 図を足したり文を直したりしても、子の記録（qid = 単元:id）が引き継がれる。答えや問いの意味を変えたら、その問題の id: の行を消す。
#   python tools/stamp.py <記号…>          … id のない問題に id を書く（書いたあと、記号が前と同じかを確かめる）
#   python tools/stamp.py --dry <記号…>    … 書かずに、書いたら記号が変わらないかだけを確かめる
import sys
from pathlib import Path
import yaml
yload = lambda s: yaml.load(s, Loader=getattr(yaml, "CSafeLoader", yaml.SafeLoader))  # C 版の読み込み口（libyaml）があれば使う。Python 版の約 9 倍速く、全部の YAML で結果が同じ（D-132）
REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / 'tools'))
import roadmap as RM


class L(yaml.SafeLoader):
    pass


def _map(loader, node, deep=False):
    m = yaml.SafeLoader.construct_mapping(loader, node, deep=True)
    m['__pos__'] = (node.start_mark.line, node.start_mark.column)
    return m


L.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, _map)


def strip(x):
    if isinstance(x, dict):
        return {k: strip(v) for k, v in x.items() if k != '__pos__'}
    if isinstance(x, list):
        return [strip(v) for v in x]
    return x


def items(d):
    for day in d.get('days') or []:
        yield from (day.get('items') or []) + (day.get('extra') or [])
    yield from d.get('ri') or []


def qids(uid, text):
    d = yload(text) or {}
    return [RM.qid(uid, it) for it in items(d)]


args = sys.argv[1:]
dry = '--dry' in args
bad = 0
for uid in [a for a in args if not a.startswith('--')]:
    p = REPO / 'units' / f'{uid}.yaml'
    text = p.read_text(encoding='utf-8')
    d = yaml.load(text, Loader=L)
    lines = text.split('\n')
    ins = []
    for it in items(d):
        if 'id' in it:
            continue
        line, col = it['__pos__']
        assert lines[line][col:].startswith('part:'), (uid, line, lines[line])
        h = RM.qid(uid, strip(it)).split(':', 1)[1]
        ins.append((line, ' ' * col + f'id: "{h}"'))  # 引用符：数字だけの指紋が数（0 始まりは 8 進）として読まれないように
    for line, s in sorted(ins, reverse=True):
        lines.insert(line + 1, s)
    new = '\n'.join(lines)
    same = qids(uid, text) == qids(uid, new)
    bad += not same
    if not dry and same and ins:
        p.write_text(new, encoding='utf-8', newline='\n' if '\r\n' not in text else '\r\n')
    print(uid, f'id を {len(ins)} 問に', '書いた' if not dry and same and ins else '（書かない）', '記号は同じ' if same else '記号が変わる！書かない')
sys.exit(1 if bad else 0)
