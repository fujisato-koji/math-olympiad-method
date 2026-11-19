# ヒントの点検（D-200）：答えの漏れと、選択肢の消しすぎを機械で拾う。審査の係の目の代わりに、書く係が自分で直す手がかり。
#   python tools/hintlint.py <記号…>
# 拾うもの（どれも「疑い」。出たら、その問題のヒントを見て直すか、そのままでよいかを決める）
#   漏れ：ヒントの文か図に正解の選択肢が出て、そこまでの段にほかの選択肢が出ない（正解だけを指している）。問いの文と図にもともと出る字は数えない。
#         数の答えが、問いにない数としてヒントの文か図に出る。
#   消しすぎ：まちがいの選択肢を「ちがう・ではない」などで退けるのが 3 段で 2 つ以上（2 択では 1 つ）。D-133
import sys, re
from pathlib import Path
import yaml
yload = lambda s: yaml.load(s, Loader=getattr(yaml, "CSafeLoader", yaml.SafeLoader))
REPO = Path(__file__).resolve().parents[1]
sys.stdout.reconfigure(encoding='utf-8')
NEG = re.compile(r'ちがう|ちがい|では\s*ない|じゃ\s*ない|あてはまらない|あわない|合わない|まちがい|はずれ|のぞ|消|×|✕|ない\s*(?:よ|ね|ので|から|。|$)')
LABEL = re.compile(r'^(?:[ア-ンA-Z①-⑳]|[0-9])$')


def svg_text(s):
    return ' '.join(re.sub(r'<[^>]+>', '', m) for m in re.findall(r'<text\b[^>]*>(.*?)</text>', s or '', re.S))


def has(hay, word):
    if not word:
        return False
    if LABEL.match(word):  # 1 字の印は、前後が字でないところだけ
        return re.search(rf'(?<![ァ-ヶーA-Za-z0-9]){re.escape(word)}(?![ァ-ヶーA-Za-z0-9])', hay) is not None
    return word in hay


def items(d):
    for day in d.get('days') or []:
        for i, it in enumerate(day.get('items') or [], 1):
            yield f"{day['day']} 日目 {i}", it
        for i, it in enumerate(day.get('extra') or [], 1):
            yield f"{day['day']} 日目 予備 {i}", it
    for i, it in enumerate(d.get('ri') or [], 1):
        yield f'腕だめし {i}', it


def lint(it):
    out = []
    if it.get('part') in ('見本', 'わけ') or 'answer' not in it:
        return out
    ans = str(it['answer']).strip()
    ch = [str(c).strip() for c in it.get('choices') or []]
    q = str(it.get('text', '')) + ' ' + svg_text(it.get('svg'))
    hs = it.get('hints') or []
    # 頭の「1 段目：」「2 つ目：」の札は数えない（札の数を答えの数と取り違える）
    ht = [re.sub(r'^\s*[0-9１-３] ?(?:段目|つ目)[：:]\s*', '', h.get('text', '') if isinstance(h, dict) else str(h)) for h in hs]
    hf = [svg_text(h.get('svg')) if isinstance(h, dict) else '' for h in hs]
    if ch:
        wrong = [c for c in ch if c != ans]
        seen = ''
        for k, (t, f) in enumerate(zip(ht, hf), 1):
            both = t + ' ' + f
            seen += ' ' + both
            if has(both, ans) and not has(q, ans) and not any(has(seen, c) for c in wrong):
                out.append(f'漏れ？ ヒント {k}{"の図" if has(f, ans) and not has(t, ans) else ""} に正解「{ans}」だけが出る')
        # 消しすぎ：文を「。」で切り、否定のある文に出るまちがいの選択肢を数える
        gone = set()
        for t, f in zip(ht, hf):
            for sent in re.split(r'[。！？\n]', t):
                if NEG.search(sent):
                    gone |= {c for c in wrong if has(sent, c)}
            if re.search(r'[×✕]', f):
                gone |= {c for c in wrong if has(f, c)}
        lim = 1 if len(ch) == 2 else 2
        if len(gone) >= lim:
            out.append(f'消しすぎ？ まちがいの選択肢 {len(gone)} つ（{"、".join(sorted(gone))}）をヒントで退けている（{len(ch)} 択）')
    else:
        num = re.escape(ans)
        for k, (t, f) in enumerate(zip(ht, hf), 1):
            if len(ans) == 1 and k < 3:  # 1 けたの数は、ふつうの文にも出るので 3 段目だけ見る
                continue
            for where, s in (('文', t), ('図', f)):
                if re.search(rf'(?<![0-9.]){num}(?![0-9.])', s) and not re.search(rf'(?<![0-9.]){num}(?![0-9.])', q):
                    out.append(f'漏れ？ ヒント {k} の{where}に答えの数 {ans}（問いにない数）')
    return out


total = 0
for uid in sys.argv[1:]:
    d = yload((REPO / 'units' / f'{uid}.yaml').read_text(encoding='utf-8')) or {}
    rows = [(w, m) for w, it in items(d) for m in lint(it)]
    total += len(rows)
    print(f'== {uid}：ヒントの疑い {len(rows)}')
    for w, m in rows:
        print(f'  - {w}：{m}')
