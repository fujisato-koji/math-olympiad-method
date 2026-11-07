# 網羅表：近年に解決された大問題の証明を読む（フェルマー、ポアンカレ、ケプラーなど）

この頁は `tools/roadmap.py build` が `coverage-solved-great.yaml` から作ります。手で直さないでください。
近年に解決された大問題の証明を読む（フェルマー、ポアンカレ、ケプラーなど）に要る論題ごとに、受け持つ単元か、入れない理由を書いています（R-09）。

論題 23 のうち、単元が受け持つもの 23、すべての単元に通る軸が受け持つもの 0、入れないもの 0。

## 主張

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-01 | フェルマーの最終定理の主張：n が 3 以上なら x^n + y^n = z^n は正の整数解を持たない | A-009 累乗と指数法則、N-035 不定方程式 | FR045 |
| T-03 | ポアンカレ予想の主張：単連結な閉じた 3 次元多様体は 3 次元球面に限る | T-004 位相多様体の例と曲面の分類の主張、T-014 可微分多様体、T-019 ホモトピーと基本群 | FR048 |
| T-05 | ケプラー予想の主張：同じ大きさの球を空間に詰める密度は面心立方の π/√18 を越えない | G-048 球充填と格子、ボロノイ分割とドロネー分割、G-021 空間図形 | FR050 |
| T-07 | 素数の間隔の有界性の主張：差がある定数以下の隣り合う素数の組が無限にある（差 2 の双子素数予想は未解決） | N-030 素数の性質、D-002 数列の極限と無限級数（高校） | FR052、FR054 |
| T-09 | 感受性予想の主張：n 次元の超立方体の頂点を半分より 1 個多く選ぶと、選んだ頂点を √n 個以上となりに持つ頂点がある（ブール関数の感受性とブロック感受性は大きく離れない） | K-121 ブール関数と回路計算量、C-029 グラフの基礎（木、2 部グラフ、オイラー回路、平面グラフ） | FR055 |
| T-11 | 三次元の掛谷予想の主張：どの向きにも長さ 1 の線分を含む空間の集合のミンコフスキー次元とハウスドルフ次元は 3 | D-072 ハウスドルフ測度と幾何学的測度論 | FR056 |
| T-13 | 幾何学的ラングランズ予想（標数 0）の主張：曲線の上の保型の側からスペクトルの側への関手が圏の同値になる（de Rham と Betti の設定） | R-026 圏論の基礎（圏・関手・自然変換）、R-029 導来圏と導来関手、R-030 線形代数群、T-035 層とスキームの入口、T-046 偏屈層と構成可能層 | FR057、FR058 |
| T-15 | ケルヴェア不変量問題の主張：ケルヴェア不変量が 1 の枠つき多様体は次元 2、6、14、30、62、126 にだけある | T-014 可微分多様体、T-025 コホモロジーの積、キュネットの定理、ポアンカレ双対性、T-026 ベクトル束とトム同型 | FR059 |
| T-17 | マッケイ予想の主張：有限群の、素数 ℓ で割り切れない次数の既約指標の個数は、シロー ℓ 部分群の正規化群のそれと等しい | R-007 シローの定理と有限 p 群、R-017 指標理論と誘導表現 | FR060 |

## 解決

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-02 | フェルマーの最終定理の証明（ワイルズ 1995、テイラー–ワイルズ）：代数的整数論、楕円曲線、モジュラー形式、ガロア表現、フライ曲線とリベットの定理、半安定楕円曲線のモジュラー性、変形理論とモジュラー性持ち上げ、ラングランズ–タネルの定理 | N-051 代数体と整数環、N-057 数体上の楕円曲線（モーデル–ヴェイユの定理、セルマー群、ヘーグナー点とグロス–ザギエ・コリヴァギンの定理）、N-062 モジュラー形式、N-065 ガロア表現とモジュラー性、N-068 保型表現 | FR045、FR046、FR047 |
| T-04 | ポアンカレ予想の証明（ペレルマン 2002–2003）：リーマン幾何の曲率、ハミルトンのリッチ流、エントロピーの公式と手術つきリッチ流、サーストンの幾何化予想 | T-016 リーマン計量、レヴィ＝チビタ接続、曲率、T-017 リーマン幾何の大域論、T-040 双曲幾何と双曲多様体、T-045 リッチ流と幾何化予想 | FR048、FR032 |
| T-06 | ケプラー予想の証明（ヘイルズ 2005、形式証明 2017）：充填の局所構造、約 150 変数の大域最適化と線形計画、区間演算による不等式の計算機証明、平面グラフの分類、HOL Light と Isabelle による形式証明 | G-048 球充填と格子、ボロノイ分割とドロネー分割、K-010 ラグランジュ法と双対性、線形計画法（単体法、内点法と楕円体法）、K-120 精度保証付き数値計算（区間演算）、C-029 グラフの基礎（木、2 部グラフ、オイラー回路、平面グラフ）、L-036 定理証明支援系と形式証明 | FR049、FR050、FR051 |
| T-08 | 素数の間隔の有界性の証明（張 2014、メイナード 2015、ポリマス 2014）：解析的整数論、篩法とゴールドストン–ピンツ–ユルドゥルムの方法、算術級数の中の素数の分布の強化、メイナードの篩、篩の変種と数値計算 | N-058 解析的整数論、N-063 篩法（セルバーグの篩とボンビエリ–ヴィノグラードフの定理）、K-009 凸最適化の基礎 | FR052、FR053、FR054 |
| T-10 | 感受性予想の証明（ファン 2019）：超立方体の誘導部分グラフ、対称行列の固有値とコーシーの交錯定理、成分を ±1 にした隣接行列 | C-032 グラフの固有値と彩色、M-006 内積空間（グラム–シュミット、直交行列とユニタリ行列）、M-007 固有値と対角化 | FR055 |
| T-12 | 三次元の掛谷予想の証明（ワン–ザール 2025、arXiv）：調和解析、幾何学的測度論、凸集合の和集合の体積の評価、多重尺度の方法 | D-072 ハウスドルフ測度と幾何学的測度論、D-023 フーリエ変換、D-026 ルベーグの微分定理と近似 | FR056、FR030 |
| T-14 | 幾何学的ラングランズ予想の証明（ゲイツゴリー–ラスキンほか、全 5 部作、arXiv）：導来代数幾何、幾何学的ラングランズ関手の構成と同値性の証明 | R-029 導来圏と導来関手、R-031 ∞圏、T-035 層とスキームの入口 | FR057、FR058 |
| T-16 | ケルヴェア不変量問題の 126 次元の解決（リン–ワン–シュー、arXiv）：安定ホモトピー論、アダムス・スペクトル系列（h_6^2 が永久サイクル）、先行結果の組み合わせ | T-043 安定ホモトピー論（スペクトラム、一般化コホモロジー、アダムス・スペクトル系列）、T-028 スペクトル系列とコホモロジー作用素 | FR059 |
| T-18 | マッケイ予想の証明（カバネス–シュペート、arXiv、Annals 掲載予定）：有限群の指標理論、アイザックス–マレ–ナヴァロの単純群への帰着、有限単純群の分類 | R-016 有限群の表現、R-017 指標理論と誘導表現、R-028 群のコホモロジー、R-030 線形代数群 | FR060 |

## 検証で足した論題

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| V-01 | フェルマーの証明の代数幾何（モジュラー曲線のヤコビ多様体、有限平坦群スキーム、層コホモロジー） | T-036 準連接層、直線束、カルティエ因子、ピカール群、T-037 層コホモロジーの入口、T-038 代数曲線と代数曲面 |  |
| V-02 | ケプラーの証明の球面幾何（立体角、二面角） | T-007 球面幾何 |  |
| V-03 | 計算機支援証明のプログラムを読む（ケプラーの計算、ケルヴェアの Ext の計算） | K-016 プログラミングの基礎（アルゴリズムの技法、データ型、再帰）、K-022 計算問題の数理モデル化、代表的なアルゴリズムとデータ構造、性能の測り方 |  |
| V-04 | 素数の間隔の証明の指数和と大きな篩 | N-064 円周法と指数和 |  |
| V-05 | 有限体の掛谷と多項式法（ドヴィル） | C-028 多項式法（組合せ論的零点定理） |  |

## 出典

| 記号 | 題名 | URL | 取得日 |
|---|---|---|---|
| FR030 | International Mathematical Union, Fields Medals 2026 | https://www.mathunion.org/imu-awards/fields-medal/fields-medals-2026 | 2026-11-07 |
| FR032 | E. W. Weisstein（MathWorld）, Smale's Problems | https://mathworld.wolfram.com/SmalesProblems.html | 2026-11-07 |
| FR045 | The Norwegian Academy of Science and Letters, Abel Prize 2016 citation, Sir Andrew J. Wiles | https://abelprize.no/sites/default/files/2021-04/citation_en_2016_A.Wiles_.pdf | 2026-11-07 |
| FR046 | The Norwegian Academy of Science and Letters, Abel Prize Laureate 2016 | https://abelprize.no/abel-prize-laureates/2016 | 2026-11-07 |
| FR047 | Wolfram Research（MathWorld）, Fermat's Last Theorem | https://mathworld.wolfram.com/FermatsLastTheorem.html | 2026-11-07 |
| FR048 | Clay Mathematics Institute, Poincaré Conjecture | https://www.claymath.org/millennium/poincare-conjecture/ | 2026-11-07 |
| FR049 | T. C. Hales, A proof of the Kepler conjecture（Ann. of Math. 162 (2005)） | https://annals.math.princeton.edu/2005/162-3/p01 | 2026-11-07 |
| FR050 | T. C. Hales, An overview of the Kepler conjecture | https://arxiv.org/abs/math/9811071 | 2026-11-07 |
| FR051 | T. Hales ほか 22 名, A Formal Proof of the Kepler Conjecture（Forum Math. Pi 5 (2017)） | https://www.cambridge.org/core/journals/forum-of-mathematics-pi/article/formal-proof-of-the-kepler-conjecture/78FBD5E1A3D1BCCB8E0D5B0C463C9FBC | 2026-11-07 |
| FR052 | Y. Zhang, Bounded gaps between primes（Ann. of Math. 179 (2014)） | https://annals.math.princeton.edu/2014/179-3/p07 | 2026-11-07 |
| FR053 | J. Maynard, Small gaps between primes（Ann. of Math. 181 (2015)） | https://annals.math.princeton.edu/2015/181-1/p07 | 2026-11-07 |
| FR054 | D. H. J. Polymath, Variants of the Selberg sieve, and bounded intervals containing many primes（Res. Math. Sci. 1 (2014)） | https://arxiv.org/abs/1407.4897 | 2026-11-07 |
| FR055 | H. Huang, Induced subgraphs of hypercubes and a proof of the Sensitivity Conjecture（Ann. of Math. 190 (2019)） | https://arxiv.org/abs/1907.00847 | 2026-11-07 |
| FR056 | H. Wang, J. Zahl, Volume estimates for unions of convex sets, and the Kakeya set conjecture in three dimensions | https://arxiv.org/abs/2502.17655 | 2026-11-07 |
| FR057 | Breakthrough Prize Foundation, Dennis Gaitsgory, 2025 Breakthrough Prize in Mathematics | https://breakthroughprize.org/Laureates/3/L3979 | 2026-11-07 |
| FR058 | D. Gaitsgory, S. Raskin, Proof of the geometric Langlands conjecture I: construction of the functor | https://arxiv.org/abs/2405.03599 | 2026-11-07 |
| FR059 | W. Lin, G. Wang, Z. Xu, On the Last Kervaire Invariant Problem | https://arxiv.org/abs/2412.10879 | 2026-11-07 |
| FR060 | M. Cabanes, B. Späth, The McKay Conjecture on character degrees | https://arxiv.org/abs/2410.20392 | 2026-11-07 |
