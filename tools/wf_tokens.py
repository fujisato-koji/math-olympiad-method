# 台本 1 回分の係の記録から、段ごとのトークンを数える（D-138）。節約の試しで、前と後を同じ物差しで比べるため。
#   python tools/wf_tokens.py <wf のフォルダ>（~/.claude/projects/<作業フォルダ>/<セッション>/subagents/workflows/wf_xxx）
#   python tools/wf_tokens.py <wf のフォルダ> --probe   … 難しさを測る係（ラベルが「測る」で始まる）が 1 問に書いたトークンも出す
# 重み付きは、入力 1、控えを作る 1.25、控えから読む 0.1、書く 5（入力の値段を 1 とした目安）。モデルの値段の違いは入れていない。
# D-138 の物差し：前の作り方は 1 単元 5.9M、軽い作り方は 4.9M。Haiku が前からの腕試しに書いたトークンは 1 問 732。
#   python tools/wf_tokens.py --find <ラベル…>   … 台本の途中で、終わった係（ラベルで名指し）が書いたトークンを出す（D-200。難しさを測る係を 1 問 1 係にして、
#       その係の書いた量で 1 問の難しさを測る）。探すのは ~/.claude/projects/*/*/subagents/workflows/wf_*（同じラベルが何度もあれば新しいもの）
import sys, json, glob, os, collections

sys.stdout.reconfigure(encoding='utf-8')
if sys.argv[1] == '--find':
    want = set(sys.argv[2:])
    best = {}
    root = os.path.join(os.path.expanduser('~'), '.claude', 'projects')
    for j in glob.glob(os.path.join(root, '*', '*', 'subagents', 'workflows', 'wf_*', 'journal.jsonl')):
        for l in open(j, encoding='utf-8'):
            r = json.loads(l)
            if r.get('type') == 'started' and r.get('label') in want:
                f = os.path.join(os.path.dirname(j), f"agent-{r['agentId']}.jsonl")
                if os.path.exists(f) and os.path.getmtime(f) > best.get(r['label'], (0, ''))[0]:
                    best[r['label']] = (os.path.getmtime(f), f)
    for label in sys.argv[2:]:
        if label not in best:
            print(f'{label}：見つからない')
            continue
        seen, out = set(), 0
        for line in open(best[label][1], encoding='utf-8'):
            r = json.loads(line)
            m = r.get('message') or {}
            if r.get('type') == 'assistant' and m.get('usage') and m.get('id') not in seen:
                seen.add(m.get('id'))
                out += m['usage'].get('output_tokens', 0)
        print(f'{label}：{out}')
    sys.exit(0)
wf = sys.argv[1]
lab = {}
res = {}
for l in open(os.path.join(wf, 'journal.jsonl'), encoding='utf-8'):
    r = json.loads(l)
    if r.get('type') == 'started':
        lab[r['agentId']] = (r.get('label', '?'), r.get('phase', '?'), r['key'])
    if r.get('type') == 'result':
        res[r['key']] = r.get('result', r.get('value'))
agg = collections.defaultdict(collections.Counter)
units = set()
probe = []
for f in glob.glob(os.path.join(wf, 'agent-*.jsonl')):
    aid = os.path.basename(f)[6:-6]
    label, phase, key = lab.get(aid, ('?', '?', None))
    seen, c, model = set(), collections.Counter(), '?'
    for line in open(f, encoding='utf-8'):
        r = json.loads(line)
        m = r.get('message') or {}
        if r.get('type') == 'assistant' and m.get('usage') and m.get('id') not in seen:
            seen.add(m.get('id'))
            u = m['usage']
            c['in'] += u.get('input_tokens', 0)
            c['cw'] += u.get('cache_creation_input_tokens', 0)
            c['cr'] += u.get('cache_read_input_tokens', 0)
            c['out'] += u.get('output_tokens', 0)
            c['turns'] += 1
            model = m.get('model', model)
        if r.get('type') == 'user' and isinstance(m.get('content'), list):
            for b in m['content']:
                if b.get('type') == 'tool_result' and isinstance(b.get('content'), list):
                    c['images'] += sum(1 for x in b['content'] if x.get('type') == 'image')
    c['agents'] = 1
    c['cost'] = c['in'] + 1.25 * c['cw'] + 0.1 * c['cr'] + 5 * c['out']
    agg[f"{phase}（{model.replace('claude-', '')}）"].update(c)
    if ':' in label and '基準' not in label and not label.startswith('較正'):  # 基準：前からの腕試しを同じやり方で測る係（単元の数に入れない）
        units.add(label.split(':', 1)[1][:5])
    v = res.get(key)
    if (label.startswith('測る') or label.startswith('基準')) and isinstance(v, dict) and v.get('answers'):
        probe.append((label, c['out'], len(v['answers'])))
tot = sum(a['cost'] for a in agg.values())
print('段（モデル）　係　返事　書いた　控え作り　控え読み　画像　重み付き　割合')
for k, a in sorted(agg.items(), key=lambda x: -x[1]['cost']):
    print(f"{k}　{a['agents']}　{a['turns']}　{a['out']:,}　{a['cw']:,}　{a['cr']:,}　{a['images']}　{a['cost'] / 1e6:.2f}M　{100 * a['cost'] / max(tot, 1):.0f}%")
print(f'合計 {tot / 1e6:.1f}M（1 単元あたり {tot / max(len(units), 1) / 1e6:.2f}M、{len(units)} 単元）')
if '--probe' in sys.argv and probe:
    t, n = sum(p[1] for p in probe), sum(p[2] for p in probe)
    print(f'難しさ：測る係が 1 問に書いたトークン {t / n:,.0f}（前からの腕試しは 732。合格の目安は 1,500 以上）')
    for label, out, k in sorted(probe):
        print(f'  {label}：{out / k:,.0f}（{k} 問）')
