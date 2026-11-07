# 網羅表：NIST の耐量子暗号の暗号学者

この頁は `tools/roadmap.py build` が `coverage-nist-pqc.yaml` から作ります。手で直さないでください。
将来の量子コンピュータでも破られない暗号のきまり（標準）をつくり、インターネットの通信を守る。に要る論題ごとに、受け持つ単元か、入れない理由を書いています（R-09）。

論題 6 のうち、単元が受け持つもの 6、すべての単元に通る軸が受け持つもの 0、入れないもの 0。

## 計算

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-01 | 鍵の確立と電子署名（量子コンピュータに脅かされる公開鍵の機能） | K-042 暗号の基礎（擬似乱数、ハッシュ、認証符号、署名、公開鍵暗号）、K-044 証明系とゼロ知識、秘密分散、秘匿マルチパーティ計算、準同型暗号、K-045 ブロック暗号とハッシュ関数の設計、楕円曲線暗号と格子暗号、攻撃の算法 | DR146 |

## 数学

| 記号 | 論題 | 受け持つ単元 | 出典 |
|---|---|---|---|
| T-02 | 加群格子にもとづく鍵カプセル化と電子署名（ML-KEM、ML-DSA） | K-045 ブロック暗号とハッシュ関数の設計、楕円曲線暗号と格子暗号、攻撃の算法、N-051 代数体と整数環、M-006 内積空間（グラム–シュミット、直交行列とユニタリ行列） | DR146、DR147 |
| T-03 | ハッシュにもとづく電子署名（SLH-DSA） | K-042 暗号の基礎（擬似乱数、ハッシュ、認証符号、署名、公開鍵暗号）、K-045 ブロック暗号とハッシュ関数の設計、楕円曲線暗号と格子暗号、攻撃の算法 | DR146、DR147 |
| T-04 | 誤り訂正符号にもとづく鍵カプセル化（HQC） | C-039 誤り訂正符号、K-045 ブロック暗号とハッシュ関数の設計、楕円曲線暗号と格子暗号、攻撃の算法 | DR148 |
| T-05 | FALCON にもとづく署名（FN-DSA） | K-045 ブロック暗号とハッシュ関数の設計、楕円曲線暗号と格子暗号、攻撃の算法、N-051 代数体と整数環 | DR146、DR147 |
| T-06 | 量子計算機に強いと考えられる数学の問題の分類 | K-045 ブロック暗号とハッシュ関数の設計、楕円曲線暗号と格子暗号、攻撃の算法、C-039 誤り訂正符号、N-056 楕円曲線の幾何と有限体上の楕円曲線、N-053 ミンコフスキーの定理と類群の有限性 | DR149 |

## 出典

| 記号 | 題名 | URL | 取得日 |
|---|---|---|---|
| DR146 | NIST Computer Security Resource Center, Post-Quantum Cryptography | https://csrc.nist.gov/projects/post-quantum-cryptography | 2026-11-07 |
| DR147 | NIST, NIST Releases First 3 Finalized Post-Quantum Encryption Standards | https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards | 2026-11-07 |
| DR148 | NIST, NIST Selects HQC as Fifth Algorithm for Post-Quantum Encryption | https://www.nist.gov/news-events/news/2025/03/nist-selects-hqc-fifth-algorithm-post-quantum-encryption | 2026-11-07 |
| DR149 | NIST, Staff Spotlight: NIST Post-Quantum Cryptography | https://www.nist.gov/node/1636206 | 2026-11-07 |
