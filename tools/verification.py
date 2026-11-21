"""単元の確かめの段（D-248、公開の段階 0 の 0-5）を git の履歴から決めて verification.yaml に書く。

段：
  none   問題がまだない（地図の位置と前提だけ）
  ai     AI が作った。答えは確かめの式（check）で確かめた（tools/roadmap.py check が式を確かめる）
  blind  AI が作り、答えを見ない AI の解き直しで確かめた（D-131 で解き直しを関門にした 2026-11-12 以降の、作る台本・直す台本の回）
  human  人が確かめた（verification.yaml の human に、取りまとめが手で書く。この道具は書き換えない）

blind は、作る・直す台本の回のコミットの題（下の RUN）に当たり、units/<単元>.yaml を変えたものから決める。
台本で作り直した単元を main に入れたら、python tools/verification.py を流して verification.yaml をコミットする
（CI は履歴を浅く取るので、ここで決めた結果を書き出しが読む）。
"""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "verification.yaml"
SINCE = "2026-11-12"
RUN = re.compile(r"図とイラストの多い形に直|図とイラストの多い問題を|問題を新しく作|単元を作る|作り直す|試しの 6 単元|節約の試し|解き直しを関門")


def runs():
    out = subprocess.run(["git", "log", "--no-merges", f"--since={SINCE}", "--format=@%h %ad %s", "--date=short", "--name-only",
                          "--", "units/*.yaml"], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", check=True).stdout
    got, cur = {}, None
    for line in out.splitlines():
        if line.startswith("@"):
            h, d, s = line[1:].split(" ", 2)
            cur = (h, d) if RUN.search(s) else None
        elif cur and line.startswith("units/") and line.endswith(".yaml"):
            uid = line[6:-5]
            if uid not in got or cur[1] > got[uid][1]:
                got[uid] = cur  # 新しい回を残す（log は新しい順なので、最初に見たもの）
    return got


def main():
    sys.path.insert(0, str(ROOT / "tools"))
    import roadmap as R
    data, problems = R.load()
    human = {}
    if OUT.exists():
        human = (R.yload(OUT.read_text(encoding="utf-8")) or {}).get("human") or {}
    got = runs()
    lines = ["# 単元の確かめの段（D-248）。tools/verification.py が git の履歴から作る（human は手で書く。道具は書き換えない）。",
             "# blind：答えを見ない AI の解き直しを含む台本の回（日付とコミット）。ここにない問題のある単元は ai（確かめの式だけ）。",
             "blind:"]
    n = 0
    for uid in sorted(got):
        if uid in problems:
            h, d = got[uid]
            lines.append(f"  {uid}: {{date: '{d}', run: '{h}'}}")
            n += 1
    lines.append("# human：人が確かめた単元。{単元: {by: 確かめた人か役目, date: 'YYYY-MM-DD', note: 何を確かめたか}}")
    if human:
        lines.append("human:")
        for uid in sorted(human):
            v = human[uid]
            lines.append(f"  {uid}: {{by: '{v.get('by', '')}', date: '{v.get('date', '')}', note: '{v.get('note', '')}'}}")
    else:
        lines.append("human: {}")
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    print(f"問題のある単元 {len(problems)}：解き直し済み {n}、確かめの式だけ {len(problems) - n}、人 {len(human)} → {OUT.name}")


if __name__ == "__main__":
    main()
