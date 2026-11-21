-- ご意見の箱（D-247）。名前・メール・IP アドレスは入れない
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,              -- 受けた時刻（UTC、ISO 8601）
  page TEXT NOT NULL,            -- ページの住所（#/ のあとを含む）
  place TEXT NOT NULL DEFAULT '', -- 単元・日・問題・概念・目標の記号（画面が添える）
  kind TEXT NOT NULL DEFAULT '',  -- 「誤り」か空（画面のどこから開いたか）
  text TEXT NOT NULL,            -- 書かれた文（1,000 字まで）
  who TEXT NOT NULL,             -- 送りすぎを止める印：IP と UTC の日付と秘密の塩の SHA-256 の頭 16 字（日ごとに変わり、IP に戻せない）
  state TEXT NOT NULL DEFAULT '新' -- 取りまとめが付ける：新・済・見送り
);
CREATE INDEX IF NOT EXISTS notes_who ON notes (who, at);
