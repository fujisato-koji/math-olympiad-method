# 関係の強さ・性質・配置と塊の先例（関係構造の調べ）

- 作成日：2026-11-12
- 施主の問い（2026-11-12）：「関係性の本数だけではなく強度も、関係性の性質も要るのでは。そういう研究があれば、それにしたがって整理してほしい」
- 目的：みちすじの単元どうしの関係に、種類（性質）と強さを持たせ、その関係から配置と分野の塊を出すとき、既存の研究が何を示しているかを照らす材料にすること
- 背景：単元は 1,523、前提（needs）の線は 3,927 本あり、どの線にも種類も強さもない。網羅表の論題は 2,795 あり、問題には使う単元（uses）が付いている。線の数を数えるだけでは、どの前提が強いか、どの線が別の種類かを区別できない
- 作り方：3 つの切り口（学習の前提と関係の種類、知識の組織化の関係の型、科学の地図の強さ・配置・塊）で別々の係が研究を集め（延べ 31 件）、別の係が出典を開いて 1 件ずつ番号順に確かめ、さらに批評役が漏れを挙げ、設計の案を述べた。この文書は集めた調べを正しくまとめたもので、みちすじが採る形は最後の節に別に書く
- 範囲：確かめ役が開けなかった本文や、抄録だけで確認した細部は、各行に「未確認」と書いた。みちすじへの使い方の列は、係の提案を写したもので、確かめ役が検証したものではない

## 凡例

- **出典の記号**：末尾の「出典」の節の R 番号。確かめ役が実際に開いた URL を載せた
- **確かめ役の直し**：判定は「そのまま」「直しあり」「確かめられず」の 3 つ。直しあり 9、そのまま 21、確かめられず 1 で、直しは本文の値に反映した。「そのまま」でも注記のあるものは、その注記を反映した
- **確かめられなかったもの**は表に入れず、「確かめられなかったもの」の節に名前と理由を書いた
- **空欄の扱い**：係が書かなかった項目は「言及なし」「記述なし」と書いた。材料にない事実は足していない

## 結果の概観

| 切り口 | 内容 | 件数（表に入れた） | 確かめられなかった |
|---|---|---|---|
| 1 | 学習の前提と関係の種類 | 12 | 0 |
| 2 | 知識の組織化の関係の型 | 7 | 1 |
| 3 | 科学の地図の強さ・配置・塊 | 11 | 0 |
| 批評役が足した研究 | 確かめは批評役のみ | 9 | - |

確かめ役の判定は、延べ 31 件のうち直しあり 9、そのまま 21、確かめられず 1。批評役が足した研究は別の節（9 件）に置く。

## 切り口 1：学習の前提と関係の種類

| 名前 | 著者と年 | 何を示したか | 関係の種類・強さ・配置と塊について言っていること | みちすじへの使い方 | 出典 |
|---|---|---|---|---|---|
| 知識空間論（Knowledge Space Theory、surmise relation と surmise system） | Doignon & Falmagne 1985（Int. J. Man-Machine Studies 23(2), 175-196）、『Knowledge Spaces』Springer 1999。surmise system という語は Falmagne & Doignon 2011（Learning Spaces）の用語 | 単元の集合上の前提を「ある問題が解けるなら別の問題も解けるはず」という準順序（surmise relation）で表し、許される知識状態の族（知識空間）を定める。道筋が複数ある場合は surmise system（AND/OR グラフ）に一般化し、知識空間と 1 対 1 に対応する（1985 の抄録で確認） | 前提は「必須」の 2 値で、surmise system では連言と択一（OR）を区別できる。標準の確率モデル（BLIM）は基本の局所独立性を仮定し、誤答と偶然正答の母数を足すもので、局所独立性を緩めるものではない。配置や分野の見つけ方は扱わない | needs 3,927 本を準順序と見て、推移閉包・同値な単元・択一前提（OR）を整理する根拠になる。複数の道筋がある単元は OR 辺として分けて持てる | R01（直しあり） |
| 能力と成績の方式（Competence-Performance Approach、CbKST） | Korossy 1997、1999（起源）。Heller, Stefanutti, Anselmi, Robusto ほか 2013（章は URL の一致のみで本文は未開）。確かめ役が開いたのは Hockemeyer ほか、J.UCS 9(12), 2003 | 問題（観測される成績）と、その背後の技能・能力（潜在）を分ける。問題から技能への解釈関数と、技能の前提構造から、成績の空間を導く | 問題どうしの前提、技能どうしの前提、問題が要する技能、の 3 種を区別する。問題の水準の前提構造は他の 2 つから導かれるもので、基本の要素ではない。強さは扱わず（確率版は別）、配置と塊は言及なし | みちすじの needs と uses を別種の関係として分けて持つ設計の根拠になる。uses との対応は係自身の読み替えで、単元＝技能、問題＝成績と置ける | R02 |
| Gagné の学習階層（learning hierarchies）とその検証 | Gagné 1968（Educational Psychologist 6(1)、本文は未開）、White 1974（AERJ 11, 121-136、DOI 10.3102/00028312011002121）、Gagné & White 1978（RER 48, 187-222、DOI 10.3102/00346543048002187。187-223 とする引用もある） | 最終の目標技能を行動で定義し、「これができるために先に何ができねばならないか」を上から下へ問うて下位技能の階層を作る。White は階層を検証する 9 段階を示した（抄録で 9 段階と段階 1 を確認。段階 2〜9 は未確認） | 下位技能が上位の前提になる「必須」の関係が中心。必須と促進的の区別は係の背景知識で、出典では確認できていない。合否の組から逆転の比率を見て前提を検証する方法が中心だが、検証手順の細部は未確認。階層（層）に整理し、分野の塊は扱わない | needs の各線を「下位が上位の前提として本当に必要か」と問題の正答データで検証する方法の元になる。層（深さ）を 3D の 1 軸にもできる | R03、R04（R03 は White でなく Phillips & Kane 1974、Florida J. Educ. Res. 16(1), 39-43 の論文。結論は、転移による順序づけは十分な基準ではない） |
| 学習の進路（Learning Trajectories） | Clements & Sarama 2004（Mathematical Thinking and Learning 6(2), 81-89、DOI 10.1207/s15327833mtl0602_1）、2024（初期の数学の学習の進路の系統的レビュー、ZDM、DOI 10.1007/s11858-024-01644-1） | 学習の進路は、目標となる数学の概念、思考の水準の発達的な順序、各水準に合う指導活動の 3 つからなる（2004 の本文でなく二次資料と著者のスライドで確認）。2024 のレビューは既存の進路の妥当性を概ね支持するが、すべての主題や実施で支持されるわけではないとする | 単元の依存というより、1 つの概念内の水準の順序で、水準ごとに活動を対応づける。強さは言及なし。主題ごとに進路を 1 本置く形で、分野の見つけ方は扱わない | 1 つの論題の中の段（水準）の順序と、その水準に対応する問題の関係を表す形式の先例。needs 全体の強さには直接使えない | R05 |
| 学習進行（Learning Progressions、CPRE） | Corcoran, Mosher & Rogat 2009（CPRE Research Report RR-63『Learning Progressions in Science: An Evidence-based Approach to Reform』、2009 年 5 月） | 学習の進路を「経験的に根拠づけられ検証できる仮説」として、生徒がたどる道筋を記述する枠と定義する（Teachers College の要約で確認）。NRC 2007 を土台にした。報告は数学でなく理科を扱う | 道筋の仮説で、複数の道筋があり得ることに触れるが、この点は全文未読で未確認。強さ、配置と塊は言及なし | 前提の線を「確定した事実」でなく「検証するべき仮説」と位置づけ、正答データで更新する運用の根拠になる | R06 |
| 概念地図（Concept maps、Novak） | Novak & Cañas 2008（The Theory Underlying Concept Maps and How to Construct and Use Them、IHMC 技術報告 2006-01 Rev 2008-01、2008 年 1 月改訂） | 概念をつなぐ線に「つなぎ語」を付けて命題にする。別の領域・区画をつなぐ線を「クロスリンク」と呼び、創造的な飛躍を示すとする（クロスリンクの定義は確認済み。つなぎ語と階層配置は報告に標準だが、PDF の本文を抽出できず未確認） | 線の種類は固定でなく、自由な語のラベルで表す。区画内の線と区画をまたぐ線の区別が重要で、配置は階層的（上位概念が上）で区画は人が分ける。強さはなく、採点の記述（命題・階層・クロスリンク）は確かめられていない | 関係に語のラベル（必須の前提、道具として使う、一般化…）を付ける設計の先例。分野をまたぐ線を特別に扱う考えは、20 分野の再編に直結する | R07 |
| RefD（Reference Distance） | Liang, Wu, Huang & Giles 2015（EMNLP 2015, pp. 1668-1674、DOI 10.18653/v1/D15-1193。第一著者は Chen Liang）。AAAI 2017 は Liang, Ye, Wu, Pursel & Giles（CPR-Recover、pp. 4786-4791）で、そこでは RefD は比較対象 | 概念 A と B の間で、それぞれに関連する概念が相手へどう参照するかの非対称さから、前提の向きと強さを [-1, 1] の 1 つの数にする。Wikipedia のリンクを参照関係に使い、RefD は非対称で RefD(A,A)=0 | 前提か否かの 1 種類のみ。RefD は [-1, 1] に正規化された連続値で、符号を向き、大きさを強さと読むのは係の解釈。配置と塊は言及なし | 向きだけの前提の線に、連続値の強さを付ける最も簡単な方法。単元の本文のリンクや共起、網羅表の共通論題を「参照」と見なして再現できる | R08 |
| 群衆注釈による前提の予測（Crowdsourced Comprehension） | Talukdar & Cohen 2012（BEA 7, pp. 307-315、題名は『Crowdsourced Comprehension: Predicting Prerequisite Structure in Wikipedia』） | 技術的な Wikipedia ページの前提構造を、群衆の注釈（Amazon Mechanical Turk）で作り、予測を新しい課題として提起した。方法（リンクグラフ、編集者との二部グラフ、文章の特徴）の記述は、PDF から抄録を取り出せず、確かめ役の事前知識による | 前提か否かの 2 値。強さは言及なし（分類器の確率は付き得る）。配置と塊は言及なし | 人の注釈と、リンクなど構造の特徴を併用して前提を推定する枠組みの先例。needs の一部を人が確かめて学習データにできる | R09 |
| 科学の文書集合での概念の依存 | Gordon, Zhu, Galstyan, Natarajan & Burns 2016（ACL 2016, pp. 866-875、DOI 10.18653/v1/P16-1082、題名は『Modeling Concept Dependencies in a Scientific Corpus』） | 読書リストを作るため、概念どうしの依存を情報理論の考えで定義し、文章の集まりから自動で概念グラフを作る。人手での辺の評価と辺のデータの公開を報告する | 依存は 1 種類で向きあり。情報量に基づく連続的な強さとされるが、情報理論の定義と連続値の部分は抄録を取り出せず未確認。配置と塊は言及なし | 文章の共起から依存の向きと強さを数にする手法の先例。網羅表の論題の共起から強さを作る案に使える | R10 |
| MOOC の概念の前提関係の学習 | Pan, Li, Li & Tang 2017（ACL 2017, pp. 1447-1456、題名は『Prerequisite Relation Learning for Concepts in MOOCs』） | MOOC の概念の前提関係を、潜在表現の学習と、どの情報が前提を最もよく示すかの検討で推定する。Coursera の 3 つのデータで評価し、F1 が +5.9〜48.0% 向上したと報告する | 前提か否かの 2 値。分類の確率は得られるが、強さの測り方としては扱わない。「文脈・構造・意味」の特徴という言い方は確かめられていない。配置と塊は言及なし | 講義の動画の順序や文脈の特徴を使う例。みちすじでは単元の説明文や問題を文脈として似た特徴を作る参考 | R11 |
| PREREQ（Roy ら） | Roy, Madhyastha, Lawrence & Rajan 2019（AAAI-19 IAAI, vol. 33, pp. 9589-9594 は AAAI の頁が開けず未確認、arXiv 1811.12640）。題名は『Inferring Concept Prerequisite Relations from Online Educational Resources』で、PREREQ は手法の名 | Pairwise LDA の概念表現とシャム型ニューラルネットで、科目の前提とラベル付き概念前提から未知の概念前提を学習する。ラベルなしの動画再生リストも使える | 前提は 2 値で、出力は確率的。ベンチマークで最新手法を上回り、少ない学習データでも効くと報告する。配置と塊は言及なし | 少ない正解（確かめた前提）からほかの前提を推定する手法の先例 | R12（直しあり） |
| 前提駆動の深層知識追跡 | Chen, Lu, Zheng & Pian 2018（IEEE ICDM 2018, pp. 39-48、DOI 10.1109/ICDM.2018.00019） | 問題を解く履歴が少ない問題を補うため、概念の前提関係を深層の知識追跡に順序対の正則化として組み込む。前提を入れることで追跡の精度が上がったと報告されるが、数値と前提グラフの作り方は未確認 | 前提は向きあり。強さ、配置と塊は言及なし | 前提の線を問題の正答データで裏づける（あるいは前提を学ぶ）方向の先例。uses があれば同様の検証ができる | R13 |

## 切り口 2：知識の組織化の関係の型

| 名前 | 著者と年 | 何を示したか | 関係の種類・強さ・配置と塊について言っていること | みちすじへの使い方 | 出典 |
|---|---|---|---|---|---|
| ISO 25964-1（情報検索用シソーラス）の BT/NT/RT | ISO 25964-1:2011（ISO/NISO。ISO 2788 と 5964 の後継とされるが、ISO の頁が 403 で開けず直接は確認できていない） | 語の関係を同値（USE/UF）、階層（BT/NT）、連想（RT）の 3 つに分ける。階層は総称 BTG/NTG、事例 BTI/NTI、全体部分 BTP/NTP に任意で細分でき、BT と NT、RT と RT は必ず対で持つ（相互性）。RT は同義でも BT/NT でもない連想（ISKO の解説で確認） | 階層は 3 型、連想は 1 型。「強さは無い」と「分野を探す手続きを定めない」は、規格に規定が見当たらないという否定の主張で、積極的な出典はない | 前提の線を「上位下位」と「連想」を混ぜずに分ける手本になる。needs はそのまま流用できない独自の型なので、共起を RT 的な別の型として分ける根拠に使える | R14 |
| ISO 25964 の階層関係の合成（BTG、BTP、BTI） | Alexiev, Isaac & Lindenthal 2016（International Journal on Digital Libraries 17, pp. 39-48、DOI 10.1007/s00799-015-0162-2）。2014 年の NKOS 発表が前身 | 階層 3 型を鎖につなぐと推移が成り立つ組が違う。BTG と BTP は別々に推移を確立する方が誤りが少なく、BTI と BTG/BTP の混合経路には推移を認めない。ISO が階層を概念間に限る制約を、論文は facet や階層名にも緩める。Springer 本体は開けず、書誌と要旨で確認 | 型ごとに推移性が違うという指摘で、階層という 1 つの線に全部入れると推論が壊れる実例。強さ、配置と塊は記述なし | needs の推移閉包（前提の前提）を取るとき、線を「概念の依存」「技能の積み上げ」などの型に分けないと遠い前提を誤って含める恐れがある、という警告になる | R15 |
| SKOS Reference（W3C 勧告） | Miles, Bechhofer（編）、W3C Recommendation、2009-08-18 | broader/narrower は直接の線のみで推移とは宣言せず（8.1、8.6.6）、broaderTransitive が推移（S24）で broader の上位性質。related は対称（S23）で推移せず、broaderTransitive と互いに素（S27）。別の体系をつなぐ写像は exactMatch（推移、S45）、closeMatch（対称、推移なし）、broadMatch/relatedMatch で、mappingRelation（S40）は semanticRelation の下 | 向き（逆対）、推移性、対称性、互いに素の公理を明示する。強さは持たず（拡張が必要）、分野の見つけ方は定めない（ConceptScheme と Collection で概念を束ねる枠のみ）。文書の後半 44562 字は未読だが、主張に必要な部分は読んだ範囲にある | 前提の線を「直接」と「閉包」に分け、推移は保存でなく計算で出す設計の根拠になる。網羅表の共起は related 相当、前提は向きのある線と型を分け、同じ対に前提と共起を二重に主張しない規則も借りられる | R16 |
| OBO 関係オントロジー（RO）と生物医学オントロジーの関係 | Smith, Ceusters, Klagges, Köhler, Kumar, Lomax, Mungall, Neuhaus, Rector, Rosse 2005（Genome Biology 6(5):R46、DOI 10.1186/gb-2005-6-5-r46）。RO は OBO Foundry が継続管理 | 関係を個体の水準で定義し、そこから分類の水準の関係を導く方法を示した。is_a と part_of を厳密に定義し、located_in、contained_in、adjacent_to、transformation_of、derives_from、preceded_by、has_participant、has_agent を加えた計 10 関係を提案し、各関係の推移・反射・反対称を表（Table 3）に示した | is_a と part_of は推移・反射・反対称。located_in は推移と反射を持つが反対称でない。transformation_of、derives_from、preceded_by は推移のみで、contained_in、adjacent_to、has_participant、has_agent はどれも持たない。強さは無し、分野の見つけ方は扱わない。論文が「性質連鎖の推論規則」を与えたという記述は確認していない | 関係ごとに推移・反対称・反射を表で宣言する作法を借りられる。needs は推移かどうかを線ごとに決める必要があり、uses は「活動が単元を使う」という別の型（has_participant に近い非推移）として区別できる | R17（直しあり） |
| 1EdTech CASE の CFAssociation | IMS Global / 1EdTech。確かめ役が開いたのは CASE v1.1 の情報モデル | 能力や学習指導要領の項目間の関係を CFAssociation（起点、終点、associationType）で表す。v1.1 の情報モデルで associationType は拡張可能な列挙で、値は 10 個（isChildOf, isPeerOf, isPartOf, exactMatchOf, precedes, isRelatedTo, replacedBy, exemplar, hasSkillLevel, isTranslationOf）。isTranslationOf は v1.1 で加わった | 木、順序、同格、一致、連想などを同じ枠で持つ。association に重みの属性は無く（sequenceNumber は順序づけ用、ほかに originNodeURI、destinationNodeURI、CFAssociationGroupingURI）、向きと推移性の規定は本文の該当部分を読めていない | 教育分野で「順序（precedes）」「木（isChildOf）」「連想（isRelatedTo）」を同じ辺の型として並べる前例。みちすじの needs・共起・uses を列挙型にする案の根拠で、定義の細部は使う前に公式の 7.3.1 節で確認が必要 | R19（直しあり） |
| 数学主題分類 MSC2020 の相互参照 | Mathematical Reviews（AMS）と zbMATH Open の共同、MSC2020（CC BY-NC-SA） | 数学の分類は木（2 桁の大分類、3 桁、5 桁）で、木に収まらない関係を 2 種の相互参照で補う。波括弧の {For A, see X} は、A の論文には通常 Y でなく X を付ける指示で、角括弧の [See also …] は関連する符号を示すだけで付けても付けなくてもよい | 「別の場所へ送る」と「関連する」の 2 型。波括弧を「排他的」と言い切るのは強すぎ、本文は「通常（usually）」の語を使う。どれが最適かは分類者の判断で、推移性や強さの規定は無い。分野の骨格は専門家が決めた木 | 20 分野を木として持ちつつ、分野をまたぐ線を「付け替え」と「関連」のどちらかと明記する前例。単元の分野を一意に決めたい目的には、波括弧型の規則（通常はどちらかに決める）が参考になる | R20 |
| Learning Commons Knowledge Graph の standards 間の関係と Jaccard | Learning Commons（教育データ基盤）のドキュメント。スキーマ初版 2025-09-23、更新 2026-07-09 と 2026-11-10、月次更新 | standards どうしをつなぐのは hasChild（枠組み内の親子）と hasStandardAlignment（州の項目から CCSS の項目へ、一方向で州どうしは無し）の 2 つだけ。supports は学習要素から標準へ、hasEducationalAlignment は教材・授業などのカリキュラム要素から標準へつなぐ | 整合は共有する学習要素の数から Jaccard 係数（共有÷全体の異なる要素、0 を超え 1 以下、共有が 1 以上の対のみ）で強さを持ち、共有内容のみで順序・依存を含まない。teaches、assesses、building_on、addressing は hasEducationalAlignment の属性（alignmentType と curriculumAlignmentType）で、前提（prerequisite）の型は当該ページに無い | 網羅表の論題の共起から単元間の強さを作るとき、共有論題数を Jaccard で正規化する具体例。強い関係を「共有する論題が多い」こととして、前提の線の強さとは別の軸にできる | R21（直しあり） |

## 切り口 3：科学の地図の強さ・配置・塊

| 名前 | 著者と年 | 何を示したか | 関係の種類・強さ・配置と塊について言っていること | みちすじへの使い方 | 出典 |
|---|---|---|---|---|---|
| association strength と共起データの正規化 | van Eck & Waltman 2009（JASIST 60(8):1635-1651、DOI 10.1002/asi.21075） | 共起データの類似度として association strength、cosine、inclusion index、Jaccard を比べた。association strength は確率的、他の 3 つは集合論的と分類し、理論と実験の両方から共起は確率的な正規化が良いと結論した（抄録による） | 強さは「観測された共起数 ÷ 偶然に期待される共起数」で、次数の大きい単元が無条件に強くなる偏りを除く。VOS の入力に使われるという記述は 2010 年の VOS 論文群のもので、本項では直接確認していない | 共起数を両端の次数で割る association strength を強さの第一案にできる。前提の線は有向の関係なので、同じ論題に並ぶ共起の側に適用するのが素直 | R22 |
| VOS 配置法と MDS の比較 | van Eck, Waltman, Dekker & van den Berg 2010（JASIST 61(12):2405-2416、DOI 10.1002/asi.21421、arXiv:1003.2551） | MDS 系の 2 つの一般的な地図化法は人工的なゆがみ（アーティファクト）を生むが、VOS はそれを避け、一般に VOS の方がデータをよく表すと主張した。MDS と VOS の数学的な関係も解析した（雑誌掲載情報は econpapers で確認） | 正規化済みの類似度が大きい対ほど近くに置く、重み付き距離の和の最小化が VOS の骨子（一般的な説明で、この論文の式は未確認）。並行移動・回転・反転の自由度が残る点や局所解の扱いも本論文では未確認 | 3D の地図の配置法の候補。MDS より中心への偏りなどが少ないとされる。回転・反転は主成分軸などで固定する工夫を自分で足す | R23 |
| 地図化と分類の統一的な見方（VOS と一般化モジュラリティ） | Waltman, van Eck & Noyons 2010（Journal of Informetrics 4(4):629-635、DOI 10.1016/j.joi.2010.07.002、arXiv:1006.1032） | VOS の地図化と、重みとパラメータ（解像度）を持つ形のモジュラリティ型クラスタリングが、同じ原理から導けることを示した。1999〜2008 年の情報科学の高被引用論文で、地図と塊の例を示した（抄録による） | どちらも正規化済みの辺の重みを使い、解像度パラメータで塊の大きさを調整する。「地図上で近いものが同じ塊に入りやすい」「解像度が粒度を決める」は論文の含意としての解釈 | 「関係から一意に近い 3D の位置を出し、近い塊を分野にする」という施主の要望と直接対応する。配置と塊を別法で作らず、同じ重み付き関係から両方を出す方針の根拠になる | R24 |
| Leiden アルゴリズムと解像度パラメータ | Traag, Waltman & van Eck 2019（Scientific Reports 9:5233、arXiv:1810.08473） | Louvain は内部がつながらない塊を作ることがあり、実験で最大 25% が連結の悪い塊、最大 16% が非連結だった。Leiden は塊の連結を保証し、反復すれば収束先で部分集合の最適性まで保証し、速さと質も上回る | モジュラリティと CPM を目的関数にでき、重み付き辺をそのまま扱える。解像度 γ>0 が大きいほど塊が増え、乱数が節点の訪問順などに入るため結果は乱数の種に依存しうる（CPM・γ・θ の細部は抄録では未確認だが標準的な記述） | 20 分野の捉えなおしの塊検出の本命。塊が必ず連結になるので分野名をつけやすく、γ を変えて粗い分野と細かい分野の階層を作れる。乱数の種を記録し、複数回の結果の合意も見る | R25 |
| モジュラリティの解像度限界 | Fortunato & Barthélemy 2007（PNAS 104(1):36-41、DOI 10.1073/pnas.0605965104） | モジュラリティ最大化は、ネットワーク全体の辺の数 L と塊どうしのつながり方で決まる規模より小さい塊を見分けられない。内部の辺が約 √(2L) 以下の塊は、下位構造を隠して合併されやすい（検索要約による） | 強さの記述なし。塊の大きさがネットワーク全体の規模に左右され、小さい分野が大きな分野に呑まれうる | 1,523 単元・3,927 本の関係で、粗い単元群が大きな塊に吸収される危険の根拠。モジュラリティだけに頼らず、Leiden の CPM や解像度を変えた階層で確かめる理由になる | R26 |
| 合意クラスタリング（塊の安定化） | Lancichinetti & Fortunato 2012（Scientific Reports 2:336、DOI 10.1038/srep00336、arXiv:1203.6093） | 多くの塊検出法は乱数の種やタイブレークで結果が変わる。確率的な手法を何度も走らせた分割から、共に所属する頻度で合意分割を作る枠組みを示し、安定性と精度が上がると報告した（抄録による）。時間変化するネットワークと物理論文の引用ネットワークの話題の出現・消滅にも応用した | 2 つの節点が同じ塊に入った回数の割合（共所属行列、手法の標準的な記述）を新しい重みに使う。複数の分割から合意分割を取ることで、乱数による揺れを減らす | 「ある程度一意」の要望に直結する。Leiden を乱数の種を変えて 100 回など走らせ、共所属の頻度が高い単元の組を分野の核とし、揺れる単元を「境界」と明示できる | R27 |
| 合意の科学地図（Toward a Consensus Map of Science） | Klavans & Boyack 2009（JASIST 60(3):455-476、DOI 10.1002/asi.20991） | 既存の 20 の科学地図を共通の高水準分野とその関係に落とし、半数以上の地図に現れる辺を合意の辺として合意地図を作った。合意地図は円形になり、弱い辺を刈ると数学から社会科学へ伸びる階層が現れ、1 次元（リーマン）版も提案した（抄録による） | 強さは「何割の地図に辺が現れるか」。方法が違っても共通に見える構造を「一意な骨格」とみなす考え方 | 方法（共起の正規化、配置法、解像度）を変えて作った複数の地図で共通に現れる単元群と辺を「動かない骨格」として採り、方法依存の部分は暫定とする整理に使える | R28 |
| 科学の骨格の地図（類似度尺度 8 種の比較） | Boyack, Klavans & Börner 2005（Scientometrics 64(3):351-374、DOI 10.1007/s11192-005-0255-6） | SCI・SSCI の 7,121 誌について、雑誌の類似度の測り方 8 通りを構造の正確さを基準に比べ、科学全体の地図（骨格）を作った（二次資料の「5 種」は食い違いで、原論文の抄録の 8 種が正）。尺度の名前と優劣の結論は全文で未確認 | 類似度の選び方で地図が変わることを比較実験で示した位置づけ。約 7,000 誌を 212 の塊にしたという数は、二次資料が当該論文の地図の数字として報告するもので、Sandia 報告 SAND2005-7538 自体は開けず、二次情報として扱う | 尺度の違いが地図に影響するため、強さの測り方（生の本数、association strength、cosine など）を比較し、結果が尺度に依存する部分を明示する手続きの先例 | R29 |
| 論文単位の分類と 3 種の引用関係の比較 | Waltman & van Eck 2012（JASIST 63(12):2378-2392、arXiv:1203.0532）、Boyack & Klavans 2010（JASIST 61(12):2389-2404）、Klavans & Boyack 2017（JASIST 68(4):984-998、arXiv:1511.05078）、Šubelj, van Eck & Waltman 2016（PLOS ONE 11(4):e0154404、arXiv:1512.09023） | Waltman と van Eck は、直接引用関係で論文を研究領域に塊化し、階層を作って約 1,000 万件に適用した（抄録まで確認。階層の層数や分野数は一次資料で未確認）。Boyack と Klavans（2010）は生物医学約 215 万件（2,153,769）で、書誌結合が共引用よりわずかに正確で直接引用が最も劣ると報告したが、Klavans と Boyack（2017）は参考文献 100 件以上の論文での参考文献の集中度を基準に、直接引用が最も正確と報告した | 関係の種類（直接引用、書誌結合、共引用）で地図の正確さが変わり、優劣は評価基準で逆転する。Šubelj らは多数の塊化法を比べ、マップ方程式系が総合で良く、望ましい性質の間にトレードオフがあるとした。外部の基準がなければ一意な正解はない | 前提の線・論題の共起・uses は種類の違う関係で、どれが地図を良くするかは評価基準に依存することの先例。種類ごとに別の地図を作って比べ、基準（単元の本文の語の近さ、学年の順など）を決めてから重みを決める | R30（直しあり） |
| OpenAlex Topics の作り方 | OpenAlex（Leiden 大学 CWTS と共同）の Topics 分類。確かめ役が開いたのは現行のヘルプ文書で、版により数字と方法が違う | 論文を引用関係で塊にし、LLM で名前と説明を付け、Scopus の ASJC で小分野・分野・領域に対応づける。現行のヘルプ文書では領域 4・分野 26・小分野 252・Topics 4,516 の 4 層で、分類器は、タイトル・抄録・誌名を使う微調整 Qwen3-8B（200 万件、ラベルは Claude 系モデル）とされる | 係の「引用関係を拡張直接引用法と Leiden で塊化、約 4,521 の微小塊を GPT-3.5 Turbo 系でラベル付け、深層学習の分類器」は 2023 年版の記述で現行とは異なる。現行のヘルプ文書は塊化アルゴリズムを名指ししておらず、Leiden・拡張直接引用は Zenodo 側の記述で未確認。塊は関係から機械的に作り、名前は後から付ける順 | 「関係から塊を見つけ、その後で分野の名前をつける」という施主の手順そのものの先例。塊の命名に LLM を使い、上位の層は既存の分野（いまの 20 分野）に対応づける設計が実例で裏づけられる | R31（直しあり） |
| 全体地図（Leydesdorff と Rafols） | Leydesdorff & Rafols 2009（JASIST 60(2):348-362、DOI 10.1002/asi.20967、arXiv:0911.1057）。比較として Ahlgren, Jarneving & Rousseau 2003（JASIST 54(6):550-560、DOI 10.1002/asi.10242） | 雑誌間の引用行列を ISI の主題カテゴリで集計し、探索的因子分析で 14 因子の解を得た。地図（14 因子、172 カテゴリ、6,164 誌）を公開し、個々の雑誌の分類が不正確でも、集計すれば誤りが平均化され大規模構造は信頼できると論じた | Ahlgren らの対象は雑誌でなく著者共引用分析（ACA）の類似度で、Pearson の r が彼らの 2 要件を満たさないと指摘し、代案として cosine 等を提案したのは Ahlgren ら自身（後の議論ではない）。White 2003（JASIST 54(13):1250-1259）は Pearson でも結果の塊は大差ないと反論しており、Pearson 不可とは断定できない | 疎な単元の関係では Pearson を避け、cosine か association strength を使う根拠の一つ。単元レベルの個別の誤りは分野レベルの集計では平均化されるので、分野名は粗い層で決め、単元の位置は暫定とする整理に使える | R32（直しあり） |

## 確かめられなかったもの

- **IEEE 1484.12.1 学習オブジェクトメタデータ（LOM）の Relation カテゴリ**（IEEE 1484.12.1-2002、改訂 2020）：
  - 理由：確かめ役が確認できたのは、Relation カテゴリが kind（管理語彙）と resource の対でできている点だけ（DCMI の対応表の記述による）。kind の語彙（ispartof/haspart など）は規格本文でも LTSC の RDF 語彙でも確認できず、Dublin Core の関係語 11 語との一致も、その頁が LOM に触れないため言えなかった。語彙・向き・推移性・強さはすべて未確認のままで、係自身も記憶と書いていた。Wikipedia は出典として弱い
  - 確かめ役が開いた資料：R18。確認するなら http://ltsc.ieee.org/rdf/lomv1p0/vocabulary# か IEEE 1484.12.1-2020 の本文を当たる（確かめ役の案）

### 本文から外した細部

確かめ役が確認できなかったか、誤りと指摘した細部は、本文から外した。主なもの：

- 1EdTech CASE の「v1.0 は 2017-07-07」と「isChildOf が非常に多く文書が大きくなるという運用上の注意」（取得範囲では確認できなかった）
- OBO RO の「契約は推移しない」という引用（確かめ役は contained_in（収容）の誤訳と見る）
- Learning Commons で「standards 間の関係が 4 型」とした記述（standards をつなぐのは 2 つ）と、teaches などを整合の属性とした記述
- 知識空間論の確率版が局所独立性を「緩める」という記述（誤り）
- Waltman & van Eck 2012 の「3 層」「最細で 2 万 2 千超」「関連度決定・塊化・ラベル付けの 3 段」「2 層目 672」（抄録で確認できず）
- OpenAlex の「小分野 254」（現行は 252）
- Leydesdorff & Rafols の「後の議論で cosine が代案とされた」（誤り）
- Pan ら 2017 の「文脈・構造・意味の特徴」という言い方（確認できず）

## 批評役が足した研究

批評役が、渡された一覧の漏れとして挙げた研究。確かめは批評役のみで、確かめ役による照合は受けていない。批評役は検索で題名・年・要旨を確認したが、細部（数値など）には未確認と明記されたものがある。「みちすじへの使い方」の列は、批評役の「なぜ要るか」を写した。

| 名前 | 著者と年 | 何を示したか | 関係の種類・強さ・配置と塊について言っていること | みちすじへの使い方 | 出典 |
|---|---|---|---|---|---|
| Infomap（マップ方程式）：Maps of random walks on complex networks reveal community structure | Rosvall & Bergstrom 2008（PNAS 105:1118-1123、DOI 10.1073/pnas.0706851105） | 向きと重みのあるグラフの流れ（ランダムウォーク）を圧縮して塊を見つける。引用データで 6,000 超の雑誌の地図にした実績がある | 重み付き・有向をそのまま扱え、Lancichinetti & Fortunato 2009 の比較でも上位 | 前提の線は向きをもつので、無向前提のモジュラリティ系の欠落を補う | R33 |
| ブートストラップによる塊の有意性：Mapping change in large networks | Rosvall & Bergstrom 2010（PLoS ONE 5(1):e8694） | 辺を再標本化して塊の割り当てが何割で保たれるかを測る安定性の確かめ方。検索で確認した範囲では、95% 以上で保たれた割り当てを有意とする。1000 回などの数字は本文での再確認が必要（未確認） | 塊の有意性（割り当てが保たれる割合）を測る | 「塊は一意か」の検査に直結する | R34 |
| モジュラリティ最大化の実際：The performance of modularity maximization in practical contexts | Good, de Montjoye & Clauset 2010（Phys. Rev. E 81:046106） | モジュラリティには近い得点の最適解が指数的に多く、実行ごとに分割がずれることを示した | 単一実行の分割は不安定で、多数の解の合意か生成モデルを使うべきという根拠 | 「ある程度一意」を目指すなら、単一実行の分割を採用しない根拠になる | R35 |
| 確率ブロックモデル：Statistical inference of assortative community structures / Nonparametric weighted stochastic block models | Zhang & Peixoto 2020（arXiv 2006.14493）、Peixoto 2017/2018（Phys. Rev. E、arXiv 1708.01432） | ベイズ的な確率ブロックモデルで塊の数を推定でき、階層も出る。モジュラリティの解像度限界を避け、過剰分割・過少分割を避けると報告するが、これは著者自身の比較で、独立の再現は未確認 | 重み付きの辺を扱う非パラメトリックなモデル（題名による）。塊の数をモデルから推定する | 「分野の数を人が決めない」分け方として使える | R36 |
| 多層ネットワークの塊：Community structure in time-dependent, multiscale, and multiplex networks | Mucha, Richardson, Macon, Porter & Onnela 2010（Science 328:876-878、DOI 10.1126/science.1184819） | 複数種類の辺（multiplex）を層として持ち、層間の結合 1 つのパラメータで塊の対応を制御する | 辺の種類ごとに層を分け、層間の結合で塊を同時に探す | needs・同じ論題・uses を別の層に置いて同じ塊を探す設計の直接の先例。種類ごとの重みの置き方の検討に使う | R37 |
| 重み付き辺の多尺度の骨格：Extracting the multiscale backbone of complex weighted networks（disparity filter） | Serrano, Boguñá & Vespignani 2009（PNAS 106:6483-6488、DOI 10.1073/pnas.0808904106） | 重み付き辺を、各ノードの局所的な重み分布に対する帰無モデルで検定し、有意な辺だけ残す。全体に同じ閾値を使うと局所の多尺度構造が壊れると主張 | 辺の重みの有意性を局所の帰無モデルで検定する | 単元ごとに本数が違う（線が多い単元と少ない単元）みちすじで、辺の間引きと強さの検定に使える | R38 |
| 塊検出法の比較：Community detection algorithms: a comparative analysis | Lancichinetti & Fortunato 2009（Phys. Rev. E 80:056117、DOI 10.1103/PhysRevE.80.056117） | LFR ベンチマークで多くの手法を比べ、Infomap・Louvain・Ronhovde-Nussinov の良好さを報告した | 既知の塊を植えたベンチマークで手法を比べる | 「既知の分け方を植えたグラフで手法が見つけるか」を確かめる基準になる | R39 |
| Isomap：A global geometric framework for nonlinear dimensionality reduction | Tenenbaum, de Silva & Langford 2000（Science 290:2319-2323） | 局所の近さからグラフ上の最短距離（測地距離）を作り、MDS で全体の配置にする。Laplacian eigenmaps（Belkin & Niyogi 2003）は今回の検索では確認できず、未確認として扱う | 前提の線の鎖がそのまま距離になる | 3D 配置の距離の定義の選択肢 | R40 |
| 専門家への質問による知識空間の構築：How to build a knowledge space by querying an expert | Koppen & Doignon 1990（J. Math. Psychol.。検索で題名と年のみ確認、詳細は未確認） | 学習者のデータなしで、専門家への質問から前提の構造（準順序）を作る方法 | 作るのは強さでなく「あるか／ないか」の構造で、強さは別に決める必要がある | 学習者データなしで前提の構造を作る場合の先例 | R41 |

## 批評役の設計の案

以下は、批評役が書いた設計の案を、意味を変えずに番号つきで写したもの。批評役の判断であり、確かめ役の照合や主会話の判断は受けていない。批評役は冒頭に次の注を付けた。「下記は、渡された一覧と今回確かめた研究にもとづく設計案で、みちすじ向けの組み合わせ自体は私の判断である。学習者データなしの前提の強さの決め方は、検索した範囲では決定版が見つからなかった（UPReG、iPRL など教師なし・テキスト系は存在するが、強さの根拠は評価が難しいと著者自身が述べている）。」

1. 関係の種類：needs（前提）、同じ論題（網羅表）、uses を混ぜて 1 本にしない。Mucha ら 2010 の multiplex の考え方で層として分けて持つ。語彙は ISO 25964 の BT/NT/RT と SKOS（broader/related）、OBO RO、1EdTech CASE の CFAssociation にならい、「前提」「同じ論題」「使う」を型として明示する。Alexiev ら 2016 の BTG/BTP/BTI が示す通り、階層関係は推移的でない型があるので、前提を無条件に推移させない。
2. 強さの測り方：前提の線は Knowledge Space Theory の surmise 関係（Doignon & Falmagne）の「あるかないか」を骨格とし、強さは学習者データなしに決める。候補は (a) 同じ論題に並ぶ回数や uses の出現回数、(b) 本文の参照距離 RefD（Liang ら 2015）、(c) 前提の鎖の直接性（推移簡約で直接の線かどうか）。(b) は評価が難しいので、採用するなら Gagné & White 1978 / White 1974 の学習階層の検証が示すように、後で少数の学習者の正答の並びで確かめる計画を付ける。
3. 正規化：共起・同論題の本数は van Eck & Waltman 2009 に従い association strength（確率的な期待値で割る）で正規化する。次数の大きい単元に引きずられないようにする。重みの有意性は Serrano ら 2009 の disparity filter で、単元ごとに有意な線だけ残す。
4. 配置：van Eck ら 2010 の VOS（類似度をつつむ配置）を第一候補とし、MDS は使わない（比較で VOS が優れるとされる）。距離を前提の鎖で作りたい場合は Isomap（Tenenbaum ら 2000）の測地距離を試し、2 つの配置を比べる。「ある程度一意」の確認は、初期値違いの複数回の配置を回転・拡大して合わせ、単元ごとの位置のずれを測る。
5. 分野の見つけ方：地図化と塊の分けを同じ目的関数で行う Waltman ら 2010 に従い、同じ重みを配置と塊に使う。手法は Leiden（Traag ら 2019）で解像度を段階的に動かす。ただし Fortunato & Barthélemy 2007 の解像度限界と Good ら 2010 の解の縮退があるので、単一実行や単一解像度の結果を採用せず、Infomap（Rosvall & Bergstrom 2008、向き付きの前提に合う）やベイズ的ブロックモデル（Peixoto 系）も並べて比べる。OpenAlex Topics や Klavans & Boyack 2017 のように、塊に付ける名前は後から、中の単元の語から人が決める。
6. 安定の確かめ：Lancichinetti & Fortunato 2012 の合意クラスタリングで多数回の分割から共起行列を作り直して分ける。さらに Rosvall & Bergstrom 2010 のブートストラップ（辺を再標本化し、保たれた割合を単元ごとに出す）を使い、保たれない単元は「境界」と明示する。辺の種類ごとの重みを変えて（2 の層の比を振って）塊が変わるかも調べ、変わらない塊だけを分野の名前の候補にする。
7. 検証：Lancichinetti & Fortunato 2009 の考え方で、既知の分け方（いまの 20 分野）を植えたグラフを作り、手法がそれを取り戻すか先に確かめる。「解がない」と言う前に既知の解で試す方針とも合う。最後に、Boyack ら 2005 と Klavans & Boyack 2009 のように、複数の類似度や手法の結果の合意を地図の根拠にする。

## 出典

取得日はすべて 2026-11-12 です。R01〜R32 は確かめ役が開いた URL（R04 のみ、係が示した出典で確かめ役が開いたとは限らない）、R33〜R41 は批評役が示した URL で、確かめ役による照合は受けていません。利用条件は調べていないため、すべて「未確認」です。

| 記号 | 題名 | URL | 利用条件 |
|---|---|---|---|
| R01 | kstMatrix vignette（知識空間論） | https://www.icesi.edu.co/CRAN/web/packages/kstMatrix/vignettes/kstMatrix.html | 未確認 |
| R02 | Hockemeyer ほか, Applying competence prerequisite structures（J.UCS 9(12)） | https://www.jucs.org/jucs_9_12/applying_competence_prerequisite_structures/Hockemeyer_C.html | 未確認 |
| R03 | On validating learning hierarchies（Phillips & Kane 1974。White 1974 ではない） | https://feraonline.org/article/10-on-validating-learning-hierarchies/ | 未確認 |
| R04 | The validation of a learning hierarchy（White 1974 の書誌、係が示した出典） | https://www.bohrium.com/paper-details/the-validation-of-a-learning-hierarchy/811933042099617793-5205 | 未確認 |
| R05 | DREME: Systematic review of learning trajectories in early mathematics | https://dreme.stanford.edu/publication/systematic-review-of-learning-trajectories-in-early-mathematics | 未確認 |
| R06 | Teachers College: Learning progressions の報告の紹介 | https://www.tc.columbia.edu/articles/2009/july/new-report-by-tc-based-researchers-explores-learning-progres | 未確認 |
| R07 | Novak & Cañas: The Theory Underlying Concept Maps and How to Construct and Use Them | https://users.cs.northwestern.edu/~paritosh/papers/sketch-to-models/Novak-Canas-TheoryUnderlyingConceptMapsHQ.pdf | 未確認 |
| R08 | ACL Anthology: Measuring Prerequisite Relations Among Concepts（EMNLP 2015、D15-1193） | https://aclanthology.org/D15-1193/ | 未確認 |
| R09 | ACL Anthology: Crowdsourced Comprehension（BEA 2012、W12-2037） | https://aclanthology.org/W12-2037/ | 未確認 |
| R10 | ACL Anthology: Modeling Concept Dependencies in a Scientific Corpus（P16-1082） | https://aclanthology.org/P16-1082/ | 未確認 |
| R11 | ACL Anthology: Prerequisite Relation Learning for Concepts in MOOCs（P17-1133） | https://aclanthology.org/P17-1133/ | 未確認 |
| R12 | arXiv 1811.12640: Inferring Concept Prerequisite Relations from Online Educational Resources | https://arxiv.org/abs/1811.12640 | 未確認 |
| R13 | AMiner: Prerequisite-driven Deep Knowledge Tracing | https://www.aminer.org/pub/5c2ffab33a55ac1a8c59730d/prerequisite-driven-deep-knowledge-tracing | 未確認 |
| R14 | ISKO Encyclopedia: Thesaurus | https://www.isko.org/cyclo/thesaurus | 未確認 |
| R15 | AMiner: On the composition of ISO 25964 hierarchical relations (BTG, BTP, BTI) | https://www.aminer.org/pub/5736956f6e3b12023e492dc5/on-the-composition-of-iso-hierarchical-relations-btg-btp-bti | 未確認 |
| R16 | W3C: SKOS Simple Knowledge Organization System Reference | https://www.w3.org/TR/skos-reference/ | 未確認 |
| R17 | PMC: Relations in biomedical ontologies（Smith ら 2005） | https://pmc.ncbi.nlm.nih.gov/articles/PMC1175958 | 未確認 |
| R18 | DCMI: RDF relation types（LOM の確認に使ったが確かめられなかった） | https://www.dublincore.org/specifications/dublin-core/rdf-relation-types/ | 未確認 |
| R19 | 1EdTech: CASE v1.1 Information Model | https://standards.1edtech.org/case/specifications/standards/v1p1/im | 未確認 |
| R20 | AMS: Using the MSC | https://ams.org/msc/useMSC.html | 未確認 |
| R21 | Learning Commons: Academic standards の実体と関係の参照 | https://docs.learningcommons.org/knowledge-graph/entity-and-relationship-reference/academic-standards | 未確認 |
| R22 | EconPapers: How to normalize cooccurrence data?（van Eck & Waltman 2009） | https://econpapers.repec.org/RePEc:bla:jamist:v:60:y:2009:i:8:p:1635-1651 | 未確認 |
| R23 | arXiv 1003.2551: A comparison of two techniques for bibliometric mapping | https://arxiv.org/abs/1003.2551 | 未確認 |
| R24 | arXiv 1006.1032: A unified approach to mapping and clustering of bibliometric networks | https://arxiv.org/abs/1006.1032 | 未確認 |
| R25 | arXiv 1810.08473: From Louvain to Leiden | https://arxiv.org/abs/1810.08473 | 未確認 |
| R26 | arXiv physics/0607100: Resolution limit in community detection | https://arxiv.org/abs/physics/0607100 | 未確認 |
| R27 | arXiv 1203.6093: Consensus clustering in complex networks | https://arxiv.org/abs/1203.6093 | 未確認 |
| R28 | IDEAS/RePEc: Toward a consensus map of science | https://ideas.repec.org/a/bla/jamist/v60y2009i3p455-476.html | 未確認 |
| R29 | IDEAS/RePEc: Mapping the backbone of science | https://ideas.repec.org/a/spr/scient/v64y2005i3d10.1007_s11192-005-0255-6.html | 未確認 |
| R30 | arXiv 1203.0532: A new methodology for constructing a publication-level classification system of science | https://arxiv.org/abs/1203.0532 | 未確認 |
| R31 | OpenAlex ヘルプ: Topics | https://help.openalex.org/hc/en-us/articles/24736129405719-Topics | 未確認 |
| R32 | arXiv 0911.1057: A global map of science based on the ISI subject categories | https://arxiv.org/abs/0911.1057 | 未確認 |
| R33 | arXiv 0707.0609: Maps of random walks on complex networks reveal community structure（批評役） | https://arxiv.org/abs/0707.0609 | 未確認 |
| R34 | arXiv 0812.1242: Mapping change in large networks（批評役） | https://arxiv.org/abs/0812.1242 | 未確認 |
| R35 | arXiv 0910.0165: The performance of modularity maximization in practical contexts（批評役） | https://arxiv.org/abs/0910.0165 | 未確認 |
| R36 | arXiv 1708.01432: Nonparametric weighted stochastic block models（批評役） | https://arxiv.org/abs/1708.01432 | 未確認 |
| R37 | arXiv 0911.1824: Community structure in time-dependent, multiscale, and multiplex networks（批評役） | https://arxiv.org/abs/0911.1824 | 未確認 |
| R38 | arXiv 0904.2389: Extracting the multiscale backbone of complex weighted networks（批評役） | https://arxiv.org/abs/0904.2389 | 未確認 |
| R39 | arXiv 0908.1062: Community detection algorithms: a comparative analysis（批評役） | https://arxiv.org/abs/0908.1062 | 未確認 |
| R40 | Tenenbaum, de Silva & Langford 2000, Isomap（批評役が示した PDF） | https://people.engr.tamu.edu/rgutier/web_courses/csce666_s20/tenenbaum2000isomap.pdf | 未確認 |
| R41 | MaRDI portal: Koppen & Doignon 1990 の書誌（批評役） | https://portal.mardi4nfdi.de/wiki/Item:Q2277404 | 未確認 |

## みちすじの採る形

施主「関係性の本数だけではなく強度も、関係性の性質も要る。研究があればそれにしたがって整理してほしい」「（前提の線に種類と強さを付けることを）すすめてください」（2026-11-12）。上の研究にしたがい、次の形にする（D-117）。

1. **関係は種類ごとの層に分けて持つ**（Mucha ら 2010 の多層）。前提（必須。知識空間理論の surmise 関係）、代わりになる前提（択一。surmise system の OR）、同じ論題に並ぶ（関連。ISO 25964 の RT、SKOS の related）、問題が使う（CbKST の「問題 → 要る技能」）の 4 層。1 本の重みに混ぜない。
2. **前提の線に、種類と強さを付ける**（relations/needs.yaml）。種類は 6 つ：土台（概念をそのまま土台にする）、道具（技法・計算を中で使う）、一般化（先の単元が広げた枠）、応用（別の対象に当てはめる）、深める（同じ論題の次の段）、成熟（中身は直接使わず、考え方の慣れが要る）。強さは 3 段：3 は欠けると始められない、2 は一部で使う、1 はあると助かる。付け方は、係が単元の名前と頭注を読んで付け（Talukdar と Cohen 2012 の注釈の型）、一部を別の係が付けなおして一致の度合いを出す。学習の記録が集まったら、Gagné と White の逆転の比で前提の線を確かめなおす（前提は「確かめるべき仮説」、CPRE 2009）。
3. **同じ論題の強さ**は、論題ごとに分数で数え、association strength で正規化し（van Eck と Waltman 2009）、単元ごとに有意な線だけを残す（Serrano ら 2009 の disparity filter）。どこまで残すかは、塊の安定で決める。
4. **分野の塊**は、Louvain を種を変えて 30 回回して合意をとり（Lancichinetti と Fortunato 2012、1 回の分け方は一意でない：Good ら 2010）、解像度を動かして見る（Traag ら 2019、解像度の限界：Fortunato と Barthélemy 2007）。関係を 1 割抜いたゆさぶりで、単元ごとの保たれ方を出し、保たれない単元は「境目の単元」と書く（Rosvall と Bergstrom 2010）。方法の力は、答えの分かっている人工のグラフ（LFR）で先に測る（Lancichinetti と Fortunato 2009）。
5. **3D の配置**は VOS（van Eck ら 2010）を 3 次元で行う。初めの位置は固有値問題から決め（乱数に頼らない）、回転と裏返しは主軸で決め、ゆさぶりで位置のずれを測る。
6. **分野の名前**は、塊の中の単元名から大規模言語モデルが付け、別の係が確かめる（OpenAlex の Topics と同じ形）。いまの 20 の流れとの対応表を作り、分け方を捉えなおす材料にする。

### 初めの結果（2026-11-12、前提の線の種類と強さを付ける前）

- 関係の層：前提 3,927 本、代わりの前提 40 本、同じ論題 7,056 本（有意な線だけにすると 539 本）、問題が使う 384 本。合わせた類似度は 1 つにつながる。
- 植えた分け方の試し（1,500 点、平均の線の数 6、混ざり 0.3、48 の塊）：合意の方法で 43 の塊、真の分け方との一致（NMI）0.59（1 回だけなら 0.52）。みちすじと同じくらいまばらな関係では、細かい分け方は一部しか取り戻せない。
- みちすじの関係（4 層、同じ論題は有意な線だけ）：解像度を粗くすると塊 14〜18。関係を 1 割抜くゆさぶりを 5 回して、分け方の一致（ARI）は平均 0.75、95% 以上の回で同じ塊に残る単元は 6 割強、80% 以上は 8 割弱。いまの 20 の流れとの一致は低い（ARI 0.27、NMI 0.51）。関係から見る分野は、いまの流れとかなりちがう。

### 前提の線の種類と強さ（2026-11-12）

relations/needs.yaml に、前提の線 3,927 本の種類と強さを付けた（係 65 束、1 割を別の係が付けなおした）。

- 種類：土台 1,734、道具 1,395、深める 313、疑い 310、成熟 103、応用 37、一般化 35。
- 強さ：3 が 1,590、2 が 1,662、1 が 675。
- 付けなおし（417 本）との一致：種類 71%（κ 0.56、「中くらい」）、強さ 76%、強さの差 1 以内 100%。食いちがいの多い組は 土台と道具（52 本）、土台と深める（27 本）。種類は目安、強さは確かめられた値として使う。
- 疑い（前提として要らないように見える線）は 310 本（8%）。付けなおしでも 37 本中 25 本が疑いになった。地図の前提の線の見直しの候補になる。　**見直した（2026-11-12）**：2 係（判定と反証）と取りまとめで、外す 216、替える 83、残す 11。前提の線は 4,291 本から 4,075 本、深さが変わった単元 878（docs/research/needs-review.md）。

### 関係から見つけた分野と 3D の配置（2026-11-12）

- **分野**（relations/fields.yaml）：4 層の関係で、同じ論題の重みを変えた 3 つの設定（そのまま、2 倍、強さつき）ごとに合意の塊を作り、3 設定の合意をもう一度とった。設定どうしの一致（ARI）は 0.76〜0.96。
  - **あとで見つけた誤り**：前提の線に種類と強さの重みを付けるはずだったが、計算では重みが配線されておらず、どの線も 1 だった。「強さつき」の設定は、実際には重みのない新しいデータの「そのまま」と同じ入力になる。「そのまま」の設定は 13:50 より前のデータ（最難関 7 問の uses を足す前）で回していた。そのため「重みを付けても分野はほとんど変わらない」とは言えない。重みを配線した 1 段目の分け方と重みなしとの一致は ARI 0.80（強さだけなら 0.82、種類だけなら 0.86。係の試し）。地図を広げる 4 セッションのあと、tools/fields/ の正の手順（強さ×種類の重み、層の比だけを変えた 3 設定の合意）で作りなおし、名前も付けなおす。17 の塊のうち 10 単元に満たない 4 つを関係のいちばん多い分野に入れ、13 の分野と 119 の細かい分野にした。3 設定とも同じ仲間で、ゆさぶりでも 8 割以上同じ塊に残る単元は 79%（のこりの 313 単元は境目の単元）。
- **名前**：塊ごとに 2 つの係が別々に名前を付け、3 つ目の係がくらべて決めた（確立した分野名、「〇と〇」で寄せ集めない）。純粋数学、生命科学、数学（算数から高校まで）、情報科学（統計を含む）、現代物理学、地球科学、化学、航空宇宙工学、構造工学、電気電子工学、金融・経済学、心理学・認知科学、天文学。
- **いまの 20 の流れとのちがい**（一致 ARI 0.33）：数学は内容でなく段（学校と大学）で分かれる。生物・医学・農学は 1 つの生命科学にまとまる。統計は情報科学に入る。工学は航空宇宙・構造・電気電子の 3 つに分かれ、物理の力学・電磁気の一部がそれぞれに入る。
- **3D の配置**（はじめの版。横から見ると平たかったので、次の節で置き方を選びなおした。VOS、min Σ s_ij d_ij² − Σ d_ij を上界で押さえて下げる方法）：初めの位置を 3 通りにずらしても同じ配置に着く（ずれ 0.000、近所 10 単元の重なり 0.999〜1.000）。関係を 1 割抜くと、位置のずれの中央値は半径の 3%、近所 10 単元の重なりは 0.80〜0.82。近傍の保存（関係の強い 10 単元のうち 3D で近い 10 単元に入る割合）は 0.34（MDS は 0.19）。
### 3D の配置が平たい理由と、置き方の選びなおし（2026-11-12、D-121）

施主「この方向から見るとなんかすごい平たいですね」「分野間の相関をかんがえればそれは平面にならないのでは」。VOS の配置は、3 本の軸の広がり（主軸ごとの標準偏差の比）が 1 : 0.72 : 0.22 で、横から見ると板のようだった。

**原因の確かめ**（計算は scratchpad の flat.py。式の勾配は差分と相対誤差 4×10⁻⁷ で一致）

- 4 次元・6 次元で解いても、4 本目からの軸は 0 で、3 本目は 0.22 のまま。まったくの乱数の初めからも同じ配置に着く。局所解ではなく、VOS とこのデータの組の答えが平たい。
- 分野どうしの関係は平面に収まらない。たとえば現代物理学・天文学・電気電子工学・航空宇宙工学は、どの 2 つも互いの関係の上位 4 つに入る（4 つを等しく近く置くには平面でなく三角すいが要る）。13 の分野だけを 12 次元まで使って置くと、VOS は 1 : 0.48 : 0.15 : 0.05 と平面に寄るが、押し合いを距離の対数にした形は 1 : 0.69 : 0.47 : 0.42 : 0.14 で、4 次元ほどに広がる。
- VOS の押し合い（−Σ d）は、近くても遠くても同じ強さの力になる。遠い大きな塊どうしの押し合いが全体を長い 1〜2 本の向きに引き延ばし、詰まって薄くなった向きをふくらませる力がない。Chen と Buja（2013）も、押し合いは点が並ぶ向きに効き、それと直角の向きには効かず配置がつぶれると書く。VOS はもともと 2 次元の地図のための方法である（Waltman ら 2010 は「位置は p 次元、ふつう p = 2」とし、2 次元を超える関係はふつう見えないと結ぶ）。

**押し合いの形を変えた試し**（Noack 2007・2009 の (a, r) エネルギーの族。E = Σ a_ij d^A / A − Σ d^R / R、R = 0 は log。A と R はエネルギーの指数で、Noack 2009 の力の指数より 1 大きい。引き合いの重みは VOS と同じ association strength。データは地図を広げる前の 1,523 単元）

| 形 (A, R) | 3 本の軸の広がり | 近傍の保存 | 近所 10 単元のうち同じ分野 | 乱数の初め 3 回：ずれ／近所の重なり | 関係を 1 割抜く 3 回：ずれ／近所の重なり | 1 回の時間 |
|---|---|---|---|---|---|---|
| (2, 1) VOS | 1 : 0.72 : 0.22 | 0.34 | 0.77 | 0／1.00 | 2.5〜3.3%／0.80〜0.81 | 約 2 分 |
| (2, 0.5) | 1 : 0.78 : 0.38 | 0.38 | 0.79 | 0／1.00 | 2.6〜3.1%／0.83〜0.84 | 約 2 分 |
| **(2, 0) 押し合いが距離の対数** | **1 : 0.81 : 0.48** | **0.40** | **0.80** | **0〜1.3%／0.95〜1.00** | **2.8〜3.1%／0.83〜0.85** | **約 2 分** |
| (3, 0) | 1 : 0.83 : 0.56 | 0.34 | 0.73 | 0／1.00 | 2.9〜3.0%／0.83〜0.84 | 約 2 分 |
| (1, −1) 押し合いが距離に反比例 | 1 : 0.83 : 0.52 | 0.52 | 0.86 | 7〜21%／0.82〜0.87（3 回とも別の配置で、どれもエネルギーが高い） | 6.9〜7.6%／0.82〜0.83 | 約 27 分 |
| (1, 0) LinLog | 1 : 0.73 : 0.21 | 0.47 | 0.85 | （測らず） | （測らず） | 39 分で収束せず |

ずれは、合わせ込み（回転・裏返し・拡大）のあとの動いた距離の中央値を、配置の半径で割ったもの。(2, 0) の乱数の初めは 3 回のうち 2 回が MDS の初めと同じ配置に着き、1 回はエネルギーがわずかに高い配置で止まった。(2, 0) を 4 次元・6 次元で解くと 1 : 0.79 : 0.45 : 0.32、1 : 0.79 : 0.44 : 0.29 : 0.20 : 0.06 で、この形ではデータは 3 次元より少し広がり、3D はそれを縮めて見せる。

**(2, 0) を選ぶ**

- 施主の求める「ある程度一意に決まる 3D 地図」を第一にする。(1, −1) は近傍をよく保つが、初めの位置で全体の配置が 7〜21% 動くので、一意に決まる地図にならない。
- わけ（自分の導き）：位置の内積の行列（グラム行列）G で書くと d_ij² = G_ii + G_jj − 2G_ij は G の 1 次式になる。引き合いが距離の 2 乗（A = 2）なら引き合いの項は G の 1 次式、押し合いの −log d = −½ log d² も −d も G の凸関数なので、すべての次元で解く問題は凸になり、いちばん小さい答えが 1 つに決まる。A = 1（LinLog、(1, −1)）は d = √(1 次式) が凹なので凸にならない。VOS が完全に同じ配置に着いたのは、全次元の答えがもともと 3 次元（4 本目から 0）だったためである。(2, 0) は全次元の答えが 3 次元より広いので、3D は次元を制限した問題になり、完全には一意でない（2 回に 1 回以上同じ、ちがっても近所の重なり 0.95）。
- 計算は tools/fields/place3d.py。初めの位置は古典的 MDS で、L-BFGS で解く。乱数は使わない。

**3 本目の軸の使い方の先例**（係が調べ、別の係が出典を読みなおして確かめた）

- 球面に置く：UCSD の科学地図（Börner ら 2012）は 3 次元の球面に置いた。理由は、地図の左右上下の縁をなくすこと。読む図は、そこから導いた 2D のメルカトル図と円形の図。
- 高さに別の量をあてる：Skupin と Fabrikant（2003）は 2D の配置に補間した地形を足し、高さを話題のまとまり具合（上位 3 語の支配の度合い）にした。学習の段や前提の深さを高さにした先例は見つからなかった。
- 科学の地図の形：20 の地図の合意は輪になる（Klavans と Boyack 2009）。2 次元に置くのは「2 次元の地図が要るから」で、次元を測った結果ではない（Boyack ら 2005）。網の内在次元を測って報告した科学地図は見つからなかった。
- 3D が 2D より読みやすいかは、まちまち（空間の記憶では差がなく主観では 3D が好まれた Cockburn と McKenzie 2002、網の経路の追跡では 3D が誤りが少ない Ware と Mitchell 2008）。

| 出典 | URL | 取得日 |
|---|---|---|
| Noack, A. (2009) Modularity clustering is force-directed layout. Physical Review E 79, 026102 | https://arxiv.org/abs/0807.4052 | 2026-11-12 |
| Noack, A. (2007) Energy models for graph clustering. JGAA 11(2), 453–480 | https://jgaa.info/index.php/jgaa/article/view/paper154 | 2026-11-12 |
| Chen, L. & Buja, A. (2013) Stress functions for nonlinear dimension reduction, proximity analysis, and graph drawing. JMLR 14, 1145–1173 | https://jmlr.org/papers/v14/chen13a.html | 2026-11-12 |
| Waltman, L., van Eck, N.J. & Noyons, E.C.M. (2010) A unified approach to mapping and clustering of bibliometric networks. Journal of Informetrics 4(4), 629–635 | https://arxiv.org/abs/1006.1032 | 2026-11-12 |
| Börner, K. ら (2012) Design and update of a classification system: the UCSD map of science. PLoS ONE 7(7): e39464 | https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0039464 | 2026-11-12 |
| Skupin, A. & Fabrikant, S.I. (2003) Spatialization methods: a cartographic research agenda for non-geographic information visualization. Cartography and Geographic Information Science 30(2), 95–115 | https://user.geo.uzh.ch/sfabri/pubs/skupin_fabrikant_cagis_b.pdf | 2026-11-12 |
| Klavans, R. & Boyack, K.W. (2009) Toward a consensus map of science. JASIST 60(3), 455–476 | https://ideas.repec.org/a/bla/jamist/v60y2009i3p455-476.html | 2026-11-12 |
| Boyack, K.W., Klavans, R. & Börner, K. (2005) Mapping the backbone of science. Scientometrics 64(3), 351–374 | https://cns.iu.edu/docs/publications/2005-boyack-mapbckbn.pdf | 2026-11-12 |
| Cockburn, A. & McKenzie, B. (2002) Evaluating the effectiveness of spatial memory in 2D and 3D physical and virtual environments. CHI 2002, 203–210 | https://www.csse.canterbury.ac.nz/andrew.cockburn/2d3d.html | 2026-11-12 |
| Ware, C. & Mitchell, P. (2008) Visualizing graphs in three dimensions. ACM Transactions on Applied Perception 5(1), 2 | https://scholars.unh.edu/ccom/467 | 2026-11-12 |

### 作りなおした分野（2026-11-12、D-122）

地図を広げた 4 セッションのあとのデータ（1,685 単元、前提の線 4,291 本、どれにも種類と強さ）で、正の手順（tools/fields/run.py、前提の線を強さ×種類で重み付け）で作りなおした。

- 層の比を変えた 3 設定（同じ論題 1 倍、2 倍、問題が使う単元 2 倍）の 1 段目は 16・17・17 の塊（10 単元以上 14・15・15）で、設定どうしの一致は ARI 0.77〜0.86。3 設定の合意は 19 の塊（10 単元以上 16）、30 回の一致 0.993。2 段目は 143 の細かい分野。
- 3 設定とも同じ仲間で、関係を 1 割抜くゆさぶりでも 8 割以上同じ塊に残る単元は 72%（のこりの 464 単元は境目の単元）。
- いまの 21 の流れとの一致は ARI 0.37（はじめの版は 0.33）。はじめの 13 分野との一致は ARI 0.82（共通の 1,523 単元）。
- はじめの版からの主な変化：情報科学が計算機科学・人工知能・統計学に分かれ、確率論（測度論的確率論と確率過程）が 1 つの分野になった。天文学は現代物理学の中の細かい分野になった。航空宇宙工学の 25 単元が構造工学に移った。新しい社会科学の流れ Y の 21 単元は 1 つの分野にならず、経済学 8、統計学 7（社会統計学、因果推論）、心理学 2 などに散った。小学校の力と電気の単元（13）が 1 つの分野になった（名前は初等物理学。はじめ「理科（小学校の力と電気）」としたが、ほかの分野名とそろわないので直した）。
- 名前：はじめの版と単元が重なる（Jaccard 0.5 以上）分野 11・細かい分野 95 は名前を引き継ぎ、残りの分野 5・細かい分野 48 は 2 つの係が別々に案を出し、3 つ目の係が選んだ。取りまとめが全部を読み、(1) 同じ名前が 2 つあるもの（神経科学 → 感覚生理学と認知神経科学、確率論 → 初等確率論と確率過程論、ロボットの 3 つ）、(2)「〇・〇」で 2 つの分野を並べたもの（金融・経済学 → 経済学、心理学・認知科学 → 心理学、数値予報・データ同化 → 数値予報 など 9）、(3) 中身に合わなくなった名前（数論幾何 → 数論、解析学基礎 → 関数解析、現代代数学 → 代数幾何学、有限要素法 → 計算力学、会計学 → 経営学 など）を直した。単元を別の塊へ移す案（係から 17）は採らない（塊は関係から計算で決める）。混じっている単元は about に書いた。
- 3D の配置（D-121 の (2, 0)）：3 本の軸の広がり 1 : 0.85 : 0.51、近傍の保存 0.41。乱数の初め 2 回とも同じ配置（ずれ 0、近所 10 単元の重なり 1.00）。関係を 1 割抜くと、ずれ 2.9〜4.0%、重なり 0.79〜0.84。同じデータの VOS は 1 : 0.77 : 0.23、近傍の保存 0.34。

| 分野 | 単元 | 細かい分野（単元の多い順に 4 つ） |
|---|---|---|
| 純粋数学 | 239 | 数論、偏微分方程式、複素解析、抽象代数学 |
| 生命科学 | 231 | 遺伝学、一般生物学、基礎医学、生理学 |
| 数学 | 212 | 幾何学、初等解析学、組合せ論、算数 |
| 現代物理学 | 210 | 量子力学、物性物理学、電磁気学、統計物理学 |
| 地球科学 | 116 | 地質学、固体地球物理学、大気海洋力学、大気海洋科学 |
| 計算機科学 | 113 | 計算機システム、アルゴリズム、グラフ理論、理論計算機科学 |
| 化学 | 105 | 化学基礎（小学校から高校まで）、物理化学、化学工学、有機化学 |
| 構造工学 | 100 | 計算力学、耐震工学、数値解析、構造力学 |
| 経済学 | 83 | ミクロ経済学、マクロ経済学、金融数学、金融経済学 |
| 統計学 | 59 | 数理統計学、初等確率論、統計的決定理論、因果推論 |
| 電気電子工学 | 51 | 通信工学、制御工学、ディジタル信号処理、統計的信号処理 |
| 心理学 | 47 | 応用心理学、認知心理学、神経工学、認知神経科学 |
| 人工知能 | 46 | 機械学習、ロボット工学、コンピュータグラフィックス、強化学習 |
| 航空宇宙工学 | 45 | 古典力学、宇宙工学、軌道力学、音響工学 |
| 確率論 | 15 | 確率過程論 |
| 初等物理学 | 13 | 初等物理学 |

### 地図を広げた第 2 回のあとの作りなおし（2026-11-12 夕）

疑いの線の見直し（前提の線 4,075 本）と第 2 回の 20 単元（1,705 単元）のあとに、tools/fields/run.py で作りなおした。

- 15 の分野と 139 の細かい分野。前の版（16 分野）との一致は ARI 0.91。いまの 21 の流れとの一致は 0.35。
- 大きな変化は 2 つ。前の統計学と心理学が 1 つの塊になり（統計 64、心理 33、神経科学 16 単元）、主の方の名前で「統計学」にした（心理学と神経科学は細かい分野）。前の航空宇宙工学と構造工学の一部が 1 つの塊になり、「機械工学」にした（構造工学は残りの 60 単元）。
- 名前は分野 13・細かい分野 124 を前の版から引き継ぎ、残りの 17 は 2 係と判定、取りまとめが直した（代数幾何学 → 表現論、因果推論 → 計量社会科学、統計的決定理論 → 臨床統計学 など、中身に合わなくなった名前）。
- サイトの 3D の配置は、回転と裏返しだけで前の配置に合わせて書いた（主軸の向きが入れかわり、そのままでは半径の 110% 動いて見えた。合わせたあとは 3.3%、近所 10 単元の重なり 0.84）。分野の色は、前と同じ名前の分野は同じ色の番号を引き継ぐ（relations/fields.yaml の color）。
- 2D の縦の並びは 1 本あたり 1,792 px（いまの roadmap.yaml の順なら 2,498 px）。

| 分野 | 単元 | 細かい分野（単元の多い順に 4 つ） |
|---|---|---|
| 純粋数学 | 248 | 微分積分学、偏微分方程式、数論、微分幾何学 |
| 生命科学 | 232 | 遺伝学、一般生物学、生態学、基礎医学 |
| 数学 | 211 | 初等解析学、幾何学、数量関係（算数から高校まで）、算数 |
| 現代物理学 | 208 | 量子力学、物性物理学、電磁気学、統計物理学 |
| 地球科学 | 128 | 大気海洋力学、地質学、固体地球物理学、大気海洋科学 |
| 統計学 | 115 | 心理学、数理統計学、神経科学、計量社会科学 |
| 計算機科学 | 111 | 計算機システム、グラフ理論、理論計算機科学、数理論理学 |
| 化学 | 101 | 物理化学、化学工学、物質の状態と熱、有機化学 |
| 経済学 | 83 | ミクロ経済学、マクロ経済学、金融数学、金融経済学 |
| 機械工学 | 82 | 古典力学、宇宙工学、空気力学、数値解析 |
| 構造工学 | 60 | 計算力学、耐震工学、構造力学、風工学 |
| 電気電子工学 | 51 | 統計的信号処理、通信工学、電子工学、ディジタル信号処理 |
| 人工知能 | 47 | 機械学習、コンピュータグラフィックス、ロボット工学、強化学習 |
| 確率論 | 15 | 確率過程論 |
| 初等物理学 | 13 | 初等物理学 |
