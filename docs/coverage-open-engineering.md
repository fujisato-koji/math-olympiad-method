# 網羅表：工学の大きな未解決問題（核融合の発電、炭素の回収、きれいな水など）

この頁は `tools/roadmap.py build` が `coverage-open-engineering.yaml` から作ります。手で直さないでください。
工学の大きな未解決問題（核融合の発電、炭素の回収、きれいな水など）に要る論題ごとに、受け持つ単元か、入れない理由を書いています（R-09）。

範囲の根拠：米国工学アカデミー（NAE）の Grand Challenges for Engineering（2008、14 の課題）。2026 年の状況は DOE と LLNL、IRENA、IEA、WHO と UNICEF の公式の資料で確かめた（2026-11-08）。誤り耐性の量子計算機は NAE の一覧の外から足した。

論題 6 のうち、単元が受け持つもの 6、すべての単元に通る軸が受け持つもの 0、入れないもの 0。

## エネルギー

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-01 | 核融合からエネルギーを得る（一部解決。NIF は 2022 年に点火し、2025 年にレーザー 2.08 MJ から 8.6 MJ（利得 4.13）。施設の消費を含めた正味の発電は未達） | P-041 プラズマ物理の入口（デバイ遮蔽、プラズマ振動、単一粒子の軌道とドリフト、磁気ミラーと断熱不変量、衝突と拡散、サハの電離平衡）、P-106 原子核物理（核力とパイ中間子交換、二核子系、液滴模型と質量公式、殻模型と魔法数、原子核の変形と集団運動、核子多体系、元素合成）、E-015 疲労・破壊・クリープと材料選択、E-040 強制対流・自然対流の熱伝達、沸騰と凝縮、熱交換器の設計 | OP150、OP151、OP152、OP153 |
| T-02 | 太陽エネルギーを安くする（一部解決。太陽光の発電単価は 2010 年から約 9 割下がり、新設の 9 割が最も安い化石燃料より安い（2025）。課題は系統への統合へ移った） | E-160 太陽電池（光起電力効果、変換効率の限界、再結合と表面の不活性化）、E-170 電力変換と電力系統（パワーエレクトロニクス、同期発電機、送電と系統の安定）、H-048 電気化学と電池（電極反応、ネルンストの式、過電圧、リチウムイオン電池、燃料電池、腐食と防食） | OP150、OP154、OP155 |

## 環境

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-03 | 炭素の回収と貯留（未解決。稼働は年約 5 千万トンで、ネットゼロへの道筋に届かない） | W-033 炭素循環と海洋の化学（炭酸系の平衡、海洋による炭素の運搬、風化による長期の気候の調節）、H-043 環境の化学（大気の化学とオゾン層、水の化学と水質、元素の循環、グリーンケミストリー）、E-041 純物質と混合気体（ダルトンの法則、湿り空気と空調の過程）、動力サイクルと冷凍サイクル、W-029 多孔質の岩石の中の流れ（ダルシーの法則、地下水と熱水の循環、融けたマントルからのメルトの移動） | OP150、OP156、OP157 |

## 水

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-04 | きれいな水をすべての人に（未解決。2024 年に 21 億人が安全に管理された飲み水を得られず、2030 年に全員に届ける目標は遠のいている） | H-021 溶液の性質（質量モル濃度、溶解度と温度、沸点上昇・凝固点降下、浸透圧、コロイド）、H-043 環境の化学（大気の化学とオゾン層、水の化学と水質、元素の循環、グリーンケミストリー）、E-024 次元解析・相似・模型、管路の損失、管路網と水撃、ポンプと送風機の性能曲線・相似則・NPSH と運転点、E-040 強制対流・自然対流の熱伝達、沸騰と凝縮、熱交換器の設計 | OP150、OP158 |

## 計算機

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-05 | 誤り耐性の量子計算機をつくる（一部解決。符号距離 7 で論理誤りが閾値より下がることを 2024 年に実証したが、役に立つ規模には届いていない） | K-176 量子アルゴリズム（量子フーリエ変換、位相推定、ショアの算法、グローバーの探索と振幅増幅、隠れ部分群問題）、K-166 量子誤り訂正と耐故障量子計算（安定化子符号と CSS 符号、表面符号と量子 LDPC 符号、復号、閾値定理、もつれの蒸留）、P-099 超伝導（マイスナー効果、現象論、BCS 理論、ジョセフソン接合）、P-087 量子情報の入口（量子ビット、複製不可能定理、量子計算） | OP138 |

## 脳

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-06 | 脳を逆工学する（一部解決。ハエの全脳とマウスの視覚野の一部の結線図はできたが、脳の働きを機械で再現するには届いていない） | B-067 神経科学の計測と操作（電気生理と多電極記録、カルシウムイメージング、光遺伝学、脳の画像化、回路の地図）、B-066 計算神経科学（神経細胞のモデル、神経符号化、回路の力学、学習則）、E-169 神経インターフェース（神経の電気信号と電気刺激、人工内耳、脳深部刺激、脳–機械インターフェースと信号の解読）、K-047 ニューラルネットワークの構成、教師なし学習と強化学習の入口 | OP150、OP124、OP125 |

## 出典

| 記号 | 題名 | URL | 取得日 |
|---|---|---|---|
| OP124 | S. Dorkenwald ほか（FlyWire）, Neuronal wiring diagram of an adult brain（Nature 634, 124 (2024)） | https://www.nature.com/articles/s41586-024-07558-y | 2026-11-08 |
| OP125 | MICrONS Consortium, Functional connectomics spanning multiple areas of mouse visual cortex（Nature 640, 435 (2025)） | https://www.nature.com/articles/s41586-025-08790-w | 2026-11-08 |
| OP138 | Google Quantum AI and Collaborators, Quantum error correction below the surface code threshold（Nature 638, 920 (2025)） | https://arxiv.org/abs/2408.13687 | 2026-11-08 |
| OP150 | National Academies, 21st Century's Grand Engineering Challenges Unveiled（NAE Grand Challenges for Engineering、2008-02-15） | https://www.nationalacademies.org/news/21-centurys-grand-engineering-challenges-unveiled | 2026-11-08 |
| OP151 | U.S. DOE, DOE National Laboratory Makes History by Achieving Fusion Ignition（2022-12-12） | https://www.energy.gov/articles/doe-national-laboratory-makes-history-achieving-fusion-ignition | 2026-11-08 |
| OP152 | LLNL, Achieving Fusion Ignition（NIF の実験の記録） | https://lmf.llnl.gov/science/achieving-fusion-ignition | 2026-11-08 |
| OP153 | LLNL, LLNL's breakthrough ignition experiment highlighted in Physical Review Letters（2024-02-05） | https://lmf.llnl.gov/news/llnls-breakthrough-ignition-experiment-highlighted-in-physical-review-letters | 2026-11-08 |
| OP154 | IRENA, Renewable Power Generation Costs in 2024（要約、2025-07） | https://www.irena.org/-/media/Files/IRENA/Agency/Publication/2025/Jul/IRENA_TEC_RPGC_in_2024_Summary_2025.pdf | 2026-11-08 |
| OP155 | IRENA, Renewable Power Generation Costs in 2025（要旨、2026-07） | https://www.irena.org/-/media/Files/IRENA/Agency/Publication/2026/Jul/IRENA_TEC_RPGC_2025_Executive_summary_2026.pdf | 2026-11-08 |
| OP156 | IEA, Policy and financing momentum sustain CCUS progress despite setbacks（2026-03-27） | https://www.iea.org/commentaries/policy-and-financing-momentum-sustain-ccus-progress-despite-setbacks | 2026-11-08 |
| OP157 | IEA, CCUS projects around the world are reaching new milestones（2025-04-30） | https://www.iea.org/commentaries/ccus-projects-around-the-world-are-reaching-new-milestones | 2026-11-08 |
| OP158 | WHO・UNICEF, 1 in 4 people globally still lack access to safe drinking water（JMP 2025、2025-08-26） | https://www.who.int/news/item/26-08-2025-1-in-4-people-globally-still-lack-access-to-safe-drinking-water---who--unicef | 2026-11-08 |
