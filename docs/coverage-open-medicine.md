# 網羅表：医学の大きな未解決問題（HIV のワクチン、アルツハイマー病、がん、薬剤耐性菌など）

この頁は `tools/roadmap.py build` が `coverage-open-medicine.yaml` から作ります。手で直さないでください。
医学の大きな未解決問題（HIV のワクチン、アルツハイマー病、がん、薬剤耐性菌など）に要る論題ごとに、受け持つ単元か、入れない理由を書いています（R-09）。

範囲の根拠：Science 誌の "What Don't We Know?"（2005、HIV のワクチン、免疫の選択的な抑制、寿命の延長）、上海交通大学と Science 誌の 125 Questions（2021、老化、がん、神経変性疾患）、WHO の細菌の優先病原体の一覧（2024）、NIAID の万能インフルエンザワクチンの戦略計画（2018）、Cancer Grand Challenges（2023）。2026 年の状況は FDA の記録と論文で確かめた（2026-11-08）。

論題 7 のうち、単元が受け持つもの 7、すべての単元に通る軸が受け持つもの 0、入れないもの 0。

## 感染症

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-01 | HIV のワクチン：エイズのウイルスを防ぐワクチンはつくれるか（未解決。第 3 相の試験 Mosaico は 2023 年に効果なしで中止。予防の薬は年 2 回の注射（レナカパビル、2025 年に FDA が承認）まで来た） | I-005 免疫学（抗原認識と MHC、抗体の多様性、T 細胞の分化、サイトカイン、ワクチンの設計、腫瘍免疫）、B-043 微生物とウイルス（細菌の構造と増殖、培養と無菌操作、ウイルスの増え方、発酵）、B-053 遺伝子工学とゲノム編集（ベクターと遺伝子導入、CRISPR–Cas、遺伝子治療、mRNA と核酸医薬）、I-003 臨床試験と医薬品の開発（非臨床試験、臨床試験の相、無作為化比較試験、承認と規制、生命倫理） | OP080、OP081、OP082、OP083 |
| T-04 | 薬剤耐性菌：抗菌薬の効かない細菌にどう対抗するか（未解決。WHO は 2024 年に 24 の優先病原体を挙げ、カルバペネム耐性菌など 4 つを最重要とした） | B-043 微生物とウイルス（細菌の構造と増殖、培養と無菌操作、ウイルスの増え方、発酵）、B-042 進化のしくみ（自然選択、遺伝的浮動、ハーディ–ワインベルグの法則、種分化、系統樹）、I-001 薬理学（受容体と用量反応、作動薬と拮抗薬、酵素阻害、薬の作用と副作用）、H-056 医薬品化学（薬の標的、構造活性相関、リード最適化、薬らしさ、薬物代謝と構造） | OP087 |
| T-06 | 万能インフルエンザワクチン：毎年変わるウイルスに 1 回で長く効くワクチンはつくれるか（未解決。2026 年時点で承認されたものはない） | I-005 免疫学（抗原認識と MHC、抗体の多様性、T 細胞の分化、サイトカイン、ワクチンの設計、腫瘍免疫）、B-042 進化のしくみ（自然選択、遺伝的浮動、ハーディ–ワインベルグの法則、種分化、系統樹）、B-043 微生物とウイルス（細菌の構造と増殖、培養と無菌操作、ウイルスの増え方、発酵） | OP091 |

## 神経変性疾患

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-02 | アルツハイマー病などの神経変性疾患を治せるか（一部解決。アミロイドを除く抗体のレカネマブ（2023）とドナネマブ（2024）が進行を少し遅らせるが、治すことはできない） | B-068 神経遺伝学と脳の病気（神経発達症、神経変性疾患、精神疾患、神経薬理）、B-014 タンパク質の折りたたみ・誤った折りたたみ・凝集と品質管理、I-003 臨床試験と医薬品の開発（非臨床試験、臨床試験の相、無作為化比較試験、承認と規制、生命倫理） | OP050、OP084、OP085 |

## がん

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-03 | すべてのがんを治せるか：転移と薬剤耐性をどう防ぐか（未解決。がん細胞の可塑性による耐性と転移は Cancer Grand Challenges の課題） | I-023 がんの生物学（がん遺伝子と抑制遺伝子、がんの特徴、浸潤と転移、腫瘍の進化と不均一性、腫瘍の微小環境）、I-005 免疫学（抗原認識と MHC、抗体の多様性、T 細胞の分化、サイトカイン、ワクチンの設計、腫瘍免疫）、H-059 創薬の新しいモダリティ（フラグメント創薬、標的タンパク質分解と分子のり、ペプチド、抗体、核酸医薬） | OP050、OP092 |

## 免疫

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-05 | 免疫の選択的な抑制：自己免疫の病気や移植の拒絶で、害になる免疫だけを止められるか（一部解決。末梢の免疫寛容と制御性 T 細胞の発見で 2025 年のノーベル賞。CAR-T 細胞でループスの 8 人全員が寛解した（2024）が、自己免疫に承認された CAR-T はまだない） | I-005 免疫学（抗原認識と MHC、抗体の多様性、T 細胞の分化、サイトカイン、ワクチンの設計、腫瘍免疫）、B-053 遺伝子工学とゲノム編集（ベクターと遺伝子導入、CRISPR–Cas、遺伝子治療、mRNA と核酸医薬） | OP088、OP089、OP090 |

## 老化

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-07 | 老化を止められるか、人の寿命はどこまで延ばせるか（未解決。老化の 12 の特徴は整理されたが、人の寿命を延ばすと認められた方法はない） | B-112 老化の生物学（老化の特徴、テロメアと細胞老化、栄養感知の経路と寿命、エピジェネティックな時計、寿命を延ばす試みとその検証）、B-010 細胞生物学（膜と細胞小器官、輸送とシグナル伝達、細胞骨格、細胞周期）、I-003 臨床試験と医薬品の開発（非臨床試験、臨床試験の相、無作為化比較試験、承認と規制、生命倫理） | OP050、OP093、OP094 |

## 出典

| 記号 | 題名 | URL | 取得日 |
|---|---|---|---|
| OP050 | 上海交通大学・Science/AAAS, 125 Questions: Exploration and Discovery（2021、12 分野の 125 問の全文。science.org の頁は 403 で、上海交通大学の掲載で確かめた） | https://news.sjtu.edu.cn/mtjj/20210412/145693.html | 2026-11-08 |
| OP080 | J. Cohen, Is an Effective HIV Vaccine Feasible?（Science 309, 99 (2005)。書誌を PubMed で確かめた） | https://doi.org/10.1126/science.309.5731.99 | 2026-11-08 |
| OP081 | B. F. Haynes ほか, Status of HIV vaccine development: progress and promise（J. Int. AIDS Soc. 28, e26489 (2025)） | https://pmc.ncbi.nlm.nih.gov/articles/PMC12081836/ | 2026-11-08 |
| OP082 | Johnson & Johnson, Janssen and Global Partners to Discontinue Phase 3 Mosaico HIV Vaccine Clinical Trial（2023-01-18） | https://www.jnj.com/media-center/press-releases/janssen-and-global-partners-to-discontinue-phase-3-mosaico-hiv-vaccine-clinical-trial | 2026-11-08 |
| OP083 | U.S. FDA, Drugs@FDA NDA 220018（Yeztugo、レナカパビル、2025-06-18 承認） | https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=overview.process&ApplNo=220018 | 2026-11-08 |
| OP084 | U.S. FDA, FDA Converts Novel Alzheimer's Disease Treatment to Traditional Approval（2023-07-06、レカネマブ） | https://www.fda.gov/news-events/press-announcements/fda-converts-novel-alzheimers-disease-treatment-traditional-approval | 2026-11-08 |
| OP085 | U.S. FDA, FDA approves treatment for adults with Alzheimer's disease（2024-07-02、ドナネマブ） | https://www.fda.gov/drugs/news-events-human-drugs/fda-approves-treatment-adults-alzheimers-disease | 2026-11-08 |
| OP087 | WHO, WHO bacterial priority pathogens list, 2024（2024-05-17） | https://www.who.int/publications/i/item/9789240093461 | 2026-11-08 |
| OP088 | J. Cohen, Can We Selectively Shut Off Immune Responses?（Science 309, 97 (2005)。書誌を PubMed で確かめた） | https://doi.org/10.1126/science.309.5731.97 | 2026-11-08 |
| OP089 | F. Müller ほか, CD19 CAR T-Cell Therapy in Autoimmune Disease — A Case Series with Follow-up（NEJM 390, 687 (2024)） | https://doi.org/10.1056/NEJMoa2308917 | 2026-11-08 |
| OP090 | The Nobel Assembly at Karolinska Institutet, The Nobel Prize in Physiology or Medicine 2025（末梢の免疫寛容。nobelprize.org は 403 で、検索の抜粋で確かめた） | https://www.nobelprize.org/prizes/medicine/2025/press-release/ | 2026-11-08 |
| OP091 | E. J. Erbelding ほか, A Universal Influenza Vaccine: The Strategic Plan for the National Institute of Allergy and Infectious Diseases（J. Infect. Dis. 218, 347 (2018)） | https://doi.org/10.1093/infdis/jiy103 | 2026-11-08 |
| OP092 | Cancer Grand Challenges（Cancer Research UK・NCI）, Nine new challenges（2023-03-08） | https://cancergrandchallenges.org/news/nine-new-challenges | 2026-11-08 |
| OP093 | C. López-Otín ほか, Hallmarks of aging: An expanding universe（Cell 186, 243 (2023)） | https://doi.org/10.1016/j.cell.2022.11.001 | 2026-11-08 |
| OP094 | J. Couzin, How Much Can Human Life Span Be Extended?（Science 309, 83 (2005)。書誌を PubMed で確かめた） | https://doi.org/10.1126/science.309.5731.83 | 2026-11-08 |
