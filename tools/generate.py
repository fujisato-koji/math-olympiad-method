#!/usr/bin/env python3
"""型紙から問題を作る。答えを確かめる式（check）も一緒に作り、tools/roadmap.py の決まりで照合してから出す。

  python tools/generate.py --unit N-001 --day 2 --n 6 --seed 1          その日のねらいに合う型紙で 6 問
  python tools/generate.py --kinds count,decompose --n 10 --seed 7       型紙を名指しで
  python tools/generate.py --list                                        型紙の一覧

出力は units/*.yaml の items や extra にそのまま貼れる YAML。考える問題（型紙にならないもの）は
.claude/skills/make-problems/SKILL.md の手順で作る。
"""
import argparse
import random
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
from roadmap import run_check  # noqa: E402  同じ決まりで答えを確かめる

# 絵、名前、数え方（なん○、答えの○）
THINGS = [
    ('🍎', 'りんご', 'なんこ', 'こ'), ('🍊', 'みかん', 'なんこ', 'こ'), ('🍓', 'いちご', 'なんこ', 'こ'),
    ('🍇', 'ぶどう', 'なんこ', 'こ'), ('🍬', 'あめ', 'なんこ', 'こ'), ('⭐', 'ほし', 'いくつ', 'こ'),
    ('🐟', 'さかな', 'なんびき', 'ひき'), ('🐸', 'かえる', 'なんびき', 'ひき'), ('🐞', 'てんとうむし', 'なんびき', 'ひき'),
    ('🐢', 'かめ', 'なんびき', 'ひき'), ('🐥', 'ひよこ', 'なんわ', 'わ'), ('🚗', 'くるま', 'なんだい', 'だい'),
    ('🌷', 'チューリップ', 'なんぼん', 'ほん'),
]
COUNT_HINTS = ['ゆびで ひとつずつ さしてみよう。', 'とばさないように、ゆっくり かぞえよう。', 'さいごに いった かずが こたえだよ。']
ROW_HINTS = ['うえの ならびから かぞえよう。', 'したの ならびに つづけて かぞえよう。', 'うえを かぞえおわった つぎの かずから、したを かぞえるよ。']
CMP_HINTS = ['1 から じゅんに かぞえてみよう。', 'さきに でて くるのは どちらかな。', 'あとから でて くる かずの ほうが おおきいよ。']
SPLIT_HINTS = ['まるを かいてみよう。', 'いわれた かずだけ ぬりつぶそう。', 'ぬって いない まるを かぞえよう。']


def rows(emoji, n):
    """5 こで 1 行に分ける（10 までの数を 5 のまとまりで見やすくする）。"""
    return '\n'.join(emoji * min(5, n - i) for i in range(0, n, 5))


def count(r):
    e, name, ask, unit = r.choice(THINGS)
    n = r.randint(3, 10)
    fig = rows(e, n)
    return {'part': '今日', 'text': f'{name}は {ask} ありますか。', 'figure': fig, 'answer': n, 'check': f"n('{e}')",
            'hints': ROW_HINTS if n > 5 else COUNT_HINTS,
            'paths': [[f'うえを かぞえる（{min(5, n)}）', f'したに つづけて {n} まで', f'{n} {unit}'] if n > 5
                      else ['ひだりから ひとつずつ さす', f'1 から {n} まで かぞえる', f'{n} {unit}']]}


def count_mixed(r):
    (e, name, ask, unit), (o, oname, _, _) = r.sample([t for t in THINGS if t[3] == 'こ'], 2)
    nt, no = r.randint(3, 6), r.randint(2, 4)
    seq = [e] * nt + [o] * no
    r.shuffle(seq)
    return {'part': '挑戦', 'text': f'{name}は {ask} ありますか。', 'figure': ''.join(seq), 'answer': nt, 'check': f"n('{e}')",
            'hints': [f'{name}と {oname}が まざって いるね。', f'{name}だけを ゆびで さそう。', 'しるしを つけながら かぞえよう。'],
            'paths': [[f'{name}だけを えらぶ', f'ひだりから 1 から {nt}', f'{nt} {unit}']],
            'note': f'{oname}も いっしょに かぞえて {nt + no} と こたえやすい。'}


def compare_groups(r):
    (a, an, _, au), (b, bn, _, bu) = r.sample(THINGS, 2)
    na, nb = r.sample(range(2, 9), 2)
    win, wu = (an, au) if na > nb else (bn, bu)
    return {'part': '今日', 'text': f'{an}と {bn}では、どちらが おおいですか。', 'figure': f'{a * na}\n{b * nb}',
            'choices': [an, bn], 'answer': win, 'check': f"'{an}' if n('{a}') > n('{b}') else '{bn}'",
            'hints': [f'{an}は いくつ、{bn}は いくつかな。', '1 こずつ せんで むすんでみよう。', 'のこったのは どちらかな。'],
            'paths': [[f'{an} {na}、{bn} {nb} と かぞえる', f'{max(na, nb)} は {min(na, nb)} より おおきい', win],
                      ['1 こずつ せんで むすぶ', f'{win}が {abs(na - nb)} {wu} のこる', win]]}


def compare_numbers(r):
    x, y = r.sample(range(1, 11), 2)
    return {'part': '今日', 'text': f'{x} と {y} では、どちらが おおきいですか。', 'choices': [str(x), str(y)],
            'answer': max(x, y), 'check': f'max({x}, {y})', 'hints': CMP_HINTS,
            'paths': [['1 から かぞえる', f'{min(x, y)} の あとに {max(x, y)} が でて くる', str(max(x, y))]]}


def decompose(r):
    total = r.randint(4, 10)
    part = r.randint(1, total - 1)
    item = {'part': '今日', 'text': f'{total} は {part} と いくつですか。', 'answer': total - part, 'hints': SPLIT_HINTS,
            'paths': [[f'まるを {total} こ かく', f'{part} こ ぬる', 'のこりを かぞえる', str(total - part)],
                      [f'{part} の つぎから {total} まで かぞえる', f'{total - part} かい かぞえた', str(total - part)]]}
    if r.random() < .5:
        item.update(figure='🔵' * part + '⚪' * (total - part), check="n('⚪')")
    else:
        item.update(check=f'{total} - {part}')
    return item


def neighbor(r):
    n = r.randint(2, 9)
    up = r.random() < .5
    ans = n + 1 if up else n - 1
    word = 'おおきい' if up else 'ちいさい'
    return {'part': '挑戦', 'text': f'{n} より 1 {word} かずは なんですか。', 'answer': ans, 'check': f"{n} {'+' if up else '-'} 1",
            'hints': ['1、2、3…と じゅんに かぞえてみよう。', f'{n} まで きたら、とまってみよう。',
                      f'{n} の {"つぎに" if up else "ひとつ まえに"} いう かずは なにかな。'],
            'paths': [['1 から じゅんに かぞえる', f'{n} の {"つぎは" if up else "まえは"} {ans}', str(ans)]]}


def between(r):
    a = r.randint(1, 6)
    b = r.randint(a + 2, 10)
    ans = b - a - 1
    return {'part': '挑戦', 'text': f'{a} より おおきくて、{b} より ちいさい かずは いくつ ありますか。', 'answer': ans,
            'check': f'len([k for k in range(1, 11) if {a} < k < {b}])',
            'hints': ['1 から 10 まで、かずを ならべて かいてみよう。', f'{a} と {b} に まるを つけよう。', 'まるの あいだに ある かずを かぞえよう。'],
            'paths': [['1 から 10 まで かく', f'{a} と {b} の あいだを みる', f'{ans} つ']],
            'note': f'{a} と {b} も いれて {ans + 2} と こたえやすい。'}


def share(r):
    n = r.choice([2, 4, 6, 8, 10])
    return {'part': '挑戦', 'text': f'あめが {n} こ あります。ふたりで おなじ かずずつ わけると、ひとり なんこですか。',
            'figure': '🍬' * n, 'answer': n // 2, 'check': "n('🍬') // 2",
            'hints': ['1 こずつ じゅんばんに くばってみよう。', 'あめの したに、ふたりの しるしを こうたいで かこう。', 'ひとりぶんの しるしを かぞえよう。'],
            'paths': [['1 こずつ こうたいで くばる', f'ひとり {n // 2} こずつに なる', f'{n // 2} こ'], [f'{n} は {n // 2} と {n // 2}', f'{n // 2} こ']]}


KINDS = {'count': count, 'count_mixed': count_mixed, 'compare_groups': compare_groups, 'compare_numbers': compare_numbers,
         'decompose': decompose, 'neighbor': neighbor, 'between': between, 'share': share}
# 単元と日ごとに使う型紙（日のねらいに合わせる）
UNIT_DAYS = {'N-001': {1: ['count', 'count_mixed'], 2: ['compare_groups', 'compare_numbers', 'neighbor'],
                       3: ['decompose', 'share'], 4: list(KINDS), 5: list(KINDS)}}


def generate(kinds, n, seed):
    r = random.Random(seed)
    out, seen, tries = [], set(), 0
    while len(out) < n and tries < n * 50:
        tries += 1
        it = KINDS[r.choice(kinds)](r)
        key = (it['text'], it.get('figure'))
        if key in seen:
            continue
        got = run_check(it, str(it.get('figure', '')))
        if str(got) != str(it['answer']):
            raise SystemExit(f'型紙の誤り：{it["text"]} の答え {it["answer"]} と式の値 {got} が違う')
        seen.add(key)
        out.append(it)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--unit'), ap.add_argument('--day', type=int), ap.add_argument('--kinds')
    ap.add_argument('--n', type=int, default=6), ap.add_argument('--seed', type=int, default=1)
    ap.add_argument('--list', action='store_true')
    a = ap.parse_args()
    if a.list:
        print('型紙:', '、'.join(KINDS)); print('単元と日:', UNIT_DAYS); return
    kinds = a.kinds.split(',') if a.kinds else UNIT_DAYS.get(a.unit, {}).get(a.day)
    if not kinds:
        raise SystemExit('型紙が決まらない（--kinds か、型紙のある --unit と --day を指定する）')
    sys.stdout.reconfigure(encoding='utf-8')
    print(yaml.safe_dump(generate(kinds, a.n, a.seed), allow_unicode=True, sort_keys=False, width=200), end='')


if __name__ == '__main__':
    main()
