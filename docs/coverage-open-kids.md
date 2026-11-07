# 網羅表：子どもでも主張が分かる未解決問題（コラッツ、ゴールドバッハなど）

この頁は `tools/roadmap.py build` が `coverage-open-kids.yaml` から作ります。手で直さないでください。
子どもでも主張が分かる未解決問題（コラッツ、ゴールドバッハなど）に要る論題ごとに、受け持つ単元か、入れない理由を書いています（R-09）。

論題 20 のうち、単元が受け持つもの 20、すべての単元に通る軸が受け持つもの 0、入れないもの 0。

## 主張

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-01 | ビール予想の主張：A^x + B^y = C^z（x、y、z は 3 以上）が正の整数で成り立てば、A、B、C には共通の素因数がある（未解決、懸賞 100 万ドル） | A-002 □を使った式、A-009 累乗と指数法則、N-018 公約数と公倍数、N-021 素数と素因数分解、素数はいくらでもある（主張） | FR002、FR007、FR006 |
| T-03 | コラッツ予想の主張：偶数なら 2 で割り、奇数なら 3 倍して 1 を足すことをくり返すと、どの正の整数から始めても 1 に着く（未解決、2^71 まで確認） | N-008 偶数と奇数、N-013 かけ算（九九）、N-014 わり算とあまり、A-008 規則性と群数列 | FR001、FR002、FR012 |
| T-05 | ゴールドバッハ予想の主張：4 以上の偶数はどれも 2 つの素数の和で書ける（未解決、4·10^18 まで確認） | N-007 2 けたのたし算とひき算、N-008 偶数と奇数、N-021 素数と素因数分解、素数はいくらでもある（主張） | FR002、FR014 |
| T-07 | 双子素数予想の主張：差が 2 の素数の組は無限にある（未解決） | N-007 2 けたのたし算とひき算、N-021 素数と素因数分解、素数はいくらでもある（主張）、N-030 素数の性質 | FR002、FR013 |
| T-09 | 奇数の完全数の問題の主張：自分以外の約数の和が自分に等しい奇数はあるか（未解決） | N-008 偶数と奇数、N-017 倍数と約数、N-024 約数の個数と和、階乗の素因数の個数（割り算のくり返し） | FR002、FR018 |
| T-11 | ルジャンドル予想の主張：n^2 と (n+1)^2 の間にはいつも素数がある（未解決。十分大きな n で成り立つという証明は主張・査読前） | N-021 素数と素因数分解、素数はいくらでもある（主張）、A-009 累乗と指数法則、N-002 数直線 | FR002、FR013、FR019 |
| T-13 | ハドウィガー–ネルソン問題の主張：距離がちょうど 1 の 2 点が違う色になるように平面を塗るとき、最少で何色いるか（未解決、答えは 5〜7） | C-010 塗り分け、C-012 一筆書きとグラフ、G-005 長さとまわりの長さ、G-010 円とおうぎ形 | FR002、FR020 |
| T-15 | ランダウの第 1 問題の主張：n^2 + 1 の形の素数は無限にある（未解決） | A-009 累乗と指数法則、N-021 素数と素因数分解、素数はいくらでもある（主張）、N-030 素数の性質 | FR013 |

## 攻め方

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-02 | ビール予想の攻め方：楕円曲線の有理点、ダルモン–グランヴィルの定理（指数を固定すれば原始解は有限個）、フライ曲線とガロア表現のモジュラー性、ヒルベルト・モジュラー形式 | N-057 数体上の楕円曲線（モーデル–ヴェイユの定理、セルマー群、ヘーグナー点とグロス–ザギエ・コリヴァギンの定理）、N-069 高さの理論とファルティングスの定理（モーデル予想）、N-062 モジュラー形式、N-065 ガロア表現とモジュラー性 | FR008、FR009 |
| T-04 | コラッツ予想の攻め方：周期軌道と指数型のディオファントス方程式（ベイカーの理論）、写像の反復を実数・複素数・2 進整数へ広げる力学系、2 進整数上のエルゴード性、一般化した写像の決定不能性（コンウェイ）、確率モデルとタオの方法（ほとんどすべての軌道）、大規模な計算 | N-067 超越数論（ゲルフォント–シュナイダーの定理とベイカーの理論）、D-053 力学系の基礎（軌道、線形化、リアプノフ安定性）、D-074 複素力学系（ジュリア集合とマンデルブロ集合）、N-055 p 進数と局所体、S-007 大数の強法則とエルゴード定理、L-026 計算可能性（停止問題、ライスの定理、ディオファントス集合と MRDP の定理）、S-005 離散時間マルコフ連鎖、S-008 特性関数、弱収束、中心極限定理、K-022 計算問題の数理モデル化、代表的なアルゴリズムとデータ構造、性能の測り方 | FR010、FR011、FR012 |
| T-06 | ゴールドバッハ予想の攻め方：素数の分布と L 関数、円周法、ヴィノグラードフの素数上の三角和（三素数の版は解決）、篩法とボンビエリ–ヴィノグラードフの定理（陳の定理）、例外集合の評価 | N-048 素数の分布（ゼータ関数とディリクレ級数）、N-058 解析的整数論、N-064 円周法と指数和、N-063 篩法（セルバーグの篩とボンビエリ–ヴィノグラードフの定理） | FR013、FR015、FR029 |
| T-08 | 双子素数予想の攻め方：算術級数の中の素数の分布（ボンビエリ–ヴィノグラードフの定理と張の強化）、セルバーグの篩とゴールドストン–ピンツ–ユルドゥルムの方法、メイナードの多次元の篩、篩の変種と数値の最適化、篩のパリティ問題（差 246 以下の組が無限にあることまでは解決） | N-058 解析的整数論、N-063 篩法（セルバーグの篩とボンビエリ–ヴィノグラードフの定理）、K-009 凸最適化の基礎 | FR013、FR052、FR053、FR054 |
| T-10 | 奇数の完全数の攻め方：約数の和の関数の乗法性とオイラーの形、素因数分解の大規模な計算（木の方法）、素因数の個数の不等式（あるとすれば 10^1500 より大きい） | N-024 約数の個数と和、階乗の素因数の個数（割り算のくり返し）、N-032 合同式、N-050 素数判定と素因数分解、N-043 整数の大きさの議論 | FR016、FR017、FR018 |
| T-12 | ルジャンドル予想の攻め方：素数定理とリーマン–フォン・マンゴルトの明示公式、零点密度定理と短い区間の素数（ホーハイゼル、インガム）、解析と篩の組み合わせ（ベイカー–ハーマン–ピンツ）、概素数による近似（陳） | N-048 素数の分布（ゼータ関数とディリクレ級数）、N-058 解析的整数論、N-063 篩法（セルバーグの篩とボンビエリ–ヴィノグラードフの定理） | FR013、FR019 |
| T-14 | ハドウィガー–ネルソン問題の攻め方：単位距離グラフの彩色、計算機による有限グラフの探索と 4 色で塗れないことの機械的な確認、節の証明の最小化（5 色で足りないという 2026 年の主張は主張・査読前） | C-023 組合せ幾何、C-032 グラフの固有値と彩色、L-023 命題論理（完全性定理、コンパクト性）、K-028 アルゴリズムの設計と解析（下界と NP 完全性） | FR003、FR020、FR021 |
| T-16 | ランダウの第 1 問題の攻め方：既約な多項式の値への篩法（ラーデマッハー、ブーフシュタープ）、イワニエツの二次多項式の篩（素因数 2 個以下の数）、最大の素因数の評価（フーリー） | N-063 篩法（セルバーグの篩とボンビエリ–ヴィノグラードフの定理）、N-058 解析的整数論、A-036 多項式の発展（補間、根の評価、既約性） | FR013 |

## 検証で足した論題

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| V-01 | 三素数定理の証明の明示的な評価と精度保証付きの計算（区間演算、GRH の数値確認） | K-120 精度保証付き数値計算（区間演算） |  |
| V-02 | タオのコラッツの方法の 2 次元の再生過程 | S-010 再生理論と空間ポアソン過程 |  |
| V-03 | 漸近記法（~、O、o）で書く進展の主張（短い区間の素数、ほとんどすべての軌道） | K-021 漸化式、漸近記法、アルゴリズム解析の初歩 |  |
| V-04 | 主張と証明の形式化（Lean） | L-036 定理証明支援系と形式証明 |  |

## 出典

| 記号 | 題名 | URL | 取得日 |
|---|---|---|---|
| FR001 | T. Tao ほか, erdosproblems: A community database for the problems on the erdosproblems.com site（版 3a73a31、2026-11-06） | https://github.com/teorth/erdosproblems | 2026-11-07 |
| FR002 | The Formal Conjectures Authors（Google DeepMind ほか）, Formal Conjectures | https://github.com/google-deepmind/formal-conjectures | 2026-11-07 |
| FR003 | OpenAI, OpenAI Math Release（manuscripts and Lean artifacts） | https://github.com/openai/math | 2026-11-07 |
| FR006 | American Mathematical Society, Beal Prize Rules and Procedures | https://www.ams.org/profession/prizes-awards/ams-supported/beal-prize-rules | 2026-11-07 |
| FR007 | American Mathematical Society, Beal Conjecture | https://www.ams.org/profession/prizes-awards/ams-supported/beal-conjecture | 2026-11-07 |
| FR008 | M. A. Bennett, I. Chen, S. R. Dahmen, S. Yazdani, Generalized Fermat equations: A miscellany（Int. J. Number Theory 11 (2015)） | https://personal.math.ubc.ca/~bennett/BeChDaYa-IJNT-2015.pdf | 2026-11-07 |
| FR009 | A. Ratcliffe, B. Grechuk, Generalised Fermat equation: a survey of solved cases（Expo. Math. 2025） | https://arxiv.org/abs/2412.11933 | 2026-11-07 |
| FR010 | J. C. Lagarias, The 3x+1 Problem: An Overview | https://arxiv.org/abs/2111.02635 | 2026-11-07 |
| FR011 | T. Tao, Almost all orbits of the Collatz map attain almost bounded values（Forum Math. Pi 10 (2022)） | https://arxiv.org/abs/1909.03562 | 2026-11-07 |
| FR012 | D. Barina, Improved verification limit for the convergence of the Collatz conjecture（J. Supercomputing 81 (2025)） | https://www.fit.vut.cz/research/publication-file/c197809/298514/s11227-025-07337-0.pdf | 2026-11-07 |
| FR013 | J. Pintz, Landau's problems on primes（J. Théor. Nombres Bordeaux 21 (2009)） | https://jtnb.centre-mersenne.org/articles/10.5802/jtnb.676/ | 2026-11-07 |
| FR014 | T. Oliveira e Silva, S. Herzog, S. Pardi, Empirical verification of the even Goldbach conjecture and computation of prime gaps up to 4·10^18（Math. Comp. 83 (2014)） | https://www.ams.org/journals/mcom/2014-83-288/S0025-5718-2013-02787-1 | 2026-11-07 |
| FR015 | H. A. Helfgott, The ternary Goldbach problem | https://arxiv.org/abs/1501.05438 | 2026-11-07 |
| FR016 | P. Ochem, M. Rao, Odd perfect numbers are greater than 10^1500（Math. Comp. 81 (2012)） | https://www.ams.org/mcom/2012-81-279/S0025-5718-2012-02563-4/ | 2026-11-07 |
| FR017 | P. Ochem（LIRMM）, Odd perfect numbers | https://www.lirmm.fr/~ochem/opn/ | 2026-11-07 |
| FR018 | E. W. Weisstein（MathWorld）, Odd Perfect Number | https://mathworld.wolfram.com/OddPerfectNumber.html | 2026-11-07 |
| FR019 | L. A. Ferreira, Real exponential sums over primes and prime gaps（査読前） | https://arxiv.org/abs/2307.08725 | 2026-11-07 |
| FR020 | A. D. N. J. de Grey, The chromatic number of the plane is at least 5 | https://arxiv.org/abs/1804.02385 | 2026-11-07 |
| FR021 | M. J. H. Heule, Computing Small Unit-Distance Graphs with Chromatic Number 5 | https://arxiv.org/abs/1805.12181 | 2026-11-07 |
| FR029 | H. A. Helfgott, The ternary Goldbach conjecture is true | https://arxiv.org/abs/1312.7748 | 2026-11-07 |
| FR052 | Y. Zhang, Bounded gaps between primes（Ann. of Math. 179 (2014)） | https://annals.math.princeton.edu/2014/179-3/p07 | 2026-11-07 |
| FR053 | J. Maynard, Small gaps between primes（Ann. of Math. 181 (2015)） | https://annals.math.princeton.edu/2015/181-1/p07 | 2026-11-07 |
| FR054 | D. H. J. Polymath, Variants of the Selberg sieve, and bounded intervals containing many primes（Res. Math. Sci. 1 (2014)） | https://arxiv.org/abs/1407.4897 | 2026-11-07 |
