"""組み合わせの指標（D-031）：単元の直接の前提が、どれだけ遠い領域をどれだけ広く・珍しく組み合わせるか。

地図のデータだけから出す（手で付けない）。roadmap.py の build から呼ぶ。

- 領域どうしの遠さ d(i, j)：前提のつながりで、領域 i と j がほかの領域をどう使い、どう使われるかの
  分布の似かた（コサイン）から、d = 1 - 似かた。
- 前提の重み：多くの単元が前提にする土台ほど軽くする（log(単元の数 / (1 + その単元を前提にする数))）。
- 組み合わせの広さ（Rao–Stirling の多様さ）：D = Σ_{i≠j} d(i, j) p_i p_j。p は前提の重みの領域ごとの割合。
- 組み合わせの珍しさ：前提の領域の組ごとに、地図での出現の数 O と、領域ごとの出現から期待される数
  E（その領域を前提に持つ単元の数の積 ÷ 単元の数）を比べ、log2(E / O) の最大。期待が 2 未満の組は、
  単元が少ないだけで珍しく見えるので数えない（Uzzi ら 2013 の「珍しい組み合わせ」に近い考え）。
- 組み合わせの層（D-035）：橋の駅（広さの上位 1 割と、珍しい組み合わせの駅）、単元の中で珍しい領域の組、
  古今東西の問題の中で少ない組と、まだ問題のない組（自作の問題の材料、2.16）。
"""
import math
from collections import Counter, defaultdict
from itertools import combinations


def region_distance(units):
    region = {u["id"]: u.get("region") for u in units}
    out_ = defaultdict(Counter)  # 領域 i の単元が、領域 j の単元を前提にする回数
    for u in units:
        for n in u.get("needs", []):
            a, b = region[u["id"]], region.get(n)
            if a and b and a != b:
                out_[a][b] += 1
                out_[b][a] += 1
    regs = sorted({r for r in region.values() if r})

    def cos(a, b):
        va, vb = out_[a], out_[b]
        keys = sorted(set(va) | set(vb) | {a, b})  # 足す順を固定する（集合の順は起動ごとに変わる）
        # 自分自身のつながりも 1 とみなす（互いに直接使い合う領域は近い）
        x = [va.get(k, 0) + (1 if k == a else 0) for k in keys]
        y = [vb.get(k, 0) + (1 if k == b else 0) for k in keys]
        nx, ny = math.sqrt(sum(v * v for v in x)), math.sqrt(sum(v * v for v in y))
        return sum(p * q for p, q in zip(x, y)) / (nx * ny) if nx and ny else 0.0

    return {(a, b): 1 - cos(a, b) for a in regs for b in regs if a != b}


def measure(units):
    """単元ごとに {breadth, rarity, regions, pair} を返す。"""
    n_units = len(units)
    region = {u["id"]: u.get("region") for u in units}
    used = Counter(n for u in units for n in u.get("needs", []))
    dist = region_distance(units)
    # 領域の組ごとに、それを前提に持つ単元の数
    pair_count, reg_count = Counter(), Counter()
    unit_regions = {}
    for u in units:
        rs = sorted({region[n] for n in u.get("needs", []) if region.get(n)})
        unit_regions[u["id"]] = rs
        reg_count.update(rs)
        for a, b in combinations(rs, 2):
            pair_count[(a, b)] += 1
    out = {}
    for u in units:
        w = Counter()
        for n in u.get("needs", []):
            if region.get(n):
                w[region[n]] += math.log(n_units / (1 + used[n]))
        total = sum(w.values())
        breadth = 0.0
        if total > 0 and len(w) > 1:
            p = {r: v / total for r, v in w.items()}
            breadth = sum(dist.get((a, b), 1.0) * p[a] * p[b] for a in p for b in p if a != b)
        rs = unit_regions[u["id"]]
        rarity, rare = 0.0, None
        for a, b in combinations(rs, 2):
            expected = reg_count[a] * reg_count[b] / n_units
            if expected < 2:
                continue
            score = math.log2(expected / pair_count[(a, b)])
            if score > rarity:
                rarity, rare = score, (a, b)
        out[u["id"]] = {"breadth": round(breadth, 3), "rarity": round(rarity, 2), "regions": rs, "pair": list(rare) if rare else []}
    return out


def _pairs(groups, n_min=2):
    """領域の集まりの並びから、組ごとの出現 O と期待 E（各領域の出現の積 ÷ 数）を数える。"""
    reg, pair, ex = Counter(), Counter(), defaultdict(list)
    for key, rs in groups:
        reg.update(rs)
        for a, b in combinations(rs, 2):
            pair[(a, b)] += 1
            ex[(a, b)].append(key)
    n = max(1, len(groups))
    regs = sorted(reg)
    rows = []
    for a, b in combinations(regs, 2):
        e = reg[a] * reg[b] / n
        if e >= n_min:
            rows.append({"a": a, "b": b, "o": pair[(a, b)], "e": round(e, 1), "ex": ex[(a, b)][:6]})
    return rows


def layer(units, catalog, comb, top=30):
    """組み合わせの層の材料。comb は measure() の結果。"""
    region = {u["id"]: u.get("region") for u in units}
    dist = region_distance(units)
    ranked = sorted((u["id"] for u in units if comb[u["id"]]["breadth"] > 0), key=lambda i: -comb[i]["breadth"])
    cut = comb[ranked[len(ranked) // 10]]["breadth"] if ranked else 1.0
    bridges = [i for i in ranked if comb[i]["breadth"] >= cut or comb[i]["rarity"] >= 1]
    # 単元：直接の前提の領域の組。期待より少ない組を、珍しい順に
    ug = [(u["id"], sorted({region[n] for n in u.get("needs", []) if region.get(n)})) for u in units]
    upairs = [r for r in _pairs(ug) if r["o"] > 0 and r["e"] / r["o"] >= 2]
    upairs.sort(key=lambda r: -r["e"] / r["o"])
    # 問題：受け持つ単元の領域の組。少ない組と、まだ問題のない組（遠い組ほど上に）
    pg = [(it["id"], sorted({region[x] for x in it.get("units") or [] if region.get(x)})) for it in catalog]
    pg = [g for g in pg if g[1]]
    prows = _pairs(pg)
    for r in prows:
        r["d"] = round(dist.get((r["a"], r["b"]), 1.0), 2)
    prare = sorted([r for r in prows if r["o"] > 0 and r["e"] / r["o"] >= 2], key=lambda r: -r["e"] / r["o"])
    unseen = sorted([r for r in prows if r["o"] == 0], key=lambda r: -(r["e"] * r["d"]))
    # ひらめきの種（D-037）：前提のつながりで共通の隣の領域を多く持つのに、まだ直接組み合わせた単元がない組
    # （リンク予測の Adamic–Adar。隣の多い領域を通るつながりほど軽く数える）
    nb = defaultdict(set)
    for u in units:
        for n in u.get("needs", []):
            a, b = region.get(u["id"]), region.get(n)
            if a and b and a != b:
                nb[a].add(b)
                nb[b].add(a)
    done = {tuple(sorted(p)) for _, rs in ug for p in combinations(rs, 2)} | {tuple(sorted((a, b))) for a in nb for b in nb[a]}
    lane_of = {u.get("region"): u["id"][0] for u in units}
    hints = []
    for a, b in combinations(sorted(nb), 2):
        if (a, b) in done or lane_of.get(a) == lane_of.get(b):
            continue
        via = nb[a] & nb[b]
        if len(via) < 2:
            continue
        score = sum(1 / math.log(1 + len(nb[w])) for w in via)
        hints.append({"a": a, "b": b, "via": sorted(via, key=lambda w: (len(nb[w]), w))[:4], "s": round(score, 2),
                      "d": round(dist.get((a, b), 1.0), 2)})
    hints.sort(key=lambda h: -h["s"] * h["d"])
    return {"cut": round(cut, 3), "bridges": bridges, "unitPairs": upairs[:top], "probPairs": prare[:top], "hints": hints[:60],
            "probUnseen": [{k: r[k] for k in ("a", "b", "e", "d")} for r in unseen[:top]], "problems": len(pg)}
