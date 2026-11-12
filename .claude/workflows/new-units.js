export const meta = {
  name: 'new-units',
  description: 'まだ問題のない単元に、図とイラストの多い問題（docs/problem-figures.md）を作り、審査・直し・答えを見ない係 2 人の解き直しで確かめる（D-129〜D-131）',
  whenToUse: 'みちすじの問題のない単元に、試しの 6 単元の水準で問題を作るとき。args は { units: ["B-017", ...], width: 4 }（width は同時に進める単元の数、省くと 4。止めたあと動かし直すときは done: [直すまで済んだ単元] を足すと、その単元は解くから始める）。1 回に 12 単元ほど',
  phases: [
    { title: 'Write', detail: '単元ごとに問題とイラストを書く' },
    { title: 'Review', detail: '別の係が図を見て審査する' },
    { title: 'Fix', detail: '審査の指摘を直す' },
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
確かめは PYTHONIOENCODING=utf-8 python tools/unitqc.py ${id}（誤り 0、漢字 0 まで）。PNG は全部 Read で見て直し、見たら --clean で消す。全部の問題を自分で解き、答えが 1 つに決まること、ヒントが答えを書いていないことを確かめる。
最後に、docs/problem-figures.md の「戻すもの」を返す。`

const reviewPrompt = id => `みちすじの単元 ${id} の問題を、別の係が新しく作った（units/${id}.yaml）。審査してほしい。日本語で答える。ファイルは書かない（読むだけ）。作業ツリーの根で動く。
まず docs/problem-figures.md を読む（何を目指したか）。単元ファイルを全部読み、全部の問題を自分で解く。図は PYTHONIOENCODING=utf-8 python tools/unitqc.py ${id} で PNG にして Read で見て、見たら --clean ${id} で消す。
疑ってかかって見る：事実のまちがい、答えが 2 つになる問い、図と答えの食い違い（左右を反対にした図で ア・イ を入れかえ忘れる、など）、まぎれる選択肢、段に合わないことばや漢字（svg の中の文字も）、ヒントが答えを言っている、図が小さい・かさなる・何の絵かわからない、図がない見本、絵で見せられるのに文だけの問題。`

const fixPrompt = (id, r) => `みちすじの単元 ${id} の問題（units/${id}.yaml）を、審査の係が見た。指摘を直してほしい。日本語で答える。作業ツリーの根で動く。
まず docs/problem-figures.md を読む。審査の点：${JSON.stringify(r.scores)}。指摘：${JSON.stringify(r.fixes)}。
指摘のうち正しいものを直す（まちがった指摘、正解を絵に描くことになる指摘は、わけを添えて直さない）。書くのは units/${id}.yaml だけ。git、build、check はしない。
直したら PYTHONIOENCODING=utf-8 python tools/unitqc.py ${id} で誤り 0・漢字 0 を確かめ、PNG を見て、見たら --clean で消す。最後に、直したこと・直さなかった指摘とわけ・qc の結果を 10 行以内で返す。`

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
3. 決める：(a) ファイルの答えがまちがい → answer、check、paths を直す。(b) 問いか図が 2 通りに読める・答えが決まらない → 図か文を直して答えを 1 つに決める。(c) 係のまちがい → 直さない（わけを書く）。
4. 書くのは units/${id}.yaml だけ。git、build、check はしない。直したら PYTHONIOENCODING=utf-8 python tools/unitqc.py --no-shot ${id} で誤り 0、漢字 0 を確かめる。
5. docs/problem-figures.md の決まりに従う。`

const ids = (args && args.units) || []
// 同時に進める単元の数（PC を軽くする。D-132）。args.width で変えられる。1 単元は 作る → 審査 → 直す → 解く 2 人 → 照らす の順
const W = Math.max(1, Math.min(ids.length || 1, (args && args.width) || 4))
// 止めたあと動かし直すとき、作る・審査・直すが済んだ単元は args.done に入れると、解く・照らすから始める
// （台本を替えると resumeFromRunId では係の並びが変わり、使い回されないため。-fix2 の知らせ）
const done = new Set((args && args.done) || [])
log(`${ids.length} 単元を作る（同時に ${W} 単元まで${done.size ? `、直すまで済んだ ${done.size} 単元は解くから` : ''}）`)
const one = async id => {
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
