# みちすじ（Michisuji）

**https://michisuji.app/**

やりたいことに要る知識の全体を、星の地図で見渡し、前提の順に学ぶためのサイトです。
ものを数えるところから研究の最前線まで、数学・自然科学・工学・計算・医学・統計などの単元（星）を、前提のつながりで並べています。
やりたいこと（試験・大会・仕事・賞などの目標や、知りたい星）を選ぶと、そこまでの道筋が見えます。

- 中身は AI で作り、AI と人が確かめています。どこまで確かめたかは、単元のページに出しています。まちがいは、画面の上の吹き出しのボタンから教えてください（[CONTRIBUTING.md](CONTRIBUTING.md)）。
- アカウントなしで使えます。学びの記録は、使っている端末のブラウザか、各自の Google ドライブにだけ置きます（[プライバシー](https://michisuji.app/privacy.html)）。
- くり返し確かめられる知識だけを入れています（文学・宗教・政治・芸術は入れません）。置き換えられた昔の分野や手法も入れません。

## いまの状態（2026-11-21）

- 単元 1,776、目標 148（試験・大会・第一線の仕事・研究の賞・未解決問題）。
- 問題のある単元 246（答えのある問題 12,771 問）。そのうち 163 単元は、答えを見ない AI の解き直しで確かめました。
- 概念の目録（定義・定理・法則などの説明）は試しの 25 項目。単元を作る・直すたびに足していきます。
- 公開の準備中です（[docs/outreach.md](docs/outreach.md)）。

## 作り方

- 地図は `roadmap.yaml`、問題は `units/`、概念は `concepts/`、前提の線と分野は `relations/` に書きます。
- `python tools/roadmap.py` が確かめ（答えの式、前提の輪、日数、概念の順など）、`python tools/roadmap.py build` が画面のデータ（`site/data.js`）と一覧（`docs/roadmap.md`）を作り直します。
- 単元の問題は、作る台本と直す台本（`.claude/workflows/`）で、AI が作り、審査し、答えを見ない係が解き直します。
- ログインを保つサーバは `auth/`、ご意見の箱は `feedback/`（どちらも Cloudflare Workers）。

## 文書

- [docs/01-requirements.md](docs/01-requirements.md)：要求整理
- [docs/02-structure.md](docs/02-structure.md)：構造（問題の書き方、画面）
- [docs/thinking-levels.md](docs/thinking-levels.md)：理解の水準（7 段）
- [docs/concepts.md](docs/concepts.md)：概念の目録
- [docs/problem-figures.md](docs/problem-figures.md)：問題を作る・直す決まり
- [docs/outreach.md](docs/outreach.md)：外への公開と広め方
- [docs/decisions.md](docs/decisions.md)：決まったこと
- [docs/roadmap.md](docs/roadmap.md)、[docs/coverage.md](docs/coverage.md)：単元の一覧と網羅表（道具が作る）
- [docs/research/](docs/research/)、[docs/sources.md](docs/sources.md)：調べたことと出典

大会の問題文はこのリポジトリに写さず、大会・年・問題番号で引きます（R-22）。

## ライセンス

中身（地図・単元・概念の目録・図・文書）は [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)、道具と画面のコードは MIT です。くわしくは [LICENSE-CONTENT.md](LICENSE-CONTENT.md) と [LICENSE](LICENSE)。

---

## English

**Michisuji** (https://michisuji.app/) maps the knowledge you need for what you want to do as a sky of stars — from counting to the research frontier across mathematics, the natural sciences, engineering, computing, medicine and statistics — and shows the path in prerequisite order. The content is made with AI and checked by AI and people; each unit shows how far it has been checked. No account is needed. Content is CC BY 4.0, code is MIT. The site is currently in Japanese.
