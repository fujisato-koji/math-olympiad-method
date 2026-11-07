# 網羅表：James Webb 宇宙望遠鏡の天文学者

この頁は `tools/roadmap.py build` が `coverage-jwst-astronomer.yaml` から作ります。手で直さないでください。
赤外線で見る大きな宇宙望遠鏡で、最初の星と銀河、星の一生、ほかの星をまわる惑星の大気を調べる。に要る論題ごとに、受け持つ単元か、入れない理由を書いています（R-09）。

論題 17 のうち、単元が受け持つもの 14、すべての単元に通る軸が受け持つもの 0、入れないもの 3。

## 物理

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-01 | 天文学・天体物理学・惑星科学（博士の分野） | P-064 膨張宇宙とフリードマン方程式（宇宙原理、FRW 計量とスケール因子、ハッブルの法則、赤方偏移と地平線、宇宙項、放射・物質・暗黒エネルギーの時代、宇宙年齢）、P-068 星の構造と進化・高密度天体（恒星の構造、熱核融合とエネルギー輸送、元素合成、白色矮星・中性子星・ブラックホール、超新星）、P-063 ブラックホール（クルスカル座標と事象の地平面、重力崩壊、ライスナー＝ノルドストロム解とカー解、ペンローズ図、ブラックホール力学の法則、曲がった時空の場の量子論とホーキング効果） | DR027 |
| T-04 | 放射輸送の基礎と観測の技法 | P-131 大気放射（散乱と吸収、放射伝達方程式と加熱率）、P-088 原子の構造とスペクトル（エネルギー準位とスペクトル線、放出と吸収、X 線、励起状態の寿命とスペクトル幅） | DR030、DR031 |
| T-05 | 宇宙の幾何と力学、熱史、CMB、インフレーション、摂動論と構造形成 | P-064 膨張宇宙とフリードマン方程式（宇宙原理、FRW 計量とスケール因子、ハッブルの法則、赤方偏移と地平線、宇宙項、放射・物質・暗黒エネルギーの時代、宇宙年齢）、P-065 熱い宇宙（宇宙マイクロ波背景放射、再結合と光子の脱結合、バリオン光子比、温度の変化、ビッグバン元素合成）、P-066 構造形成（線形の密度ゆらぎ、ジーンズ不安定性、移送関数、ハリソン＝ゼルドビッチ・スペクトル、パワースペクトル、バリオン音響振動、CMB のゆらぎ）、P-067 インフレーションと素粒子の宇宙論（標準宇宙論の問題、インフレーション、バリオン数生成、大統一理論の入口、インフレーションによる初期ゆらぎ） | DR032 |
| T-06 | 一般相対論 | P-059 等価原理と曲がった時空の入口（重力赤方偏移、シュワルツシルト計量、測地線、粒子と光の軌道、シャピロ遅延）、P-060 テンソル解析と微分幾何（多様体、計量テンソル、接続とクリストッフェル記号、共変微分と平行移動、リーマン・リッチ曲率、測地線偏差）、P-061 アインシュタイン方程式とシュワルツシルト解（エネルギー運動量テンソル、ビアンキ恒等式、宇宙項、光の湾曲・近日点移動・シャピロ遅延、バーコフの定理） | DR033 |
| T-07 | 非線形の構造形成、暗黒物質ハロー、銀河の形成（円盤銀河・楕円銀河） | 入れない（地図にない（候補：銀河の形成と進化）） | DR034 |
| T-08 | 星の構造と進化（基礎方程式、エネルギー輸送、ポリトロープ、HR 図、終末） | P-068 星の構造と進化・高密度天体（恒星の構造、熱核融合とエネルギー輸送、元素合成、白色矮星・中性子星・ブラックホール、超新星） | DR035 |
| T-09 | 系外惑星の大気と内部（放射輸送、化学、雲、状態方程式） | 入れない（地図にない（候補：系外惑星科学）） | DR031 |
| T-11 | 理想気体力学と磁気流体力学、衝撃波、爆風、星風と降着、星の振動 | P-014 流体力学（オイラー方程式とナビエ＝ストークス方程式、渦度、ポテンシャル流と複素速度ポテンシャル、レイノルズ数と粘性流、乱流の入口、水波、不安定性）、P-041 プラズマ物理の入口（デバイ遮蔽、プラズマ振動、単一粒子の軌道とドリフト、磁気ミラーと断熱不変量、衝突と拡散、サハの電離平衡）、E-037 圧縮性流れの理論（オイラー方程式、衝撃波の跳び条件、特性曲線） | DR036 |
| T-12 | 超大質量ブラックホール、活動銀河核、降着円盤とアウトフロー | P-063 ブラックホール（クルスカル座標と事象の地平面、重力崩壊、ライスナー＝ノルドストロム解とカー解、ペンローズ図、ブラックホール力学の法則、曲がった時空の場の量子論とホーキング効果） | DR037 |

## 工学

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-02 | 赤外線の観測と望遠鏡の観測モード（撮像、分光、時系列、開口マスク干渉法） | P-028 光学（レーザー、ビーム光学、光共振器、コヒーレンスと干渉計、光学機器）、P-024 光の干渉と回折（ヤングの実験、薄膜、単スリット・二重スリット、回折格子、フラウンホーファー回折、ブラッグ反射）、P-088 原子の構造とスペクトル（エネルギー準位とスペクトル線、放出と吸収、X 線、励起状態の寿命とスペクトル幅）、P-118 実験技術と計測（電子回路と信号処理、計測器、真空と低温、X 線による構造解析、磁気共鳴、放射線の検出と計数統計、レーザーと光の干渉計、次元解析） | DR028、DR029、DR030 |
| T-03 | 望遠鏡の設計・光学の配置・検出器・分光器 | P-023 光の反射・屈折とレンズ（全反射、凸レンズと像、フェルマーの原理とスネルの法則、光学機器と分解能）、P-028 光学（レーザー、ビーム光学、光共振器、コヒーレンスと干渉計、光学機器）、P-096 半導体（電子と正孔、不純物、半導体素子） | DR030 |

## その他

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-10 | 生命居住可能性と生命の兆候 | 入れない（地図にない（候補：生命居住可能性（宇宙生物学））） | DR031 |

## 数学

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-13 | 天文の統計：ベイズ推論、モンテカルロ法、ガウス過程、階層模型、模型選択 | S-022 ベイズ推論と統計的決定理論、S-024 ノンパラメトリック推論とモンテカルロ法、S-021 尤度理論と漸近理論 | DR038 |
| T-14 | 誤差の伝播と最尤・カイ二乗のフィット | P-117 測定と誤差の解析（物理量と単位、有効数字、系統誤差と偶然誤差、誤差の伝播、線形化と直線の当てはめ、グラフと誤差棒）、S-018 点推定と区間推定、S-020 線形モデル | DR014 |
| T-15 | 時系列とスペクトルの解析（周期図、Lomb–Scargle、パワースペクトル） | D-022 フーリエ級数、D-023 フーリエ変換、E-073 フーリエ級数・フーリエ変換・離散フーリエ変換（音と画像の解析）、E-081 DFT の計算と FFT、スペクトル解析と時間周波数解析 | DR014 |

## 計算

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-16 | 主成分分析、クラスタリング、機械学習の概観 | K-062 行列の方法（特異値分解、重み付き最小二乗、主成分分析、行列分解、大規模行列）、K-049 線形・加法モデル、ブースティング、SVM、カーネル法、EM、次元削減、HMM、ベイジアンネットワーク、K-046 最適化の観点からの機械学習（線形・非線形モデルと勾配に基づく方法） | DR014 |
| T-17 | 大きな天文データベースの解析、観測装置のソフトウェア開発と較正 | K-012 計算という考え方と Python（簡単なアルゴリズムとデータ構造）、K-016 プログラミングの基礎（アルゴリズムの技法、データ型、再帰）、K-027 並列と逐次のデータ構造とアルゴリズム | DR027 |

## 出典

| 記号 | 題名 | URL | 取得日 |
|---|---|---|---|
| DR014 | University of Victoria, Physics & Astronomy, PHYS 515: Data Analysis Techniques for Physics and Astronomy（Graduate） | https://www.uvic.ca/science/physics/assets/docs/outlines/2026-27/phys515_202609.pdf | 2026-11-07 |
| DR027 | Space Telescope Science Institute, Scientific Careers | https://www.stsci.edu/scientific-community/scientific-careers | 2026-11-07 |
| DR028 | NASA Science, Webb Science Overview | https://science.nasa.gov/mission/webb/science-overview/ | 2026-11-07 |
| DR029 | Space Telescope Science Institute, JWST User Documentation (JDox) | https://jwst-docs.stsci.edu/ | 2026-11-07 |
| DR030 | University of Arizona, Lunar and Planetary Laboratory, PTYS 521: Observational Planetary Astronomy & Remote Sensing（Graduate elective） | https://lpl.arizona.edu/graduate/courses/ptys-521 | 2026-11-07 |
| DR031 | University of Cambridge, Extrasolar Planets: Atmospheres and Interiors, N. Madhusudhan | https://www.maths.cam.ac.uk/postgrad/part-iii/files/GtC/Astrophysics/Extrasolar_Planets_Madhusudhan.pdf | 2026-11-07 |
| DR032 | University of Cambridge, Cosmology (M24), E. Pajer | https://www.maths.cam.ac.uk/postgrad/part-iii/files/GtC/Relativity%20and%20Cosmology/Cosmology_26-27.pdf | 2026-11-07 |
| DR033 | University of Cambridge, General Relativity (M24), D. Skinner | https://www.maths.cam.ac.uk/postgrad/part-iii/files/GtC/Relativity%20and%20Cosmology/GR_Skinner.pdf | 2026-11-07 |
| DR034 | University of Cambridge, Galaxy Formation and Dynamics (M24), N. W. Evans | https://www.maths.cam.ac.uk/postgrad/part-iii/files/GtC/Astrophysics/Galaxy_Formation_Evans.pdf | 2026-11-07 |
| DR035 | University of Cambridge, Structure and Evolution of Stars (M24), A. N. Żytkow | https://www.maths.cam.ac.uk/postgrad/part-iii/files/GtC/Astrophysics/Anna_Zytkow.pdf | 2026-11-07 |
| DR036 | University of Cambridge, Astrophysical Fluid Dynamics (M24), G. I. Ogilvie | https://www.maths.cam.ac.uk/postgrad/part-iii/files/GtC/Astrophysics/Astrophysical_Fluid_Dynamics_Ogilvie.pdf | 2026-11-07 |
| DR037 | University of Cambridge, Astrophysical Black Holes (L16), D. Sijacki | https://www.maths.cam.ac.uk/postgrad/part-iii/files/GtC/Astrophysics/PartIII_AstrophysicalBlackHoles_Sijacki.pdf | 2026-11-07 |
| DR038 | University of Cambridge, Astrostatistics (L24), K. Mandel | https://www.maths.cam.ac.uk/postgrad/part-iii/files/GtC/Astrophysics/Astrostatistics_Mandel.pdf | 2026-11-07 |
