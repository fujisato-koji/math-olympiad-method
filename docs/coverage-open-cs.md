# 網羅表：計算機科学の大きな未解決問題（P 対 NP、行列の積、量子計算など）

この頁は `tools/roadmap.py build` が `coverage-open-cs.yaml` から作ります。手で直さないでください。
計算機科学の大きな未解決問題（P 対 NP、行列の積、量子計算など）に要る論題ごとに、受け持つ単元か、入れない理由を書いています（R-09）。

範囲の根拠：クレイ数学研究所の P vs NP、Wigderson "Mathematics and Computation"（2019、プリンストン大学出版局。著者の公開版は取れず、arXiv の 1 章で確かめた）の未解決問題と、各問題の論文（arXiv）。P 対 NP はミレニアム懸賞問題の目標と重なる。

論題 7 のうち、単元が受け持つもの 7、すべての単元に通る軸が受け持つもの 0、入れないもの 0。

## 計算量

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-01 | P 対 NP：答えを速く確かめられる問題は、速く解けるか（未解決。ミレニアム懸賞問題） | K-041 計算課題の難しさによる分類、P 対 NP 問題、乱択の力、K-028 アルゴリズムの設計と解析（下界と NP 完全性）、K-121 ブール関数と回路計算量、K-150 PCP 定理と近似の困難さ（ユニークゲーム予想、硬さの増幅） | OP130 |
| T-02 | 乱択の力：乱数を使うと本質的に速く解ける問題はあるか（BPP = P か）（未解決） | K-041 計算課題の難しさによる分類、P 対 NP 問題、乱択の力、K-150 PCP 定理と近似の困難さ（ユニークゲーム予想、硬さの増幅）、K-121 ブール関数と回路計算量 | OP131 |

## 代数的計算量

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-03 | 代数的な計算の難しさ：永久式は行列式のように小さな式で計算できるか（VP 対 VNP）（未解決） | K-172 代数的計算量と実数上の計算（VP と VNP、行列の積の指数、BSS 機械、直線プログラム）、K-121 ブール関数と回路計算量 | OP131 |
| T-04 | 行列の積の計算量：n × n の行列の積は n^2 に近い手間でできるか（ω = 2 か）（一部解決。2024 年に ω < 2.371339、2026 年に AI による探索を使って ω < 2.371177 と主張（査読前）） | K-172 代数的計算量と実数上の計算（VP と VNP、行列の積の指数、BSS 機械、直線プログラム）、K-024 分割統治と動的計画法、M-011 多重線形代数（テンソル積、外積） | OP132、OP133 |

## アルゴリズム

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-05 | グラフ同型問題：2 つのグラフが同じ形かを多項式時間で判定できるか（一部解決。バーバイの準多項式時間の方法（2015〜2017）。多項式時間か NP 完全かは未解決） | K-153 群論的アルゴリズムとグラフ同型（置換群のアルゴリズム、ワイスファイラー–レーマン法、ルクスの方法、バーバイの準多項式時間の方法）、R-003 群作用、K-026 グラフアルゴリズムと最短経路（ネットワークフロー、計算幾何） | OP134、OP135 |

## 近似の難しさ

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-06 | ユニークゲーム予想：多くの最適化問題で、いまの近似の精度が限界か（一部解決。2-to-2 ゲームの定理（2018、Annals 2023）が示された。予想そのものは未解決） | K-150 PCP 定理と近似の困難さ（ユニークゲーム予想、硬さの増幅）、K-028 アルゴリズムの設計と解析（下界と NP 完全性） | OP136、OP137 |

## 量子計算

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-07 | 量子計算の力：量子計算機は古典の計算機より本質的に速いか（BQP 対 BPP）（未解決。誤り訂正で論理誤りが閾値より下がることは 2024 年に実証された） | K-176 量子アルゴリズム（量子フーリエ変換、位相推定、ショアの算法、グローバーの探索と振幅増幅、隠れ部分群問題）、K-166 量子誤り訂正と耐故障量子計算（安定化子符号と CSS 符号、表面符号と量子 LDPC 符号、復号、閾値定理、もつれの蒸留）、P-087 量子情報の入口（量子ビット、複製不可能定理、量子計算）、K-041 計算課題の難しさによる分類、P 対 NP 問題、乱択の力 | OP138、OP139 |

## 出典

| 記号 | 題名 | URL | 取得日 |
|---|---|---|---|
| OP130 | Clay Mathematics Institute, P vs NP | https://www.claymath.org/millennium/p-vs-np/ | 2026-11-08 |
| OP131 | A. Wigderson, Mathematics and Computation（の 1 章、arXiv 2017。書籍は Princeton University Press 2019、著者の公開版は 403 で取れなかった） | https://arxiv.org/abs/1710.09780 | 2026-11-08 |
| OP132 | J. Alman, R. Duan, V. Vassilevska Williams, Y. Xu, Z. Xu, R. Zhou, More Asymmetry Yields Faster Matrix Multiplication（SODA 2025） | https://arxiv.org/abs/2404.16349 | 2026-11-08 |
| OP133 | E. Dupont ほか, Improving the matrix multiplication exponent with modern optimization and AlphaEvolve（2026-08、査読前） | https://arxiv.org/abs/2608.16884 | 2026-11-08 |
| OP134 | L. Babai, Graph Isomorphism in Quasipolynomial Time | https://arxiv.org/abs/1512.03547 | 2026-11-08 |
| OP135 | M. Grohe, D. Neuen, Recent Advances on the Graph Isomorphism Problem | https://arxiv.org/abs/2011.01366 | 2026-11-08 |
| OP136 | S. Khot, D. Minzer, M. Safra, Pseudorandom sets in Grassmann graph have near-perfect expansion（Ann. of Math. 198 (2023)） | https://annals.math.princeton.edu/2023/198-1/p01 | 2026-11-08 |
| OP137 | D. Ellis, G. Kindler, N. Lifshitz, An analogue of Bonami's Lemma for functions on spaces of linear maps, and 2-2 Games | https://arxiv.org/abs/2209.04243 | 2026-11-08 |
| OP138 | Google Quantum AI and Collaborators, Quantum error correction below the surface code threshold（Nature 638, 920 (2025)） | https://arxiv.org/abs/2408.13687 | 2026-11-08 |
| OP139 | S. Aaronson, L. Chen, Complexity-Theoretic Foundations of Quantum Supremacy Experiments | https://arxiv.org/abs/1612.05903 | 2026-11-08 |
