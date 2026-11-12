# tools/fields：関係から分野を見つける計算

単元どうしの関係（前提・代わりの前提・網羅表の同じ論題・問題が使う単元の 4 層）だけから、合意の Louvain で分野の塊を見つけ、
2 段目で細かく分け、VOS で 3D に置き、`relations/fields.yaml` を書く。結果は `docs/research/relation-structure.md`
の「関係から見つけた分野と 3D の配置」にある。

## 動かし方

    python tools/fields/run.py            # 全部（ゆさぶりあり）
    python tools/fields/run.py --quick    # ゆさぶりを省く（keep は前の out/ の結果を使う。なければ 1 とする）
    python tools/fields/run.py --write    # relations/fields.yaml も書きかえる（付けなければ out/fields.yaml だけ）

順番：(a) 3 設定（typed、typed_topic2、typed_use2。どれも前提の線を強さ×種類で重み付け、α=1.0）の合意の分け方 → (b) 3 設定の合意（cross.py、out/fields.json）→
(c) 2 段目（level2.py）→ (d) VOS の 3D 配置（vos.py、out/X_vos.npy）→ (e) out/fields.yaml を書く（save_fields.py。`--write` で relations/fields.yaml も）。
名前は、旧の relations/fields.yaml の分野・細かい分野と単元の集まりの Jaccard が最大で 0.5 以上なら引き継ぎ、
そうでない塊は name を null にして「要命名」として一覧を出す。names.json は最初の名付けの写しで、いまの run.py は読まない。

## かかる時間

全体で約 13〜32 分（この端末。ほかの処理と重なると遅い）。(a) は 1 設定あたり 5〜10 分（ゆさぶり 5 回を含む）、--quick なら 1 設定 35 秒ほど。

## 出力

- `relations/fields.yaml`（版管理する）
- `tools/fields/out/`（.gitignore）：cl_<設定>_a1.0.json、fields.json、X_vos.npy、preview-data.json（プレビュー用）

## 決まっている数

- 3 設定：どれも前提の線を強さ×種類で重み付け（relations/needs.yaml、typed_weight）し、層の比だけ変える。typed（need 1、alt 0.5、topic 1、use 0.5）、typed_topic2（topic 2）、typed_use2（use 2）。base（重みなし）は感度を見る参考で、cluster2.py に残すが合意には入れない（cross.py が ARI だけ出す）。disparity filter の α=1.0（しぼらない）
- 解像度 γ=0.5、ゆさぶり 5 回（関係の 1 割を抜く、種は 3000+31*回）、合意 30 回（ゆさぶりの中は 20 回）
- 3 設定の合意：重み topic 1.5 の元のグラフの線の上で、3 設定のうち 2/3 以上が同じ塊にした線を残し、Louvain を 30 回
- 2 段目：40 単元以上の塊を、γ=1.0、1.5、2.0 の順に合意（20 回）で分け、最大の塊が半分以下になったところで止める
- 10 単元に満たない塊は、関係（合わせた類似度）のいちばん多い大きな塊に入れる
- VOS：min Σ s_ij d_ij² − Σ d_ij を上界で押さえて下げる（600 回まで）、初めの位置は古典的 MDS

## 確かめの数（docs/research/relation-structure.md）

設定どうしの一致 ARI 0.76〜0.96。17 の塊、10 単元未満の 4 つを入れて 13 の分野と 119 の細かい分野。3 設定とも同じ仲間でゆさぶりでも
8 割以上残る単元 79%（境目 313）。VOS：初めをずらしても同じ（近所 10 単元の重なり 0.999〜1.000）、関係を 1 割抜くとずれ 3%、重なり 0.80〜0.82、
近傍の保存 0.34（MDS 0.19）。

## 補助（run.py からは呼ばない）

prep_needs.py、merge_needs.py：前提の線の種類と強さを付けるときの入出力（束の作成と回収）。relations.py、graph.py、clusters.py、embed.py、layout.py：道具。

## 注意（2026-11-12）

- relations/fields.yaml の今の 13 分野は、**前提の線の重みが配線されていない版**（typed 設定が重みなしと同じ入力）で作った。このスクリプトは重みを配線した正の手順で、同じ結果にはならない（再現ではない）。
- 地図を広げる 4 つのセッションのあとに、この手順で作りなおす。その時点で要命名の塊に名前を付ける。
- 正の手順で一度回した結果（地図を広げる前の今のデータ）：1 段目 18 塊（10 単元以上 15）、2 段目 128、15 分野と 128 の細かい分野、旧の13 分野との ARI 0.788、名前を引き継げた分野 8/15、細かい分野 95/128、要命名 40。
