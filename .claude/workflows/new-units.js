export const meta = {
  name: 'new-units',
  description: 'まだ問題のない単元に、図とイラストの多い問題（docs/problem-figures.md）を作り、審査・直し・答えを見ない係 2 人の解き直しで確かめる（D-129〜D-131）',
  whenToUse: 'みちすじの問題のない単元に、試しの 6 単元の水準で問題を作るとき。args は { units: ["B-017", ...], width: 4 }（width は同時に進める単元の数、省くと 4。止めたあと動かし直すときは done: [直すまで済んだ単元] を足すと、その単元は解くから始める）。1 回に 12 単元ほど。light: true で軽い形（D-202：節約の試し 3 の作り方、1 単元 2.5M ほど。段 1〜6 の単元に使う。root: 作業ツリーの根（/c/dev/... の形）を必ず渡す。line は腕試しの線で、省くと 1,500）',
  phases: [
    { title: 'Write', detail: '単元ごとに問題とイラストを書く' },
    { title: 'Review', detail: '別の係が図を見て審査する' },
    { title: 'Fix', detail: '審査の指摘を直す' },
    { title: 'Ri', detail: '軽い形（light）：腕試しを書き、Haiku が 1 問ずつ解いて測り、線に届かないものだけ上げる' },
    { title: 'Solve', detail: '答えを見ない係 2 人が解き直す' },
    { title: 'Judge', detail: 'ファイルの答えと照らし、割れた問いを直す' },
  ],
}

const REVIEW = {
  type: 'object',
  properties: {
    scores: { type: 'object', properties: {
      correctness: { type: 'integer', description: '中身の正しさ（事実、答えが 1 つに決まる）1〜5' },
      grade_fit: { type: 'integer', description: '段に合うか（ことば、漢字、分かち書き、難しさ）1〜5' },
      figures: { type: 'integer', description: '図とイラストで見てわかるか（見本、問題、ヒントの図）1〜5' },
      hints: { type: 'integer', description: 'ヒントが答えを書かずに次の一歩を示すか 1〜5' },
      clarity: { type: 'integer', description: '問いと選択肢がまぎれなく、子が迷わないか 1〜5' },
    }, required: ['correctness', 'grade_fit', 'figures', 'hints', 'clarity'] },
    fixes: { type: 'array', items: { type: 'string' }, description: '直すべきこと。日と問題の番号と、どう直すかを具体的に。なければ空' },
  },
  required: ['scores', 'fixes'],
}
const SOLVE = {
  type: 'object',
  properties: {
    answers: { type: 'array', items: { type: 'object', properties: {
      key: { type: 'string' },
      answer: { type: 'string', description: '選択肢の文字そのまま（ア、イ、「ふえる」など）か、数や式' },
      sure: { type: 'boolean', description: '図と文から答えが 1 つに決まると思うなら true' },
      issue: { type: 'string', description: '答えが 2 つありうる、図と文が合わない、図が読めない、事実としておかしい、などがあれば短く。なければ空' },
    }, required: ['key', 'answer', 'sure', 'issue'] } },
  },
  required: ['answers'],
}
const JUDGE = {
  type: 'object',
  properties: {
    checked: { type: 'integer', description: '照らした問題の数' },
    mismatches: { type: 'integer', description: '係の答えとファイルの答えが食い違った問題の数' },
    fixed: { type: 'array', items: { type: 'string' }, description: '直した問題（場所、何がまちがいで、どう直したか）' },
    kept: { type: 'array', items: { type: 'string' }, description: '食い違ったが直さなかった問題と、そのわけ' },
    qc: { type: 'string', description: '最後の tools/unitqc.py の結果（誤り、漢字）' },
  },
  required: ['checked', 'mismatches', 'fixed', 'kept', 'qc'],
}

const writePrompt = id => `みちすじ（子どもが毎日少しずつ解く学びの地図）の単元 ${id} に、まだ問題がない。新しく units/${id}.yaml を作る。日本語で考え、答える。作業ツリーの根（いまの作業フォルダ）で動く。
まず docs/problem-figures.md を全部読み、その決まり（ファイルの形、日の並び、図とイラストの描き方、試しの審査で多かった指摘、確かめ）で書く。手本は units/H-002.yaml（段 1、図の多い単元）と units/P-181.yaml（頭注と分かち書き）。roadmap.yaml で ${id} の行（題、段、日数、前提）と前提の単元の題を見る。
書くのは units/${id}.yaml だけ。git の操作、tools/roadmap.py の build と check はしない。下書きのスクリプトや控えは、自分の一時フォルダ（scratchpad）の中に ${id}/ を作ってそこだけに置き、終わったらその ${id}/ だけを消す。scratchpad のほかのファイルは主会話やほかの係のものなので、消さない・書きかえない。
確かめは PYTHONIOENCODING=utf-8 python tools/unitqc.py ${id}（誤り 0、漢字 0 まで）。長くかかる道具（tools/unitqc.py、tools/blind.py render）は Bash の timeout を 600000（10 分）にして動かす（時間切れで止めると画面なしの Edge が残り、PC のメモリを食う。D-137）。PNG は全部 Read で見て直し、見たら --clean で消す。全部の問題を自分で解き、答えが 1 つに決まること、ヒントが答えを書いていないことを確かめる。
最後に、docs/problem-figures.md の「戻すもの」を返す。`

const reviewPrompt = id => `みちすじの単元 ${id} の問題を、別の係が新しく作った（units/${id}.yaml）。審査してほしい。日本語で答える。ファイルは書かない（読むだけ）。作業ツリーの根で動く。
まず docs/problem-figures.md を読む（何を目指したか）。単元ファイルを全部読み、全部の問題を自分で解く。図は PYTHONIOENCODING=utf-8 python tools/unitqc.py ${id} で PNG にして Read で見て、見たら --clean ${id} で消す。
疑ってかかって見る：事実のまちがい、答えが 2 つになる問い、図と答えの食い違い（左右を反対にした図で ア・イ を入れかえ忘れる、など）、まぎれる選択肢、段に合わないことばや漢字（svg の中の文字も）、ヒントが答えを言っている、図が小さい・かさなる・何の絵かわからない、図がない見本、絵で見せられるのに文だけの問題。`

const fixPrompt = (id, r) => `みちすじの単元 ${id} の問題（units/${id}.yaml）を、審査の係が見た。指摘を直してほしい。日本語で答える。作業ツリーの根で動く。
まず docs/problem-figures.md を読む。審査の点：${JSON.stringify(r.scores)}。指摘：${JSON.stringify(r.fixes)}。
指摘のうち正しいものを直す（まちがった指摘、正解を絵に描くことになる指摘は、わけを添えて直さない）。書くのは units/${id}.yaml だけ。git、build、check はしない。
直したら PYTHONIOENCODING=utf-8 python tools/unitqc.py ${id} で誤り 0・漢字 0 を確かめ、PNG を見て、見たら --clean で消す。最後に、直したこと・直さなかった指摘とわけ・qc の結果を 10 行以内で返す。`

const solvePrompt = (id, t) => `あなたは、みちすじの単元 ${id} の問題を、答えを知らずに解く係。日本語で考え、答える。作業ツリーの根（いまの作業フォルダ）で動く。
【守ること】長くかかる道具（tools/unitqc.py、tools/blind.py render）は Bash の timeout を 600000（10 分）にして動かす（時間切れで止めると画面なしの Edge が残り、PC のメモリを食う。D-137）。答えを見ない：units/、site/、docs/ のファイルは開かない・grep しない。tools/blind.py の key は使わない。ファイルを書き換えない。
【手順】
1. PYTHONIOENCODING=utf-8 python tools/blind.py build ${id} を実行し、表示された一時フォルダの ${id}.json（key、part、text、choices、svg、figure）を読む。roadmap.yaml の ${id} の行で段（stage）を見る（子の学年の目安）。
2. PYTHONIOENCODING=utf-8 python tools/blind.py render ${id} ${t} を実行し、できた画像（${id}-${t}-1.png、-2.png …、同じ一時フォルダ）を全部 Read で見る。図が細かいときは json の svg の中身（座標と文字）も読んでよい。
3. 子どもが画面で見るのと同じく、文と図と選択肢だけから、1 問ずつ答えを決める。図の中の文字（ア・イ・ウ、方角、数）の位置と、事実や計算をよく照らす。
4. 答えが 2 つありうる、図と文が合わない、図だけでは決まらない、事実としておかしい、と思ったら issue に書き、sure を false にする。
5. 見終わったら必ず PYTHONIOENCODING=utf-8 python tools/blind.py clean ${id} ${t} で画像を消す。
6. 全部の key について答えを返す。`

const judgePrompt = (id, solved) => `みちすじの単元 ${id} を、答えを知らない係 2 人（a、b）が解き直した。その答えとファイルの答えを照らし、割れた問題を直す。日本語で考え、答える。作業ツリーの根で動く。
係の答え（JSON）：${JSON.stringify(solved)}
【手順】
1. PYTHONIOENCODING=utf-8 python tools/blind.py key ${id} でファイルの答え（key ごと）を出し、係の答えと照らす。空白・矢印・「まい」「こ」などの書き方の違いは同じとみなす。
2. 食い違った問題と、係が sure=false か issue を付けた問題について、units/${id}.yaml のその問題（key は d<日>-<番>、予備は d<日>-x<番>、腕だめしは ri-<番>）と図を見る（図は python tools/blind.py render ${id} j で画像にし、見たら clean ${id} j で消す）。
3. 決める：(a) ファイルの答えがまちがい → answer、check、paths を直す。(b) 問いか図が 2 通りに読める・答えが決まらない → 図か文を直して答えを 1 つに決める。(c) 係のまちがい → 直さない（わけを書く）。
4. 書くのは units/${id}.yaml だけ。git、build、check はしない。直したら PYTHONIOENCODING=utf-8 python tools/unitqc.py --no-shot ${id} で誤り 0、漢字 0 を確かめる。
5. 選ぶ問題（choices のある問題）は全部、ヒント 3 段でまちがいの選択肢を消しすぎていないかを見る。3 段を合わせて 2 つ以上消して答えだけが残る形、2 択で 1 つ消す形は、消すのを 1 つまでにし、残りを「何を見ればわかるか」「どう比べるか」に直す（D-133）。直した数を fixed に書き、直したら 4. の unitqc をもう一度通す。
6. docs/problem-figures.md の決まりに従う。`

// ── 軽い形（D-202。args.light: true）：節約の試し 3（D-201、docs/research/pilot-light-hard.md）の作り方 ──
// 作る（Sonnet medium：要点 1 枚、日ごとのファイル、図の部品 tools/figparts、tools/selfcheck.py）
// → 全日の審査と直し（Sonnet medium。抜き取りにしない）と、腕試し（Sonnet medium、作業を絞る）を並べる
// → 腕試しを Haiku が 1 問 1 係で答えを見ずに解き、書いたトークンを tools/wf_tokens.py --find で数える → 線（args.line、省くと 1,500）に届かないものだけ Opus が 1 回上げる
// → 答えを見ない解き直し（Sonnet 1 人、effort は既定、文だけ）→ Haiku が答えを照らし、食い違いか印があるときだけ Sonnet が照らして直す
// 係への指示の頭で args.root（作業ツリーの根）へ cd する。台本は名前で呼ぶと本体のフォルダの版が読まれるので、scriptPath で呼ぶ
const LIGHT = !!(args && args.light)
const ROOT = args && args.root
const LINE = (args && args.line) || 1500
const HOME = ROOT
  ? `最初に必ず cd ${ROOT} を実行し、最後までこのフォルダで動く（ほかの作業ツリーやフォルダへ移らない）。日本語で考え、答える。`
  : '作業ツリーの根（いまの作業フォルダ）で動き、ほかの作業ツリーやフォルダへ移らない。日本語で考え、答える。'
const RUN = 'Bash の timeout は 600000 にする（長い道具を時間切れで止めると画面なしの Edge が残る。D-137）。git、tools/roadmap.py の build と check はしない。下書きのスクリプトは scratchpad の 記号/ だけに置き、ほかのファイルは消さない。'
const LEAN = '道具の出力は要るところだけ読む（長くなるものは | head -c 3000 や grep で絞る）。画像は作らない・見ない。'
const WORK = id => `置き場（python tools/assemble.py --dir ${id} で出る場所）`
const MED = { model: 'sonnet', effort: 'medium' }, SON = { model: 'sonnet' }, HAI = { model: 'haiku' }
const L_REVIEW = { type: 'object', properties: {
  scores: { type: 'object', description: '直す前の出来（1〜5）', properties: {
    correctness: { type: 'integer' }, grade_fit: { type: 'integer' }, figures: { type: 'integer' }, hints: { type: 'integer' }, clarity: { type: 'integer' },
  }, required: ['correctness', 'grade_fit', 'figures', 'hints', 'clarity'] },
  found: { type: 'array', items: { type: 'string' }, description: '見つけて直したまちがい（日・問題・何が・どう直したか）' },
  qc: { type: 'string' },
}, required: ['scores', 'found', 'qc'] }
const L_MEASURE = { type: 'object', properties: { tokens: { type: 'array', items: { type: 'integer' } } }, required: ['tokens'] }
const L_MATCH = { type: 'object', properties: { mismatch: { type: 'array', items: { type: 'string' }, description: '食い違った key' } }, required: ['mismatch'] }

const writeL = id => `${HOME}
みちすじ（子どもが毎日少しずつ解く学びの地図）の単元 ${id} に、まだ問題がない。新しく作る。
1. docs/problem-card.md を全部読む（これが決まり。とくに「子に見せる文と字」の段の決まり）。roadmap.yaml の ${id} の行と、前提の単元の題を grep で見る。ほかの単元のファイルは読まない。
2. PYTHONIOENCODING=utf-8 python tools/figparts/catalog.py で図の部品の一覧を 1 回だけ読む。図はすべて fig: の 1 行で部品を呼んで描く（svg を手で書かない。部品のファイルの中身は読まない。足りない部品は置き場の parts.py に書く）。
3. ${WORK(id)}に head.yaml と day-1.yaml … を、1 日分ずつ 1 回の Write で書く。腕だめし（ri.yaml）は書かない（別の係）。
4. PYTHONIOENCODING=utf-8 python tools/selfcheck.py ${id} で確かめ、誤り 0、漢字 0、図の直すところ 0 まで日のファイルを Edit で直す。ヒントの疑いと「…だけで通っている字」は 1 つずつ見て決める。
5. 書いた問題を全部自分で解き、答えが 1 つに決まること、図と答えが合うこと、ヒントが答えを言わないことを確かめる。書いた日のファイルを何度も読み直さない。${LEAN}
${RUN}
返す（6 行以内）：日ごとの問題の数、図の数、selfcheck の結果、parts.py に足した部品、気になった点。`

const reviewL = id => `${HOME}
みちすじの単元 ${id} を別の係が新しく作った。全日を審査し、見つけたまちがいはその場で直す（抜き取りにしない。答えを見ない解き直しは、ヒントのよしあしや文と図の食い違いをすり抜けるため。D-201）。
1. docs/problem-card.md を読む。${WORK(id)}の day-1.yaml から順に全部の日を読む。図は fig: の式で読む（部品の意味は PYTHONIOENCODING=utf-8 python tools/figparts/catalog.py、置き場の parts.py は単元だけの部品）。${LEAN}
2. 全部の問題を自分で解き、疑ってかかって見る：見本の文と図が、同じ日の問題の答えをそのまま見せていないか（R-003 で見本が共役類を 3 つとも書き、同じ日の 3 問の答えになっていた。D-193）、ヒントの図が問いの図の字を落として、輪や四角が何もない所を囲んでいないか（D-210）、問いの図が答えと逆の形や大小を描いていないか、事実と計算のまちがい、答えが 2 つ、図と答えの食い違い、図の字や数や比がそのまま答えになる、問いの文に答えが書いてある、文と図の数（箱、つぶ、高さ）が合わない、まぎれる選択肢、段に合わない字やことばや書き方、説明していない用語、ヒントが答えを言う・ヒントの図の輪や四角が答えを囲む・選択肢を消しすぎる（3 段で 2 つ以上、2 択で 1 つ）、図がない見本、段の子に難しすぎる・易しすぎる。数は python で確かめてよい。
3. 直す前の出来に点を付ける（1〜5）。
4. 直すべきものを、その日のファイルで Edit で直す（正解を絵に描く直しはしない。答えを変えたら check と paths も合わせる）。直したら PYTHONIOENCODING=utf-8 python tools/selfcheck.py ${id} で誤り 0・漢字 0・図 0。腕だめし（ri.yaml）は別の係が書いているので触らない。
${RUN}`

const riL = id => `${HOME}
みちすじの単元 ${id} に、難しくて良い腕だめし（part: 離）を 3 問書く。
【まず】PYTHONIOENCODING=utf-8 python tools/ri_seeds.py ${id} 6（範囲、過去の大会問題の骨組みと鍵の上位 6、構造の一覧）。docs/problem-card.md の「問題の形」「子に見せる文と字」「図」「腕試し」を読む。図は fig: で部品を呼ぶ（PYTHONIOENCODING=utf-8 python tools/figparts/catalog.py）。roadmap.yaml の ${id} の行と前提の単元の題を grep で見る。${WORK(id)}の日のファイルは、head.yaml とわけの日だけ読む。
【難しさの物差し：全部満たす】
1. 教わった手順を 1 つ当てるだけで終わらない。工夫が 2 段以上。
2. この単元と、前提の単元のどれかを組み合わせる。
3. 見方を変える一手が 1 つ要る（構造の一覧から：不変量、極端な場合、対称、逆から考える、作ってみせる、場合分け、数え方の工夫 など）。
4. 本当にちがう道筋が 2 本ある（paths 2 本）。
5. 答えは 1 つに決まり、check の式（計算か総当たり）で確かめられる。
6. 段の子が読める文と字で、図で場面を見せる。
7. 過去の大会問題は構造と鍵だけ借り、場面と数を変える（問題文は写さない）。種がなければ構造の一覧から組み立てる。
8. この単元の「挑戦」の問題より、はっきり難しい（答えもヒントも見ない弱い係が、1 問に考えのトークンを ${LINE} 以上使うくらい）。手順を当てれば済む、場合が少なく全部ためせる、図や文が答えを語る、は易しすぎる。
【作業を絞る】3 問を考えたら、${WORK(id)}に ri.yaml として 1 回の Write で書く（1 行目が「  - part: 離」、kinds は 総動員・数・道筋・手数・読み取り から、text、fig、choices か数の answer、check、hints 3 段、paths 2 本、note に借りた構造 S..・種の記号・なぜむずかしいか。note も段の字で書く）。確かめの python は 1 本のスクリプトにまとめ、3 問の check と、自分の 2 本の道筋の答えが合うかだけを短く出す（総当たりの途中を出さない）。そのあと PYTHONIOENCODING=utf-8 python tools/selfcheck.py ${id}（腕だめしの分が 0）。${LEAN} ほかの係が同じ置き場の日のファイルを直しているので、日のファイルは書きかえない。
${RUN}
返す（3 問それぞれ 2 行）：中身の 1 行、答え、借りた構造と種、工夫の段数。`

const probeL = (id, key) => `${HOME}
あなたは、みちすじの単元 ${id} の問題を 1 問、答えもヒントも見ずに一度で解く係。
answer を見ない：units/、site/、docs/ と michisuji-work の置き場は開かない。tools/blind.py の key は使わない。ファイルを書き換えない。画像は作らない。Bash の timeout は 600000。
PYTHONIOENCODING=utf-8 python tools/blind.py one ${id} ${key} を実行し、出た問題だけを解く。図は svg の中身（座標と文字）を読む。1 問に長くかけすぎず、自分の答えを決める。わからなければ answer に「わからない」、sure は false。issue は空でよい。答えの key は ${key}。`
const measureL = labels => `${HOME}
PYTHONIOENCODING=utf-8 python tools/wf_tokens.py --find ${labels.map(l => `'${l}'`).join(' ')} を 1 回実行し、出た数を、ラベルの順に tokens に入れて返す（「見つからない」は -1）。ほかには何もしない。`
const raiseL = (id, low) => `${HOME}
みちすじの単元 ${id} の腕だめしのうち ${low.map(x => `${x.key}（${x.tok} トークン）`).join('、')} は、いちばん弱い係（Haiku）が答えもヒントも見ずに解き終えた量が、線の ${LINE} に届かなかった。易しすぎるので、同じ場面と借りた構造のまま、もう一段難しくする（1 回だけ）。
易しくなっていたわけ（手順を当てれば済む、図や文が答えを語る、場合が少なく全部ためせる、など）を見つけてふさぐ（場合を増やす、逆向きに問う、条件を 1 つ足して見方を変える一手が要るようにする、など）。答えは 1 つに決まり check の式で確かめられること、paths 2 本、段の字と、段の子が読める文は守る。docs/problem-card.md の「問題の形」を守る。図は fig: で部品を呼ぶ。
直すのは${WORK(id)}の ri.yaml のその問題だけ（日のファイルは書きかえない）。直したら PYTHONIOENCODING=utf-8 python tools/selfcheck.py ${id} で 0 を確かめ、check の式を python で動かして答えを確かめる。${LEAN}
${RUN}
返す（問題ごとに 2 行）：何を足して難しくしたか、新しい答え。`
const solveL = id => `${HOME}
あなたは、みちすじの単元 ${id} の問題を、答えを知らずに解く係。
answer を見ない：units/、site/、docs/ と michisuji-work の置き場は開かない・grep しない。tools/blind.py の key は使わない。ファイルを書き換えない。画像は作らない。Bash の timeout は 600000。
1. PYTHONIOENCODING=utf-8 python tools/blind.py build ${id} を実行し、表示された json（key、part、text、choices、svg）を読む。roadmap.yaml の ${id} の行で段を見る。
2. 文と図（svg の中身の座標と文字）と選択肢だけから 1 問ずつ答えを決める。2 通りに読める・図と文が合わない・事実がおかしいと思ったら issue に書き、sure を false。
3. 全部の key に答える。`
const matchL = (id, list) => `${HOME}
PYTHONIOENCODING=utf-8 python tools/blind.py key ${id} を 1 回実行し、出たファイルの答えと、下の係の答えを key ごとに照らす。空白・単位・「こ」「まい」・かっこの中の説明・「選択肢 2:」などの書き方の違いは同じとみなす。食い違った key を mismatch に入れて返す（同じ key が 2 つあれば、どちらかが食い違えば入れる）。ファイルを開かない・直さない。ほかには何もしない。
係の答え：${JSON.stringify(list)}`
const judgeL = (id, s, hk, keys) => `${HOME}
みちすじの単元 ${id} を、答えを知らない係が解き直した（sonnet は全部の問題、haiku は腕だめしを 1 問ずつ）。食い違いか印のあった問題 ${keys.join('、')} を見て、割れた問題を直す。
sonnet の答え（その問題の分）：${JSON.stringify(s)}
haiku の答え（その問題の分）：${JSON.stringify(hk)}
1. PYTHONIOENCODING=utf-8 python tools/blind.py key ${id} でファイルの答えを出す。
2. その問題を、${WORK(id)}の日のファイル（key は d<日>-<番>、予備は d<日>-x<番>、腕だめしは ri-<番>。番は items の順、x は extra の順）でその問題と fig を見て決める：ファイルの答えがまちがい → 直す。2 通りに読める・図と文が合わない → 図か文を直して答えを 1 つにする。係のまちがい → 直さない（わけを kept に）。
3. 直すのは日のファイルか ri.yaml で、直したら PYTHONIOENCODING=utf-8 python tools/selfcheck.py ${id} で誤り 0・漢字 0・図 0 を確かめる。
${RUN}`

const probeManyL = async (id, keys, tag) => {
  const ans = await parallel(keys.map(k => () => agent(probeL(id, k), { label: `${tag}:${id}:${k}`, phase: 'Ri', schema: SOLVE, ...HAI })
    .then(x => x && x.answers && x.answers[0] ? { ...x.answers[0], key: k } : { key: k, answer: '（なし）', sure: false, issue: '' })))
  const labels = keys.map(k => `${tag}:${id}:${k}`)
  let m = await agent(measureL(labels), { label: `数える:${id}:${tag}`, phase: 'Ri', schema: L_MEASURE, ...HAI, effort: 'low' })
  // Haiku の low が道具を呼ばずに空の並びを返すことがある（make56 の 1 回目で 13 回のうち 5 回、D-210）。数が足りなければ 1 回だけ数え直す
  if (!m || !m.tokens || m.tokens.length !== keys.length) {
    m = await agent(measureL(labels), { label: `数え直す:${id}:${tag}`, phase: 'Ri', schema: L_MEASURE, model: 'sonnet', effort: 'low' })
    if (!m || !m.tokens || m.tokens.length !== keys.length) log(`${id} ${tag}：数える係が数を返さなかった（上げる段を飛ばす）`)
  }
  return keys.map((k, i) => ({ key: k, tok: m && m.tokens && m.tokens[i] != null ? m.tokens[i] : -1, answer: (ans[i] || {}).answer, sure: (ans[i] || {}).sure }))
}
const riChainL = async id => {
  const h = await agent(riL(id), { label: `腕:${id}`, phase: 'Ri', ...MED })
  if (!h) return null
  const keys = ['ri-1', 'ri-2', 'ri-3']
  const first = await probeManyL(id, keys, '測る')
  const low = first.filter(x => x.tok >= 0 && x.tok < LINE)
  let up = null, second = []
  if (low.length) {
    up = await agent(raiseL(id, low), { label: `上げる:${id}`, phase: 'Ri', model: 'opus' })
    second = await probeManyL(id, low.map(x => x.key), '測る2')
  }
  log(`${id} 腕試し ${first.map(x => `${x.key} ${x.tok}`).join('、')}${second.length ? ` → 上げたあと ${second.map(x => `${x.key} ${x.tok}`).join('、')}` : ''}（線 ${LINE}）`)
  return { write: h, first, raise: up, second }
}
const oneLight = async (id, skip) => {
  let w = '作る・審査・腕試しは前の回で済み（args.done）', rv = null, ri = null
  if (!skip) {
    w = await agent(writeL(id), { label: `作る:${id}`, phase: 'Write', ...MED })
    if (!w) return null
    ;[rv, ri] = await parallel([
      () => agent(reviewL(id), { label: `審査:${id}`, phase: 'Review', schema: L_REVIEW, ...MED }),
      () => riChainL(id),
    ])
  }
  const s = await agent(solveL(id), { label: `解く:${id}`, phase: 'Solve', schema: SOLVE, ...SON })
  const hk = ri ? ri.first.map(x => (ri.second.find(y => y.key === x.key) || x)).map(x => ({ key: x.key, answer: x.answer, sure: x.sure })) : []
  const sa = (s && s.answers) || []
  const mt = await agent(matchL(id, [...sa.map(a => ({ key: a.key, answer: a.answer })), ...hk.map(a => ({ key: a.key, answer: a.answer, by: 'haiku' }))]),
    { label: `照合:${id}`, phase: 'Judge', schema: L_MATCH, ...HAI, effort: 'low' })
  // 照らす係は、食い違い・印（sure=false か issue）・照合の失敗があるときだけ動かす
  const flagged = sa.filter(a => !a.sure || (a.issue && a.issue.trim())).map(a => a.key)
  const keys = [...new Set([...((mt && mt.mismatch) || []), ...flagged])]
  const need = !s || !mt || keys.length > 0
  const pick = list => list.filter(a => !keys.length || keys.includes(a.key))
  const j = need ? await agent(judgeL(id, pick(sa), pick(hk), keys.length ? keys : ['（解き直しか照合が止まったので全部）']), { label: `照らす:${id}`, phase: 'Judge', schema: JUDGE, ...SON }) : '食い違いも印もないので照らす係は動かさない'
  return { id, write: w, review: rv && rv.scores, found: rv && rv.found.length, ri: ri && { first: ri.first, second: ri.second }, mismatch: mt && mt.mismatch, flagged, judge: j }
}

const ids = (args && args.units) || []
// 同時に進める単元の数（PC を軽くする。D-132）。args.width で変えられる。1 単元は 作る → 審査 → 直す → 解く 2 人 → 照らす の順
const W = Math.max(1, Math.min(ids.length || 1, (args && args.width) || 4))
// 止めたあと動かし直すとき、作る・審査・直すが済んだ単元は args.done に入れると、解く・照らすから始める
// （台本を替えると resumeFromRunId では係の並びが変わり、使い回されないため。-fix2 の知らせ）
const done = new Set((args && args.done) || [])
log(`${ids.length} 単元を作る（${LIGHT ? `軽い形 D-202、腕試しの線 ${LINE}、` : ''}同時に ${W} 単元まで${done.size ? `、直すまで済んだ ${done.size} 単元は解くから` : ''}）`)
if (LIGHT && !ROOT) log('args.root がないので、係には「作業ツリーの根で動く」とだけ言う。cd の一文を入れるには root: "/c/dev/…/作業ツリー" を渡す')
const one = async id => {
  if (LIGHT) return oneLight(id, done.has(id))
  const skip = done.has(id)
  const w = skip ? '作る・審査・直すは前の回で済み（args.done）' : await agent(writePrompt(id), { label: `作る:${id}`, phase: 'Write' })
  if (!w) return null
  const r = skip ? null : await agent(reviewPrompt(id), { label: `審査:${id}`, phase: 'Review', schema: REVIEW, model: 'sonnet' })
  const f = skip ? '前の回で済み' : (!r || (!r.fixes.length && Object.values(r.scores).every(s => s >= 4))) ? '直しなし'
    : await agent(fixPrompt(id, r), { label: `直す:${id}`, phase: 'Fix' })
  const s = (await parallel(['a', 'b'].map(t => () => agent(solvePrompt(id, t), { label: `解く:${id}-${t}`, phase: 'Solve', schema: SOLVE })
    .then(x => x ? { t, answers: x.answers } : null)))).filter(Boolean)
  const j = await agent(judgePrompt(id, s), { label: `照らす:${id}`, phase: 'Judge', schema: JUDGE })
  return { id, write: w, review: r && r.scores, fix: f, judge: j }
}
const out = ids.map(() => null)
let next = 0
await parallel(Array.from({ length: W }, () => async () => {
  while (next < ids.length) {
    const i = next++
    try { out[i] = await one(ids[i]) } catch (e) { log(`${ids[i]} は途中で止まった：${e}`) }
  }
}))
const ok = out.filter(Boolean)
log(`終わった単元 ${ok.length}/${ids.length}`)
return ok
