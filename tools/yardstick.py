"""外の物差し（yardsticks/*.yaml）：公開の分類で、地図の網羅性を確かめる（D-115、D-117）。

公開の分類（学問の分類、職業の分類、各分野の細かい分類）の項目ごとに、次のどれか 1 つを書く。
  units：受け持つ単元（1 つ以上）
  none ：入れない理由（D-115：人文、規範、検証できない知、上書きされた知、知の体系でない技能、など）
  gap  ：入れるべきだが、まだ単元がない（要る単元の案を書く）
上位の項目で、下位の項目に分けて書くものは group: true にして、3 つのどれも書かない。

  python tools/yardstick.py           物差しごとの数と、gap の一覧
  python tools/roadmap.py check       この確かめも含む（誤りは CI で止まる）
"""
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
KINDS = ("units", "none", "gap")


def load():
    out = {}
    d = ROOT / "yardsticks"
    for p in sorted(d.glob("*.yaml")) if d.exists() else []:
        out[p.stem] = yaml.safe_load(p.read_text(encoding="utf-8")) or {}
    return out


def check(units, ys=None):
    """誤りの一覧。units は地図の単元の id の集まり。"""
    ys = load() if ys is None else ys
    errors = []
    for name, y in ys.items():
        if not y.get("title"):
            errors.append(f"物差し {name}: title がない")
        srcs = y.get("sources") or {}
        if not srcs:
            errors.append(f"物差し {name}: sources がない（出典・取得日・ライセンスを書く）")
        for sid, s in srcs.items():
            for k in ("title", "url", "date"):
                if not (s or {}).get(k):
                    errors.append(f"物差し {name}: 出典 {sid} に {k} がない")
        seen = set()
        ids = {str(it.get("id")) for it in y.get("items") or []}
        for it in y.get("items") or []:
            iid = str(it.get("id", "?"))
            if iid in seen:
                errors.append(f"物差し {name} {iid}: 二重")
            seen.add(iid)
            n = sum(bool(it.get(k)) for k in KINDS)
            if it.get("group"):
                if n:
                    errors.append(f"物差し {name} {iid}: group の項目には units、none、gap を書かない")
            elif n != 1:
                errors.append(f"物差し {name} {iid}: units、none、gap のどれか 1 つを書く")
            if it.get("parent") is not None and str(it["parent"]) not in ids:
                errors.append(f"物差し {name} {iid}: 親 {it['parent']} がない")
            for uid in it.get("units") or []:
                if uid not in units:
                    errors.append(f"物差し {name} {iid}: 単元 {uid} が地図にない")
            for s in it.get("sources") or []:
                if s not in srcs:
                    errors.append(f"物差し {name} {iid}: 出典 {s} が sources にない")
    return errors


def summary(ys=None):
    ys = load() if ys is None else ys
    rows = []
    for name, y in ys.items():
        items = [it for it in y.get("items") or [] if not it.get("group")]
        c = {k: sum(1 for it in items if it.get(k)) for k in KINDS}
        rate = c["units"] / (c["units"] + c["gap"]) if c["units"] + c["gap"] else 1.0
        rows.append((name, y.get("title", ""), len(items), c["units"], c["none"], c["gap"], rate,
                     [(str(it.get("id")), it.get("ja") or it.get("name"), it.get("gap")) for it in items if it.get("gap")]))
    return rows


if __name__ == "__main__":
    rm = yaml.safe_load((ROOT / "roadmap.yaml").read_text(encoding="utf-8"))
    ids = {u["id"] for u in rm["units"]}
    errs = check(ids)
    for name, title, n, cu, cn, cg, rate, gaps in summary():
        print(f"{name}（{title}）：項目 {n}、受け持つ {cu}、入れない {cn}、足りない {cg}、網羅 {rate:.0%}")
        for iid, nm, why in gaps:
            print(f"  足りない {iid} {nm}：{why}")
    if errs:
        print("\n".join(errs))
        sys.exit(1)
