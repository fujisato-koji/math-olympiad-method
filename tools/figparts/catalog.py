# 図の部品の一覧（D-189）。係はこれを 1 回読めば部品を呼べる（部品のファイルの中身は読まなくてよい）。
#   python tools/figparts/catalog.py [分野…]   … 土台（base）と分野（chem など）の部品の呼び方と説明。分野を省くと全部
import sys, inspect, importlib
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from expand import fields  # noqa: E402

want = sys.argv[1:] or [f for f in fields() if f != 'base']
for f in ['base'] + [w for w in want if w != 'base']:
    mod = importlib.import_module(f)
    print(f'■ {f}')
    for k, v in vars(mod).items():
        if k.startswith('_') or not inspect.isfunction(v) or v.__module__ != f or k in ('n', 'esc', 'col', 'flat'):
            continue
        doc = ' '.join((inspect.getdoc(v) or '').split())
        print(f'- {k}{inspect.signature(v)}' + (f'：{doc}' if doc else ''))
    data = [k for k, v in vars(mod).items() if k.isupper() and not k.startswith('_') and getattr(v, '__module__', None) is None
            and k not in ('CC',)]
    if f == 'base':
        print('- 色：YEL 黄、SKY 空色、GRN 緑、RED 赤、BRN 茶、PUR 紫、GRY 灰（"黄" のように名前でも渡せる）。並び [a, b] を返せば 1 枚の svg に包む')
    elif data:
        print('- データ：' + '、'.join(k for k in data if k not in ('YEL', 'SKY', 'GRN', 'RED', 'BRN', 'PUR', 'GRY', 'COLORS')))
