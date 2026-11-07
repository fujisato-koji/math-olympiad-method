# 網羅表：理論物理学者（ノーベル物理学賞の研究に届く知識）

この頁は `tools/roadmap.py build` が `coverage-nobel-theory.yaml` から作ります。手で直さないでください。
理論物理学者（ノーベル物理学賞の研究に届く知識）に要る論題ごとに、受け持つ単元か、入れない理由を書いています（R-09）。

論題 43 のうち、単元が受け持つもの 41、すべての単元に通る軸が受け持つもの 0、入れないもの 2。

## 物理

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-01 | 前提：解析力学、電磁気学、特殊相対論 | P-015 変分法と最小作用の原理（汎関数と汎関数微分、オイラー＝ラグランジュ方程式、ラグランジュの未定乗数、フェルマーの原理、仮想仕事とダランベールの原理）、P-016 ラグランジュ形式（一般化座標、ホロノミックな拘束、ネーターの定理と保存則、微小振動と基準振動、電磁場中の荷電粒子）、P-018 ハミルトン形式（相空間、正準方程式、ルジャンドル変換、ポアソン括弧、リウヴィルの定理）、P-034 マクスウェル方程式と電磁波（変位電流、積分形と微分形、電磁場のエネルギーとポインティング・ベクトル、平面電磁波と偏り）、P-037 相対論的電磁気学（4 元電流と連続の式、4 元ポテンシャルとゲージ変換、電磁場テンソル、電磁場のローレンツ変換、共変形のマクスウェル方程式、一様な場の中の荷電粒子）、P-057 相対性原理とローレンツ変換（光速度不変、マイケルソン＝モーリーの実験、同時性の相対性、時間の遅れとローレンツ収縮、速度の合成、時空図とパラドックス）、P-058 相対論的力学（ミンコフスキー計量と不変間隔、固有時、4 元速度と 4 元運動量、質量とエネルギーの等価性、衝突と崩壊、光子のエネルギーと運動量、相対論的ドップラー効果）、D-052 変分法（オイラー–ラグランジュ方程式、ネーターの定理） | DR011 |
| T-02 | 前提：上級の量子力学（ブラケット記法）と群論の基礎 | P-072 量子力学の体系（ヒルベルト空間、エルミート演算子と固有値、行列表示とユニタリ変換、ブラ・ケット、交換関係と不確定性関係、同時固有状態の完全系、正準量子化、測定）、P-073 時間発展と描像（時間発展演算子、シュレーディンガー描像とハイゼンベルク描像、ハイゼンベルクの運動方程式）、R-001 群の定義と例、部分群と準同型、R-006 行列群、結晶群と空間群（ビーベルバッハの定理）、D-038 複素領域の 2 階線形常微分方程式（フックス型、超幾何関数）、D-039 漸近解析（ラプラス法、停留位相法、最急降下法、WKB）、P-230 物理のための群と表現（リー群とリー環の計算、SU(2)・SU(3)、ローレンツ群とポアンカレ群の表現、ヤング図形） | DR011 |
| T-03 | 前提：学部の統計力学 | P-048 ミクロカノニカル分布（等重率の原理、状態数とエントロピー、温度と圧力の統計力学的な定義）、P-049 カノニカル分布と分配関数（ボルツマン分布、自由エネルギー、理想気体、二準位系、調和振動子、常磁性、比熱）、P-050 グランドカノニカル分布と化学ポテンシャル、P-051 量子統計（フェルミ分布とボース分布、理想フェルミ気体、理想ボース気体とボース＝アインシュタイン凝縮、黒体放射とプランク分布、デバイ模型、パウリ常磁性） | DR054 |
| T-04 | 場の量子論（スカラー、スピノル、ゲージ場の量子化、ファインマン図、QED） | P-109 古典場の理論と対称性（場のラグランジアン、場のオイラー＝ラグランジュ方程式、ネーターの定理と保存則、相対論的な共変性）、P-110 自由場の量子化（スカラー場とディラック場の正準量子化、粒子と反粒子、フォック空間と粒子の統計）、P-111 相互作用する場と摂動論（LSZ 公式、シュウィンガー＝ダイソン方程式とウィックの定理、ファインマン図とファインマン則、崩壊率と断面積、S 行列のユニタリ性）、P-112 量子電磁力学（マクスウェル場の作用とゲージ不変性、グプタ＝ブロイラーの条件による量子化、最小結合、木の近似の散乱振幅） | DR011 |
| T-05 | 経路積分と汎関数の方法、ゲージ理論の量子化 | P-085 経路積分の入口（量子力学の経路積分）、P-113 経路積分による量子化とゲージ理論（汎関数法、非可換ゲージ理論、ゴースト場と BRST 対称性） | DR055 |
| T-06 | くりこみ（次元正則化）とくりこみ群の流れ、漸近的自由性 | P-114 くりこみとくりこみ群（ループ積分と次元正則化、1 ループのくりこみ、くりこみ群の流れ、漸近的自由性、ウィルソンの描像） | DR055 |
| T-07 | 有効場の理論 | P-116 有効場の理論（自由度と対称性の見きわめ、パワーカウンティング、マッチングとウィルソン係数） | DR055 |
| T-08 | 標準模型とニュートリノの質量と振動（2015・2026 年の賞） | P-108 標準模型（QED、QCD と漸近的自由性・閉じ込め、弱い相互作用とパリティの破れ、電弱統一とヒッグス機構、CKM 行列と CP の破れ、ニュートリノ質量と振動、深非弾性散乱とパートン模型、標準模型を超える物理）、P-115 対称性の自発的破れとヒッグス機構（有効ポテンシャル、ゴールドストーンの定理、ゲージ対称性の破れ） | DR013、DR056 |
| T-09 | イジング模型、Landau の平均場理論と相転移、Landau–Ginzburg 理論 | P-052 相互作用する系と相転移（ビリアル展開とファンデルワールス状態方程式、イジング模型、平均場近似、ランダウ理論、秩序変数と対称性の破れ、一次と二次の転移） | DR054 |
| T-10 | 臨界点とくりこみ群、スケーリング、臨界指数 | P-053 臨界現象とくりこみ群（臨界指数、スケーリング仮説、普遍性、くりこみ群、量子古典対応）、P-056 統計場の理論（ランダウ＝ギンツブルグ理論、経路積分とガウス模型、くりこみ群とε展開、演算子積展開、連続対称性、トポロジカル相転移）、P-236 共形場理論（ヴィラソロ代数、2 次元の臨界現象、頂点作用素代数） | DR054 |
| T-12 | トポロジカル秩序、エニオン、マヨラナ零モード | 入れない（地図にない（候補：トポロジカル秩序とエニオン）） | DR026 |
| T-13 | 超伝導と超流動 | P-099 超伝導（マイスナー効果、現象論、BCS 理論、ジョセフソン接合） | DR057、DR016 |
| T-14 | 一般相対論（微分幾何と重力の物理）（2017・2020 年の賞） | P-059 等価原理と曲がった時空の入口（重力赤方偏移、シュワルツシルト計量、測地線、粒子と光の軌道、シャピロ遅延）、P-060 テンソル解析と微分幾何（多様体、計量テンソル、接続とクリストッフェル記号、共変微分と平行移動、リーマン・リッチ曲率、測地線偏差）、P-061 アインシュタイン方程式とシュワルツシルト解（エネルギー運動量テンソル、ビアンキ恒等式、宇宙項、光の湾曲・近日点移動・シャピロ遅延、バーコフの定理） | DR033、DR058 |
| T-15 | 重力波と Einstein 方程式の構造、偏微分方程式の特性曲面と分類 | P-062 線形化重力と重力波（線形化した真空の方程式、ド・ドンダーゲージ、重力波、四重極公式）、D-057 偏微分方程式の基礎（適切性、コーシー–コワレフスカヤの定理）、D-059 双曲型方程式 | DR059 |
| T-16 | 数値相対論（初期値、ゲージ、波形の抽出） | K-005 初期値問題の偏微分方程式の差分法と安定性、P-119 計算物理（数値誤差と数値微分、常微分方程式の数値解法（ルンゲ＝クッタ法、シンプレクティック積分）、連立一次方程式と固有値問題、モンテカルロ法、分子動力学、最適化） | DR059 |
| T-18 | Schwarzschild ブラックホール、重力崩壊、因果構造、Penrose の特異点定理、Kerr、ブラックホール力学、Hawking 効果（2020 年の賞） | P-061 アインシュタイン方程式とシュワルツシルト解（エネルギー運動量テンソル、ビアンキ恒等式、宇宙項、光の湾曲・近日点移動・シャピロ遅延、バーコフの定理）、P-063 ブラックホール（…、ペンローズ図、レイチャウドゥリ方程式と特異点定理、ブラックホール力学の法則）、P-240 曲がった時空の場の量子論とホーキング効果（P-063 から分ける） | DR060、DR061 |
| T-19 | 超大質量ブラックホールの観測の証拠（SgrA*） | P-063 ブラックホール（…、ペンローズ図、レイチャウドゥリ方程式と特異点定理、ブラックホール力学の法則） | DR037、DR061 |
| T-20 | 宇宙論：宇宙の幾何と力学、インフレーション、熱史、摂動論、構造形成、CMB（2019 年の賞） | P-064 膨張宇宙とフリードマン方程式（宇宙原理、FRW 計量とスケール因子、ハッブルの法則、赤方偏移と地平線、宇宙項、放射・物質・暗黒エネルギーの時代、宇宙年齢）、P-065 熱い宇宙（宇宙マイクロ波背景放射、再結合と光子の脱結合、バリオン光子比、温度の変化、ビッグバン元素合成）、P-066 構造形成（線形の密度ゆらぎ、ジーンズ不安定性、移送関数、ハリソン＝ゼルドビッチ・スペクトル、パワースペクトル、バリオン音響振動、CMB のゆらぎ）、P-067 インフレーションと素粒子の宇宙論（標準宇宙論の問題、インフレーション、バリオン数生成、大統一理論の入口、インフレーションによる初期ゆらぎ） | DR032、DR062 |
| T-21 | 系外惑星の大気と内部（2019 年の賞） | P-068 星の構造と進化・高密度天体（恒星の構造、熱核融合とエネルギー輸送、元素合成、白色矮星・中性子星・ブラックホール、超新星）、P-131 大気放射（散乱と吸収、放射伝達方程式と加熱率） | DR031、DR062 |
| T-22 | フェムト秒レーザー：発振器とパルスの増幅（2018・2023 年の賞） | P-028 光学（レーザー、ビーム光学、光共振器、コヒーレンスと干渉計、光学機器）、P-091 光と原子の相互作用と量子光学（共鳴、吸収と誘導放出・自然放出、ドレスト原子、メーザーとレーザー、共振器 QED、レーザー冷却、ボース＝アインシュタイン凝縮、電磁場の量子化、コヒーレント状態、スクイージング、もつれと量子干渉）、P-234 非線形光学と超短パルス（2 次・3 次の非線形感受率、位相整合と波長変換、チャープパルス増幅、高次高調波とアト秒） | DR063、DR064 |
| T-23 | 非線形光学 | P-234 非線形光学と超短パルス（2 次・3 次の非線形感受率、位相整合と波長変換、チャープパルス増幅、高次高調波とアト秒） | DR063 |
| T-24 | 時間分解の手法（ポンプ・プローブ分光、高次高調波の光源）（2023 年の賞） | P-234 非線形光学と超短パルス（2 次・3 次の非線形感受率、位相整合と波長変換、チャープパルス増幅、高次高調波とアト秒） | DR063、DR065 |
| T-25 | 光の放射圧と光ピンセット（2018 年の賞） | P-038 電磁場のエネルギー・運動量と作用原理（ポインティングの定理、マクスウェルの応力テンソル、エネルギー運動量テンソル、放射圧、マクスウェル方程式と荷電粒子の作用原理）、P-039 電磁波の放射と散乱（遅延ポテンシャル、多重極展開と双極子放射、リエナール＝ヴィーヒェルト・ポテンシャル、ラーモアの公式、制動放射、チェレンコフ放射、点電荷による散乱、アンテナ） | DR064 |
| T-26 | 気候の流体力学：回転と成層の流れ、地衡流の釣り合い、波と不安定（2021 年の賞） | P-126 回転と成層の効果（コリオリ力、慣性振動、浮力振動、リチャードソン数）、P-127 温度風、ロスビー変形半径、エクマン層、プリミティブ方程式、P-129 大気・海洋の波（内部重力波・ロスビー波・ケルビン波）と分散関係、P-157 大規模な大気・海洋の力学（順圧渦度、準地衡、傾圧力学） | DR066、DR067 |
| T-27 | 放射の収支と空気の鉛直輸送 | P-120 地球の放射収支、対流と雲、大気と海洋の循環、気候変化、P-131 大気放射（散乱と吸収、放射伝達方程式と加熱率）、P-160 大気放射と対流（放射伝達、ミー理論、湿潤対流、放射対流平衡）、P-143 地球システムモデル（気候系の要素の表現と結合、結合モデルの実行と評価） | DR067 |
| T-28 | スピングラス、レプリカ法とレプリカ対称性の破れ、空洞法と TAP 方程式（2021 年の賞） | P-239 スピングラスとガラスと乱れた系（レプリカ法、空洞法、ガラス転移とジャミング） | DR068、DR069、DR067 |
| T-29 | ランダムエネルギー模型、KPZ 普遍クラス、ガラス転移 | P-239 スピングラスとガラスと乱れた系（レプリカ法、空洞法、ガラス転移とジャミング） | DR069 |
| T-30 | Anderson 局在と多体局在 | 入れない（地図にない（候補：局在（Anderson 局在と多体局在））） | DR069 |
| T-32 | 量子情報の基礎：密度行列、Schmidt 分解、エンタングルメント、複製禁止定理、Bell の定理（2022 年の賞） | P-084 密度行列ともつれ（純粋状態と混合状態、デコヒーレンス、EPR とベルの不等式、GHZ 状態）、P-087 量子情報の入口（量子ビット、複製不可能定理、量子計算） | DR071、DR072 |
| T-33 | 量子テレポーテーション | P-087 量子情報の入口（量子ビット、複製不可能定理、量子計算） | DR072 |
| T-34 | Hopfield 模型の連想記憶、Boltzmann 機械、深層学習の統計力学（2024 年の賞） | P-049 カノニカル分布と分配関数（ボルツマン分布、自由エネルギー、理想気体、二準位系、調和振動子、常磁性、比熱）、P-052 相互作用する系と相転移（ビリアル展開とファンデルワールス状態方程式、イジング模型、平均場近似、ランダウ理論、秩序変数と対称性の破れ、一次と二次の転移）、K-047 ニューラルネットワークの構成、教師なし学習と強化学習の入口、K-051 ニューラルネットの構造（MLP、CNN、RNN、グラフネット、トランスフォーマー）、K-054 確率的グラフィカルモデルと推論、MDP と POMDP による計画 | DR068、DR073 |
| T-36 | 超伝導回路：Josephson 効果、磁束の量子化、超伝導量子ビット（2025 年の賞） | P-099 超伝導（マイスナー効果、現象論、BCS 理論、ジョセフソン接合）、P-091 光と原子の相互作用と量子光学（共鳴、吸収と誘導放出・自然放出、ドレスト原子、メーザーとレーザー、共振器 QED、レーザー冷却、ボース＝アインシュタイン凝縮、電磁場の量子化、コヒーレント状態、スクイージング、もつれと量子干渉） | DR016、DR074 |
| T-37 | 宇宙からの高エネルギーニュートリノの検出（2026 年の賞） | P-107 素粒子の現象論（…、物質との相互作用と検出器、加速器とビーム光学）、P-118 実験技術と計測（電子回路と信号処理、計測器、真空と低温、X 線による構造解析、磁気共鳴、放射線の検出と計数統計、レーザーと光の干渉計、次元解析） | DR009、DR075 |

## 数学

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-11 | 位相幾何の考えと位相的な相転移・相（2016 年の賞） | P-102 トポロジカル物性（トポロジカルバンド理論、量子異常ホール効果、量子スピンホール効果、エッジ状態とトポロジカル絶縁体）、T-019 ホモトピーと基本群、T-013 測地線とガウス–ボネの定理、P-176 量子の断熱定理と準位の避けた交差（ランダウ＝ツェナー遷移、ベリー位相の入口）、P-056 統計場の理論（ランダウ＝ギンツブルグ理論、経路積分とガウス模型、くりこみ群とε展開、演算子積展開、連続対称性、トポロジカル相転移） | DR057 |
| T-31 | ランダム行列理論 | S-032 ランダム行列 | DR068、DR070 |

## 工学

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-17 | レーザー干渉計（重力波の検出器） | P-028 光学（レーザー、ビーム光学、光共振器、コヒーレンスと干渉計、光学機器） | DR058 |

## 計算

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-35 | 深層ネットの構造と学習の理論 | K-051 ニューラルネットの構造（MLP、CNN、RNN、グラフネット、トランスフォーマー）、K-052 深層学習の幾何と不変性、高次元の学習理論と汎化 | DR070 |

## 検証で足した論題

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| V-01 | 正準変換と剛体の力学 | P-019 正準変換とハミルトン＝ヤコビ理論（作用・角変数、断熱不変量、可積分系の入口）、P-017 剛体の力学（慣性テンソルの対角化、オイラー方程式、オイラーのこまとラグランジュのこま、歳差と章動） |  |
| V-02 | 静電場・静磁場の境界値問題 | P-036 静電場・静磁場の境界値問題（ポアソン方程式、グリーン関数の方法、極座標の境界値問題、多重極展開、回路のインダクタンス） |  |
| V-03 | 散乱理論 | P-081 散乱理論（古典散乱と微分断面積、散乱振幅、ボルン近似、部分波と位相のずれ、光学定理、散乱長、共鳴、S 行列の極） |  |
| V-04 | 揺らぎと確率過程（ランジュバン方程式、フォッカー＝プランク方程式） | P-055 確率過程とブラウン運動（拡散方程式とランダムウォーク、ランジュバン方程式、フォッカー＝プランク方程式、マスター方程式、ゆらぎの熱力学） |  |
| V-05 | 数理物理の方法（フーリエ・ラプラス変換の計算、直交多項式と特殊関数） | D-075 フーリエ変換の計算（たたみ込み、デルタ関数、物理と工学の使い方）、D-035 ラプラス変換と複素積分による逆変換、D-077 直交多項式と特殊関数（ルジャンドル、エルミート、ラゲール、ベッセル） |  |
| V-06 | 物性の場の理論 | P-101 物性の場の理論・多体理論の入口（多体の定式化とファインマン図、乱雑位相近似、誘電関数と線形応答、経路積分と平均場、ボソン化、非線形シグマ模型、量子ゲージ理論） |  |

## 出典

| 記号 | 題名 | URL | 取得日 |
|---|---|---|---|
| DR009 | University of Wisconsin–Madison, Department of Physics, Physics 736: Experimental Methods in Nuclear-, Particle-, and Astrophysics（Graduate, basic） | https://physics.wisc.edu/courses/spring2024/736 | 2026-11-07 |
| DR011 | University of Cambridge, Quantum Field Theory (MT24), A. Castro | https://www.maths.cam.ac.uk/postgrad/part-iii/files/GtC/Particle%20Physics%20and%20Quantum%20Fields/Quantum_Field_Theory.pdf | 2026-11-07 |
| DR013 | University of Cambridge, The Standard Model (L24), M. Ubiali | https://www.maths.cam.ac.uk/postgrad/part-iii/files/GtC/Particle%20Physics%20and%20Quantum%20Fields/PartIII_course_outline_SM_Ubiali_2627.pdf | 2026-11-07 |
| DR016 | University of Waterloo, Graduate Studies Academic Calendar: Quantum Info & Computation (QIC)（QIC 710, 750, 820, 823, 845, 880, 885） | https://academic-calendar-archive.uwaterloo.ca/graduate-studies/archive-winter-2024/graduate-course/subject/QIC.html | 2026-11-07 |
| DR026 | University of Cambridge, Topological Quantum Matter (L16), B. Béri | https://www.maths.cam.ac.uk/postgrad/part-iii/files/GtC/Quantum%20computation%2C%20Information%20and%20Foundations/Topological_Quantum_Matter_Beri.pdf | 2026-11-07 |
| DR031 | University of Cambridge, Extrasolar Planets: Atmospheres and Interiors, N. Madhusudhan | https://www.maths.cam.ac.uk/postgrad/part-iii/files/GtC/Astrophysics/Extrasolar_Planets_Madhusudhan.pdf | 2026-11-07 |
| DR032 | University of Cambridge, Cosmology (M24), E. Pajer | https://www.maths.cam.ac.uk/postgrad/part-iii/files/GtC/Relativity%20and%20Cosmology/Cosmology_26-27.pdf | 2026-11-07 |
| DR033 | University of Cambridge, General Relativity (M24), D. Skinner | https://www.maths.cam.ac.uk/postgrad/part-iii/files/GtC/Relativity%20and%20Cosmology/GR_Skinner.pdf | 2026-11-07 |
| DR037 | University of Cambridge, Astrophysical Black Holes (L16), D. Sijacki | https://www.maths.cam.ac.uk/postgrad/part-iii/files/GtC/Astrophysics/PartIII_AstrophysicalBlackHoles_Sijacki.pdf | 2026-11-07 |
| DR054 | University of Cambridge, Statistical Field Theory (M16), H. S. Reall | https://www.maths.cam.ac.uk/postgrad/part-iii/files/GtC/Particle%20Physics%20and%20Quantum%20Fields/Statistical_Field_Theory_Reall.pdf | 2026-11-07 |
| DR055 | University of Cambridge, Advanced Quantum Field Theory (L24), C. E. Thomas | https://www.maths.cam.ac.uk/postgrad/part-iii/files/GtC/Particle%20Physics%20and%20Quantum%20Fields/Advanced_Quantum_Field_Theory_Thomas.pdf | 2026-11-07 |
| DR056 | Royal Swedish Academy of Sciences, The Nobel Prize in Physics 2015 | https://www.kva.se/en/news/nobelpriset-i-fysik-2015-2/ | 2026-11-07 |
| DR057 | Royal Swedish Academy of Sciences, The Nobel Prize in Physics 2016 | https://www.kva.se/en/news/nobelpriset-i-fysik-2016-2/ | 2026-11-07 |
| DR058 | Royal Swedish Academy of Sciences, The Nobel Prize in Physics 2017 | https://www.kva.se/en/news/nobelpriset-i-fysik-2017-2/ | 2026-11-07 |
| DR059 | University of Cambridge, Gravitational Waves and Numerical Relativity (E16), U. Sperhake | https://www.maths.cam.ac.uk/postgrad/part-iii/files/GtC/Relativity%20and%20Cosmology/gravitational_waves_and_numerical_relativity_sperhake.pdf | 2026-11-07 |
| DR060 | University of Cambridge, Black Holes (L24), C. Warnick | https://www.maths.cam.ac.uk/postgrad/part-iii/files/GtC/Relativity%20and%20Cosmology/BlackHoles_Warnick.pdf | 2026-11-07 |
| DR061 | Royal Swedish Academy of Sciences, The Nobel Prize in Physics 2020 – Black holes and the Milky Way's darkest secret | https://www.kva.se/en/news/nobelpriset-i-fysik-2020-2/ | 2026-11-07 |
| DR062 | Royal Swedish Academy of Sciences, The Nobel Prize in Physics 2019 | https://www.kva.se/en/news/nobelpriset-i-fysik-2019-2/ | 2026-11-07 |
| DR063 | Università di Pavia, Doctoral School in Physics, Ultrafast Laser Physics（G. F. Mancini） | https://luxem.unipv.it/wp-content/uploads/2024/07/Ultrafast_Laser_Physics_-_PhD_Course_PHYS_v2.pdf | 2026-11-07 |
| DR064 | Royal Swedish Academy of Sciences, The Nobel Prize in Physics 2018 | https://www.kva.se/en/news/nobelpriset-i-fysik-2018-2/ | 2026-11-07 |
| DR065 | Royal Swedish Academy of Sciences, The Nobel Prize in Physics 2023: Experiments with light capture the shortest of moments | https://www.kva.se/en/news/the-nobel-prize-in-physics-2023/ | 2026-11-07 |
| DR066 | University of Cambridge, Fluid Dynamics of Climate (L24), P. H. Haynes, A. Ming | https://www.maths.cam.ac.uk/postgrad/part-iii/files/GtC/Continuum%20Mechanics/Fluid_dynamics_of_climate_HAYNES_MING.pdf | 2026-11-07 |
| DR067 | Royal Swedish Academy of Sciences, The Nobel Prize in Physics 2021 – Physics for climate and other complex phenomena | https://www.kva.se/en/news/nobelpriset-i-fysik-2021-2/ | 2026-11-07 |
| DR068 | Harvard University（CBMM のサイトに掲載）, Physics 265: Statistical Mechanics of Spin Glasses and Neural Networks（H. Sompolinsky） | https://cbmm.mit.edu/sites/default/files/courses/syllabus/Physics%20265-2025%20Edition%20.pdf | 2026-11-07 |
| DR069 | École normale supérieure, Département de physique, Statistical Physics of Disordered Systems（M2 ICFP） | https://www.phys.ens.fr/cours/statistical-physics-disordered-systems | 2026-11-07 |
| DR070 | University of Oxford, Mathematical Institute, Part C Mathematics Synopses 2025-26（DRAFT） | https://www.maths.ox.ac.uk/system/files/inline-files/DRAFT%20Part%20C%20Mathematics%20Synopses%202025-26.pdf | 2026-11-07 |
| DR071 | University of Cambridge, Quantum Information, Foundations and Gravity (M16), A. Kent | https://www.maths.cam.ac.uk/postgrad/part-iii/files/GtC/Quantum%20computation%2C%20Information%20and%20Foundations/PartIII_course_outline_template.2026.pdf | 2026-11-07 |
| DR072 | Royal Swedish Academy of Sciences, The Nobel Prize in Physics 2022: Entangled states – from theory to technology | https://www.kva.se/en/news/the-nobel-prize-in-physics-2022/ | 2026-11-07 |
| DR073 | Royal Swedish Academy of Sciences, The Nobel Prize in Physics 2024: They trained artificial neural networks using physics | https://www.kva.se/en/news/the-nobel-prize-in-physics-2024/ | 2026-11-07 |
| DR074 | Royal Swedish Academy of Sciences, The Nobel Prize in Physics 2025: Their experiments on a chip revealed quantum physics in action | https://www.kva.se/en/news/the-nobel-prize-in-physics-2025/ | 2026-11-07 |
| DR075 | Royal Swedish Academy of Sciences, The Nobel Prize in Physics 2026: Elusive particles from the universe captured at the South Pole | https://www.kva.se/en/news/the-nobel-prize-in-physics-2026/ | 2026-11-07 |
