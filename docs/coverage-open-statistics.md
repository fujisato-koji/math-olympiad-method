# 網羅表：統計学の大きな未解決問題（因果推論、再現性、過剰パラメータのモデルの汎化など）

この頁は `tools/roadmap.py build` が `coverage-open-statistics.yaml` から作ります。手で直さないでください。
統計学の大きな未解決問題（因果推論、再現性、過剰パラメータのモデルの汎化など）に要る論題ごとに、受け持つ単元か、入れない理由を書いています（R-09）。

範囲の根拠：NSF 向けの報告 "Statistics at a Crossroads: Who Is For the Challenge?"（2019）と、ASA・RSS など 6 団体の "Statistics and Science: A Report of the London Workshop on the Future of the Statistical Sciences"（2014）が挙げた課題、ASA の p 値に関する声明（2016）。

論題 6 のうち、単元が受け持つもの 6、すべての単元に通る軸が受け持つもの 0、入れないもの 0。

## 推測の基礎

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-01 | ベーレンス–フィッシャー問題：分散の違う 2 つの正規母集団の平均の差を検定する（未解決（限定付き）。完全十分統計量に基づく正確な検定はないと示され（リンニク）、近似の解が使われる） | S-019 仮説検定、S-021 尤度理論と漸近理論、S-033 十分統計量と不偏推定（指数型分布族、完備性、ラオ–ブラックウェルの定理、フィッシャー情報量とクラメール–ラオの不等式） | OP145 |
| T-05 | データ駆動の時代の推論の枠組み：データを見てモデルを選んだ後で、どう正しく推論するか（未解決） | S-021 尤度理論と漸近理論、S-040 多重検定と偽発見率（族ごとの誤り率、ベンジャミニ–ホッホベルク法）、K-048 統計的推論からみた機械学習（表現、汎化、モデル選択、正則化） | OP140 |

## 因果

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-02 | 観察データからの因果推論：無作為化できないとき、原因と結果をどう見分けるか（一部解決。自然実験の方法で 2021 年のノーベル経済学賞。測っていない交絡には一般の解がない） | S-042 因果推論（潜在結果、交絡、無作為化、操作変数、差の差）、S-031 標本調査、観察研究と実験計画、F-033 計量経済学（回帰と内生性、操作変数、パネルデータ、一般化モーメント法） | OP140、OP148 |

## 再現性

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-03 | 再現性の危機と p 値：研究の結果がくり返し確かめられないのはなぜか、どう推論すべきか（未決着。2014 年の報告は再現性の危機を最初の課題に挙げ、ASA は 2016 年に p 値の誤用を戒める 6 原則を出した） | S-019 仮説検定、S-040 多重検定と偽発見率（族ごとの誤り率、ベンジャミニ–ホッホベルク法）、S-022 ベイズ推論と統計的決定理論、能動学習と逐次の実験計画 | OP141、OP142 |

## 学習の理論

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-04 | 過剰パラメータのモデルの汎化：データより多いパラメータの深層網はなぜ当たるのか（一部解決。二重降下（2019）は線形モデルなどで定量的に説明されたが、深層網の一般の理論はない） | K-052 深層学習の幾何と不変性、高次元の学習理論と汎化、K-048 統計的推論からみた機械学習（表現、汎化、モデル選択、正則化）、S-025 統計的学習理論 | OP140、OP143、OP144 |
| T-06 | 分布によらない不確かさの定量化：AI の予測の幅を、分布を仮定せずに保証できるか（一部解決。コンフォーマル予測で平均の被覆は保証されるが、条件付きの被覆は仮定なしには不可能と示された） | K-154 分布によらない不確かさの定量化（コンフォーマル予測、較正、分布が移るときの被覆、条件付き被覆の限界）、S-024 ノンパラメトリック推論とモンテカルロ法、S-034 ブートストラップ（再標本化による標準誤差と信頼区間、ジャックナイフ） | OP146、OP147 |

## 出典

| 記号 | 題名 | URL | 取得日 |
|---|---|---|---|
| OP140 | X. He, D. Madigan, B. Yu, J. Wellner, Statistics at a Crossroads: Who Is For the Challenge?（NSF 向けの報告 2019、arXiv 2025） | https://arxiv.org/abs/2503.22945 | 2026-11-08 |
| OP141 | Statistics and Science: A Report of the London Workshop on the Future of the Statistical Sciences（ASA・RSS ほか 6 団体、2014） | https://niss.org/sites/default/files/static_page_attachments/Statistics%26Science-TheLondonWorkshopReport.pdf | 2026-11-08 |
| OP142 | American Statistical Association, ASA Statement on Statistical Significance and P-Values（2016、Am. Stat. 70, 129） | https://www.amstat.org/asa/files/pdfs/p-valuestatement.pdf | 2026-11-08 |
| OP143 | M. Belkin, D. Hsu, S. Ma, S. Mandal, Reconciling modern machine-learning practice and the classical bias–variance trade-off（PNAS 116, 15849 (2019)） | https://arxiv.org/abs/1812.11118 | 2026-11-08 |
| OP144 | T. Hastie, A. Montanari, S. Rosset, R. J. Tibshirani, Surprises in High-Dimensional Ridgeless Least Squares Interpolation | https://arxiv.org/abs/1903.08560 | 2026-11-08 |
| OP145 | Wang, Jia, Te Test（ベーレンス–フィッシャー問題、リンニクの結果の要約を含む、査読前） | https://arxiv.org/abs/2210.16473 | 2026-11-08 |
| OP146 | A. N. Angelopoulos, S. Bates, A Gentle Introduction to Conformal Prediction and Distribution-Free Uncertainty Quantification | https://arxiv.org/abs/2107.07511 | 2026-11-08 |
| OP147 | R. F. Barber, E. J. Candès, A. Ramdas, R. J. Tibshirani, The limits of distribution-free conditional predictive inference | https://arxiv.org/abs/1903.04684 | 2026-11-08 |
| OP148 | Royal Swedish Academy of Sciences, The Prize in Economic Sciences 2021（2021-10-11） | https://www.kva.se/en/news/ekonomipriset-2021-2/ | 2026-11-08 |
