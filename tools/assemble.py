# 日ごとの小さなファイルから単元のファイルを組み立てる（D-138 の試し）。係は大きな単元のファイルを何度も読み書きしない。
#   python tools/assemble.py --dir <記号>           … 置き場（OS の一時フォルダの michisuji-work/<作業ツリーの名>/<記号>/）を出す
#   python tools/assemble.py <記号>                 … head.yaml、day-1.yaml …、ri.yaml を並べて units/<記号>.yaml を書く
#   python tools/assemble.py --append-ri <記号> <ファイル>  … 作ってある単元の ri: の後ろに、そのファイルの腕試しを足す
#   python tools/assemble.py --split <記号>         … 作ってある units/<記号>.yaml を、日ごとの小さなファイルに分ける（直すとき用）
# 日のファイルと ri.yaml の「fig: <式>」の行は、図の部品（tools/figparts、D-200）で svg に変えてから組み立てる。置き場の parts.py は単元だけの部品
import sys, re, tempfile
from pathlib import Path
import yaml
yload = lambda s: yaml.load(s, Loader=getattr(yaml, "CSafeLoader", yaml.SafeLoader))
REPO = Path(__file__).resolve().parents[1]
sys.stdout.reconfigure(encoding='utf-8')


def work(uid):
    d = Path(tempfile.gettempdir()) / 'michisuji-work' / REPO.name / uid
    d.mkdir(parents=True, exist_ok=True)
    return d


def check_block(text, key, where):
    """days: や ri: の下に入るかたまりが YAML として読め、一覧になっているかを確かめる"""
    try:
        v = yload(f'{key}:\n' + text)
    except yaml.YAMLError as e:
        sys.exit(f'{where} が YAML として読めない：{str(e)[:300]}')
    if not isinstance(v.get(key), list):
        sys.exit(f'{where} の 1 行目は「  - day: n」か「  - part: 離」の形で、字下げは 2 つ')
    return v[key]


args = sys.argv[1:]
if args and args[0] == '--dir':
    print(work(args[1]))
elif args and args[0] == '--append-ri':
    uid, src = args[1], Path(args[2])
    text = src.read_text(encoding='utf-8').rstrip('\n') + '\n'
    new = check_block(text, 'ri', src.name)
    up = REPO / 'units' / f'{uid}.yaml'
    body = up.read_text(encoding='utf-8').rstrip('\n') + '\n'
    if not re.search(r'^ri:\s*$', body, re.M):
        body += 'ri:\n'
    elif not re.search(r'^ri:\s*\n(?:(?:  |\s*$|#).*\n?)*\Z', body, re.M):
        sys.exit('ri: が単元のファイルの最後のかたまりでないので、足せない（手で足す）')
    up.write_text(body + text, encoding='utf-8', newline='\n')
    d = yload(up.read_text(encoding='utf-8'))
    print(f'{uid}：腕試しを {len(new)} 問足した（いまは {len(d.get("ri") or [])} 問）')
elif args and args[0] == '--split':
    uid = args[1]
    lines = (REPO / 'units' / f'{uid}.yaml').read_text(encoding='utf-8').split('\n')
    w = work(uid)
    cut = {i: m.group(1) for i, l in enumerate(lines) if (m := re.match(r'^  - day: (\d+)\s*$', l))}
    di = lines.index('days:') if 'days:' in lines else None
    ri = next((i for i, l in enumerate(lines) if re.match(r'^ri:\s*$', l)), len(lines))
    if di is None:
        sys.exit('days: の行がない')
    (w / 'head.yaml').write_text('\n'.join(lines[:di]).rstrip('\n') + '\n', encoding='utf-8')
    starts = sorted(cut)
    for k, s in enumerate(starts):
        e = starts[k + 1] if k + 1 < len(starts) else ri
        (w / f'day-{cut[s]}.yaml').write_text('\n'.join(lines[s:e]) + '\n', encoding='utf-8')  # 日のあいだの空行も残す（分けて組み立てても元と同じ）
    if ri < len(lines):
        (w / 'ri.yaml').write_text('\n'.join(lines[ri + 1:]).rstrip('\n') + '\n', encoding='utf-8')
    print(f'{uid}：{len(starts)} 日に分けた → {w}')
elif args:
    uid = args[0]
    w = work(uid)
    head = (w / 'head.yaml').read_text(encoding='utf-8').rstrip('\n') + '\n'
    if not re.search(rf'^id: {re.escape(uid)}\s*$', head, re.M):
        sys.exit(f'head.yaml に「id: {uid}」の行がない')
    days = sorted(w.glob('day-*.yaml'), key=lambda p: int(re.findall(r'\d+', p.stem)[0]))
    if not days:
        sys.exit(f'{w} に day-1.yaml などがない')
    sys.path.insert(0, str(REPO / 'tools' / 'figparts'))
    from expand import namespace, expand_text
    ns = namespace(w / 'parts.py')
    bad = []
    parts, n = [], 0
    for i, p in enumerate(days, 1):
        t, e = expand_text(p.read_text(encoding='utf-8'), ns, p.name)
        bad += e
        t = t if t.endswith('\n') else t + '\n'
        v = check_block(t, 'days', p.name)
        if len(v) != 1 or v[0].get('day') != i:
            sys.exit(f'{p.name} は 1 日分で、day: {i} にする（いまは {[x.get("day") for x in v]}）')
        n += len(v[0].get('items') or []) + len(v[0].get('extra') or [])
        parts.append(t)
    text = head + 'days:\n' + ''.join(parts)
    rp = w / 'ri.yaml'
    nri = 0
    if rp.exists() and rp.read_text(encoding='utf-8').strip():
        t, e = expand_text(rp.read_text(encoding='utf-8'), ns, rp.name)
        bad += e
        t = t.rstrip('\n') + '\n'
        nri = len(check_block(t, 'ri', 'ri.yaml'))
        text += 'ri:\n' + t
    if bad:
        sys.exit('\n'.join(bad))
    yload(text)
    (REPO / 'units' / f'{uid}.yaml').write_text(text, encoding='utf-8', newline='\n')
    print(f'{uid}：{len(days)} 日、問題 {n}、腕試し {nri} を units/{uid}.yaml に組み立てた')
else:
    print(__doc__ or '使い方は頭の注を見る')
