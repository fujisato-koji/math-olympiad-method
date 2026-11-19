# 日のファイルの「fig: <式>」を「svg: '<svg …>'」に変える（D-200）。tools/assemble.py が組み立てるときに使う。
# 式は 1 行の python の式で、部品（base.py と分野のファイルの関数）を呼ぶ。並び（[a, b, …]）を返せば 1 枚の svg に包む。
# 単元だけの部品は、置き場（python tools/assemble.py --dir <記号>）の parts.py に書けば使える（分野のファイルを書きかえない）。
import sys, re, importlib, types
from pathlib import Path

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))
SKIP = {'expand', 'catalog', 'gallery', '__init__'}
SAFE = {k: __builtins__[k] if isinstance(__builtins__, dict) else getattr(__builtins__, k)
        for k in ('range', 'len', 'min', 'max', 'abs', 'round', 'list', 'dict', 'tuple', 'zip', 'enumerate', 'str', 'int',
                  'float', 'sum', 'sorted', 'reversed', 'True', 'False', 'None', 'isinstance')}


def fields():
    return [p.stem for p in sorted(HERE.glob('*.py')) if p.stem not in SKIP]


def public(mod):
    return {k: v for k, v in vars(mod).items() if not k.startswith('_') and not isinstance(v, types.ModuleType)}


def namespace(local=None):
    ns = {}
    for f in ['base'] + [f for f in fields() if f != 'base']:
        ns.update(public(importlib.import_module(f)))
    if local and Path(local).exists():
        mod = types.ModuleType('parts_local')
        mod.__dict__.update(ns)
        exec(compile(Path(local).read_text(encoding='utf-8'), str(local), 'exec'), mod.__dict__)
        ns.update(public(mod))
    ns['__builtins__'] = SAFE
    return ns


def to_svg(expr, ns):
    v = eval(expr, ns)
    if isinstance(v, str) and v.lstrip().startswith('<svg'):
        return v
    return ns['svg'](v)


LINE = re.compile(r'^(\s*(?:- )?)fig:\s*(.+?)\s*$')


def expand_text(t, ns, where):
    """日のファイルの文字列の fig: の行を svg: の行に変える。誤りは (行, わけ) の並びで返す"""
    out, errs = [], []
    for i, l in enumerate(t.split('\n'), 1):
        m = LINE.match(l)
        if not m:
            out.append(l)
            continue
        e = m.group(2)
        if len(e) >= 2 and e[0] == e[-1] and e[0] in '"\'':
            e = e[1:-1]
        try:
            s = to_svg(e, ns)
        except Exception as x:  # noqa: BLE001
            errs.append(f'{where} {i} 行：fig の式が動かない（{type(x).__name__}: {str(x)[:160]}）')
            out.append(l)
            continue
        out.append(f"{m.group(1)}svg: '" + s.replace("'", "''") + "'")
    return '\n'.join(out), errs
