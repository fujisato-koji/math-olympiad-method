export const meta = {
  name: 'fix-units',
  description: '作ってある単元を、図とイラストの多い形（docs/problem-figures.md）に直し、答えを見ない係 2 人の解き直しで確かめて直す（D-131）',
  whenToUse: 'みちすじの作ってある単元を、試しの 6 単元の水準に直すとき。args は { units: ["A-001", ...], width: 4 }（width は同時に進める単元の数、省くと 4）。1 回に 12 単元ほど',
  phases: [
    { title: 'Fix', detail: '記号を固定し、図・ヒント・文・漢字・答えを直す' },
    { title: 'Solve', detail: '答えを見ない係 2 人が解き直す' },
    { title: 'Judge', detail: 'ファイルの答えと照らし、割れた問いを直す' },
  ],
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
    fixed: { type: 'array', items: { type: 'string' }, description: '直した問題（場所、何がまちがいで、どう直したか、id を消したか）' },
    kept: { type: 'array', items: { type: 'string' }, description: '食い違ったが直さなかった問題と、そのわけ（係のまちがい、など）' },
    qc: { type: 'string', description: '最後の tools/unitqc.py の結果（誤り、漢字）' },
  },
  required: ['checked', 'mismatches', 'fixed', 'kept', 'qc'],
}

const fixPrompt = id => `みちすじ（子どもが毎日少しずつ解く学びの地図）の、作ってある単元 ${id} を直す。日本語で考え、答える。作業ツリーの根（いまの作業フォルダ）で動く。
施主の願い：見ただけでわかるように。見本とヒントはできるだけ図とイラストで。図だけでなく、ヒント・文・漢字・答えのまちがいも合わせて直す。
【まず】
1. PYTHONIOENCODING=utf-8 python tools/stamp.py ${id} を実行し、全部の問題に今の記号を id: として書く（子の記録を引き継ぐため。D-044）。
2. docs/problem-figures.md を全部読む（決まり、描き方、試しの審査で多かった指摘、直すときの決まり）。
3. roadmap.yaml で ${id} の行（題、段 stage、日数、前提 needs）を grep で見る。units/${id}.yaml を全部読む。
4. docs/research/unit-quality.md に「### ${id}」の節があれば読む（審査で見つかった問題点、図の案、答えの疑い）。
【直すこと】
- 見本：どの見本にも、その日の新しいことが 1 枚で見てわかる svg の図かイラストを付ける。
- 答える問題：絵や図で見せられるものは、図を見て答える形にする（問いの文は短く）。段 5 以上では、数直線・面積図・表・グラフ・図形・対応の図・模式図など。
- ヒント：答える問題のヒント 3 段のうち、1〜2 段を図の付いたヒント（{text, svg}）にし、答えの手前までを絵で見せる（正解そのものは描かない）。図が助けにならない問題（式の変形だけなど）は文のままでよい。答えをほぼ言っているヒントは、見方・調べ方・一歩手前に直す。
- 文：段に合うことばと長さ。答えが 2 つになる問い、まぎれる選択肢を直す。段の学年より上の漢字（段 6 まで）をかなに開く。
- 答え：全部の答える問題を自分で解き、ファイルの答えと照らす。まちがいは直す。
【守ること】
- 問題の数・日の並び・part・qid のもとは変えない。答えや問いの意味を変えた問題だけ、その id: の行を消す。kinds: [最難関] の問題は中身を変えない（答えのまちがいを見つけたら返す要約に書く）。
- 書くのは units/${id}.yaml だけ。git の操作、tools/roadmap.py の build と check はしない（ほかの係とまざる）。下書きのスクリプトは OS の一時フォルダの michisuji-work/<作業ツリーの名>/${id}/ に置き、終わったら消す。
- 確かめ：PYTHONIOENCODING=utf-8 python tools/unitqc.py ${id} で誤り 0、漢字 0 まで直す。できた PNG は全部 Read で見て、はみ出し・かさなり・何の絵かわからない図を直し、見たら python tools/unitqc.py --clean ${id} で消す（画像をためない）。
【返すもの】10 行以内：足した図の数（見本・問題・ヒント）、直したヒントと文と漢字の数、見つけた答えのまちがい、最難関で気づいたこと、qc の結果。`

const solvePrompt = (id, t) => `あなたは、みちすじの単元 ${id} の問題を、答えを知らずに解く係。日本語で考え、答える。作業ツリーの根（いまの作業フォルダ）で動く。
【守ること】答えを見ない：units/、site/、docs/ のファイルは開かない・grep しない。tools/blind.py の key は使わない。ファイルを書き換えない。
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
3. 決める：(a) ファイルの答えがまちがい → answer、check、paths を直し、その問題の id: の行を消す。(b) 問いか図が 2 通りに読める・答えが決まらない → 図か文を直して答えを 1 つに決める（意味が変わったら id: を消す）。(c) 係のまちがい → 直さない（わけを書く）。kinds: [最難関] の問題は中身を変えず、kept にわけを書く。
4. 書くのは units/${id}.yaml だけ。git、build、check はしない。直したら PYTHONIOENCODING=utf-8 python tools/unitqc.py --no-shot ${id} で誤り 0、漢字 0 を確かめる。
5. docs/problem-figures.md の決まりに従う。`

const ids = (args && args.units) || []
// 同時に進める単元の数（PC を軽くする。D-132）。args.width で変えられる。1 単元は 直す → 解く 2 人 → 照らす の順
const W = Math.max(1, Math.min(ids.length || 1, (args && args.width) || 4))
log(`${ids.length} 単元を直す（同時に ${W} 単元まで）`)
const one = async id => {
  const w = await agent(fixPrompt(id), { label: `直す:${id}`, phase: 'Fix' })
  if (!w) return null
  const s = (await parallel(['a', 'b'].map(t => () => agent(solvePrompt(id, t), { label: `解く:${id}-${t}`, phase: 'Solve', schema: SOLVE })
    .then(r => r ? { t, answers: r.answers } : null)))).filter(Boolean)
  const j = await agent(judgePrompt(id, s), { label: `照らす:${id}`, phase: 'Judge', schema: JUDGE })
  return { id, fix: w, judge: j }
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
