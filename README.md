# math-olympiad-method

小学校低学年から、国際数学オリンピック（IMO）の問題を解けるようになるまでの体系的な学習メソッドです。
AI と人（保護者や指導者）が組んで回すことを前提にしています。

## 進め方

設計は次の順に進めます。

1. 要求整理（`docs/01-requirements.md`）
2. 構造（段階と分野の組み立て、AI と人の分担）
3. 各段の詳細（学ぶこと、問題、確かめ方）

特定の子に使いながら作り、使って分かったことで一般化します。
その子の学習記録はこのリポジトリには置きません。

## 画面「みちすじ」

公開先 https://fujisato-koji.github.io/math-olympiad-method/ （手元では `site/index.html`）を開くと、全体の地図、考え方の水準のページ、組み合わせの層、単元の日、今日の問題を 1 問ずつたどれます。
進み具合はその端末のブラウザの中にだけ保存します。

地図は `roadmap.yaml`、問題は `units/` に書き、`python tools/roadmap.py build` で画面のデータ（`site/data.js`）と一覧（`docs/roadmap.md`）を作り直します。
この道具は、問題の答えを式で確かめ、前提の輪や日数の食い違いを止めます。

## 文書

- [docs/01-requirements.md](docs/01-requirements.md)：要求整理（R-01〜R-31、ぶつかり、判断待ち）
- [docs/02-structure.md](docs/02-structure.md)：構造（組み合わせなしのフロー、問題の書き方、画面）
- [docs/roadmap.md](docs/roadmap.md)：段ごとの単元の一覧（道具が作る）
- [docs/coverage.md](docs/coverage.md)：網羅表（IMO に要る 103 論題と受け持つ単元、道具が作る）
- [docs/decisions.md](docs/decisions.md)：決まったこと
- [docs/research/](docs/research/)：調べたこと（大会の梯子、教材と学習科学、AI）
- [docs/sources.md](docs/sources.md)：出典の一覧

大会の問題文はこのリポジトリに写さず、大会・年・問題番号で引きます（R-22）。

## 状態

2026-11-07 開始。要求整理と、組み合わせなしのフローの第一案を確認待ちです。

## ライセンス

未定です。
