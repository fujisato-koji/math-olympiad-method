# ご意見の箱（D-247）

施主「各ページにフィードバックボタン…クリックするとちょっとテキスト入れる箱がでてきて…それがサーバに保存されていく」（2026-11-21）。

## 仕組み

- 画面：上の帯の吹き出しのボタン（どのページにも）と、問題の札・単元・概念・目標のページの「誤りを知らせる」で、小さな箱が開く。書いて「送る」（Ctrl+Enter でも）。水準 1〜2 の単元では、かなの言葉で出す。
- 添えるもの：ページの住所（#/ のあとを含む）、場所（単元・日・問題・概念・目標の記号）、種類（「誤りを知らせる」から開いたら「誤り」）。
- 置き場：Cloudflare Workers の `michisuji-feedback`（`feedback/worker.js`、https://michisuji-feedback.fujisato-koji.workers.dev ）と D1 の `michisuji-feedback`（表 `notes`、`feedback/schema.sql`）。施主の Cloudflare のアカウント、無料の枠。
- 守ること：名前・メール・IP アドレスは残さない。送りすぎを止めるため、IP と UTC の日付と秘密の塩（secret の `FEEDBACK_SALT`）の SHA-256 の頭 16 字（`who`）だけを残す。日ごとに変わり、IP に戻せない。1 つの印から 1 日 20 通、1 通 1,000 字まで。受けるのは `ALLOWED_ORIGINS`（https://michisuji.app と前の住所）からだけ。
- 箱から GitHub へは飛ばさない（施主「フィードバックで github に飛ばす機能はいらない」）。GitHub の issue のひな形（`.github/ISSUE_TEMPLATE/`）は、リポジトリを直に見に来た人のために残す。

## 読み方と片付け方（取りまとめ）

`feedback/` で動かす（wrangler 4.158.0、施主の Cloudflare にログイン済み）。

```
npx wrangler d1 execute michisuji-feedback --remote --json --command "SELECT id, at, page, place, kind, text, state FROM notes WHERE state = '新' ORDER BY id"
npx wrangler d1 execute michisuji-feedback --remote --command "UPDATE notes SET state = '済' WHERE id IN (…)"
```

- 読んだら、直したものは「済」、直さないものは「見送り」にする。直しはいつもの道（単元の直し、地図の直し、決定の記録）で行い、決定の記録に notes の id を書く。
- Git Bash から日本語の条件を wrangler に渡すと文字が化けることがある。条件は id で書く。
- 消してほしいと頼まれたら、日時と文で行を探して消す（`DELETE FROM notes WHERE id = …`）。
- 試験は `node feedback/test.mjs`（D1 は偽物、CI でも流す）。直したら `feedback/` で `npx wrangler deploy`。
