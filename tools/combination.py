"""組み合わせの指標（D-031）：単元の直接の前提が、どれだけ遠い領域をどれだけ広く・珍しく組み合わせるか。

地図のデータだけから出す（手で付けない）。roadmap.py の build から呼ぶ。

- 領域どうしの遠さ d(i, j)：前提のつながりで、領域 i と j がほかの領域をどう使い、どう使われるかの
  分布の似かた（コサイン）から、d = 1 - 似かた。
- 前提の重み：多くの単元が前提にする土台ほど軽くする（log(単元の数 / (1 + その単元を前提にする数))）。
- 組み合わせの広さ（Rao–Stirling の多様さ）：D = Σ_{i≠j} d(i, j) p_i p_j。p は前提の重みの領域ごとの割合。
- 組み合わせの珍しさ：前提の領域の組ごとに、地図での出現の数 O と、領域ごとの出現から期待される数
  E（その領域を前提に持つ単元の数の積 ÷ 単元の数）を比べ、log2(E / O) の最大。期待が 2 未満の組は、
  単元が少ないだけで珍しく見えるので数えない（Uzzi ら 2013 の「珍しい組み合わせ」に近い考え）。
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
        keys = set(va) | set(vb) | {a, b}
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
