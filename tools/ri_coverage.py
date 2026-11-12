#!/usr/bin/env python3
"""小学・中学の数学単元の、腕だめしの網羅性を調べる。

問題数ではなく、単元ごとに必要な「難しさの種類」がそろっているかを見る。
段 1〜2 は 総動員・数・読み取り、段 3〜4 は 5 種類すべてを目標にする。
"""
from __future__ import annotations

import argparse
import glob
import os
from collections import Counter

import yaml
yload = lambda s: yaml.load(s, Loader=getattr(yaml, "CSafeLoader", yaml.SafeLoader))  # C 版の読み込み口（libyaml）があれば使う。Python 版の約 9 倍速く、全部の YAML で結果が同じ（D-132）

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MATH = set("NACGLSF")
KINDS = ["総動員", "数", "道筋", "手数", "読み取り"]
TARGET = {1: ["総動員", "数", "読み取り"], 2: ["総動員", "数", "読み取り"], 3: KINDS, 4: KINDS}


def load():
    road = yload(open(os.path.join(ROOT, "roadmap.yaml"), encoding="utf-8"))
    stages = {u["id"]: u.get("stage") for u in road["units"]}
    titles = {u["id"]: u.get("title", "") for u in road["units"]}
    rows = []
    for f in sorted(glob.glob(os.path.join(ROOT, "units", "*.yaml"))):
        uid = os.path.basename(f)[:-5]
        if stages.get(uid) not in TARGET or uid[0] not in MATH:
            continue
        doc = yload(open(f, encoding="utf-8")) or {}
        ri = doc.get("ri") or []
        have = {k for it in ri for k in (it.get("kinds") or [])}
        miss = [k for k in TARGET[stages[uid]] if k not in have]
        rows.append({
            "id": uid,
            "stage": stages[uid],
            "title": titles.get(uid, ""),
            "n": len(ri),
            "soudou": sum(1 for it in ri if "総動員" in (it.get("kinds") or [])),
            "missing": miss,
        })
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--md", action="store_true", help="Markdown の表で出す")
    args = ap.parse_args()
    rows = load()
    need = [r for r in rows if r["missing"]]
    print(f"対象 {len(rows)} 単元、不足あり {len(need)} 単元、不足の種類 {sum(len(r['missing']) for r in need)}")
    dist = Counter(len(r["missing"]) for r in rows)
    print("不足の数ごとの単元数:", dict(sorted(dist.items())))
    if args.md:
        print("\n| 単元 | 段 | 題 | 腕だめし | 総動員 | 足りない種類 |")
        print("|---|---:|---|---:|---:|---|")
        for r in need:
            print(f"| {r['id']} | {r['stage']} | {r['title']} | {r['n']} | {r['soudou']} | {'、'.join(r['missing'])} |")
    else:
        for r in need:
            print(f"{r['id']} 段{r['stage']} {r['title']}：足りない {'、'.join(r['missing'])}")


if __name__ == "__main__":
    main()
