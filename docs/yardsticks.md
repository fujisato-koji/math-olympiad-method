# 外の物差しで網羅性を確かめる（D-117）

みちすじの地図が「反復・検証できる知」（D-115）を網羅しているかを、思いつきでなく、公開の分類を物差しにして確かめる。物差しの項目ごとに、受け持つ単元、入れない理由、足りない（単元がない）のどれか 1 つを書き、`python tools/roadmap.py check` で漏れを機械的に見つける。

## 物差し

| 物差し | ファイル | 何を測るか | 受け持つセッション |
|---|---|---|---|
| OECD FORD（Frascati Manual 2015 の研究開発分野分類、6 大分野・42 分野） | yardsticks/ford.yaml | 学問の分野として抜けがないか | 広い物差し |
| UNESCO ISCED-F 2013（教育分野分類、11・29・約 80） | yardsticks/isced-f.yaml | 教育課程の分野として抜けがないか | 広い物差し |
| ISCO-08（国際標準職業分類の大分類 2 専門職と 3 技術職、4 けたの細分類） | yardsticks/isco-08.yaml | 知の体系を要る職業の土台になっているか | 広い物差し |
| 数学 MSC2020（2 けた） | yardsticks/msc2020.yaml | 数学の中の抜け | 深い物差し |
| 物理 PhySH（Physics Subject Headings の分野と主な分類） | yardsticks/physh.yaml | 物理の中の抜け | 深い物差し |
| 計算機 ACM CCS 2012（上位 2 段） | yardsticks/acm-ccs.yaml | 計算機科学の中の抜け | 深い物差し |
| 医学 MeSH（樹の上位） | yardsticks/mesh.yaml | 医学と生命科学の中の抜け | 深い物差し |
| 社会学 ASA（米国社会学会の部会） | yardsticks/asa-sections.yaml | 社会学の実証の部分の抜け | 地図を広げる（社会科学、D-119） |
| 政治学 APSA（米国政治学会の Organized Sections） | yardsticks/apsa-sections.yaml | 政治学と行政学の実証の部分の抜け | 地図を広げる（社会科学） |
| 教育学 AERA（米国教育学会の 12 部会） | yardsticks/aera-divisions.yaml | 教育の実証の部分の抜け | 地図を広げる（社会科学） |
| コミュニケーション学 ICA（国際コミュニケーション学会の部会と関心グループ） | yardsticks/ica-divisions.yaml | メディアとコミュニケーションの実証の部分の抜け | 地図を広げる（社会科学） |
| 地理学 AAG（米国地理学会の専門部会） | yardsticks/aag-specialty-groups.yaml | 人文地理の実証の部分と自然地理の抜け | 地図を広げる（社会科学） |
| ほかの分野（化学、地球科学、工学、統計、経済など） | yardsticks/<名前>.yaml | 各分野の中の抜け | 深い物差し（公開の分類が見つかるものから） |

## 書き方

```yaml
title: OECD Fields of Research and Development（Frascati Manual 2015）
version: "2015"
sources:
  Y01: {title: "Frascati Manual 2015（OECD）", url: "https://...", date: 2026-11-12, license: "（ページの利用条件。分からなければ未確認と書く）"}
items:
  - {id: "1", name: Natural sciences, ja: 自然科学, group: true}
  - id: "1.1"
    parent: "1"
    name: Mathematics
    ja: 数学
    units: [N-001, A-010, G-016]   # 受け持つ単元（代表でよい。全部は要らない）
    sources: [Y01]
  - id: "6.1"
    parent: "6"
    name: History and Archaeology
    ja: 歴史と考古学
    none: 人文（D-115）。年代測定などの測れる部分は W・H の単元で扱う
  - id: "5.3"
    parent: "5"
    name: Educational sciences
    ja: 教育学
    gap: 学習科学の実証の部分（学習と記憶、測定と評価）は Q-0xx にあるが、教育の研究の方法の単元がない
```

- 項目の記号と名前は、物差しの原文のとおりにする（日本語は ja に）。
- `units` は、その項目を受け持つ単元を代表で挙げる。項目の中身を読んで、本当に受け持っているかで決める（名前の似ていることで決めない）。
- `none` の理由は D-115 にしたがう：人文、規範（法・倫理の判断）、検証できない知、上書きされた過去の知、知の体系でない技能（職業の手技など）。理由は 1 行で、何を外し、測れる部分がどこにあるかを書く。
- `gap` は、D-115 の範囲に入るのに単元がないもの。要る単元の案（名前と前提）を書く。**地図（roadmap.yaml）に単元は足さない**。足すかどうかは、物差しがそろってから取りまとめで決める（ほかのセッションと地図がぶつからないように）。
- 出典は、URL・取得日・ライセンス（利用条件）を必ず書く（always-record-sources）。分類の表をまるごと写さず、記号と名前だけを使う。

## 次の回の候補（2026-11-12、D-120）

物差しの表の gap に残るもの（3）と、表では「受け持つ」か「入れない」になっているが、中身の一部が欠けているもの。次に地図を広げる回で、単元を足すかを決める。

| 候補 | どこで見つかったか | 受け持つ流れの案 |
|---|---|---|
| 空間統計と空間モデル | AAG 71（gap） | S |
| 測量と写真測量 | AAG 76（gap） | W か E |
| 学習者の認識論的信念（科学への態度とその測り方） | PhySH c9842cda（gap） | Q |
| コーパスと計算言語学（形態素と構文の解析、意味の表現、コーパスの統計） | APA 2720 の一部、ISCED-F 0232・ISCO 2643 の理由（docs/research/ext-soc.md） | K |
| 自然人類学（人類の進化、集団の遺伝） | FORD 5.4・ISCED-F 0314・ISCO 2632 の一部（社会学の単元で受け持つとした行） | B |
| 書誌計量と科学の計量（引用の分布、指標の妥当性） | FORD 5.8 の一部（ext-soc.md） | Y か K |
| ポントリャーギン双対（抽象調和解析） | MSC 43（受け持つ R-033 が弱い、ext-cs.md） | R か D |
| 凸体の理論（ヘリー、ブルン–ミンコフスキー） | MSC 52（離散の側だけで受け持つ） | G か T |
| 指数定理と熱核、非有界作用素と作用素環 | MSC 58・47 | D か T |
| 代数統計（トーリックイデアルとマルコフ基底） | MSC 62R01 | S |
| ネットワークプロトコルの設計と検証 | ACM（K-038、K-144 で受け持つが設計と検証がない） | K |

## 確かめ

- `python tools/yardstick.py`：物差しごとの数（受け持つ、入れない、足りない）と、足りないの一覧。
- `python tools/roadmap.py check`：書き方の誤り（どれか 1 つでない、地図にない単元、出典がない）を誤りにする。CI で止まる。
