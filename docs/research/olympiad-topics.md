# 数学オリンピックの論題一覧（JMO と IMO に照らすための一覧）

- 作成日：2026-11-07
- 目的：小学 1 年〜IMO の学習の地図が、JMO と IMO に要る内容を網羅しているかを照らすこと
- 作り方：公開されている資料（末尾の出典の表）の章立てや範囲の記述を突き合わせ、重なりを除いてまとめた。どの資料にも出てこない論題は入れていない。学校の学習指導要領は照らしの対象にしていない

## 凡例

- **論題の番号**：A＝代数、C＝組合せ、G＝幾何、N＝整数、P＝論法と証明。分け方は IMO の候補問題の 4 分類（A、C、G、N。出典 12）に、論法と証明を足したもの
- **出典の番号**：末尾の出典の表の番号
- **目安の段**：
  - 「JMO（語）」＝出典 1 の「主たる出題分野」の語にあたる論題。括弧の中はその語。出典 1 と 2 は予選と本選で分野を分けていないため、どちらで要り始めるかは書けない
  - 「JMO 本選」＝出典 1 と 2 の試験の形（予選は答えだけ、本選は証明を書く）から言えるもの
  - 「IMO 必須／有用／上級／不要」＝出典 4 の分類（Required、Useful for solution、Advanced topic、Not required）
  - 「範囲外 [n]」＝出典 n が範囲外とするもの
  - 空欄＝段を示す資料がない
- **前提として要る学校の内容**：作成者の対応付け。資料が学校の内容の名前を直接挙げているのは出典 4（複素数、三角関数）と出典 10（NCERT 8〜10 年の内容、三角法、座標、ベクトルなど）だけ。それ以外は作成者の判断で、資料の記述ではない

## 1. 代数（20 件）

| 論題（日本語） | 英語名 | 挙げている出典の番号 | 目安の段 | 前提として要る学校の内容 |
|---|---|---|---|---|
| A01 式の変形と方程式（因数分解・展開、恒等式、連立方程式、指数法則） | Elementary algebraic manipulation; identities; systems of linear equations; theory of indices | 1, 2, 4, 5, 10 | JMO（恒等式、方程式）; IMO 必須 | 文字式、因数分解、連立方程式、指数法則 |
| A02 総和・総積の記号と和の変形（和の順序の入れ替え） | Σ and Π notation; manipulating sums | 4, 5, 8 | IMO 必須 | 数列の和と Σ 記号 |
| A03 数列（等差・等比・調和数列） | Sequences; progressions (AP, GP, HP) | 1, 9, 10 | JMO（数列） | 数列（等差数列、等比数列） |
| A04 二項定理と二項係数の性質 | Binomial theorem; properties of binomial coefficients | 10 |  | 二項定理、組合せの数 |
| A05 1 変数の多項式（解と係数の関係、代数学の基本定理、方程式論） | Polynomials in one variable; Vieta's relations; fundamental theorem of algebra; theory of equations | 4, 5, 9, 10 | IMO 必須 | 剰余の定理と因数定理、解と係数の関係、複素数と 2 次方程式 |
| A06 多変数の多項式と対称式（ニュートンの公式、対称式の基本定理） | Polynomials in two or more variables; symmetric polynomials; Newton sums | 4, 5, 10 | IMO 必須 | 式と証明（対称式）、解と係数の関係 |
| A07 多項式の発展（ラグランジュ補間、根の大きさの評価、微分の利用） | Lagrange interpolation; size arguments; differentiation of polynomials | 5 |  | 多項式の割り算、導関数 |
| A08 多項式の既約性 | Irreducible polynomials | 5 |  | 複素数の絶対値、合同式 |
| A09 複素数と三角関数、1 の累乗根 | Complex numbers and trigonometric functions; roots of unity | 4, 5, 10 | IMO 必須 | 複素数平面（極形式、ド・モアブルの定理）、三角関数（加法定理） |
| A10 母関数 | Generating functions (incl. snake oil method) | 4, 5, 8 | IMO 上級 | 数列、等比数列の和、二項定理 |
| A11 関数方程式の基本（代入、単射・全射の利用、コーシーの関数方程式） | Functional equations; Cauchy's functional equation | 4, 5, 6, 8, 9, 10 | IMO 必須（コーシーの関数方程式） | 関数の概念 |
| A12 病的な解をもつ関数方程式（「モンスター」） | Monster (pathological) functional equations | 5, 6, 8 |  | ベクトルの 1 次独立（出典 6 は線形代数の用語で説明する） |
| A13 不等式の基本（相加相乗平均、コーシー・シュワルツ、斉次化） | AM-GM; Cauchy(-Schwarz); homogenization | 1, 4, 5, 6, 8, 9, 10 | JMO（不等式）; IMO 必須 | 式と証明（相加平均と相乗平均、不等式の証明） |
| A14 ヘルダーの不等式と重み付きべき平均 | Hölder's inequality; weighted power mean | 4, 5, 6 | IMO 上級（ヘルダー） | 有理数の指数 |
| A15 ミュアヘッドの不等式 | Muirhead's inequality | 6 |  | 式と証明、対称式 |
| A16 シューアの不等式 | Schur's inequality | 6 |  | 式と証明 |
| A17 置き換えによる不等式（積が 1 の条件、ラヴィ置換、根号と分数の除去） | Substitutions: product-1 case, Ravi substitution, eliminating radicals and fractions | 6 |  | 三角形の成立条件 |
| A18 イェンセン、カラマタと接線の技法 | Jensen; Karamata; tangent line trick | 4, 5, 6 | IMO 上級（イェンセン） | 接線、関数の凹凸（第 2 次導関数） |
| A19 SOS 法 | SOS (sum of squares) method | 8 |  | 平方完成、式と証明 |
| A20 微積分（ラグランジュの未定乗数法を含む） | Calculus in one or more variables; Lagrange multipliers | 4, 5, 8 | IMO 上級 [4]; 範囲外 [2][11] | 微分、積分 |

## 2. 組合せ（16 件）

| 論題（日本語） | 英語名 | 挙げている出典の番号 | 目安の段 | 前提として要る学校の内容 |
|---|---|---|---|---|
| C01 数え上げの基本（積の法則、順列・組合せ、全単射） | Basic counting; enumerative combinatorics; bijections | 1, 4, 5, 9, 10 | JMO（数え上げ、場合の数）; IMO 必須 | 場合の数（順列、組合せ） |
| C02 漸化式と再帰 | Recursion and recurrence relations | 4, 5, 10 | IMO 必須 | 数列の漸化式 |
| C03 二重数え上げと大域的な議論（握手補題） | Double counting; handshake lemma; global arguments | 5, 6 |  | 場合の数、Σ 記号 |
| C04 確率と期待値の線形性（マルコフ連鎖を含む） | Elementary probability; expected value and linearity of expectation; Markov chains | 1, 4, 5, 6, 8 | JMO（確率）; IMO 有用 | 確率、期待値 |
| C05 確率的方法 | Probabilistic method | 8 |  | 確率、期待値 |
| C06 グラフ理論の基本（次数、道・閉路・連結、二部グラフ） | Basic graph theory: degree, paths, cycles, connectedness, bipartite graphs | 1, 4, 5, 6, 10 | JMO（グラフ理論）; IMO 有用 | （特になし） |
| C07 グラフ理論の発展と極値グラフ（ホールの結婚定理、トゥランの定理） | Nontrivial graph theory; extremal graph theory (Hall's marriage lemma, Turán's theorem) | 4, 5 | IMO 上級 | 場合の数、不等式 |
| C08 関数を矢印のグラフとして見る（サイクル分解と反復） | Functions as directed graphs ("arrows"); cycle decomposition; iteration | 5 |  | 関数（写像） |
| C09 盤面・格子の組合せ | Grids | 5 |  | （特になし） |
| C10 凸包と組合せ幾何 | Convex hull; combinatorial geometry | 4, 5 | IMO 有用（凸包） | 平面図形 |
| C11 局所的な調整（小さな摂動、貪欲法） | Local: small perturbations; greedy algorithms | 5, 6 |  | （特になし） |
| C12 構成問題とアルゴリズム（自由度の大きい問題） | Free: constructions; algorithms (incl. IOI-style) | 5, 6 |  | （特になし） |
| C13 固い構造の解析（具体例から構造を決める） | Rigid: characterizing a fixed structure | 5, 6 |  | （特になし） |
| C14 等号の場合を手がかりにする | Equality cases | 5 |  | 不等式 |
| C15 ゲーム | Games | 9 | （深い理論は IMO 不要 [4]） | （特になし） |
| C16 多項式法（組合せ論的零点定理） | Polynomial method; Combinatorial Nullstellensatz | 5 |  | 多項式、因数定理 |

## 3. 幾何（25 件）

| 論題（日本語） | 英語名 | 挙げている出典の番号 | 目安の段 | 前提として要る学校の内容 |
|---|---|---|---|---|
| G01 合同・相似と三角形・多角形の基本性質 | Congruence; similar triangles; properties of triangles, quadrilaterals and polygons | 1, 4, 10 | JMO（合同と相似、三角形）; IMO 必須（相似） | 合同、相似、三平方の定理 |
| G02 角度の追跡と円に内接する四角形（有向角を含む） | Angle chasing; cyclic quadrilaterals; directed angles | 1, 4, 5, 7, 8, 10 | JMO（円）; IMO 必須 | 円周角の定理、円に内接する四角形 |
| G03 方べきの定理と根軸・根心 | Power of a point; radical axis and radical center | 4, 5, 7 | JMO（円）; IMO 必須 | 方べきの定理、円の接線 |
| G04 方べきの差の線形性と共軸の補題 | Linearity of the power of a point; coaxiality lemma | 5 |  | 座標、1 次関数 |
| G05 三角形の五心と九点円（傍心を含む） | Incenter, centroid, orthocenter, circumcenter, excenters; nine-point circle | 4, 7 | JMO（三角形）; IMO 必須 | 三角形の五心 |
| G06 典型的な配置（内心・傍心の補題、混線内接円、名前の付いた補題） | Assorted configurations; incenter/excenter lemma; mixtilinear incircles; named lemmas | 5, 7, 8 |  | 三角形の五心、円周角の定理 |
| G07 チェバとメネラウスの定理、共点と共線 | Ceva and Menelaus theorems; concurrency and collinearity | 4, 10 | IMO 必須（定理の主張） | チェバの定理、メネラウスの定理 |
| G08 相似拡大（ホモセティ） | Homothety | 4, 5, 7 | IMO 必須 | 相似の位置と相似の中心 |
| G09 三角法（正弦定理・余弦定理、加法定理、倍角・半角） | Trigonometry: law of sines and cosines; compound, multiple and submultiple angles | 3, 4, 5, 10 | IMO 有用 | 三角比、三角関数（加法定理） |
| G10 長さと比の追跡 | Lengths and ratios; chasing lengths with trigonometry | 5, 7 |  | 相似、三角比 |
| G11 計算による幾何 | Computational geometry (AIME-style) | 5, 7 |  | 三角比、座標 |
| G12 座標幾何（直線と円） | Cartesian coordinates; coordinate geometry of lines and circles | 4, 10 | IMO 有用 | 図形と方程式 |
| G13 ベクトル | Vectors | 10 |  | 平面と空間のベクトル |
| G14 複素数による幾何 | Complex numbers in geometry | 4, 5, 7, 8 | IMO 有用 | 複素数平面 |
| G15 重心座標 | Barycentric coordinates | 4, 5, 7, 8 | IMO 有用 | 位置ベクトル、面積比 |
| G16 反転 | Inversion | 4, 5, 7 | IMO 有用 | 方べきの定理、相似 |
| G17 射影幾何（複比、調和点列、極と極線、パスカルの定理、射影変換） | Projective geometry: cross ratio, harmonic bundles, poles and polars, Pascal's theorem, projective transformations | 4, 5, 7 | IMO 有用 | 方べきの定理、メネラウスの定理 |
| G18 回転相似、ミケル点と完全四辺形 | Spiral similarity; Miquel point; complete quadrilateral | 4, 5, 7 | IMO 有用（回転相似） | 相似、複素数平面 |
| G19 円錐曲線 | Conic sections | 4, 5, 10 | IMO 上級 | 2 次曲線（放物線、楕円、双曲線） |
| G20 空間図形 | Solid geometry; 3-D geometry | 1, 10 | JMO（空間図形）; IMO 不要 [4] | 空間図形、空間ベクトル |
| G21 作図（定規とコンパス） | Ruler-and-compass constructions | 5, 10 |  | 作図 |
| G22 図を描くことと図からの見当付け | Constructing diagrams; diagram intuition | 5, 8 |  | 作図 |
| G23 動く点の方法 | Moving points | 5 |  | 1 次関数 |
| G24 ポリズム（ポンスレの閉形定理など） | Porisms (Poncelet, Steiner, etc.) | 5 |  | 円と 2 次曲線 |
| G25 幾何と他分野の融合（幾何の不等式、格子点、多角形の自由度の数え上げ） | Hybrid geometry; geometric inequalities; lattice points; degrees of freedom | 5 |  | 不等式、座標 |

## 4. 整数（17 件）

| 論題（日本語） | 英語名 | 挙げている出典の番号 | 目安の段 | 前提として要る学校の内容 |
|---|---|---|---|---|
| N01 約数・倍数と素数、素因数分解の一意性 | Divisibility; primes; fundamental theorem of arithmetic | 1, 4, 9, 10 | JMO（約数・倍数、素数）; IMO 必須 | 約数と倍数、素因数分解 |
| N02 ユークリッドの互除法、ベズーの補題、1 次不定方程式 ax+by=c | Euclidean algorithm; Bézout's lemma; linear Diophantine equation | 4, 5, 10 | JMO（不定方程式）; IMO 必須 | ユークリッドの互除法、1 次不定方程式 |
| N03 合同式の基本（逆元、1 次合同式） | Modular arithmetic; modular inverses; linear congruences | 1, 4, 5, 10 | JMO（合同式）; IMO 必須 | 整数の割り算と余り |
| N04 中国剰余定理 | Chinese remainder theorem | 4, 8, 10 | IMO 必須 | 合同式 |
| N05 フェルマーの小定理、オイラーの定理とオイラー関数、ウィルソンの定理 | Fermat's little theorem; Euler's theorem and φ; Wilson's theorem | 4, 10 | IMO 必須（フェルマーの小定理） | 合同式、二項定理 |
| N06 位数と原始根 | Orders modulo n; primitive roots | 4, 5, 6, 8 | IMO 必須（位数） | 合同式 |
| N07 素因数の指数 ν_p | Exponents in prime factorizations; p-adic valuation | 4, 5, 6 | IMO 必須 | 素因数分解、指数法則 |
| N08 指数持ち上げの補題（LTE）と aⁿ±1 の形の式 | Lifting the exponent; expressions aⁿ ± 1 | 5, 6 |  | 二項定理、因数分解 |
| N09 2 平方和の定理（フェルマーのクリスマス定理） | Fermat's theorem on sums of two squares | 4, 5, 6, 8 | IMO 有用 | 合同式 |
| N10 不定方程式（剰余と因数分解による解法、ピタゴラス数） | Diophantine equations; Pythagorean triples | 1, 5, 10 | JMO（不定方程式） | 因数分解、合同式 |
| N11 平方剰余と相互法則（ヤコビ記号を含む） | Quadratic residues; quadratic reciprocity; Jacobi symbol | 4, 5, 6 | IMO 上級 | 合同式 |
| N12 ペル方程式 | Pell equations | 6 |  | 無理数、2 次方程式 |
| N13 ヴィエタ・ジャンピング | Vieta jumping | 5, 6 |  | 解と係数の関係 |
| N14 整数の大きさの議論（十分大きい素数を選ぶなど） | Size arguments in number theory | 5 |  | 不等式 |
| N15 整数の構成問題 | Constructions in number theory | 5, 6 |  | （特になし） |
| N16 整数係数の多項式 | Polynomials over the integers | 5 |  | 多項式、合同式 |
| N17 素数の分布の定理の主張（ディリクレの算術級数定理、素数定理） | Statements of Dirichlet's theorem on primes in arithmetic progressions and the prime number theorem | 4 | IMO 有用（ディリクレ）、IMO 上級（素数定理） | （特になし） |

## 5. 論法と証明（8 件）

| 論題（日本語） | 英語名 | 挙げている出典の番号 | 目安の段 | 前提として要る学校の内容 |
|---|---|---|---|---|
| P01 証明の書き方とよくある誤り | Proof writing; common proof mistakes; style | 1, 2, 4, 6, 8 | JMO 本選（証明を書く記述式）; IMO 必須 | 命題と条件、必要条件と十分条件、背理法 |
| P02 集合と写像（単射・全射） | Sets and functions; injectivity and surjectivity | 4, 6 | IMO 必須 | 集合、関数 |
| P03 数学的帰納法 | Principle of mathematical induction | 4, 5, 9 | IMO 必須 | 数学的帰納法 |
| P04 鳩の巣原理 | Pigeonhole (box) principle | 4, 5, 6, 9, 10 | IMO 必須 | （特になし） |
| P05 不変量と単調量（変化する過程の解析） | Invariance principle; monovariants; processes | 5, 9 |  | 偶奇、合同式 |
| P06 極端原理 | Extremal principle | 6, 9 |  | （特になし） |
| P07 塗り分けによる証明 | Coloring proofs | 9 |  | （特になし） |
| P08 「すべて求めよ」「最大値を求めよ」の二部構成（構成と、不可能性・上界の証明） | Two-part problems: construction plus impossibility or bound | 6 |  | （特になし） |

注：出典 1 は「主たる出題分野」に論法の項目を立てていない。P01 の「JMO 本選」は試験の形（本選は証明を求める 5 問の記述式）から言えること。

## 6. 資料に出るが、IMO で不要・範囲外とされるもの（地図に入れるかは別に判断）

| 論題（日本語） | 英語名 | 出典 | 扱い |
|---|---|---|---|
| 行列・行列式と線形代数（組合せへの線形代数の方法を含む） | Matrices, determinants, linear algebra; linear algebra methods (over R and F₂) | 2, 4, 5 | IMO 不要 [4]、行列は範囲外 [2]。ただし出典 5 は組合せの単元（Linear Algebra）として持つ |
| 実解析・複素解析（収束、コンパクト集合） | Real or complex analysis | 4, 5 | IMO 不要 [4]。出典 5 の Analysis、Putnam Analysis、Integration Bee がこれにあたる |
| 抽象代数（群・環・体） | Groups, rings, fields | 4 | IMO 不要 |
| 代数幾何（ヒルベルトの零点定理、ベズーの定理） | Algebraic geometry (Nullstellensatz, Bézout) | 4 | IMO 不要（C16 の組合せ論的零点定理とは別物） |
| フック長公式など高度な数え上げの恒等式 | Advanced enumerative identities (hook-length formula) | 4 | IMO 不要 |
| 大数の法則、マルチンゲール | Nontrivial probability theory | 4 | IMO 不要 |
| ゲーム理論の機構（ナッシュ均衡、スプラーグ・グランディ） | Game-theory machinery (Nash, Sprague-Grundy) | 4 | IMO 不要 |
| 3 次以上の曲線（シャールの定理、ケイリー・バカラックの定理） | Curves of degree > 2 | 4, 8 | IMO 不要 [4]。出典 8 に解説の資料がある |
| 代数的整数論（数体、代数的整数） | Algebraic number theory | 4, 5 | IMO 不要 [4]。出典 5 の Int Polynom が代数的整数に触れる |
| 解析的整数論（L 関数、漸近評価、乗法的関数） | Analytic number theory | 4, 5 | IMO 不要 [4]。出典 5 に Analytic NT の単元がある |
| 統計 | Statistics | 2, 4, 11 | 範囲外 [2][11]、IMO 不要 [4] |
| 数理モデル、理論計算機科学、集合論の公理と論理、数値近似、数学の哲学 | Modelling; theoretical CS; ZFC and logic; numerical approximation; philosophy of mathematics | 4 | IMO 不要 |

## 7. 論題にしなかった単元・章

演習と復習のための単元や、論題を名指さない章は、論題にしなかった。

- 出典 5：C8 Summit、G6 Summit、N7 Summit、Intermediate Mix、Russian Combo、Mystery、Misc NT、Super NT、Ineq Standard、Hard Ineq、Tricky Ineq、Formulas、Courage、Grinding、Duluth、Dummy Unit、Anti Problems。似た単元は 1 つにまとめた（Elem Geo は G02、G03、G08 へ、Config Geo と Classical Geo は G06 へ、Inversion and Spiral は G16 と G18 へ、Super Bary と Super Complex は G15 と G14 へ、Homography と Hyperbola は G17 と G19 へ、Weird Geo は G25 へ）。分類 H（Higher Math、3 単元）は取得していない
- 出典 6：Anti-Problems の章（理論を立てない、「単純に保て」という助言の章）、USA TST の問題の章
- 出典 7：第 11 章 Personal Favorites（演習の章）
- 出典 9：第 14 章 Further Strategies（目次だけでは中身が分からない）。第 6 章 Number Theory と第 12 章 Geometry は章の題だけで、細かい論題には割り当てていない（N01 にだけ番号を付けた）

## 8. 資料どうしで扱いが割れた点

1. **確率**：出典 1 は組合せの分野に「確率」を挙げるが、出典 2 は「確率統計は範囲外」とする。出典 4 は初等の確率を IMO 有用とする
2. **空間図形**：出典 1 と 10 は範囲に入れ、出典 4 は IMO 不要とする
3. **微積分**：出典 2 と 11 は範囲外、出典 4 は IMO 上級（難しい問題で役立つことがある）とする。出典 5 には解析の単元がある
4. **行列と線形代数**：出典 2 は範囲外、出典 4 は IMO 不要とするが、出典 5 は組合せの道具として単元を持つ
5. **三角法と座標の方法**：出典 4 は「有用」で必須ではない（別解があることが多い）とするが、出典 10 は三角法（加法定理、倍角、一般解）と座標幾何を範囲として詳しく挙げ、出典 3 は三角法の問題集を挙げる
6. **円錐曲線**：出典 10 は座標幾何の範囲に入れ、出典 4 は IMO 上級とする
7. **不等式の深さ**：出典 4 の必須は相加相乗とコーシーまでで、ヘルダーとイェンセンは上級。出典 6 はミュアヘッド、シューア、カラマタまで基本の章で扱う
8. **整数で挙げる定理**：出典 10 はウィルソンの定理とオイラー関数を挙げる。出典 4 は位数と ν_p を必須とし、ウィルソンとオイラー関数は名指さない。平方剰余の相互法則は出典 4 で上級
9. **分類の仕方**：鳩の巣、帰納法、漸化式を、出典 4 と 10 は組合せに、出典 9 は分野をまたぐ戦略として扱う。関数方程式を、出典 4 と 10 は代数に、出典 5 は独立の分類 F に置く。出典 12 は A、C、G、N の 4 分類
10. **JMO の予選と本選の区別**：分野を予選と本選で分ける資料はなかった。言えるのは試験の形の違い（予選は答えだけの 12 問、本選は証明を書く 5 問）だけ

## 9. 取得できなかった資料

| 資料 | URL | 結果 |
|---|---|---|
| AoPS の講座の説明（Olympiad Geometry、WOOT、Intermediate Number Theory）と AoPS Wiki | https://artofproblemsolving.com/school/course/olympiad-geometry ほか | HTTP 403 で取得できず。一覧には使っていない |
| シンガポール数学会の SMO の規則（Junior、Senior、Open） | https://sms.math.nus.edu.sg/rules-of-the-smo-senior-section ほか | 接続がリセットされ取得できず |
| 英国 UKMT の出題範囲 | https://bmos.ukmt.org.uk/home/training.shtml | 範囲を示す公開文書は見つからなかった。訓練の頁は合宿で幾何と整数の講義をすると書くだけ |
| EGMO の目次（MAA の PDF、AMS の書店頁） | https://www.maa.org/sites/default/files/pdf/pubs/books/EGMO_TOC.pdf 、https://bookstore.ams.org/PRB/27 | HTTP 403。章の題は出典 7 の解答集で確かめた |
| Engel の書籍（Springer の頁） | https://link.springer.com/book/10.1007/b97682 | 認証へ転送され取得できず。目次は書店の目録（出典 9）で取った |

## 10. 出典

取得日はすべて 2026-11-07。

| 番号 | URL | 発行者 | 題名 | 取得日 | 利用条件 |
|---|---|---|---|---|---|
| 1 | https://www.imojp.org/domestic/jmo_overview.html | 公益財団法人 数学オリンピック財団 | 日本数学オリンピック 概要（主たる出題分野、予選と本選の形。最新更新日 2026-10-07） | 2026-11-07 | 「当サイト内の画像、文章、その他一切の無断転載をお断りします」 |
| 2 | https://www.imojp.org/domestic/jmo_apply.html | 公益財団法人 数学オリンピック財団 | 第 37 回 日本数学オリンピック（JMO）募集要項（前提とする知識、範囲外の分野） | 2026-11-07 | 頁に独自の記載なし。同じサイトの表示（出典 1）では無断転載禁止 |
| 3 | https://www.imojp.org/domestic/jmo_books.html | 公益財団法人 数学オリンピック財団 | JMO 参考書案内 | 2026-11-07 | 同上 |
| 4 | https://web.evanchen.cc/handouts/Syllabus/Syllabus.pdf | Evan Chen | Unofficial syllabus for math olympiads（2023-01-31 版） | 2026-11-07 | 記載なし |
| 5 | https://catalog.evanchen.cc/ （A/、C/、F/、G/、N/、M/ の各頁） | Evan Chen（OTIS） | OTIS Unit Catalog Wiki | 2026-11-07 | 記載なし（公開閲覧、GitHub で寄稿を受け付ける） |
| 6 | https://web.evanchen.cc/textbooks/OTIS-Excerpts.pdf （紹介頁 https://web.evanchen.cc/excerpts.html ） | Evan Chen | The OTIS Excerpts（PDF の更新 2026-08-09、目次を使用） | 2026-11-07 | 「©2019 Evan Chen. All rights reserved. Personal use only.」 |
| 7 | https://web.evanchen.cc/textbooks/AGEST.pdf （章の題）、https://books.google.co.jp/books?id=47UaDAAAQBAJ （3 部の構成の紹介文） | Evan Chen／The Mathematical Association of America（2016） | Euclidean Geometry in Mathematical Olympiads（章の題は解答集 Auto-Generated EGMO Solutions Treasury の章立てから） | 2026-11-07 | 書籍は商業出版物。解答集の利用条件は確認していない |
| 8 | https://web.evanchen.cc/olympiad.html | Evan Chen | Olympiad handouts（解説資料の一覧と各資料の題） | 2026-11-07 | 記載なし |
| 9 | https://www.schweitzer-online.de/en/buch/Engel/Problem-Solving-Strategies/9780387982199/B330380/ | Springer（Problem Books in Mathematics、1998、ISBN 978-0-387-98219-9）。頁は書店 Schweitzer の目録 | Arthur Engel, Problem-Solving Strategies（全 14 章の目次） | 2026-11-07 | 書籍は商業出版物 |
| 10 | https://olympiads.hbcse.tifr.res.in/syllabus/ | Homi Bhabha Centre for Science Education（TIFR） | Syllabus（Mathematical Olympiad の節） | 2026-11-07 | 「© 2026 Olympiads, HBCSE」。ほかの条件の記載なし |
| 11 | https://www.isical.ac.in/~rmo/ | Indian Statistical Institute | Regional Mathematical Olympiad の頁（出題範囲の記述） | 2026-11-07 | 記載なし |
| 12 | https://www.imo-official.org/assets/documents/problems/2024/IMO2024SL.pdf | International Mathematical Olympiad | 65th IMO 2024 Shortlisted Problems with Solutions（A1〜A8、C1〜C8、G1〜G8、N1〜N7 の分類） | 2026-11-07 | サイトの表示は「© International Mathematical Olympiad」 |
