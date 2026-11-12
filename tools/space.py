"""知の宇宙（D-037）：単元を 3D の空間に置く。roadmap.py の build から呼ぶ。

地図のデータだけから決める（手で置かない）。乱数の種は固定し、毎回同じ配置にする。

- 中心からの距離：前提の深さ（前提の鎖の長さ）。中心は数える・観察する駅、外ほど最前線。
- 方角：流れ（分野）。前提でよく使い合う流れほど近い方角に置く（球面の上で、使い合いで引き、どの組も押し合う）。
- 流れの中では、領域ごとに方角を少しずつずらし、前提の線でゆるく引き合わせる。分野をまたぐ駅は、分野と分野のあいだに浮かぶ。

計算は三角関数とべき乗をくり返すので、OS の数学ライブラリの最後の桁の違いで結果がずれうる。そこで、
`python tools/space.py` で計算して tools/space-layout.json に残し、build はそれを読むだけにする（CI で作り直しても変わらない）。
配置にない新しい単元は、build が place_missing で前提の星の近くに置き、作り直すよう警告する。
"""
import json
import sys
from pathlib import Path
import math
import random
from collections import Counter, defaultdict

SEED = 20261108


def _norm(v):
    n = math.sqrt(sum(x * x for x in v)) or 1.0
    return [x / n for x in v]


def _tangent(v, f):
    """球面の点 v での、力 f の接平面の成分。"""
    d = sum(a * b for a, b in zip(v, f))
    return [b - d * a for a, b in zip(v, f)]


def _lane_dirs(units, lanes):
    """流れの方角：使い合い（流れをまたぐ前提の数を、両方の大きさで割ったもの）で引き、どの組も押し合う。"""
    lane = {u["id"]: u["id"][0] for u in units}
    size = Counter(lane.values())
    cross = Counter()
    for u in units:
        for n in u.get("needs", []):
            a, b = lane[u["id"]], lane.get(n)
            if b and a != b:
                cross[tuple(sorted((a, b)))] += 1
    ids = [l["id"] for l in lanes if size[l["id"]]]
    k = len(ids)
    # フィボナッチ球面で、流れの順に置いてから動かす
    dirs = {}
    for i, l in enumerate(ids):
        y = 1 - 2 * (i + .5) / k
        r = math.sqrt(1 - y * y)
        th = math.pi * (3 - math.sqrt(5)) * i
        dirs[l] = [r * math.cos(th), y, r * math.sin(th)]
    aff = {(a, b): c / math.sqrt(size[a] * size[b]) for (a, b), c in cross.items()}
    for it in range(1500):
        step = .02 * (1 - it / 1500) + .002
        new = {}
        for a in ids:
            f = [0.0, 0.0, 0.0]
            for b in ids:
                if a == b:
                    continue
                d = [y - x for x, y in zip(dirs[a], dirs[b])]
                dist = math.sqrt(sum(x * x for x in d)) or 1e-6
                w = aff.get(tuple(sorted((a, b))), 0.0)
                for i in range(3):
                    f[i] += 1.0 * w * d[i] - .3 * d[i] / dist ** 3
            new[a] = _norm([x + step * t for x, t in zip(dirs[a], _tangent(dirs[a], f))])
        dirs = new
    return dirs


def layout(units, lanes, regions):
    """単元ごとの位置 {id: [x, y, z]}。"""
    rnd = random.Random(SEED)
    byid = {u["id"]: u for u in units}
    depth = {}

    def dep(i):
        if i not in depth:
            depth[i] = 1 + max([dep(n) for n in byid[i].get("needs", []) if n in byid] or [0])
        return depth[i]

    for u in units:
        dep(u["id"])
    radius = {i: 2.0 + 2.4 * (d - 1) ** .9 for i, d in depth.items()}
    lane_dir = _lane_dirs(units, lanes)
    # 領域の方角：流れの方角のまわりの円錐に、黄金角で並べる
    by_lane = defaultdict(list)
    for r in regions:
        if any(u.get("region") == r["id"] for u in units):
            by_lane[r["lane"]].append(r["id"])
    region_dir = {}
    for l, rs in by_lane.items():
        a = lane_dir.get(l)
        if not a:
            continue
        # 流れの方角に垂直な 2 つの向き
        h = [0.0, 1.0, 0.0] if abs(a[1]) < .9 else [1.0, 0.0, 0.0]
        e1 = _norm(_tangent(a, h))
        e2 = [a[1] * e1[2] - a[2] * e1[1], a[2] * e1[0] - a[0] * e1[2], a[0] * e1[1] - a[1] * e1[0]]
        cone = .18 + .05 * math.sqrt(len(rs))
        for i, rid in enumerate(rs):
            th = i * math.pi * (3 - math.sqrt(5))
            s = cone * math.sqrt((i + .5) / len(rs))
            region_dir[rid] = _norm([a[k] + s * (math.cos(th) * e1[k] + math.sin(th) * e2[k]) for k in range(3)])
    anchor = {u["id"]: region_dir.get(u.get("region")) or lane_dir.get(u["id"][0]) or [0.0, 1.0, 0.0] for u in units}
    dirs = {i: _norm([x + rnd.gauss(0, .06) for x in anchor[i]]) for i in anchor}
    edges = [(u["id"], n) for u in units for n in u.get("needs", []) if n in byid]
    ids = list(dirs)
    for it in range(140):
        f = {i: [0.0, 0.0, 0.0] for i in ids}
        # 前提の線でゆるく引き合う（方角を寄せる）
        for a, b in edges:
            d = [y - x for x, y in zip(dirs[a], dirs[b])]
            for k in range(3):
                f[a][k] += .05 * d[k]
                f[b][k] -= .02 * d[k]
        # 領域の方角へ戻す
        for i in ids:
            for k in range(3):
                f[i][k] += .08 * (anchor[i][k] - dirs[i][k])
        # 近すぎる駅は押し合う（空間の格子で近くだけを見る）
        pos = {i: [radius[i] * x for x in dirs[i]] for i in ids}
        cell, grid = 1.6, defaultdict(list)
        for i in ids:
            grid[tuple(int(math.floor(x / cell)) for x in pos[i])].append(i)
        for i in ids:
            c = tuple(int(math.floor(x / cell)) for x in pos[i])
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    for dz in (-1, 0, 1):
                        for j in grid.get((c[0] + dx, c[1] + dy, c[2] + dz), ()):
                            if j <= i:
                                continue
                            d = [y - x for x, y in zip(pos[i], pos[j])]
                            dist = math.sqrt(sum(x * x for x in d)) or 1e-3
                            if dist < cell:
                                push = .5 * (cell - dist) / dist
                                for k in range(3):
                                    f[i][k] -= push * d[k] / radius[i]
                                    f[j][k] += push * d[k] / radius[j]
        for i in ids:
            dirs[i] = _norm([x + t for x, t in zip(dirs[i], _tangent(dirs[i], f[i]))])
    return {i: [round(radius[i] * x, 2) for x in dirs[i]] for i in ids}


def place_missing(units, pos):
    """配置にない単元を、前提（なければ同じ領域）の星の重心の方角に、前提より一歩外へ置く。
    足し算、かけ算、平方根だけを使うので、どの環境でも同じ値になる。"""
    byid = {u["id"]: u for u in units}
    out = dict(pos)
    added = {}
    for u in units:  # 地図の順は前提が先なので、前提の位置は先に決まる
        if u["id"] in out:
            continue
        ref = [out[n] for n in u.get("needs", []) if n in out] or [out[v["id"]] for v in units if v.get("region") == u.get("region") and v["id"] in out]
        if not ref:
            ref = [[0.0, 1.0, 0.0]]
        c = [sum(p[k] for p in ref) / len(ref) for k in range(3)]
        r = math.sqrt(sum(x * x for x in c)) or 1.0
        rr = max(math.sqrt(sum(x * x for x in p)) for p in ref) + 2.2
        out[u["id"]] = added[u["id"]] = [round(x / r * rr, 2) for x in c]
    return out, sorted(added)


if __name__ == "__main__":
    # D-124 で、サイトの 3D の地図を関係から見た配置に替えた。この道具の layout() は、はじめの知の宇宙（中心からの距離が前提の深さ、方角が流れ）として残す
    if "--old" not in sys.argv:
        sys.exit("サイトの 3D の配置は、関係から見た配置になった（D-124）。作りなおすときは python tools/fields/run.py のあと python tools/fields/place3d.py --site。"
                 "はじめの知の宇宙（D-037）で書くときだけ --old を付ける")
    sys.path.insert(0, str(Path(__file__).parent))
    import roadmap  # noqa: E402

    data = roadmap.load()
    data = data[0] if isinstance(data, tuple) else data
    pos = layout(data["units"], data["lanes"], data.get("regions", []))
    out = Path(__file__).parent / "space-layout.json"
    out.write_text(json.dumps(pos, ensure_ascii=False, separators=(",", ":"), sort_keys=True) + "\n", encoding="utf-8", newline="\n")
    print(f"知の宇宙の配置を作り直した：{len(pos)} 単元 → {out.name}")
