# tools/fields：関係から分野を見つける計算

単元どうしの関係（前提・代わりの前提・網羅表の同じ論題・問題が使う単元の 4 層）だけから、合意の Louvain で分野の塊を見つけ、
2 段目で細かく分け、3D に置き、`relations/fields.yaml` を書く。わけと結果は `docs/research/relation-structure.md`
の「関係から見つけた分野と 3D の配置」「3D の配置が平たい理由と、置き方の選びなおし」「作りなおした分野」にある（D-117、D-121、D-122）。

## 動かし方

    python tools/fields/run.py            # 全部（ゆさぶりあり）
    python tools/fields/run.py --quick    # ゆさぶりを省く（keep は前の out/ の結果を使う。なければ 1 とする）
    python tools/fields/run.py --from b   # (b) から始める（(a) の結果が out/ にあるとき）
    python tools/fields/run.py --write    # relations/fields.yaml も書きかえる（付けなければ out/fields.yaml だけ）
    python tools/fields/place3d.py --check  # 3D の配置だけ作り、乱数の初めと関係を 1 割抜いた配置とくらべる
    python tools/fields/place3d.py --site   # サイトの 3D の地図の位置（tools/space-layout.json）を書く（D-124）。向きは、いま公開している配置に回転と裏返しだけで合わせる
    python tools/fields/order2d.py          # 2D の地図の縦の並び（relations/region-order.yaml）を書く（D-124。relations/fields.yaml のあとに）

順番：(a) 3 設定（typed、typed_topic2、typed_use2。どれも前提の線を強さ×種類で重み付け、α=1.0）の合意の分け方 → (b) 3 設定の合意（cross.py、out/fields.json）→
(c) 2 段目（level2.py）→ (d) 3D の配置（place3d.py、out/X_3d.npy）→ (e) out/fields.yaml を書く（save_fields.py。`--write` で relations/fields.yaml も）。
名前は、旧の relations/fields.yaml の分野・細かい分野と単元の集まりの Jaccard が最大で 0.5 以上なら引き継ぎ、
そうでない塊は name を null にして「要命名」として一覧を出す。要命名の塊は、2 つの係が別々に名前の案を出し、3 つ目の係がくらべて決め、取りまとめが読んで直す。

## かかる時間

全体で約 20〜35 分（この端末。ほかの処理と重なると遅い）。(a) は 1 設定あたり 4〜10 分（ゆさぶり 5 回を含む）、--quick なら 1 設定 35 秒ほど。(b) から (e) は 3 分ほど。
place3d.py --check は 15 分ほど。

## 出力

- `relations/fields.yaml`（版管理する）
- `relations/region-order.yaml`（版管理する。order2d.py）、`tools/space-layout.json`（版管理する。place3d.py --site）。build はどちらも読むだけ
- `tools/fields/out/`（.gitignore）：cl_<設定>_a1.0.json、fields.json、X_3d.npy、place3d.json、fields.yaml、preview-data.json（プレビュー用）

## 決まっている数

- 3 設定：どれも前提の線を強さ×種類で重み付け（relations/needs.yaml、typed_weight：強さ 3・2・1 を 1.0・0.6・0.3、種類の疑いは ×0.3、成熟は ×0.5）し、層の比だけ変える。typed（need 1、alt 0.5、topic 1、use 0.5）、typed_topic2（topic 2）、typed_use2（use 2）。base（重みなし）は感度を見る参考で、cluster2.py に残すが合意には入れない（cross.py が ARI だけ出す）。disparity filter の α=1.0（しぼらない）
- 解像度 γ=0.5、ゆさぶり 5 回（関係の 1 割を抜く、種は 3000+31*回）、合意 30 回（ゆさぶりの中は 20 回）
- 3 設定の合意：重み topic 1.5 の元のグラフの線の上で、3 設定のうち 2/3 以上が同じ塊にした線を残し、Louvain を 30 回
- 2 段目：40 単元以上の塊を、γ=1.0、1.5、2.0 の順に合意（20 回）で分け、最大の塊が半分以下になったところで止める
- 10 単元に満たない塊は、関係（合わせた類似度）のいちばん多い大きな塊に入れる
- 3D の配置（D-121）：エネルギー Σ a_ij d²/2 − Σ log d（Noack の (a, r) 族の (2, 0)。引き合いは association strength、層の比は topic 1.5）を、古典的 MDS の初めから L-BFGS で最小にする。乱数は使わない

## 確かめの数（地図を広げたあとの 1,685 単元、2026-11-12 昼。夕の第 2 回のあとは 1,705 単元で 15 分野・139 細かい分野、前の版との一致 0.91）

- 3 設定どうしの一致 ARI 0.77〜0.86。合意は 19 の塊（10 単元以上 16）、30 回の一致 0.993。16 の分野と 143 の細かい分野。
- 3 設定とも同じ仲間で、ゆさぶりでも 8 割以上同じ塊に残る単元 72%（境目 464）。いまの 21 の流れとの一致 ARI 0.37。旧の 13 分野（1,523 単元）との一致 ARI 0.82。
- 3D の配置：3 本の軸の広がり 1 : 0.85 : 0.51、近傍の保存 0.41。乱数の初め 2 回とも同じ配置（ずれ 0、近所 10 単元の重なり 1.00）。関係を 1 割抜くと、ずれ 2.9〜4.0%、重なり 0.79〜0.84。

分野を作りなおしたら、place3d.py --site と order2d.py も回し、`python tools/roadmap.py build` で site/data.js を作りなおす（サイトの 3D と 2D の地図が分野と並びを読む）。

## 補助（run.py からは呼ばない）

prep_needs.py、merge_needs.py：前提の線の種類と強さを付けるときの入出力（束の作成と回収）。relations.py、graph.py、clusters.py、embed.py、layout.py：道具。

## 経緯（2026-11-12）

- はじめの 13 分野は、前提の線の重みが配線されていない版（typed 設定が重みなしと同じ入力、1 設定は古いデータ）で作った。このスクリプトは重みを配線した正の手順で、地図を広げた 4 セッションのあとのデータで作りなおした（D-122）。
- はじめの 3D の配置は VOS（(2, 1)）で、どの次元で解いても平たかった（1 : 0.72 : 0.22）。押し合いを距離の対数にした (2, 0) に替えた（D-121）。
