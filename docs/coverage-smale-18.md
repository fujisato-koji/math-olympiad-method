# 網羅表：スメイルの 18 の問題

この頁は `tools/roadmap.py build` が `coverage-smale-18.yaml` から作ります。手で直さないでください。
スメイルの 18 の問題に要る論題ごとに、受け持つ単元か、入れない理由を書いています（R-09）。

論題 18 のうち、単元が受け持つもの 18、すべての単元に通る軸が受け持つもの 0、入れないもの 0。

## 数論

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-01 | 第 1 問題：リーマン予想（未解決。ミレニアム懸賞問題と重なる） | N-048 素数の分布（ゼータ関数とディリクレ級数）、N-058 解析的整数論、D-037 特殊関数（ガンマ関数、ベータ関数、ゼータ関数） | FR031、FR032 |
| T-05 | 第 5 問題：ディオファントス曲線の高さの評価（未解決。判定可能かどうかも分かっていない） | N-057 数体上の楕円曲線（モーデル–ヴェイユの定理、セルマー群、ヘーグナー点とグロス–ザギエ・コリヴァギンの定理）、N-069 高さの理論とファルティングスの定理（モーデル予想）、N-067 超越数論（ゲルフォント–シュナイダーの定理とベイカーの理論） | FR031、FR032 |

## 幾何

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-02 | 第 2 問題：ポアンカレ予想（解決：ペレルマン） | T-019 ホモトピーと基本群、T-045 リッチ流と幾何化予想、T-050 微分位相（横断性、モース理論、コボルディズムとポントリャーギン–トム構成、h 同境と手術） | FR031、FR032、FR048 |

## 計算

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-03 | 第 3 問題：P=NP か（未解決。ミレニアム懸賞問題と重なる） | K-041 計算課題の難しさによる分類、P 対 NP 問題、乱択の力、K-028 アルゴリズムの設計と解析（下界と NP 完全性）、L-026 計算可能性（停止問題、ライスの定理、ディオファントス集合と MRDP の定理）、K-172 代数的計算量と実数上の計算（BSS 機械、直線プログラム） | FR031、FR032 |
| T-04 | 第 4 問題：1 変数多項式の整数零点（未解決） | A-026 多項式（剰余の定理、因数定理、解と係数の関係）、K-041 計算課題の難しさによる分類、P 対 NP 問題、乱択の力、K-172 代数的計算量と実数上の計算（BSS 機械、直線プログラム） | FR031、FR032 |
| T-07 | 第 7 問題：球面上の点の分布（未解決） | D-033 平面の調和関数、D-017 重積分（累次積分、変数変換、ガンマ関数とベータ関数）、K-041 計算課題の難しさによる分類、P 対 NP 問題、乱択の力、K-168 数値代数幾何（ニュートン法の α 理論、ホモトピー連続法、条件数、BKK による根の数え上げ）、D-088 ポテンシャル論と平衡測度（対数ポテンシャル、フェケテ点） | FR031、FR032 |
| T-09 | 第 9 問題：線形計画問題を強多項式時間で解けるか（未解決。各行か各列の非零成分が 2 個以下の場合は解決） | K-010 ラグランジュ法と双対性、線形計画法（単体法、内点法と楕円体法）、K-009 凸最適化の基礎、K-041 計算課題の難しさによる分類、P 対 NP 問題、乱択の力、K-172 代数的計算量と実数上の計算（BSS 機械、直線プログラム） | FR031、FR032、FR036 |
| T-17 | 第 17 問題：多項式方程式の近似解を平均多項式時間で求める（解決：ベルトラン–パルド、ビュルギッサー–クッカー、レレ） | T-030 アフィン多様体と射影多様体、K-002 常微分方程式の数値解法、K-041 計算課題の難しさによる分類、P 対 NP 問題、乱択の力、S-003 連続確率変数と同時分布、K-168 数値代数幾何（ニュートン法の α 理論、ホモトピー連続法、条件数、BKK による根の数え上げ）、K-172 代数的計算量と実数上の計算（BSS 機械、直線プログラム） | FR031、FR032、FR042、FR043、FR044 |
| T-18 | 第 18 問題：知能の限界（問いが曖昧な研究計画） | L-026 計算可能性（停止問題、ライスの定理、ディオファントス集合と MRDP の定理）、K-041 計算課題の難しさによる分類、P 対 NP 問題、乱択の力、S-025 統計的学習理論、L-034 ゲーデルの不完全性定理とペアノ算術、K-172 代数的計算量と実数上の計算（BSS 機械、直線プログラム） | FR031、FR032 |

## 力学系

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-06 | 第 6 問題：天体力学の相対平衡の個数の有限性（一部解決：4 体はハンプトン–メッケル、平面の 5 体はアルブイ–カロシンが例外を除いて有限、例外の一部は計算機援用） | P-009 万有引力と惑星の運動（ケプラーの法則、万有引力の位置エネルギー、楕円軌道のエネルギー）、P-018 ハミルトン形式（相空間、正準方程式、ルジャンドル変換、ポアソン括弧、リウヴィルの定理）、D-053 力学系の基礎（軌道、線形化、リアプノフ安定性）、K-120 精度保証付き数値計算（区間演算）、K-168 数値代数幾何（ニュートン法の α 理論、ホモトピー連続法、条件数、BKK による根の数え上げ） | FR031、FR032、FR033、FR034、FR035 |
| T-08 | 第 8 問題：経済理論への力学の導入（問いが曖昧な研究計画） | D-053 力学系の基礎（軌道、線形化、リアプノフ安定性）、D-027 ブラウワーの不動点定理と写像度、F-012 ミクロ経済学（消費者行動、費用と供給、市場均衡と余剰）、F-024 ゲーム理論（ナッシュ均衡、展開形ゲーム、オークション、情報の非対称性）、F-058 一般均衡理論（ワルラス均衡の存在、厚生経済学の基本定理、超過需要） | FR031、FR032 |
| T-10 | 第 10 問題：閉包補題（一部解決：C^1 はピュー、閉曲面のハミルトン微分同相の C^∞ は浅岡–入江が埋め込み接触ホモロジーで示した） | D-073 双曲力学系と構造安定性、閉包補題とジェネリックな性質、T-041 シンプレクティック幾何（ダルブーの定理と運動量写像）、T-014 可微分多様体、T-052 擬正則曲線とフレアー理論（グロモフ–ウィッテン、深谷圏、埋め込み接触ホモロジー） | FR031、FR032、FR037 |
| T-11 | 第 11 問題：1 次元の力学系は一般に双曲的か（一部解決：実の場合はコズロフスキー–シェン–ファン・ストリーン、複素の場合は未解決） | D-073 双曲力学系と構造安定性、閉包補題とジェネリックな性質、D-074 複素力学系（ジュリア集合とマンデルブロ集合） | FR031、FR032、FR038 |
| T-12 | 第 12 問題：微分同相の中心化群（一部解決：C^1 位相の生成的な場合はボナッティ–クロヴィジエ–ウィルキンソン） | D-073 双曲力学系と構造安定性、閉包補題とジェネリックな性質、D-063 ベールのカテゴリー定理と一様有界性原理・閉グラフ定理、T-014 可微分多様体 | FR031、FR032、FR039 |
| T-13 | 第 13 問題：ヒルベルトの第 16 問題（未解決。極限周期の個数の一様な上界は主張・査読前） | D-054 平面の周期軌道と分岐、T-032 2 次曲線、平面 3 次曲線、2 次曲面 | FR031、FR032、FR003 |
| T-14 | 第 14 問題：ローレンツ・アトラクタ（解決：タッカーが区間演算による厳密な常微分方程式の解法で示した） | D-055 カオス、D-073 双曲力学系と構造安定性、閉包補題とジェネリックな性質、K-120 精度保証付き数値計算（区間演算） | FR031、FR032、FR040 |

## 解析

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-15 | 第 15 問題：ナヴィエ–ストークス方程式（未解決。ミレニアム懸賞問題と重なる） | E-031 連続体の保存方程式、粘性流のナビエ・ストークス方程式、潤滑理論、P-014 流体力学（オイラー方程式とナビエ＝ストークス方程式、渦度、ポテンシャル流と複素速度ポテンシャル、レイノルズ数と粘性流、乱流の入口、水波、不安定性）、D-025 ソボレフ空間、D-057 偏微分方程式の基礎（適切性、コーシー–コワレフスカヤの定理）、D-090 ナヴィエ–ストークス方程式の数学的理論（ルレイの弱解、部分正則性、爆発） | FR031、FR032 |

## 代数

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-16 | 第 16 問題：ヤコビアン予想（解決：否定的。3 次元以上の反例は 2026-07 の発表で査読前だが、第三者が Isabelle で形式検証した。2 次元は未解決） | D-014 多変数関数の微分（全微分、連鎖律、ヤコビ行列、極値と条件付き極値、ラグランジュの未定乗数法の計算）、D-015 逆関数定理と陰関数定理、条件付き極値、A-026 多項式（剰余の定理、因数定理、解と係数の関係）、L-036 定理証明支援系と形式証明 | FR031、FR032、FR041 |

## 出典

| 記号 | 題名 | URL | 取得日 |
|---|---|---|---|
| FR003 | OpenAI, OpenAI Math Release（manuscripts and Lean artifacts） | https://github.com/openai/math | 2026-11-07 |
| FR031 | S. Smale, Mathematical Problems for the Next Century（Second Version、Passau 大学の掲載） | https://www.fim.uni-passau.de/fileadmin/dokumente/fakultaeten/fim/lehrstuhl/muller/SmaleProblems1998.pdf | 2026-11-07 |
| FR032 | E. W. Weisstein（MathWorld）, Smale's Problems | https://mathworld.wolfram.com/SmalesProblems.html | 2026-11-07 |
| FR033 | M. Hampton, R. Moeckel, Finiteness of relative equilibria of the four-body problem（Invent. Math. 163 (2006)） | https://experts.umn.edu/en/publications/finiteness-of-relative-equilibria-of-the-four-body-problem/ | 2026-11-07 |
| FR034 | A. Albouy, V. Kaloshin, Finiteness of central configurations of five bodies in the plane（Ann. of Math. 176 (2012)） | https://annals.math.princeton.edu/2012/176-1/p10 | 2026-11-07 |
| FR035 | M. Moczurad, P. Zgliczyński, Central Configurations with Unequal Masses: Finiteness in Several Exceptional Cases of Five Bodies | https://arxiv.org/abs/2601.01165 | 2026-11-07 |
| FR036 | D. Dadush, Z. K. Koh, B. Natura, N. Olver, L. A. Végh, A Strongly Polynomial Algorithm for Linear Programs with at Most Two Non-Zero Entries per Row or Column (Invited Talk) | https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.STACS.2025.2 | 2026-11-07 |
| FR037 | M. Asaoka, K. Irie, A C^∞ closing lemma for Hamiltonian diffeomorphisms of closed surfaces | https://arxiv.org/abs/1512.06336 | 2026-11-07 |
| FR038 | O. Kozlovski, W. Shen, S. van Strien, Density of hyperbolicity in dimension one（Ann. of Math. 166 (2007)） | https://annals.math.princeton.edu/2007/166-1/p04 | 2026-11-07 |
| FR039 | C. Bonatti, S. Crovisier, A. Wilkinson, The C^1 generic diffeomorphism has trivial centralizer（Publ. Math. IHÉS 109 (2009)） | https://geodesic.mathdoc.fr/item/PMIHES_2009__109__185_0/ | 2026-11-07 |
| FR040 | W. Tucker, A Rigorous ODE Solver and Smale's 14th Problem（Found. Comput. Math. 2 (2002)） | https://research.monash.edu/en/publications/a-rigorous-ode-solver-and-smales-14th-problem/ | 2026-11-07 |
| FR041 | A. F. Ramos, D. B. Hulak, R. J. G. B. de Queiroz（Archive of Formal Proofs）, Formal Verification of an Explicit Counterexample to the Jacobian Conjecture | https://isa-afp.org/entries/Jacobian_Counterexample.html | 2026-11-07 |
| FR042 | C. Beltrán, L. M. Pardo, Smale's 17th problem: Average polynomial time to compute affine and projective solutions（J. Amer. Math. Soc. 22 (2009)） | https://www.ams.org/jams/2009-22-02/S0894-0347-08-00630-9/ | 2026-11-07 |
| FR043 | P. Bürgisser, F. Cucker, On a Problem Posed by Steve Smale（Ann. of Math. 174 (2011)） | https://arxiv.org/abs/0909.2114 | 2026-11-07 |
| FR044 | P. Lairez, A deterministic algorithm to compute approximate roots of polynomial systems in polynomial average time（Found. Comput. Math. 17 (2017)） | https://arxiv.org/abs/1507.05485 | 2026-11-07 |
| FR048 | Clay Mathematics Institute, Poincaré Conjecture | https://www.claymath.org/millennium/poincare-conjecture/ | 2026-11-07 |
