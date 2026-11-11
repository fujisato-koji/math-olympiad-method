/* みちすじ：知の宇宙と全体の地図 → 考え方の水準のページ・組み合わせの層 → 単元の日 → 今日の問題を 1 問ずつ */
(() => {
  'use strict';
  const R = window.ROADMAP;
  const LANES = Object.fromEntries(R.lanes.map(l => [l.id, l]));
  const LANE_ORDER = R.lanes.map(l => l.id);
  const UNITS = Object.fromEntries(R.units.map(u => [u.id, u]));
  // 考え方の水準（D-028）。段（stage）は画面に出さない
  const THINK = Object.fromEntries((R.levels || []).map(l => [l.id, l]));
  const KEY = 'michisuji.progress.v1', PREF = 'michisuji.prefs.v1';
  const STATUS_NAME = { ri: '腕だめしまで', done: '済', doing: 'いま', review: '復習', ready: '次にできる', later: 'まだ' };
  // 問題の量の決まり（R-33〜R-35）。値は仮の設計点で、記録を見て直す。
  // prior は係数の前置き（基本の日数を何日分混ぜるか）。済んだ単元が少ないうちに係数がぶれないようにする。
  const RULE = { low: .6, high: .9, pass: .8, intervals: [1, 7, 30], reviewItems: 2, reviewDay: .25, prior: 20 };

  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lc = id => `--c: var(--lane-${id})`;
  // 問題の文の数式の見せ方（D-042、D-060）。データの書き方は変えず、見せるときに組む（答え合わせ、check の式、鍵盤はそのまま）。
  // - 1 文字の小文字（x、a、n）は斜体のセリフ体にして × と見分ける。数のすぐ後に空白をはさむ 1 文字（5 m、300 g）は単位とみて変えない
  // - 分数（3/4、(x + 1)/3、(x² − 16)/(x − 4)、dy/dx、∂f/∂x）は分子と分母を上下に重ね、外側のかっこを外す
  // - ベクトル（→a、→AB、2→a）は文字の上に矢印、根号（√5、√(x + 1)）は中身の上に横線
  // - lim (x→1) は lim の下に x→1、∫(0→3) と [F(x)](0→3) は右に上と下の端、Σ k（k = 1〜n）は Σ の上と下に範囲
  // - x^2、(1 − p)^(n − k) は右肩に、P_A は右下に
  const TAIL = /^[²³¹⁰-₟′″']*/;  // 文字の後ろに付く肩と添字とプライム
  const FN = /^(sin|cos|tan|log|ln)$/;
  // 立体で書く名前（関数、極限）と単位。ほかの小文字の並び（ac、xy）は文字の積として斜体にする
  const UPRIGHT = /^(sin|cos|tan|sec|csc|cot|log|ln|lim|exp|max|min|mod|gcd|lcm|det|ker|im|rank|dim|km|cm|mm|kg|mg|mL|dL|kL|ha|min|sec)$/;
  // 肩と添字の字（²、ₙ）は、まわりと同じ字体の上付きと下付きにする（字体によって ₙ や ⁿ がないため）
  const SS = { '²': '2', '³': '3', '¹': '1', '⁰': '0', 'ⁱ': 'i', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '−', '⁼': '=', '⁽': '(', '⁾': ')', 'ⁿ': 'n',
    '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9', '₊': '+', '₋': '−', '₌': '=', '₍': '(', '₎': ')',
    'ₐ': 'a', 'ₑ': 'e', 'ₒ': 'o', 'ₓ': 'x', 'ₕ': 'h', 'ₖ': 'k', 'ₗ': 'l', 'ₘ': 'm', 'ₙ': 'n', 'ₚ': 'p', 'ₛ': 's', 'ₜ': 't' };
  const isSub = ch => ch >= '₀' && ch <= '₟';
  function tailHtml(t) {
    let out = '';
    for (const m of (t || '').matchAll(/[′″']+|[^′″']+/g)) {
      const r = m[0];
      if (/^[′″']/.test(r)) { out += `<span class="pr">${r.replace(/'/g, '′')}</span>`; continue; }
      // 上付きと下付きの切れ目で分ける（aₙ₊₁、x²）
      for (const q of r.matchAll(/[₀-₟]+|[^₀-₟]+/g)) {
        const v = Array.from(q[0]).map(ch => SS[ch] || ch).join('');
        out += isSub(q[0][0]) ? `<sub class="m">${letters(v)}</sub>` : `<sup class="m">${letters(v)}</sup>`;
      }
    }
    return out;
  }
  const CJK = /[　-ヿ㐀-鿿＀-￯]/;
  // 矢印の後ろがベクトルの名前か（大文字 1〜2 字、小文字 1 字、零ベクトルの 0）
  const VEC = /^(?:[A-Z]{1,2}(?![A-Za-z])|[a-z](?![A-Za-z(])|0(?![\d.]))/;
  const isVecAt = (s, i) => {
    const m = VEC.exec(s.slice(i + 1)), p = s[i - 1] || '';
    if (!m) return null;
    if (m[0] === '0' && /[\w)]/.test(p)) return null;         // x→0、h→0 は極限の矢印
    if (/[A-Z]/.test(p) && /[A-Z]/.test(m[0][0])) return null;  // A→B→C は道すじの矢印
    return m[0];
  };
  // 閉じるかっこの位置（組にならなければ -1）
  function closeAt(s, i) {
    for (let d = 0, j = i; j < s.length; j++) { if (s[j] === '(') d++; else if (s[j] === ')' && !--d) return j; }
    return -1;
  }
  const bounds = s => { const k = s.indexOf('→'); return k < 0 ? null : [s.slice(0, k), s.slice(k + 1)]; };
  // 字句に分ける。k：g かっこの組、n 数、w ローマ字の並び、s 記号の字、t そのほかの字、と組み立ての字句
  function lex(s) {
    const out = [];
    let i = 0, m;
    const tail = j => TAIL.exec(s.slice(j))[0];
    while (i < s.length) {
      const c = s[i], rest = s.slice(i);
      if (c === '(') {
        const j = closeAt(s, i);
        if (j > 0) { const t = tail(j + 1); out.push({ k: 'g', v: s.slice(i + 1, j), t }); i = j + 1 + t.length; continue; }
      }
      if ((c === '∫' || c === ']') && s[i + 1] === '(') {
        const j = closeAt(s, i + 1), b = j > 0 && bounds(s.slice(i + 2, j));
        if (b) { out.push({ k: c === '∫' ? 'int' : 't', v: c }, { k: 'bd', lo: b[0], hi: b[1] }); i = j + 1; continue; }
      }
      if (c === '∫') { out.push({ k: 'int', v: c }); i++; continue; }
      if ((m = /^lim\s?\(/.exec(rest))) {
        const j = closeAt(s, i + m[0].length - 1);
        if (j > 0 && s.slice(i, j).includes('→')) { out.push({ k: 'lim', v: s.slice(i + m[0].length, j) }); i = j + 1; continue; }
      }
      if (c === 'Σ' && (m = /^Σ\s?([^（、。\n]{0,40}?)（([a-z]) = ([^〜）]{1,12})〜([^）]{1,12})）/.exec(rest))) {
        out.push({ k: 'sum', x: m[2], lo: m[3], hi: m[4] }, { k: 't', v: ' ' }, ...lex(m[1]));
        i += m[0].length; continue;
      }
      if (c === '√') {
        if (s[i + 1] === '(') {
          const j = closeAt(s, i + 1);
          if (j > 0) { const t = tail(j + 1); out.push({ k: 'rt', v: s.slice(i + 2, j), t }); i = j + 1 + t.length; continue; }
        }
        if ((m = /^(?:\d+(?:\.\d+)?|[a-zA-Zα-ω])/.exec(s.slice(i + 1)))) {
          const t = tail(i + 1 + m[0].length);
          out.push({ k: 'rt', v: m[0] + t, t: '' }); i += 1 + m[0].length + t.length; continue;
        }
      }
      if (c === '→') {
        const v = isVecAt(s, i);
        if (v) { const t = tail(i + 1 + v.length); out.push({ k: 'vec', v, t }); i += 1 + v.length + t.length; continue; }
      }
      if (c === '^') {
        if (s[i + 1] === '(') { const j = closeAt(s, i + 1); if (j > 0) { out.push({ k: 'sup', v: s.slice(i + 2, j) }); i = j + 1; continue; } }
        if ((m = /^(?:\d+|[a-z])/.exec(s.slice(i + 1)))) { out.push({ k: 'sup', v: m[0] }); i += 1 + m[0].length; continue; }
      }
      if (c === '_' && s[i + 1] === '(') { const j = closeAt(s, i + 1); if (j > 0) { out.push({ k: 'sub', v: s.slice(i + 2, j) }); i = j + 1; continue; } }
      if (c === '_' && (m = /^[A-Za-z0-9]/.exec(s.slice(i + 1)))) { out.push({ k: 'sub', v: m[0] }); i += 2; continue; }
      if ((m = /^\d+(?:\.\d+)?/.exec(rest))) { const t = tail(i + m[0].length); out.push({ k: 'n', v: m[0], t }); i += m[0].length + t.length; continue; }
      if ((m = /^[A-Za-z]+/.exec(rest))) { const t = tail(i + m[0].length); out.push({ k: 'w', v: m[0], t }); i += m[0].length + t.length; continue; }
      if (/[α-ω]/.test(c) && c !== 'π') { const t = tail(i + 1); out.push({ k: 'gr', v: c, t }); i += 1 + t.length; continue; }
      if (/[π□∞∂]/.test(c)) { const t = tail(i + 1); out.push({ k: 's', v: c, t }); i += 1 + t.length; continue; }
      if (SS[c]) { const t = tail(i); out.push({ k: 's', v: '', t }); i += t.length; continue; }  // ₙCₖ の ₙ のように前に字のない添字
      out.push({ k: 't', v: c }); i++;
    }
    return out;
  }
  // 1 文字の単位か（数と空白のすぐ後、単位の後の /、「単位は W」の W）
  const UNIT_SYMS = /^(N|J|W|V|A|C|K|T|Pa|Hz|mol|Ω|S|F|H|Wb|℃)$/;
  function unitAt(x, i) {
    const w = x[i];
    if (!w || w.k !== 'w') return false;
    if (x[i - 1] && x[i - 1].v === ' ' && x[i - 2] && x[i - 2].k === 'n') return w.v.length <= 3;
    const before = x.slice(Math.max(0, i - 4), i).map(a => a.v || '').join('');
    if (UNIT_SYMS.test(w.v) && /(単位は|単位)\s*$/.test(before)) return true;
    return !!(x[i - 1] && x[i - 1].v === '/' && unitAt(x, i - 2));
  }
  // 分子や分母になれる字句か
  const operand = (x, i) => {
    const a = x[i];
    if (!a) return false;
    if (a.k === 'g') return !CJK.test(a.v);
    if (a.k === 'w') return !unitAt(x, i) && (a.v.length === 1 || /^d[a-z]$/.test(a.v));
    return ['n', 's', 'rt', 'vec', 'sup', 'sub', 'gr'].includes(a.k);
  };
  // 分数を組む：/ の前と後ろの、すき間なく続く字句をまとめる。1/2/3 のように続くものは組まない
  function fracs(x) {
    for (let k = 1; k < x.length - 1; k++) {
      if (x[k].k !== 't' || x[k].v !== '/' || !operand(x, k - 1) || !operand(x, k + 1)) continue;
      let a = k - 1, b = k + 1;
      while (a > 0 && (operand(x, a - 1) || (x[a].k === 'g' && x[a - 1].k === 'w' && x[a - 1].v.length === 1))) a--;
      // 分母は 1 つの字句と、続く肩だけ（f(x) のような関数の形は、名前とかっこをまとめる）。1/2x は 1/2 と x とみる。
      // ∂f/∂x の分母は、∂ と変数名をまとめる（∂x を 1 つのかたまりにする）。∂²f/∂x∂y もまとめる
      if (x[b].k === 's' && x[b].v === '∂' && x[b + 1] && x[b + 1].k === 'w') b++;
      while (x[b + 1] && x[b + 1].k === 's' && x[b + 1].v === '∂' && x[b + 2] && x[b + 2].k === 'w') b += 2;
      if (x[b].k === 'w' && x[b + 1] && x[b + 1].k === 'g') b++;
      while (x[b + 1] && x[b + 1].k === 'sup') b++;
      // sin h/h のように、関数の名前と空白の後ろなら、名前も分子に入れる
      if (a >= 2 && x[a - 1].v === ' ' && x[a - 2].k === 'w' && FN.test(x[a - 2].v)) a -= 2;
      if ((x[a - 1] && x[a - 1].v === '/') || (x[b + 1] && x[b + 1].v === '/')) continue;
      x.splice(a, b - a + 1, { k: 'frac', num: x.slice(a, k), den: x.slice(k + 1, b + 1) });
      k = a;
    }
    return x;
  }
  const raw = x => x.map(a => a.k === 'g' ? `(${a.v})${a.t}` : a.k === 'frac' ? raw(a.num) + '/' + raw(a.den) : (a.v || '') + (a.t || '')).join('');
  // 分子と分母は、かっこの組 1 つだけなら外側のかっこを外す
  const part = x => x.length === 1 && x[0].k === 'g' && !x[0].t ? mx(x[0].v) : html(x);
  const letters = v => Array.from(v).map(ch => (/[a-zα-ω]/.test(ch) && ch !== 'π') ? `<i class="v">${ch}</i>` : esc(ch)).join('');
  // 分数・根号・積分・極限・行列を含むかっこは、中身の高さに合わせて伸ばす
  const tallGroup = v => {
    if (v.includes(MAT0) || v.includes(MAT1)) return true;
    return fracs(lex(v)).some(a => ['frac', 'rt', 'int', 'sum', 'lim', 'bd'].includes(a.k) || (a.k === 'g' && tallGroup(a.v)));
  };
  function html(x, flat) {
    return x.map((a, i) => {
      const t = tailHtml(a.t);
      switch (a.k) {
        case 'g': {
          const inner = mx(a.v, flat);
          if (flat || !tallGroup(a.v)) return `(${inner})${t}`;
          // 分数や偏微分を包むかっこは、中身の高さに合わせた曲線で描く
          return `<span class="pgroup"><svg class="par left" viewBox="0 0 10 20" preserveAspectRatio="none" aria-hidden="true"><path d="M7 .5 C3 4.5, 3 15.5, 7 19.5"/></svg><span class="pcontent">${inner}</span><svg class="par right" viewBox="0 0 10 20" preserveAspectRatio="none" aria-hidden="true"><path d="M3 .5 C7 4.5, 7 15.5, 3 19.5"/></svg></span>${t}`;
        }
        case 'w':
          // 1 文字の大文字は変数として斜体（W = 仕事、E = エネルギー）。単位（10 W、単位は W）は立体のまま
          if (/^[A-Z]$/.test(a.v) && !unitAt(x, i) && !UPRIGHT.test(a.v)) return `<i class="v">${esc(a.v)}</i>${t}`;
          return (/^[a-z]{1,3}$/.test(a.v) && !unitAt(x, i) && !UPRIGHT.test(a.v) && !/^d[a-z]$/.test(a.v) ? letters(a.v) : esc(a.v)) + t;
        case 'n': case 's': return esc(a.v) + t;
        case 'gr': return `<i class="v">${esc(a.v)}</i>${t}`;
        case 'frac': {
          // 分子に下付きの字があるときは、分数の線とぶつからないよう分子の下を広げる
          const sub = a.num.some(t => t.k === 'sub' || (t.t && /[₀-₟]/.test(t.t)) || (t.k === 'g' && /[_₀-₉]/.test(t.v)));
          return `<span class="frac${sub ? ' frac-sub' : ''}" role="math" aria-label="${esc(raw(a.den))}ぶんの${esc(raw(a.num))}"><span>${part(a.num)}</span><span>${part(a.den)}</span></span>`;
        }
        case 'vec': return `<span class="vec">${letters(a.v)}${t}</span>`;
        // 根号は √ の字を使わず線で描く（字体によって √ と横線が離れるため）。中身の高さに合わせて伸びる
        case 'rt': return `<span class="sqrt" role="math" aria-label="ルート ${esc(a.v)}"><svg class="rt" viewBox="0 0 10 20" preserveAspectRatio="none" aria-hidden="true"><path d="M.4 12.2 2.6 10.8 5.4 19.6 10 0"/></svg><span class="rad">${mx(a.v, flat)}</span></span>${t}`;
        case 'sup': return `<sup class="m">${mx(a.v, true)}</sup>`;
        case 'sub': return `<sub class="m">${letters(a.v)}</sub>`;
        case 'lim': return `<span class="lim"><span>lim</span><span class="lim-to">${mx(a.v, true)}</span></span>`;
        case 'int': return `<span class="int">∫</span>`;
        case 'bd': return `<span class="bd"><span>${mx(a.hi, true)}</span><span>${mx(a.lo, true)}</span></span>`;
        case 'sum': return `<span class="sum"><span>${mx(a.hi, true)}</span><span class="sg">Σ</span><span>${letters(a.x)} = ${mx(a.lo, true)}</span></span>`;
        default: return esc(a.v);
      }
    }).join('');
  }
  // flat は、肩や端の中（分数を重ねず、斜線のまま）
  const mx = (s, flat) => { const x = lex(s); return html(flat ? x : fracs(x), flat); };
  // 用語の説明は、原稿で《用語》と囲んだ所にだけ付ける（D-063）。日本語は語の切れ目がなく、
  // 字面を走査すると「原子核」の「核」と「準同型の核」を区別できない。どの意味で使ったかは原稿側で決める。
  // 用語集は glossary.yaml が唯一の情報源。ここにない語を《》で囲むと、roadmap.py check が誤りとして報告する。
  const GLOSS = Object.fromEntries((R.glossary || []).map(g => [g.term, g]));
  const GS = '\uE000', GE = '\uE001';
  const markGloss = s => String(s ?? '').replace(/《([^》\n]+)》/g, (m, t) => GLOSS[t] ? GS + t + GE : m);
  const glossHtml = h => h.replace(/\uE000([^\uE001]*)\uE001/g, (m, t) => `<span class="gloss" tabindex="0" data-g="${esc(t)}">${esc(t)}</span>`);
  // 行列：(a b；c d) の書き方を、行と列に組む（D-064）。；が行の切れ目、空白か「、」が列の切れ目。
  // 成分が式のときは「、」で区切る（M-002 の約束）。組めない形は、そのまま文字で残す。
  const MAT0 = String.fromCharCode(0xE002), MAT1 = String.fromCharCode(0xE003);
  const matPlace = new RegExp(MAT0 + '(\\d+)' + MAT1, 'g');
  function matHtml(inner) {
    const rows = inner.split('；').map(r => r.trim()).filter(Boolean);
    if (rows.length < 2) return '';
    const cells = rows.map(r => (r.includes('、') ? r.split('、') : r.split(/\s+/)).map(x => x.trim()).filter(Boolean));
    if (cells.some(r => !r.length) || new Set(cells.map(r => r.length)).size !== 1) return '';
    return `<span class="mat" role="math" aria-label="${esc(inner)}">` +
      `<svg class="par left" viewBox="0 0 10 20" preserveAspectRatio="none" aria-hidden="true"><path d="M7 .5 C3 4.5, 3 15.5, 7 19.5"/></svg>` +
      `<span class="mgrid">${cells.map(r =>
      `<span class="mrow">${r.map(c => `<span class="mcell">${glossHtml(mx(c))}</span>`).join('')}</span>`).join('')}</span>` +
      `<svg class="par right" viewBox="0 0 10 20" preserveAspectRatio="none" aria-hidden="true"><path d="M3 .5 C7 4.5, 7 15.5, 3 19.5"/></svg></span>`;
  }
  function markMat(s) {
    const mats = [];
    const text = String(s ?? '').replace(/\(([^()]*；[^()]*)\)/g, (m, inner) => {
      const h = matHtml(inner);
      if (!h) return m;
      mats.push(h);
      return MAT0 + (mats.length - 1) + MAT1;
    });
    return { text, mats };
  }
  const putMat = (h, mats) => h.replace(matPlace, (m, i) => mats[Number(i)] ?? m);
  const fmt = s => { const m = markMat(markGloss(s)); return kindify(putMat(glossHtml(mx(m.text)), m.mats)); };
  // 単元の記号（A-024 など）を、その単元のページへのリンクにする（ヒント・見どころ・手本）
  const fmtLinks = s => { const m = markMat(markGloss(s)); return kindify(putMat(glossHtml(mx(m.text).replace(/\b([A-Z])-(\d{3})\b/g, x => UNITS[x] ? `<a class="ulink" href="#/unit/${x}" target="_blank" rel="noopener">${x}</a>` : x)), m.mats)); };
  // 見本の説明は、長い文を文ごとに改行し、｜で囲んだ表を組む（D-067）。
  // 例：｜量｜記号｜意味｜ の行を続けると、見出しつきの表になる。
  const TB0 = String.fromCharCode(0xE004), TB1 = String.fromCharCode(0xE005);
  const tbPlace = new RegExp(TB0 + '(\\d+)' + TB1, 'g');
  function markTable(s) {
    const tables = [];
    const lines = String(s ?? '').split('\n');
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      if (/^｜.*｜/.test(lines[i].trim())) {
        const block = [];
        while (i < lines.length && /^｜.*｜/.test(lines[i].trim())) block.push(lines[i++].trim());
        i--;
        const rows = block.map(line => line.replace(/^｜|｜$/g, '').split('｜').map(x => x.trim()));
        if (rows.length >= 2 && rows.every(r => r.length === rows[0].length)) {
          const cell = c => glossHtml(mx(markGloss(c)));
          const html = `<table class="tbl"><thead><tr>${rows[0].map(c => `<th>${cell(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(r => `<tr>${r.map(c => `<td>${cell(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
          tables.push(html);
          out.push(TB0 + (tables.length - 1) + TB1);
          continue;
        }
      }
      out.push(lines[i]);
    }
    return { text: out.join('\n'), tables };
  }
  const putTable = (h, tables) => h.replace(tbPlace, (m, i) => tables[Number(i)] ?? m);
  // 説明文の「素性」：定義・定理・法則・公理・公式・原理・性質・約束・予想・モデル・近似・方法・現象・仮説（D-067）
  const KIND_NAMES = ['定義', '定理', '法則', '公理', '公式', '原理', '性質', '約束', '予想', 'モデル', '近似', '方法', '現象', '仮説'];
  const KIND_ALT = KIND_NAMES.join('|');
  const KIND_BRACKET = new RegExp('【(' + KIND_ALT + ')】', 'g');
  const KIND_NAMED = new RegExp('([一-龯\u30A0-\u30FFA-Za-z0-9・ー]+)の(' + KIND_ALT + ')', 'g');
  const kindSpan = (key, label = key) => `<span class="kind gloss" tabindex="0" data-g="${esc(key)}">${esc(label)}</span>`;
  function kindify(h) {
    return h
      .replace(KIND_BRACKET, (m, k) => kindSpan(k) + ' ')
      .replace(KIND_NAMED, (m, name, k) => {
        // 名前全体が用語集にあるときだけ、名前全体にホバー説明を付ける。
        // 用語集にない名前は、普通の文としてそのまま出す（「定理」だけのラベルにしない）。
        const full = name + 'の' + k;
        return GLOSS[full] ? `<span class="gloss" tabindex="0" data-g="${esc(full)}">${esc(full)}</span>` : `${name}の${k}`;
      });
  }
  const fmtExplain = s => {
    const t = markTable(s);
    const text = t.text.split('\n').map(line =>
      line.length > 72 && !line.startsWith(TB0) ? line.replace(/。(?!$)/g, '。\n') : line
    ).join('\n');
    return putTable(fmtLinks(text), t.tables);
  };
  let glossTip = null;
  function glossTipEl() {
    if (!glossTip) {
      glossTip = document.createElement('div');
      glossTip.id = 'gloss-tip';
      document.body.appendChild(glossTip);
    }
    return glossTip;
  }
  function showGloss(g) {
    const item = GLOSS[g.dataset.g];
    if (!item) return;
    const tip = glossTipEl();
    const u = item.unit && UNITS[item.unit] ? `<a class="u" href="#/unit/${item.unit}" target="_blank" rel="noopener">${esc(item.unit)} ${esc(UNITS[item.unit].title)}</a>` : '';
    tip.innerHTML = `<div>${esc(item.text)}</div>${u}`;
    tip.classList.add('on');
    const r = g.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    const left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), window.innerWidth - w - 8);
    let top = r.top - h - 8;
    if (top < 8) top = r.bottom + 8;
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  }
  function hideGloss() {
    if (glossTip) glossTip.classList.remove('on');
  }
  document.addEventListener('mouseover', e => {
    const g = e.target.closest && e.target.closest('.gloss');
    if (g) showGloss(g);
  });
  document.addEventListener('mouseout', e => {
    const g = e.target.closest && e.target.closest('.gloss');
    if (g) hideGloss();
  });
  document.addEventListener('focusin', e => {
    const g = e.target.closest && e.target.closest('.gloss');
    if (g) showGloss(g);
  });
  document.addEventListener('focusout', e => {
    const g = e.target.closest && e.target.closest('.gloss');
    if (g) hideGloss();
  });
  window.addEventListener('scroll', hideGloss, true);
  // 図の中のベクトル（→a）と根号（√3）を、描いたあとに文字の位置を測って組む（D-060）。測れない図はそのまま
  function figMath(root) {
    root.querySelectorAll('.fig-svg text').forEach(tx => {
      const S = tx.textContent;
      if (!/[→√]/.test(S) || typeof tx.getExtentOfChar !== 'function') return;
      try { if (tx.getNumberOfChars() !== S.length) return; } catch { return; }
      const del = [], marks = [];
      for (let i = 0; i < S.length; i++) {
        if (S[i] === '→') { const v = isVecAt(S, i); if (v) { del.push(i); marks.push({ k: 'vec', a: i + 1, b: i + 1 + v.length }); } }
        else if (S[i] === '√') { const m = /^(?:\d+(?:\.\d+)?|[a-zA-Z])/.exec(S.slice(i + 1)); if (m) marks.push({ k: 'rt', a: i + 1, b: i + 1 + m[0].length }); }
      }
      if (!marks.length) return;
      // 矢印の字を消す（後ろから）
      const nodes = [], w = document.createTreeWalker(tx, NodeFilter.SHOW_TEXT);
      for (let n, at = 0; (n = w.nextNode());) { nodes.push({ n, at }); at += n.data.length; }
      del.slice().reverse().forEach(p => { const o = nodes.filter(z => z.at <= p).pop(); o.n.deleteData(p - o.at, 1); });
      const shift = p => del.filter(d => d < p).length;
      const fs = parseFloat(getComputedStyle(tx).fontSize) || 14, col = getComputedStyle(tx).fill || 'currentColor';
      // 基準線：y の値（dominant-baseline が中央なら少し下）。測れなければ字の箱の下のほう
      const db = tx.getAttribute('dominant-baseline') || '', y0 = parseFloat(tx.getAttribute('y'));
      const base = e => !isNaN(y0) && !tx.querySelector('[dy],[y]') ? y0 + (/middle|central/.test(db) ? fs * .34 : /hanging|before/.test(db) ? fs * .8 : 0) : e.y + e.height * .8;
      // √ の字は見えなくする（幅はそのまま）
      const hide = q => {
        const w2 = document.createTreeWalker(tx, NodeFilter.SHOW_TEXT);
        for (let n, at = 0; (n = w2.nextNode()); at += n.data.length) {
          if (q >= at + n.data.length) continue;
          const r = n.splitText(q - at); r.splitText(1);
          const ts = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
          ts.setAttribute('fill-opacity', '0'); ts.setAttribute('stroke-opacity', '0');
          r.replaceWith(ts); ts.appendChild(r); return;
        }
      };
      let d = '';
      marks.forEach(mk => {
        try {
          const e1 = tx.getExtentOfChar(mk.a - shift(mk.a)), e2 = tx.getExtentOfChar(mk.b - 1 - shift(mk.b - 1));
          const x0 = e1.x + fs * .04, x1 = e2.x + e2.width - fs * .02, h = fs * .16, b = base(e1);
          if (mk.k === 'vec') {
            const y = b - fs * (/[A-Z]/.test(S[mk.a]) ? 1 : .9);  // b や d の上の端より上
            d += `M${x0} ${y}H${x1}M${x1 - h} ${y - h * .8}L${x1} ${y}L${x1 - h} ${y + h * .8}`;
          } else {
            // 根号：√ の字の幅に、かぎと斜めの線を描き、中身の上の横線へつなぐ
            const q = mk.a - 1 - shift(mk.a - 1), er = tx.getExtentOfChar(q), w = er.width, top = b - fs * .84;
            d += `M${er.x + w * .06} ${b - fs * .36}L${er.x + w * .26} ${b - fs * .44}L${er.x + w * .52} ${b + fs * .06}L${er.x + w * .94} ${top}H${x1 + fs * .04}`;
            hide(q);
          }
        } catch { /* 測れない字は飛ばす */ }
      });
      if (!d) return;
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', d); p.setAttribute('fill', 'none'); p.setAttribute('stroke', col);
      p.setAttribute('stroke-width', (fs * .075).toFixed(2)); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('stroke-linejoin', 'round');
      if (tx.getAttribute('transform')) p.setAttribute('transform', tx.getAttribute('transform'));
      tx.after(p);
    });
  }
  // 天秤（D-042）：{left, right, tilt: left|right|level}。left と right は皿にのせる物（空白で区切れば語ごと、なければ 1 字ずつ）。
  // 並びにすると横に並べる。重い側の皿が下がる
  const seg = s => { s = String(s ?? ''); if (/\s/.test(s.trim())) return s.trim().split(/\s+/);
    return window.Intl && Intl.Segmenter ? [...new Intl.Segmenter('ja', { granularity: 'grapheme' }).segment(s)].map(x => x.segment) : Array.from(s); };
  function balanceSvg(b) {
    const a = b.tilt === 'left' ? 1 : b.tilt === 'right' ? -1 : 0, th = a * .17, cx = 130, cy = 62, L = 98;
    const ends = [[cx - L * Math.cos(th), cy + L * Math.sin(th)], [cx + L * Math.cos(th), cy - L * Math.sin(th)]];
    const pan = ([x, y], items) => {
      const py = y + 36, ts = seg(items), per = 3, rows = Math.ceil(ts.length / per) || 1;
      const goods = ts.map((tk, i) => {
        const r = Math.floor(i / per), k = i % per, n = Math.min(per, ts.length - r * per), big = [...tk].length <= 2;
        return `<text x="${x + (k - (n - 1) / 2) * 29}" y="${py - 6 - r * 29}" font-size="${big ? 28 : 15}" text-anchor="middle">${esc(tk)}</text>`;
      }).join('');
      return `<line x1="${x}" y1="${y}" x2="${x - 36}" y2="${py}"/><line x1="${x}" y1="${y}" x2="${x + 36}" y2="${py}"/>
        <path class="pan" d="M${x - 44},${py} Q${x},${py + 16} ${x + 44},${py} Z"/>${goods}`;
    };
    const label = `てんびん：ひだり ${b.left || ''}、みぎ ${b.right || ''}、${a > 0 ? 'ひだりが さがる' : a < 0 ? 'みぎが さがる' : 'つりあう'}`;
    return `<svg class="balance" viewBox="18 4 224 160" role="img" aria-label="${esc(label)}">
      <path class="base" d="M${cx - 44},160 h88 l-10,-8 h-68 Z"/><line x1="${cx}" y1="${cy}" x2="${cx}" y2="152"/>
      <line class="beam" x1="${ends[0][0]}" y1="${ends[0][1]}" x2="${ends[1][0]}" y2="${ends[1][1]}"/><circle cx="${cx}" cy="${cy}" r="4.5"/>
      ${pan(ends[0], b.left)}${pan(ends[1], b.right)}</svg>`;
  }
  const balanceHtml = b => `<div class="fig fig-svg balances">${(Array.isArray(b) ? b : [b]).map(balanceSvg).join('')}</div>`;
  const localDate = (d = new Date()) => d.toLocaleDateString('sv-SE');
  const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return localDate(d); };

  // ---- 記録（この端末のブラウザの中だけ、D-044） ----
  // 人ごとの記録を束ねる：{schema: 2, current, profiles: {pid: {name, created, rec}}}。
  // rec.units は単元ごとの日のまとめ（日の印 key つき）、rec.items は問題ごとの記録（問題の記号 qid ごと）。
  // 問題を直したり足したりしても、単元の記号の付け替え（renamed）、日の印、問題の記号で引き継ぐ
  function load(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 保存できない環境でも表示は続ける */ } }
  const STORE_KEY = 'michisuji.store.v2';
  const newProfile = (name, rec) => ({ name, created: new Date().toLocaleDateString('sv-SE'), rec: rec || { units: {}, items: {} } });
  // 人の記号は端末をまたいでも重ならないように、時刻と乱数から作る
  const newPid = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  let store = load(STORE_KEY, null);
  if (!store || store.schema !== 2 || !store.profiles || !Object.keys(store.profiles).length) {
    // 前の形（1 人分の記録）は「1 人目」として引き継ぐ
    const old = load(KEY, null);
    const pid = newPid();
    store = { schema: 2, current: pid, profiles: { [pid]: newProfile('1 人目', old && typeof old.units === 'object' ? { units: old.units, items: {} } : null) } };
  }
  // 前の作りでは、端末で最初の人の記号がどの端末でも p1 だった。端末ごとに重ならない記号に付け替える（D-051）
  if (store.profiles.p1) {
    const pid = newPid();
    store.profiles[pid] = store.profiles.p1; delete store.profiles.p1;
    if (store.current === 'p1') store.current = pid;
  }
  if (!store.profiles[store.current]) store.current = Object.keys(store.profiles)[0];
  // 記録を、いまの地図と問題に合わせ直す
  function migrate(p) {
    const ren = R.renamed || {};
    p.units = p.units || {}; p.items = p.items || {};
    // 単元の記号の付け替え（N1-01 → N-001、B-047 → I-001 など）
    Object.keys(p.units).forEach(k => { if (ren[k] && !p.units[ren[k]]) { p.units[ren[k]] = p.units[k]; delete p.units[k]; } });
    Object.keys(p.items).forEach(q => {
      const i = q.indexOf(':'), u = q.slice(0, i);
      if (i > 0 && ren[u]) { const nq = ren[u] + q.slice(i); if (!p.items[nq]) p.items[nq] = p.items[q]; delete p.items[q]; }
    });
    // ふりかえりの課題（D-045）
    p.asks = (p.asks || []).map(a => ({ ...a, u: ren[a.u] || a.u, from: ren[a.from] || a.from })).filter(a => UNITS[a.u]);
    p.asks.forEach(a => { const m = a.key ? UNITS[a.u].days.findIndex(d => d.key === a.key) + 1 : 0; a.day = m || Math.min(a.day || 1, UNITS[a.u].days.length); });
    // 日の並びが変わったら、日の印（ねらい、なければ種類と何番目か）で記録の日を合わせ直す
    Object.entries(p.units).forEach(([id, r]) => {
      const u = UNITS[id];
      if (!u || !r.days) return;
      const move = {};
      Object.entries(r.days).forEach(([n, v]) => {
        const m = v && v.key ? u.days.findIndex(d => d.key === v.key) + 1 : +n;
        if (m > 0) move[n] = m;
      });
      if (Object.entries(move).every(([n, m]) => +n === m) && Object.keys(move).length === Object.keys(r.days).length) return;
      const to = n => move[n] || (+n <= u.days.length ? +n : 0), days = {}, extra = {};
      Object.entries(r.days).forEach(([n, v]) => { if (move[n]) days[move[n]] = v; });
      Object.entries(r.extra || {}).forEach(([n, v]) => { if (to(n)) extra[to(n)] = v; });
      r.days = days; r.extra = extra;
      r.skip = (r.skip || []).map(to).filter(Boolean);
      if (r.pending) r.pending = to(r.pending) || null;
    });
    return p;
  }
  Object.values(store.profiles).forEach(pr => migrate(pr.rec));
  let progress = store.profiles[store.current].rec;
  // 保存のたびに呼ぶもの（Google ドライブへ送る、D-049）。ドライブを使わないときは何もしない
  let onPersist = null;
  const persist = () => { save(STORE_KEY, store); if (onPersist) onPersist(); };
  persist();
  // 問題ごとの記録：解いた回数、一度でできた回数、ヒント、間違い、とばした、わからない、目安をすぎた、最後にかかった秒
  function noteItem(it, res) {
    if (!it || !it.qid || !res) return;
    const x = progress.items[it.qid] || (progress.items[it.qid] = { n: 0, ok: 0, h: 0, w: 0 });
    x.n++; if (res.first) x.ok++;
    x.h += res.hints || 0; x.w += Math.max(0, (res.tries || 1) - 1);
    if (res.skipped) x.s = (x.s || 0) + 1;
    if (res.dunno) x.d = (x.d || 0) + 1;
    if (res.over) x.o = (x.o || 0) + 1;
    if (res.ms) x.t = Math.round(res.ms / 1000);
    // 腕だめしの星（D-047）：解けた ★、ヒントなし ★★、一度に目安の内 ★★★。いちばんよいものを残す
    if (it.part === '離' && !res.skipped) x.star = Math.max(x.star || 0, res.first ? 3 : !res.hints && !res.dunno ? 2 : 1);
    x.last = new Date().toLocaleDateString('sv-SE');
    // 日の記録（D-046）：解いた問題、一度にできた問題、かかった秒、終えた日の数。400 日分まで残す
    const L = progress.log || (progress.log = {}), g = L[x.last] || (L[x.last] = { n: 0, ok: 0, sec: 0, days: 0 });
    if (!res.skipped) g.n++;
    if (res.first) g.ok++;
    g.sec += Math.round((res.ms || 0) / 1000);
    const ks = Object.keys(L);
    if (ks.length > 400) ks.sort().slice(0, ks.length - 400).forEach(k => delete L[k]);
  }
  // わけの深さ（D-016）。考え方の水準と同じ軸（D-028）
  const REASON = ['', '例で見せて口で言う', '代表の例で文に書く', '約束した定義と事実から筋道を立てて書く', '公理から体系として書く', '定義を選び直す'];
  const circled = n => '①②③④⑤'[n - 1] || '';
  const prefs = Object.assign({ music: true, parent: false, goal: 'all', riGroup: 'order' }, load(PREF, {}));
  // 探索の画面の見方は前提のつながりだけにした（D-050）。前に「橋」を選んでいても前提で開く
  prefs.mapComb = false;
  if (!['order', 'kinds', 'uses'].includes(prefs.riGroup)) prefs.riGroup = 'order';
  // 目標：網羅表が指す単元とその前提。'all' はすべての単元（大会のための単元も含む）
  const GOALS = R.goals || [];
  const GOAL_SETS = Object.fromEntries(GOALS.map(g => [g.id, new Set(g.units)]));
  if (prefs.goal !== 'all' && !GOAL_SETS[prefs.goal]) prefs.goal = 'all';
  const inGoal = id => prefs.goal === 'all' || GOAL_SETS[prefs.goal].has(id);
  // 選んで解く論題（選択科目）の単元：道のりには入らないが、関係図に薄く描く
  const CHOICE_SETS = Object.fromEntries(GOALS.map(g => [g.id, new Set(g.choiceUnits || [])]));
  const inChoice = id => prefs.goal !== 'all' && CHOICE_SETS[prefs.goal].has(id);
  // 論題に届いた＝その論題を受け持つ単元がすべて済
  const isDone = id => !!(progress.units[id] && progress.units[id].done);
  // その単元に問題が入っているか（2D の関係図で、まだ問題のない単元を薄くする）
  const hasProblems = u => (u.days || []).some(d => (d.items || []).length);
  const topicDone = it => !!(it.units && it.units.length && it.units.every(isDone));
  function goalStats(g) {
    // 選んで解く論題の組（choices）は、組ごとに選ぶ数だけを数える（道のりには入らない）
    const must = g.items.filter(i => i.units && i.units.length && !i.choice);
    let topics = must.length, got = must.filter(topicDone).length;
    Object.entries(g.choices || {}).forEach(([k, c]) => {
      topics += c.pick;
      got += Math.min(c.pick, g.items.filter(i => i.choice === k && i.units && i.units.length && topicDone(i)).length);
    });
    return { topics, got, units: g.units.length, done: g.units.filter(isDone).length,
      pct: Math.round(100 * got / Math.max(1, topics)) };
  }
  function satisfied() {
    const s = new Set();
    GOALS.forEach(g => g.items.forEach(i => { if (topicDone(i)) s.add(g.id + ':' + i.id); }));
    return s;
  }
  const topicsOf = uid => GOALS.flatMap(g => g.items.filter(i => (i.units || []).includes(uid)).map(i => ({ g, i })));
  // 組み合わせ（D-031）：前提がどの領域を合わせたものか。広さは遠い領域を広く合わせるほど大きく、珍しい組には印を付ける
  const REGION_NAME = Object.fromEntries((R.regions || []).map(r => [r.id, r.name]));
  const LAYER = R.combLayer || { bridges: [], unitPairs: [], probPairs: [], probUnseen: [] };
  const BRIDGES = new Set(LAYER.bridges);
  function combHtml(u) {
    const c = u.comb;
    if (!c) return '';
    const rare = c.r >= 1 ? `<span class="pill rare" title="地図の中で、期待より少ない組（${esc(c.pr.map(r => REGION_NAME[r]).join(' × '))}）">珍しい組み合わせ</span>` : '';
    const bridge = BRIDGES.has(u.id) ? '<a class="pill rare" href="#/comb">橋の単元</a>' : '';
    return `<div class="row comb">組み合わせ ${c.rg.map(r => `<span class="from">${esc(REGION_NAME[r] || r)}</span>`).join('<span class="x">×</span>')}
      <span class="comb-bar" title="組み合わせの広さ ${c.b}"><i style="width:${Math.round(100 * c.b / 0.7)}%"></i></span>${rare}${bridge}</div>`;
  }
  // 単元が受け持つ論題。多いときは数だけ見せて畳む
  function topicsHtml(ts) {
    if (!ts.length) return '';
    const one = ({ g, i }) => `<a class="from" href="#/goal/${g.id}" style="--c: var(--ok)">${esc(g.name)}「${esc(i.topic)}」</a>`;
    if (ts.length <= 4) return `<div class="row">受け持つ論題 ${ts.map(one).join('')}</div>`;
    return `<details class="row topics-fold"><summary>受け持つ論題 ${ts.length}（${new Set(ts.map(t => t.g)).size} の目標）</summary>${ts.map(one).join('')}</details>`;
  }
  // 目標は種類ごとにまとめ、種類の中は小学から大学院の順に並べる（2.12）
  const LEVELS = ['小学', '中学', '高校', '大学', '大学院'];
  const levelOf = g => LEVELS.reduce((a, l, i) => (g.level || '').startsWith(l) ? i : a, LEVELS.length);
  const KINDS = (R.goalKinds || []).filter(k => GOALS.some(g => g.kind === k));
  // 頂点の目標は分野の順、ほかは段階の順
  const FIELD_ORDER = R.goalFields || [], fieldOf = g => (FIELD_ORDER.indexOf(g.field) + 1) || 99;
  const goalsOf = k => GOALS.filter(g => g.kind === k).sort((a, b) => fieldOf(a) - fieldOf(b) || levelOf(a) - levelOf(b));
  const kindNow = () => KINDS.includes(prefs.goalKind) ? prefs.goalKind : ((GOALS.find(g => g.id === prefs.goal) || {}).kind || KINDS[0]);
  // 近い目標：まだ届いていない目標のうち、論題の割合が高く、残りの単元が少ないもの。種類ごとに 1 つ
  function nearGoals(n) {
    const st = new Map(GOALS.map(g => [g.id, goalStats(g)]));
    const left = g => st.get(g.id).units - st.get(g.id).done;
    const near = (a, b) => st.get(b.id).pct - st.get(a.id).pct || left(a) - left(b);
    const open = KINDS.map(k => GOALS.filter(g => g.kind === k && st.get(g.id).pct < 100).sort(near)[0])
      .filter(Boolean).sort(near).slice(0, n);
    const cur = GOALS.find(g => g.id === prefs.goal);
    if (cur && !open.includes(cur)) open.unshift(cur);
    return { list: open.map(g => [g, st.get(g.id)]), reached: GOALS.filter(g => st.get(g.id).pct === 100).length };
  }

  function rec(id) {
    const r = progress.units[id] || (progress.units[id] = {});
    r.days = r.days || {}; r.extra = r.extra || {}; r.skip = r.skip || [];
    return r;
  }
  function status(id) {
    const r = progress.units[id];
    if (r && r.done) return r.review && r.review.lapsed ? 'review' : 'done';
    if (r && Object.keys(r.days || {}).length) return 'doing';
    const alt = UNITS[id].alt || {};
    return UNITS[id].needs.every(n => [n, ...(alt[n] || [])].some(isDone)) ? 'ready' : 'later';
  }
  // 見せる状態（D-048）：済のうち、腕だめしをすべて解いた単元は「腕だめしまで」（ri）。
  // 進みは、途中なら日の割合（やった日ととばした日）、済なら腕だめしの解けた割合
  const riSolved = id => (UNITS[id].ri || []).filter(it => ((progress.items[it.qid] || {}).star || 0) > 0).length;
  function stateOf(id) {
    const s = status(id), n = (UNITS[id].ri || []).length;
    return s === 'done' && n && riSolved(id) >= n ? 'ri' : s;
  }
  function progOf(id) {
    const u = UNITS[id], r = progress.units[id] || {}, s = status(id);
    if (s === 'doing' || s === 'review') return Math.min(1, new Set([...Object.keys(r.days || {}).map(Number), ...(r.skip || [])]).size / u.days.length);
    return s === 'done' && (u.ri || []).length ? riSolved(id) / u.ri.length : 0;
  }
  // 次にやること：おさらいの日、まだの日（とばした日を除く）、どれも済なら確認の日のやり直し
  function nextStep(id) {
    const u = UNITS[id], r = progress.units[id] || {};
    if (r.pending) return { type: 'extra', day: r.pending };
    const days = r.days || {}, skip = r.skip || [];
    for (let i = 1; i <= u.days.length; i++) if (!days[i] && !skip.includes(i)) return { type: 'day', day: i };
    return { type: 'day', day: u.days.length };
  }
  // 答えの鍵盤（D-039）：段 1〜2 は数字だけ 3 けた、段 3 から「.」「/」、段 4 から「−」、8 字まで
  // 単元の keys（地図に書く）で鍵を足せる。段 2 の負の数の単元など
  const padKeys = id => { const u = UNITS[id], st = u.stage, ks = [...(st >= 4 ? ['−'] : []), ...(st >= 3 ? ['.', '/'] : [])];
    (u.keys || []).forEach(k => { if (!ks.includes(k)) ks.unshift(k); }); return ks; };
  const padMax = id => UNITS[id].stage >= 3 ? 8 : (UNITS[id].keys || []).includes('−') ? 4 : 3;
  // 答え合わせ：マイナスの書き方をそろえ、空白を除いて比べる。accept は認める別の書き方
  const norm = v => String(v).replace(/[-‐－]/g, '−').replace(/\s+/g, '');
  const isRight = (it, v) => [it.answer, ...(it.accept || [])].some(a => norm(a) === norm(v));
  const stepHref = (id, s) => `#/${s.type === 'extra' ? 'extra' : 'day'}/${id}/${s.day}`;
  // 前提の浅い順、同じ深さなら流れの順
  const order = (a, b) => DEPTH[a.id] - DEPTH[b.id] || LANE_ORDER.indexOf(a.lane) - LANE_ORDER.indexOf(b.lane) || a.id.localeCompare(b.id);
  function options() {
    const today = localDate();
    const due = R.units.filter(u => {
      const v = progress.units[u.id] && progress.units[u.id].review;
      return v && !v.lapsed && !v.complete && v.due <= today;
    }).sort(order).map(u => ({ u, href: `#/review/${u.id}`, mode: '確かめ', label: `${RULE.reviewItems} 問` }));
    const doing = R.units.filter(u => ['doing', 'review'].includes(status(u.id))).sort(order).map(u => {
      const s = nextStep(u.id);
      const mode = status(u.id) === 'review' ? '復習' : s.type === 'extra' ? 'おさらい' : 'つづき';
      return { u, href: stepHref(u.id, s), mode, label: `${s.day} 日目` };
    });
    const ready = R.units.filter(u => status(u.id) === 'ready' && inGoal(u.id)).sort(order)
      .slice(0, Math.max(0, 4 - doing.length)).map(u => ({ u, href: `#/day/${u.id}/1`, mode: 'はじめる', label: '1 日目' }));
    const asks = (progress.asks || []).filter(a => UNITS[a.u]).map(a => ({ u: UNITS[a.u], href: `#/look/${a.u}/${a.day}`, mode: 'ふりかえり', label: `${a.day} 日目` }));
    const ri = R.units.filter(u => riOpen(u).some(it => !riStar(it))).sort(order).slice(0, 2)
      .map(u => ({ u, href: `#/ri/${u.id}`, mode: '腕だめし', label: `★ ${riStars(u)} / ${u.ri.length * 3}` }));
    return [...asks, ...due, ...doing, ...ready, ...ri];
  }
  // 全体の見込み（R-35）：残りの基本量 × 流れごとの係数 ＋ 復習の量
  function forecast(only = inGoal) {
    const lanes = {};
    let base = 0, reviews = 0;
    R.units.filter(u => only(u.id)).forEach(u => {
      const r = progress.units[u.id] || {}, n = u.days.length, L = lanes[u.lane] || (lanes[u.lane] = { base: 0, used: 0, rest: 0 });
      base += n;
      if (r.done) {
        L.base += n;
        L.used += Object.keys(r.days || {}).length + Object.values(r.extra || {}).reduce((a, b) => a + b, 0);
        const v = r.review;
        if (v && !v.complete) reviews += (RULE.intervals.length - (v.step || 0)) * RULE.reviewDay;
        if (v && v.lapsed) L.rest += 1;
      } else {
        L.rest += Math.max(0, n - Object.keys(r.days || {}).length - (r.skip || []).length) + (r.pending ? 1 : 0);
      }
    });
    let est = reviews;
    Object.values(lanes).forEach(L => { est += L.rest * Math.min(3, Math.max(.5, (L.used + RULE.prior) / (L.base + RULE.prior))); });
    return { base, est: Math.round(est) };
  }

  // ---- 道順 ----
  function parse() {
    const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    if (p[0] === 'level' && THINK[p[1]]) return { name: 'level', level: +p[1] };
    if (p[0] === 'unit' && UNITS[p[1]]) return { name: 'unit', id: p[1] };
    if ((p[0] === 'day' || p[0] === 'extra') && UNITS[p[1]]) {
      const n = Math.min(Math.max(1, parseInt(p[2], 10) || 1), UNITS[p[1]].days.length);
      return { name: 'day', type: p[0], id: p[1], day: n };
    }
    if (p[0] === 'review' && UNITS[p[1]]) return { name: 'day', type: 'review', id: p[1], day: UNITS[p[1]].days.length };
    if (p[0] === 'ri' && UNITS[p[1]]) return { name: 'day', type: 'ri', id: p[1], day: UNITS[p[1]].days.length, group: p[2] || 'order', start: Math.max(0, (parseInt(p[3], 10) || 1) - 1) };
    if (p[0] === 'look' && UNITS[p[1]]) return { name: 'day', type: 'look', id: p[1], day: Math.min(Math.max(1, parseInt(p[2], 10) || 1), UNITS[p[1]].days.length) };
    if (p[0] === 'goal' && GOAL_SETS[p[1]]) return { name: 'goal', goal: p[1] };
    if (p[0] === 'comb') return { name: 'comb' };
    if (p[0] === 'join' && p[1]) return { name: 'join', file: p[1] };
    return { name: 'map' };
  }
  function crumbs(r) {
    const parts = [['#/', '全体の地図']];
    if (r.name === 'goal') parts.push(['', '目標：' + GOALS.find(g => g.id === r.goal).name]);
    if (r.name === 'comb') parts.push(['', '組み合わせの層']);
    if (r.name === 'join') parts.push(['', '共有の記録']);
    const lv = r.name === 'level' ? r.level : r.id ? UNITS[r.id].level : null;
    if (THINK[lv]) parts.push([`#/level/${lv}`, `水準 ${lv} ${THINK[lv].name}`]);
    if (r.id) parts.push([`#/unit/${r.id}`, UNITS[r.id].title]);
    if (r.name === 'day') parts.push(['', r.type === 'review' ? '確かめ' : r.type === 'look' ? 'ふりかえり' : r.type === 'ri' ? '腕だめし' : r.type === 'extra' ? `${r.day} 日目のおさらい` : `${r.day} 日目`]);
    return parts.map(([href, t], i) => i === parts.length - 1
      ? `<span class="here">${esc(t)}</span>`
      : `<a href="${href}">${esc(t)}</a><span class="sep">›</span>`).join('');
  }

  let session = null;
  const viewHtml = r => r.name === 'level' ? viewLevel(r.level)
    : r.name === 'unit' ? viewUnit(r.id)
    : r.name === 'day' ? viewDay(r.id, r.day, r.type, r.group, r.start)
    : r.name === 'goal' ? viewGoal(r.goal) : r.name === 'comb' ? viewComb() : r.name === 'join' ? viewJoin(r.file) : viewMap();
  function render() {
    const r = parse(), view = $('#view');
    if (r.name !== 'day') session = null;
    Music.scene(r.name === 'day' ? 'play' : 'map');
    view.innerHTML = viewHtml(r);
    view.classList.remove('enter'); void view.offsetWidth; view.classList.add('enter');
    const ex = $('#explore');
    if (r.name === 'map') { ex.hidden = false; ex.innerHTML = exploreHtml(); mountExplore(); }
    else { ex.hidden = true; if (cosmos) cosmos.pause(); }
    $('#crumbs').innerHTML = crumbs(r);
    document.title = (r.name === 'map' ? '' : $('#crumbs .here').textContent + ' — ') + 'みちすじ';
    if (r.name === 'day') drawItem();
    if (r.name === 'join') { const b = $('#btn-join'); if (b) b.addEventListener('click', () => joinOpen(r.file)); }
    window.scrollTo(0, 0);
  }
  // ほかの端末や家族の変更が入ったときの描き直し（D-061、施主「1 分に一回更新されるせいで 2D の地図を見ていると急に画面が引き戻される」）。
  // 見ている場所（2D の地図のスクロール、3D の視点、ページの位置）は動かさず、中身だけを塗り直す。問題を解いている途中と共有のリンクの画面は描き直さない
  function refresh() {
    const r = parse();
    if (r.name === 'day' || r.name === 'join') return;
    const y = window.scrollY;
    $('#view').innerHTML = viewHtml(r);
    if (r.name === 'map') paint();
    window.scrollTo(0, y);
  }

  // ---- あゆみ（D-046）：きょう、この 7 日、いまの単元、目標までの道のり。保護者の表示では、つまずきも ----
  const WEEK = ['日', '月', '火', '水', '木', '金', '土'];
  // 日の記録。D-046 より前の日は、単元の日のまとめの日付から数える
  function dayLog(date) {
    const L = (progress.log || {})[date];
    if (L) return L;
    const o = { n: 0, ok: 0, sec: 0, days: 0 };
    Object.values(progress.units).forEach(r => Object.values(r.days || {}).forEach(v => {
      if (v && v.date === date) { o.days++; o.n += v.total || 0; o.ok += v.first || 0; }
    }));
    return o;
  }
  const active = L => L.n > 0 || L.days > 0;
  // 目標までの道のり：日の単位で数える（済んだ単元は全部の日、途中の単元はやった日ととばした日）
  function pathDays(set) {
    let all = 0, got = 0;
    set.forEach(id => {
      const u = UNITS[id], r = progress.units[id] || {}, n = u.days.length;
      all += n;
      got += r.done ? n : Math.min(n, new Set([...Object.keys(r.days || {}).map(Number), ...(r.skip || [])]).size);
    });
    return { all, got, pct: all ? Math.round(100 * got / all) : 0 };
  }
  function ayumiHtml() {
    const today = localDate(), t = dayLog(today), name = store.profiles[store.current].name;
    const week = Array.from({ length: 7 }, (_, i) => { const d = addDays(i - 6); return { d, L: dayLog(d) }; });
    let streak = 0;
    for (let i = active(t) ? 0 : 1; i < 400 && active(dayLog(addDays(-i))); i++) streak++;
    const top = Math.max(5, ...week.map(w => w.L.n));
    const bars = week.map(({ d, L }) => {
      const dow = new Date(d + 'T00:00:00').getDay();
      return `<span class="ay-col${d === today ? ' now' : ''}" title="${d}：${L.n} 問（一度に ${L.ok}）">
        <span class="ay-bar"><i style="height:${Math.round(100 * L.n / top)}%"><b style="height:${L.n ? Math.round(100 * L.ok / L.n) : 0}%"></b></i></span>
        <em>${WEEK[dow]}</em></span>`;
    }).join('');
    // 目標：選んでいる目標、なければ近い目標
    const g = GOALS.find(x => x.id === prefs.goal) || ((nearGoals(1).list[0] || [])[0]);
    let goal = '';
    if (g) {
      const set = GOAL_SETS[g.id], st = goalStats(g), f = forecast(id => set.has(id)), pd = pathDays(set);
      goal = `<a class="ay-card ay-goal" href="#/goal/${g.id}">
        <span class="ring big" style="--p:${pd.pct}"><b>${pd.pct}<small>%</small></b></span>
        <span class="ay-goal-t"><span class="k">目標までの道のり</span><span class="g">${esc(g.name)}</span>
          <span class="muted">日 ${pd.got} / ${pd.all}・単元 ${st.done} / ${st.units}・論題 ${st.got} / ${st.topics}・見込み 残り約 ${f.est} 日</span></span></a>`;
    }
    const doing = R.units.filter(u => ['doing', 'review'].includes(status(u.id))).sort(order).slice(0, 4).map(u => {
      const r = progress.units[u.id] || {}, s = nextStep(u.id), got = new Set([...Object.keys(r.days || {}).map(Number), ...(r.skip || [])]).size;
      return `<a class="ay-unit" href="${stepHref(u.id, s)}" style="${lc(u.lane)}"><span class="t">${esc(u.title)}</span>
        <span class="ay-days">${u.days.map((_, i) => `<i class="${(r.days || {})[i + 1] ? 'on' : (r.skip || []).includes(i + 1) ? 'skip' : i + 1 === s.day ? 'nx' : ''}"></i>`).join('')}</span>
        <span class="muted">${Math.min(got, u.days.length)} / ${u.days.length} 日${status(u.id) === 'review' ? '・復習' : s.type === 'extra' ? '・おさらい' : ''}</span></a>`;
    }).join('');
    const min = Math.round(t.sec / 60), stars = R.units.reduce((a, u) => a + riStars(u), 0);
    return `<section class="ayumi">
      <div class="ay-head"><h2>あゆみ</h2><span class="muted">${esc(name)}</span></div>
      <div class="ay-grid">
        <div class="ay-card ay-today"><span class="k">きょう</span>
          <span class="ay-big"><b>${t.n}</b><span class="u">問</span></span>
          <span class="muted">${t.n ? `一度にできた ${t.ok} 問${min ? `・${min} 分` : ''}${t.days ? `・${t.days} 日分` : ''}` : 'まだ はじめていません'}</span>
          ${stars ? `<span class="muted">腕だめし <span class="stars">★</span> ${stars}</span>` : ''}</div>
        <div class="ay-card ay-week"><span class="k">この 7 日${streak > 1 ? `<span class="streak">${streak} 日つづけて</span>` : ''}</span>
          <span class="ay-bars">${bars}</span></div>
        ${goal}
      </div>
      ${doing ? `<div class="ay-units"><span class="k">いまの単元</span>${doing}</div>` : ''}
      ${prefs.parent ? stumbleHtml(week) : ''}
    </section>`;
  }
  // 保護者の表示：この 2 週間のつまずき（わからない、目安をすぎた）と、この 7 日のまとめ
  function stumbleHtml(week) {
    const since = addDays(-13), its = Object.entries(progress.items || {}).filter(([, x]) => x.last >= since);
    const by = key => {
      const m = {};
      its.forEach(([q, x]) => { if (x[key]) { const u = q.split(':')[0]; m[u] = (m[u] || 0) + x[key]; } });
      return Object.entries(m).filter(([u]) => UNITS[u]).sort((a, b) => b[1] - a[1]).slice(0, 5);
    };
    const chips = xs => xs.map(([u, k]) => `<a class="from" href="#/unit/${u}" style="${lc(UNITS[u].lane)}">${esc(UNITS[u].title)} ×${k}</a>`).join('') || '<span class="muted">なし</span>';
    const n = week.reduce((a, w) => a + w.L.n, 0), ok = week.reduce((a, w) => a + w.L.ok, 0), sec = week.reduce((a, w) => a + w.L.sec, 0);
    const asks = (progress.asks || []).filter(a => UNITS[a.u]);
    return `<div class="parent ay-parent">
      <div><b>この 7 日</b> ${n} 問・一度にできた ${n ? Math.round(100 * ok / n) : 0}%${n && sec ? `・1 問あたり 約 ${Math.round(sec / n)} 秒` : ''}</div>
      <div class="row"><b>「わからない」（2 週間）</b> ${chips(by('d'))}</div>
      <div class="row"><b>目安をすぎた（2 週間）</b> ${chips(by('o'))}</div>
      ${asks.length ? `<div class="row"><b>ふりかえり待ち</b> ${asks.map(a => `<a class="from" href="#/look/${a.u}/${a.day}" style="${lc(UNITS[a.u].lane)}">${esc(UNITS[a.u].title)}</a>`).join('')}</div>` : ''}
    </div>`;
  }

  // ---- 全体の地図 ----
  function viewMap() {
    const f = forecast(), opts = options(), kind = kindNow(), near = nearGoals(5);
    return `${ayumiHtml()}
    <section class="hero hero-rest">
      <div class="goal-pick levels" role="group" aria-label="考え方の水準"><span class="k">水準</span>${(R.levels || []).map(l => {
        const us = R.units.filter(u => u.level === l.id && inGoal(u.id));
        return `<a class="pill" href="#/level/${l.id}">${l.id} ${esc(l.name)}<span class="n">${us.filter(u => isDone(u.id)).length} / ${us.length}</span></a>`;
      }).join('')}</div>
      <div class="reach"><span class="k">近い目標</span>${near.list.map(([g, st]) =>
        `<a class="reach-item" href="#/goal/${g.id}"><span class="ring" style="--p:${st.pct}"></span>${esc(g.name)} ${st.pct}%<span class="muted">（論題 ${st.got} / ${st.topics}）</span></a>`).join('')}
        <span class="reach-item">届いた目標 ${near.reached} / ${GOALS.length}</span>
        <span class="reach-item" title="済んだ単元だけで組み合わせがそろう問題">古今東西の問題 ${solvable()} / ${PROBS.length} 問</span></div>
      <div class="gauge">
        <div><span class="k">基本</span><b>${f.base}</b><span class="u">日分</span></div>
        <div title="できぐあいに合わせて毎日計算し直します"><span class="k">いまの見込み</span><b>残り 約 ${f.est}</b><span class="u">日</span></div>
      </div>
    </section>
    <section class="next">
      <h2>つぎの みちすじ</h2>
      <div class="next-list">${opts.map(o => `
        <a class="next-card" href="${o.href}" style="${lc(o.u.lane)}">
          <span class="dot ${stateOf(o.u.id)}"></span>
          <span class="mode">${o.mode}・${esc(LANES[o.u.lane].name)}・${o.label}</span>
          <span class="t">${esc(o.u.title)}</span>
        </a>`).join('') || '<p class="muted">すべての単元を終えました。</p>'}
      </div>
    </section>
    <section class="goals">
      <h2 class="section-title">終点</h2>
      ${KINDS.map(k => `<details class="goal-group"${k === kind ? ' open' : ''}>
        <summary><span class="goal-kind">${esc(k)}</span><span class="muted">${goalsOf(k).length} の目標</span></summary>
        <div class="goal-list">${goalsOf(k).map(g => {
          const set = GOAL_SETS[g.id], f = forecast(id => set.has(id)), st = goalStats(g);
          return `<a class="goal-card" href="#/goal/${g.id}" aria-current="${prefs.goal === g.id}">
            <span class="eyebrow">${g.field ? esc(g.field) + '・' : g.fields ? esc(g.fields.join('・')) + '・' : ''}${esc(g.level)}・${esc(g.region)}</span>
            <span class="goal-name">${esc(g.name)}</span>
            <span class="muted">${esc(g.note)}</span>
            <span class="goal-nums">論題 ${st.got} / ${st.topics}・単元 ${st.done} / ${st.units}・見込み 残り約 ${f.est} 日</span>
            <span class="goal-bar"><i style="width:${st.pct}%"></i></span>
          </a>`;
        }).join('')}</div>
      </details>`).join('')}
    </section>`;
  }
  // 全体の関係図（2 次元）：横は理解の深さ（前提の鎖の長さ）、縦は名前を付けた領域（D-019）
  const DEPTH = {};
  const depthOf = id => DEPTH[id] ?? (DEPTH[id] = 1 + Math.max(0, ...UNITS[id].needs.map(depthOf)));
  R.units.forEach(u => depthOf(u.id));
  const NEXT = {};
  R.units.forEach(u => u.needs.forEach(n => (NEXT[n] = NEXT[n] || []).push(u.id)));
  function closure(id, dir) {
    const out = new Set(), stack = [id];
    while (stack.length) {
      const x = stack.pop();
      (dir === 'up' ? UNITS[x].needs : NEXT[x] || []).forEach(y => { if (!out.has(y)) { out.add(y); stack.push(y); } });
    }
    return out;
  }
  // ---- 知の宇宙と平面の関係図（D-037、D-038） ----
  // 3D（知の宇宙）と 2D（平面の関係図）は、同じ状態 X を描き分ける。どちらで選んでも、切り替えた先に引き継ぐ。
  // X.sel は選んだ星、X.pair は組み合わせた 2 つの星と出会う星、X.hits は探して光らせた星
  const X = { view: prefs.xview === '2d' ? '2d' : '3d', sel: null, pair: null, hits: null };
  let cosmos = null, POS2D = {}, CARD = '', hits = [], hintAt = Math.floor(Math.random() * 997);
  const combine = { on: false, from: null };
  // 範囲：島が多いので、分野ごとに見られるようにする。1 つのボタンは 1 つの分野（流れ）。違う分野を「〇と〇」で抱き合わせない（D-033）
  const SCHOOL_REGIONS = new Set(['kazu', 'keisan', 'seisu', 'seisuron', 'houteishiki', 'kansu', 'shiki', 'futoshiki', 'kazoekata',
    'kakuritsu', 'graph', 'katachi', 'hakaru', 'shomei-zukei', 'zahyo', 'haichi', 'suiri', 'ronpo']);
  const MAP_GROUPS = [
    ['all', 'すべて', () => true],
    ['school', '小中高の数学', rg => SCHOOL_REGIONS.has(rg.id)],
    ['univ', '大学の数学', rg => !SCHOOL_REGIONS.has(rg.id) && ('NACGLDMRTS'.includes(rg.lane) || rg.id === 'suchi')],
    ['cs', '計算機科学', rg => rg.lane === 'K' && rg.id !== 'suchi'],
    ...'PHBWIQVEF'.split('').map(l => [l, LANES[l].name, rg => rg.lane === l]),
  ];
  const REGION = Object.fromEntries((R.regions || []).map(r => [r.id, r]));
  const group = () => MAP_GROUPS.find(g => g[0] === prefs.mapGroup) || MAP_GROUPS[0];
  const inGroup = id => { const rg = REGION[UNITS[id].region]; return !rg || group()[2](rg); };
  const cssLane = l => getComputedStyle($('#cosmos') || document.documentElement).getPropertyValue('--lane-' + l).trim() || '#9fb4ff';
  const svgi = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICON = {
    spark: svgi('<path d="M12 3v5M12 16v5M3 12h5M16 12h5M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M6.3 17.7l2.8-2.8M14.9 9.1l2.8-2.8"/>'),
    link: svgi('<circle cx="8.5" cy="12" r="4.5"/><circle cx="15.5" cy="12" r="4.5"/>'),
    stars: svgi('<path d="M4.5 17.5l4-6 5 3 6-8"/><circle cx="4.5" cy="17.5" r="1.7"/><circle cx="8.5" cy="11.5" r="1.7"/><circle cx="13.5" cy="14.5" r="1.7"/><circle cx="19.5" cy="6.5" r="1.7"/>'),
    fields: svgi('<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5V12l6.5 5"/>'),
    home: svgi('<circle cx="12" cy="12" r="2.6"/><circle cx="12" cy="12" r="8.5"/>'),
    layer: svgi('<path d="M12 4l8.5 4.2L12 12.4 3.5 8.2z"/><path d="M3.5 12.2l8.5 4.2 8.5-4.2M3.5 16l8.5 4.2 8.5-4.2"/>'),
    full: svgi('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
    close: svgi('<path d="M6 6l12 12M18 6L6 18"/>'),
  };
  function barHtml() {
    const g = GOALS.find(x => x.id === prefs.goal), grp = group();
    const b = (attr, icon, label, pressed, cls = '') => `<button class="xb ${cls}" type="button" ${attr}${pressed === undefined ? '' : ` aria-pressed="${pressed}"`} title="${esc(label)}">${ICON[icon]}<span>${esc(label)}</span></button>`;
    return `
      <nav class="xbar" aria-label="見方">
        <div class="xseg" role="group" aria-label="表示">
          <button type="button" data-x="view" data-v="3d" aria-pressed="${X.view === '3d'}">3D</button>
          <button type="button" data-x="view" data-v="2d" aria-pressed="${X.view === '2d'}">2D</button>
        </div>
        ${b('data-cos="inspire"', 'spark', 'ひらめき', undefined, 'glow')}
        ${b('data-cos="combine"', 'link', '組み合わせる', combine.on)}
        ${b('data-cos="goals"', 'stars', g ? '星座：' + g.name : '目標の星座', !!g)}
        ${g ? b('data-goal="all"', 'close', '星座をやめる') : ''}
        ${b('data-x="fields"', 'fields', '分野：' + grp[1], grp[0] !== 'all')}
        ${b('data-cos="home"', 'home', '全体')}
        <a class="xb" href="#/comb" title="組み合わせの層">${ICON.layer}<span>組み合わせの層</span></a>
        ${b('data-x="full"', 'full', '全画面')}
      </nav>`;
  }
  function exploreHtml() {
    return `
    <div class="cosmos" id="cosmos" data-view="${X.view}">
      <div class="cosmos-gl" id="cosmos-gl"></div>
      <div class="flat" id="flat"><div id="map" class="map${prefs.mapComb ? ' comb' : ''}"></div></div>
      <div class="cosmos-head">
        <div class="cosmos-title"><div class="eyebrow">知の宇宙</div></div>
        <input class="cosmos-q" id="cosmos-q" type="search" placeholder="星をさがす（光合成、フーリエ、確率…）" autocomplete="off" aria-label="星をさがす">
      </div>
      ${barHtml()}
      ${legendHtml()}
      <div class="xpop" id="xpop" hidden></div>
      <div class="cosmos-tip" id="cosmos-tip" hidden></div>
      <div class="cosmos-card" id="cosmos-card"${CARD ? '' : ' hidden'}>${CARD}</div>
      <div class="cosmos-hover" id="cosmos-hover" hidden></div>
      <button class="xdown" type="button" data-x="down">つぎのみちすじ ▾</button>
    </div>`;
  }
  function syncBar() {
    const nav = $('.xbar');
    if (nav) nav.outerHTML = barHtml();
    const c = $('#cosmos'); if (c) c.dataset.view = X.view;
    const m = $('#map'); if (m) m.classList.toggle('comb', !!prefs.mapComb);
  }
  function setBarH() { const b = $('.bar'); if (b) document.documentElement.style.setProperty('--bar-h', b.offsetHeight + 'px'); }
  function mountExplore() {
    setBarH();
    if (X.view === '3d') mountCosmos();
    else { if (cosmos) cosmos.pause(); requestAnimationFrame(() => paint()); document.fonts && document.fonts.ready.then(() => X.view === '2d' && paint()); }
  }
  function mountCosmos(fly) {
    const host = $('#cosmos-gl');
    if (!host || !window.Space) return;
    if (!cosmos) {
      try {
        cosmos = Space.mount({ units: R.units, lanes: R.lanes, laneColor: cssLane, bridges: BRIDGES,
          onPick: id => pick(id), onHover: cosHover, onTouch: () => { const c = $('#cosmos'); if (c) c.classList.add('touched'); },
          onLane: l => { Music.tap(); cosmos.flyLane(l); tip(`<b>${esc(LANES[l].name)}</b>　${esc(LANES[l].note)}`); } });
      } catch (err) {
        // WebGL が使えない端末では 2D で使う
        X.view = '2d'; syncBar(); paint();
        tip('この端末では 3D を描けませんでした。2D で見ています。', 0);
        return;
      }
    }
    cosmos.attach(host);
    paint(fly);
  }
  window.addEventListener('space-ready', () => { if (parse().name === 'map' && X.view === '3d') mountCosmos(); });

  // ---- 状態を描く（3D と 2D の共通の入口） ----
  const goalMarks = g => [...new Set(g.items.filter(i => !i.choice).flatMap(i => i.units || []))];
  function starEdges(id) {
    const set = new Set([id, ...closure(id, 'up')]), edges = [];
    set.forEach(x => UNITS[x].needs.forEach(n => set.has(n) && edges.push([n, x, -DEPTH[n] * .15])));
    (NEXT[id] || []).forEach(x => edges.push([id, x, 0]));
    return edges;
  }
  // 3D の濃さ：探した星 → 目標の星座 → 分野の範囲の順に効かせる
  function cosAlpha() {
    if (!cosmos) return;
    const g = GOALS.find(x => x.id === prefs.goal), all = group()[0] === 'all';
    cosmos.setLens(!!prefs.mapComb);
    cosmos.setAlpha(id => {
      if (X.hits) return X.hits.has(id) ? 1 : .08;
      const a = !g ? 1 : inGoal(id) ? 1 : inChoice(id) ? .35 : .05;
      return all || inGroup(id) ? a : a * .08;
    }, g ? 3.2 : 1);
  }
  function paint(fly) {
    if (X.view === '3d') {
      if (!cosmos) return;
      cosmos.setStates(stateOf, progOf);
      cosAlpha();
      const g = GOALS.find(x => x.id === prefs.goal);
      if (X.pair) {
        cosmos.arc(X.pair.a, X.pair.b, X.pair.meet);
        if (fly) cosmos.focus([X.pair.a, X.pair.b, ...X.pair.meet], 26);
      } else if (X.sel) {
        cosmos.glowEdges(starEdges(X.sel)); cosmos.mark([X.sel]);
        if (fly) cosmos.focus([X.sel], 20);
      } else {
        cosmos.clearGlow();
        if (g) cosmos.mark(goalMarks(g));
        if (fly) {
          const ids = R.units.filter(u => inGoal(u.id) && inGroup(u.id)).map(u => u.id);
          g || group()[0] !== 'all' ? cosmos.focus(ids, 30) : cosmos.home();
        }
      }
    } else {
      drawMap();
      if (fly) scroll2D();
    }
  }
  // 2D：選んだ星の鎖、組み合わせの道（2 つの星から出会う星まで）、探した星を浮かび上がらせる
  function apply2D() {
    const host = $('#map');
    if (!host) return;
    const near = x => inGoal(x) || inChoice(x);
    let on = null, edgeOn = null;
    if (X.pair) {
      const { a, b, meet } = X.pair, path = (s, m) => { const d = closure(s, 'down'), u = closure(m, 'up'); return [...d].filter(x => u.has(x)); };
      on = new Set([a, b, ...meet, ...meet.flatMap(m => [...path(a, m), ...path(b, m)])]);
      edgeOn = (x, y) => on.has(x) && on.has(y);
    } else if (X.sel) {
      const s = X.sel, up = new Set([...closure(s, 'up')].filter(near)), down = new Set([...closure(s, 'down')].filter(near));
      on = new Set([s, ...up, ...down]);
      edgeOn = (x, y) => (up.has(x) && (up.has(y) || y === s)) || (down.has(y) && (down.has(x) || x === s));
    }
    const g = GOALS.find(x => x.id === prefs.goal), marks = g && !on ? new Set(goalMarks(g)) : null;
    host.classList.toggle('focus', !!on);
    host.querySelectorAll('.dc').forEach(g => {
      const id = g.dataset.d;
      g.classList.toggle('fade', (!!on && !on.has(id)) || (!!X.hits && !X.hits.has(id)));
    });
    host.querySelectorAll('circle[data-u]').forEach(c => {
      const id = c.dataset.u;
      c.classList.toggle('hl', !!on && on.has(id));
      c.classList.toggle('sel', id === X.sel || (!!X.pair && (id === X.pair.a || id === X.pair.b)));
      c.classList.toggle('meet', !!X.pair && X.pair.meet.includes(id));
      c.classList.toggle('mark', !!marks && marks.has(id));
      c.classList.toggle('dim', !!X.hits && !X.hits.has(id));
    });
    host.querySelectorAll('.edges path').forEach(p => p.classList.toggle('hl', !!edgeOn && edgeOn(p.dataset.a, p.dataset.b)));
    // 組み合わせた 2 つの星を、金色の弧で結ぶ
    const svg = host.querySelector('svg'), old = host.querySelector('.pair-arc');
    if (old) old.remove();
    if (svg && X.pair && POS2D[X.pair.a] && POS2D[X.pair.b]) {
      const [x1, y1] = POS2D[X.pair.a], [x2, y2] = POS2D[X.pair.b], mx = (x1 + x2) / 2, my = Math.min(y1, y2) - 60 - Math.abs(x2 - x1) * .15;
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('class', 'pair-arc'); p.setAttribute('d', `M${x1},${y1} Q${mx},${my} ${x2},${y2}`);
      svg.appendChild(p);
    }
  }
  // 2D：いま光っている星が真ん中に来るように送る
  function scroll2D() {
    const flat = $('#flat');
    if (!flat) return;
    const ids = X.pair ? [X.pair.a, X.pair.b, ...X.pair.meet] : X.sel ? [X.sel] : X.hits ? [...X.hits].slice(0, 1) : [];
    const ps = ids.map(i => POS2D[i]).filter(Boolean);
    if (!ps.length) { flat.scrollTo({ left: 0, top: 0, behavior: 'smooth' }); return; }
    const x = ps.reduce((s, p) => s + p[0], 0) / ps.length, y = ps.reduce((s, p) => s + p[1], 0) / ps.length;
    const m = $('#map'), ox = m.offsetLeft, oy = m.offsetTop;
    flat.scrollTo({ left: ox + x - flat.clientWidth / 2, top: oy + y - flat.clientHeight / 2, behavior: 'smooth' });
  }

  function tip(html, ms = 6000) {
    const t = $('#cosmos-tip');
    if (!t) return;
    t.innerHTML = html || ''; t.hidden = !html;
    clearTimeout(tip.t);
    if (html && ms) tip.t = setTimeout(() => { t.hidden = true; }, ms);
  }
  function card(html) { CARD = html || ''; const c = $('#cosmos-card'); if (c) { c.innerHTML = CARD; c.hidden = !CARD; } }
  function cosHover(id, x, y) {
    const h = $('#cosmos-hover'), box = $('#cosmos');
    if (!h || !box) return;
    if (!id) { h.hidden = true; box.style.cursor = ''; return; }
    const r = box.getBoundingClientRect(), u = UNITS[id];
    h.innerHTML = `<span class="cc-dot" style="${lc(u.lane)}"></span>${esc(u.title.replace(/（.*$/, ''))}`;
    h.style.transform = `translate(${x - r.left + 14}px, ${y - r.top - 10}px)`;
    h.hidden = false; box.style.cursor = 'pointer';
  }
  // 星を選ぶ（3D でも 2D でも同じ）
  function pick(id) {
    if (!id) {
      if (!combine.on && (X.sel || X.pair)) { X.sel = null; X.pair = null; card(''); paint(); }
      return;
    }
    Music.tap();
    if (combine.on) {
      if (!combine.from) { combine.from = id; X.sel = id; X.pair = null; starCard(id); paint(); tip('もう 1 つの星を押すと、2 つを組み合わせます', 0); return; }
      if (combine.from !== id) {
        const a = combine.from;
        combine.on = false; combine.from = null; syncBar(); tip('');
        showCombine(a, id);
        return;
      }
    }
    X.sel = id; X.pair = null; starCard(id); paint();
  }
  const short = u => esc(u.title.replace(/（.*$/, ''));
  const star = id => `<a class="cc-star" href="#/unit/${id}" style="${lc(UNITS[id].lane)}"><span class="cc-dot"></span>${short(UNITS[id])}</a>`;
  function starCard(id) {
    const u = UNITS[id], up = closure(id, 'up'), down = closure(id, 'down');
    card(`
      <div class="cc-eyebrow"><span class="cc-dot" style="${lc(u.lane)}"></span>${esc(LANES[u.lane].name)}・水準 ${u.level} ${esc((THINK[u.level] || {}).name || '')}${inChoice(id) ? '・選択の論題' : ''}</div>
      <div class="cc-title">${esc(u.title)}</div>
      <div class="cc-meta">${STATUS_NAME[status(id)]}・${up.size} の星を通って届く・この先 ${down.size} の星へ開ける</div>
      ${u.comb ? `<div class="cc-meta">組み合わせ ${u.comb.rg.map(r => esc(REGION_NAME[r] || r)).join(' × ')}${BRIDGES.has(id) ? '　<b class="cc-bridge">橋の星</b>' : ''}</div>` : ''}
      <div class="cc-actions">
        <a class="cpill solid" href="#/unit/${id}">単元をひらく</a>
        <button class="cpill" type="button" data-cos="combine-from" data-id="${id}">これと組み合わせる</button>
        <button class="cpill" type="button" data-cos="close" aria-label="とじる">×</button>
      </div>`);
  }
  // 領域どうしの遠さ（combination.py と同じ数え方：前提で互いをどう使うかの似ていなさ）
  let RD = null;
  function regionDist(a, b) {
    if (a === b) return 0;
    if (!RD) {
      RD = {};
      const add = (x, y) => { (RD[x] = RD[x] || {})[y] = (RD[x][y] || 0) + 1; };
      R.units.forEach(u => u.needs.forEach(n => { const x = u.region, y = UNITS[n].region; if (x && y && x !== y) { add(x, y); add(y, x); } }));
    }
    const va = RD[a] || {}, vb = RD[b] || {}, keys = [...new Set([...Object.keys(va), ...Object.keys(vb), a, b])].sort();
    let dot = 0, na = 0, nb = 0;
    keys.forEach(k => { const x = (va[k] || 0) + (k === a ? 1 : 0), y = (vb[k] || 0) + (k === b ? 1 : 0); dot += x * y; na += x * x; nb += y * y; });
    return 1 - dot / Math.sqrt(na * nb || 1);
  }
  // 2 つを組み合わせる：両方から届く星（出会う星）を探し、なければ同じ領域の組から生まれた星、それもなければ「まだない組」
  function showCombine(a, b, hint) {
    const A = UNITS[a], B = UNITS[b], da = closure(a, 'down'), db = closure(b, 'down');
    const both = new Set([...da].filter(x => db.has(x)));
    const meet = [...both].filter(x => !UNITS[x].needs.some(y => both.has(y))).sort((x, y) => DEPTH[x] - DEPTH[y]).slice(0, 3);
    const ra = A.region, rb = B.region, d = regionDist(ra, rb);
    const born = ra === rb ? [] : R.units.filter(u => u.comb && u.comb.rg.includes(ra) && u.comb.rg.includes(rb)).map(u => u.id).slice(0, 3);
    const far = d >= .8 ? '遠い組み合わせ' : d >= .5 ? 'ほどよく離れた組み合わせ' : '近い組み合わせ';
    const rn = r => esc(REGION_NAME[r] || r);
    let verdict;
    if (ra === rb) verdict = 'どちらも同じ領域の星です。ちがう領域の星を選ぶと、組み合わせの面白さが見えます。';
    else if (meet.length) verdict = hint ? `${rn(ra)} と ${rn(rb)} を直接組み合わせた星はまだありませんが、道をたどると ${meet.map(star).join('')} で出会います。` : `2 つの道は ${meet.map(star).join('')} で出会います。`;
    else if (born.length) verdict = `この 2 つの星から続く道はまだ出会いませんが、${rn(ra)} と ${rn(rb)} の組み合わせから ${born.map(star).join('')} が生まれています。`;
    else verdict = `${rn(ra)} と ${rn(rb)} を組み合わせた星は、まだこの宇宙にありません。${hint ? `${hint.via.map(rn).join('、')} を通してつながっているのに、直接は結ばれていない組です。` : ''}新しい問いの種かもしれません。`;
    const [x, y] = [ra, rb].sort(), prob = (LAYER.probPairs || []).find(r => r.a === x && r.b === y), none = (LAYER.probUnseen || []).find(r => r.a === x && r.b === y);
    X.sel = null; X.pair = { a, b, meet, hint: !!hint };
    paint(true);
    card(`
      <div class="cc-eyebrow">${hint ? '✦ ひらめき' : '組み合わせ'}・${far}（遠さ ${d.toFixed(2)}）</div>
      <div class="cc-pair">${star(a)}<span class="cc-x">×</span>${star(b)}</div>
      <div class="cc-meta">${rn(ra)} × ${rn(rb)}</div>
      <p class="cc-verdict">${verdict}</p>
      ${prob ? `<div class="cc-meta">古今東西の問題では、期待 ${prob.e} 問に対して ${prob.o} 問だけ。</div>` : none ? `<div class="cc-meta">古今東西の問題では、期待 ${none.e} 問なのに、まだ 1 問もありません。</div>` : ''}
      <div class="cc-actions">
        <button class="cpill glow" type="button" data-cos="inspire">✦ ${hint ? 'つぎのひらめき' : 'ひらめき'}</button>
        <a class="cpill" href="#/comb">組み合わせの層</a>
        <button class="cpill" type="button" data-cos="close" aria-label="とじる">×</button>
      </div>`);
  }
  // ひらめき：前提のつながりで近いのに、まだ直接組み合わせた星がない領域の組（combination.py の hints）。
  // 各領域から、その先に多くの星を開く星を 1 つずつ選んで結ぶ
  const downSize = {};
  const reach = id => downSize[id] ?? (downSize[id] = closure(id, 'down').size);
  function inspire() {
    const hs = LAYER.hints || [];
    if (!hs.length) return;
    const h = hs[hintAt++ % hs.length];
    const rep = r => {
      const us = R.units.filter(u => u.region === r), mid = us.filter(u => (u.level || 3) <= 4);
      return (mid.length ? mid : us).sort((p, q) => reach(q.id) - reach(p.id) || p.level - q.level)[0];
    };
    const ua = rep(h.a), ub = rep(h.b);
    if (ua && ub) showCombine(ua.id, ub.id, h);
  }
  function cosAction(act, id) {
    Music.tap();
    if (act === 'inspire') { combine.on = false; combine.from = null; syncBar(); return inspire(); }
    if (act === 'goals') return openGoals();
    if (act === 'home' || act === 'close') {
      card(''); X.sel = null; X.pair = null; combine.on = false; combine.from = null; syncBar(); tip('');
      paint();
      if (act === 'home') { if (X.view === '3d' && cosmos) cosmos.home(); else { const f = $('#flat'); if (f) f.scrollTo({ left: 0, top: 0, behavior: 'smooth' }); } }
      return;
    }
    if (act === 'combine' || act === 'combine-from') {
      combine.on = act === 'combine-from' ? true : !combine.on;
      combine.from = combine.on ? (id || X.sel || null) : null;
      syncBar();
      tip(combine.on ? (combine.from ? 'もう 1 つの星を押すと、2 つを組み合わせます' : '組み合わせる 1 つ目の星を押してください') : '', 0);
    }
  }
  function xAction(act, v) {
    Music.tap();
    if (act === 'view') {
      if (X.view === v) return;
      X.view = v; prefs.xview = v; save(PREF, prefs); syncBar();
      if (v === '3d') mountCosmos(true); else { if (cosmos) cosmos.pause(); paint(true); }
      return;
    }
    if (act === 'fields') {
      const p = $('#xpop');
      if (!p.hidden) { p.hidden = true; return; }
      p.innerHTML = `<div class="xpop-title">分野で見る</div>${MAP_GROUPS.map(([gid, name]) =>
        `<button type="button" data-mapgroup="${gid}" aria-pressed="${group()[0] === gid}">${gid.length === 1 ? `<span class="cc-dot" style="${lc(gid)}"></span>` : ''}${esc(name)}</button>`).join('')}`;
      p.hidden = false;
      return;
    }
    if (act === 'full') {
      // 全画面はページ全体にする。探索の画面だけを全画面にすると、単元のページへ移ったとき枠の外になって押せなかった（D-055）
      const el = document.documentElement;
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else if (el.requestFullscreen) el.requestFullscreen().catch(() => { /* 全画面にできない端末では、そのまま */ });
      return;
    }
    if (act === 'down') $('#view').scrollIntoView({ behavior: 'smooth' });
  }
  // 目標を星座で見る：種類を選び、目標を選ぶ。選ぶと、その目標に要る星だけが光る
  function openGoals() {
    let d = $('#goal-sheet');
    if (!d) { d = document.createElement('dialog'); d.id = 'goal-sheet'; d.className = 'sheet goal-sheet'; document.body.appendChild(d); }
    let kind = kindNow();
    const draw = () => {
      d.innerHTML = `
        <h2>目標を星座で見る</h2>
        <div class="goal-pick">${KINDS.map(k => `<button class="pill kind" type="button" data-sheetkind="${esc(k)}" aria-pressed="${k === kind}">${esc(k)}<span class="n">${goalsOf(k).length}</span></button>`).join('')}</div>
        <div class="sheet-goals">${goalsOf(kind).map(g => `<button class="sheet-goal" type="button" data-sheetgoal="${g.id}" aria-pressed="${prefs.goal === g.id}">
          <span class="eyebrow">${g.field ? esc(g.field) + '・' : g.fields ? esc(g.fields.join('・')) + '・' : ''}${esc(g.level)}</span>
          <b>${esc(g.name)}</b><span class="muted">${esc(g.note)}</span></button>`).join('')}</div>
        <div class="row"><button class="pill" type="button" data-sheetgoal="all">すべての星</button><button class="pill solid" type="button" data-sheetclose>とじる</button></div>`;
    };
    d.onclick = e => {
      const k = e.target.closest('[data-sheetkind]');
      if (k) { kind = k.dataset.sheetkind; Music.tap(); draw(); return; }
      const g = e.target.closest('[data-sheetgoal]');
      if (g) {
        Music.tap(); d.close();
        setGoal(g.dataset.sheetgoal);
        return;
      }
      if (e.target.closest('[data-sheetclose]') || e.target === d) d.close();
    };
    draw(); d.showModal();
  }
  function setGoal(id) {
    prefs.goal = id; X.sel = null; X.pair = null; card('');
    if (GOAL_SETS[prefs.goal]) prefs.goalKind = GOALS.find(x => x.id === prefs.goal).kind;
    save(PREF, prefs);
    if (location.hash.replace(/^#\/?/, '') !== '') { location.hash = '#/'; return; }
    render();
    paint(true);
  }
  // 探索の画面の操作
  $('#explore').addEventListener('click', e => {
    const dot = e.target.closest('#map circle[data-u]');
    if (dot) {
      const id = dot.dataset.u;
      if (X.sel === id && !combine.on) { location.hash = `#/unit/${id}`; return; }
      pick(id); return;
    }
    const xb = e.target.closest('[data-x]');
    if (xb) { xAction(xb.dataset.x, xb.dataset.v); return; }
    const cs = e.target.closest('[data-cos]');
    if (cs) { cosAction(cs.dataset.cos, cs.dataset.id); return; }
    const mc = e.target.closest('[data-mapcomb]');
    if (mc) { prefs.mapComb = mc.dataset.mapcomb === '1'; save(PREF, prefs); Music.tap(); syncBar(); paint(); return; }
    const mg = e.target.closest('[data-mapgroup]');
    if (mg) { prefs.mapGroup = mg.dataset.mapgroup; save(PREF, prefs); Music.tap(); $('#xpop').hidden = true; syncBar(); paint(true); return; }
    const g = e.target.closest('[data-goal]');
    if (g) { Music.tap(); setGoal(g.dataset.goal); return; }
    if (!e.target.closest('#xpop')) { const p = $('#xpop'); if (p) p.hidden = true; }
    if (e.target.closest('#map') && !e.target.closest('a, button')) pick(null);
  });
  // 星をさがす：題に言葉を含む星だけを光らせる。Enter で 1 つ目へ（組み合わせの途中なら、その星と組み合わせる）
  $('#explore').addEventListener('input', e => {
    if (e.target.id !== 'cosmos-q') return;
    const q = e.target.value.trim().toLowerCase();
    hits = q ? R.units.filter(u => (u.title + ' ' + u.id).toLowerCase().includes(q)).map(u => u.id) : [];
    X.hits = q ? new Set(hits) : null;
    paint();
    tip(q ? (hits.length ? `${hits.length} の星が光っています。Enter で 1 つ目へ` : '見つかりません') : '', 0);
  });
  $('#explore').addEventListener('keydown', e => {
    if (e.target.id !== 'cosmos-q' || e.key !== 'Enter' || !hits.length) return;
    const id = hits[0];
    e.target.value = ''; hits = []; X.hits = null; tip('');
    pick(id);
    if (!X.pair) paint(true);
  });
  document.addEventListener('fullscreenchange', () => { setBarH(); if (cosmos) cosmos.resize(); if (X.view === '2d' && parse().name === 'map') paint(); });

  // 平面の関係図（2D）：横は理解の深さ（前提の鎖の長さ）、縦は名前を付けた領域（D-019）
  function drawMap() {
    const host = $('#map');
    if (!host) return;
    // 目標を選んでいるときは、その目標の単元と、その単元がある島だけで描き直す（D-015）
    const grp = group()[2];
    const shown = id => inGoal(id) || inChoice(id);
    const shownRegions = (R.regions || []).filter(grp).filter(rg => R.units.some(u => u.region === rg.id && shown(u.id)));
    const shownIds = new Set(shownRegions.map(r => r.id));
    const shownUnits = R.units.filter(u => shownIds.has(u.region) && shown(u.id));
    if (!shownUnits.length) {
      host.innerHTML = `<p class="muted">${prefs.goal === 'all' ? 'この切り替えの単元はまだありません。' : 'この範囲には、選んでいる目標の単元がありません。範囲を「すべて」にすると見えます。'}</p>`;
      return;
    }
    const minD = Math.min(...shownUnits.map(u => DEPTH[u.id])), maxD = Math.max(...shownUnits.map(u => DEPTH[u.id]));
    // 幅に収まるなら深さの間隔を縮めて収め、22px より詰まるなら図を広げて横に送る（右端の目盛りの名前の余白 70px）
    const X0 = 168, span = Math.max(1, maxD - minD), avail = Math.max(host.clientWidth, 820);
    const XS = Math.min(140, Math.max(22, (avail - X0 - 70) / span)), W = Math.max(avail, Math.ceil(X0 + span * XS + 70));
    const YS = 18, PAD = 13, TOP = 44, pos = {}, boxes = [];
    let y = TOP;
    shownRegions.forEach(rg => {
      const us = shownUnits.filter(u => u.region === rg.id).sort(order);
      if (!us.length) return;
      const byD = {};
      us.forEach(u => (byD[DEPTH[u.id]] = byD[DEPTH[u.id]] || []).push(u));
      const rows = Math.max(...Object.values(byD).map(a => a.length)), h = rows * YS + PAD * 2;
      Object.entries(byD).forEach(([d, a]) => a.forEach((u, i) => {
        pos[u.id] = [X0 + (d - minD) * XS, y + PAD + YS / 2 + (i + (rows - a.length) / 2) * YS];
      }));
      const xs = us.map(u => pos[u.id][0]);
      boxes.push({ rg, x: Math.min(...xs) - 15, x2: Math.max(...xs) + 15, y, h });
      y += h + 8;
    });
    const H = y + 6;
    // 考え方の水準：描いている単元の深さの中央値を、水準ごとにおよその位置として上に置く
    const marks = (R.levels || []).map(s => {
      const ds = shownUnits.filter(u => u.level === s.id).map(u => DEPTH[u.id]).sort((a, b) => a - b);
      return ds.length ? { s, x: X0 + (ds[Math.floor(ds.length / 2)] - minD) * XS } : null;
    }).filter(Boolean);
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="全体の関係図">`;
    svg += marks.map((m, i) => `<g class="level-mark"><line x1="${m.x}" y1="${TOP - 6}" x2="${m.x}" y2="${H}"/>
      <text x="${m.x}" y="${i % 2 ? TOP - 10 : TOP - 26}" text-anchor="middle">水準 ${m.s.id} ${esc(m.s.name)}</text></g>`).join('');
    svg += boxes.map(b => `<g class="region" style="${lc(b.rg.lane)}"><rect x="${b.x}" y="${b.y}" width="${b.x2 - b.x}" height="${b.h}" rx="14"/>
      <line x1="${X0 - 26}" y1="${b.y + b.h / 2}" x2="${b.x}" y2="${b.y + b.h / 2}" class="leader"/>
      <text x="8" y="${b.y + b.h / 2 + 4}">${esc(b.rg.name)}</text></g>`).join('');
    // 前提の線：同じ領域は「深める」、ほかの領域は「組み合わせる」（x）。代わりになる前提（alt）は点線
    const edge = (n, u, cls) => {
      const a = pos[n], b = pos[u.id];
      if (!a || !b) return '';
      const mx = (a[0] + b[0]) / 2;
      return `<path class="${cls}${UNITS[n].region !== u.region ? ' x' : ''}" data-a="${n}" data-b="${u.id}" d="M${a[0]},${a[1]} C${mx},${a[1]} ${mx},${b[1]} ${b[0]},${b[1]}"/>`;
    };
    svg += '<g class="edges">' + R.units.flatMap(u => [...u.needs.map(n => edge(n, u, 'need')),
      ...Object.values(u.alt || {}).flat().map(n => edge(n, u, 'alt'))]).join('') + '</g>';
    svg += '<g class="dots">' + R.units.map(u => {
      const p = pos[u.id];
      return p ? `<circle class="${stateOf(u.id)}${inGoal(u.id) ? '' : inChoice(u.id) ? ' choice' : ' off'}${BRIDGES.has(u.id) ? ' bridge' : ''}${hasProblems(u) ? '' : ' noq'}" data-u="${u.id}" cx="${p[0]}" cy="${p[1]}" r="6" style="${lc(u.lane)}"><title>${esc(u.id + ' ' + u.title)}</title></circle>` : '';
    }).join('') + '</g><g class="decos">' + R.units.map(u => decoSvg(u, pos[u.id])).join('') + '</g></svg>';
    host.innerHTML = svg;
    POS2D = pos;
    apply2D();
  }

  // 単元の状態の飾り（D-048）：途中は日の割合の弧、済は閉じた輪と腕だめしの金の弧、腕だめしまでは金の光と輪
  const arcSvg = (x, y, r, k, cls) => `<circle class="${cls}" cx="${x}" cy="${y}" r="${r}" pathLength="100" stroke-dasharray="${(k * 100).toFixed(1)} 100" transform="rotate(-90 ${x} ${y})"/>`;
  function sparkPath(x, y, R, r) {
    let d = '';
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 - Math.PI / 2, q = i % 2 ? r : R;
      d += (i ? 'L' : 'M') + (x + q * Math.cos(a)).toFixed(1) + ',' + (y + q * Math.sin(a)).toFixed(1);
    }
    return d + 'Z';
  }
  // 2D では丸の縁と中だけに描く（縦の間隔 18 に収める、D-050）：途中は中抜きの縁にやった日の割合の弧、
  // 済は塗った丸の縁に腕だめしの解けた割合の金の弧、腕だめしまでは金の丸に白い星
  function decoSvg(u, p) {
    if (!p) return '';
    const s = stateOf(u.id), k = progOf(u.id), [x, y] = p;
    const head = `<g class="dc ${s}${inGoal(u.id) || inChoice(u.id) ? '' : ' off'}" data-d="${u.id}" style="${lc(u.lane)}">`;
    if ((s === 'doing' || s === 'review') && k > 0) return `${head}${arcSvg(x, y, 6, k, 'arc')}</g>`;
    if (s === 'done' && k > 0) return `${head}${arcSvg(x, y, 6, k, 'garc')}</g>`;
    if (s === 'ri') return `${head}<path class="spark" d="${sparkPath(x, y, 4.6, 1.5)}"/></g>`;
    return '';
  }
  // 探索の画面の凡例（D-048）：星の状態の見分け方。3D と 2D で絵が違うので両方を置き、見ている方だけ出す
  function legendHtml() {
    const dot = (fill, stroke) => `<circle cx="12" cy="12" r="5.5" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`;
    const ic2 = {
      later: dot('#0d1330', '#3d4f8a'),
      ready: dot('#0d1330', '#9fb4ff'),
      doing: dot('#0d1330', '#33457a') + '<circle cx="12" cy="12" r="5.5" fill="none" stroke="#86a6ff" stroke-width="3" stroke-linecap="round" pathLength="100" stroke-dasharray="55 100" transform="rotate(-90 12 12)"/>',
      done: dot('#86a6ff', '#86a6ff'),
      ri: dot('#f5c451', '#f0b429') + `<path d="${sparkPath(12, 12, 4.2, 1.4)}" fill="#fff"/>`,
    };
    const ic = {
      later: '<circle cx="12" cy="12" r="4" fill="none" stroke="#8f9be0" stroke-opacity=".6" stroke-width="2"/>',
      ready: '<circle cx="12" cy="12" r="4.5" fill="none" stroke="#b9c6ff" stroke-width="2.4"/>',
      doing: '<circle cx="12" cy="12" r="3.5" fill="#86a6ff"/><circle cx="12" cy="12" r="8.5" fill="none" stroke="#86a6ff" stroke-opacity=".25" stroke-width="2"/><circle cx="12" cy="12" r="8.5" fill="none" stroke="#86a6ff" stroke-width="2" stroke-linecap="round" pathLength="100" stroke-dasharray="55 100" transform="rotate(-90 12 12)"/>',
      done: '<circle cx="12" cy="12" r="3.5" fill="#fff"/><circle cx="12" cy="12" r="8.5" fill="none" stroke="#c9d4ff" stroke-width="1.6"/>',
      ri: `<path d="${sparkPath(12, 12, 11.5, 2)}" fill="#f5c451"/><circle cx="12" cy="12" r="3" fill="#fff"/>`,
    };
    const names = { later: 'まだ', ready: '次にできる', doing: '途中', done: '済', ri: '腕だめしまで' };
    return `<div class="xlegend" aria-label="星の状態">${Object.keys(names).map(k =>
      `<span><svg class="i3" viewBox="0 0 24 24" aria-hidden="true">${ic[k]}</svg><svg class="i2" viewBox="0 0 24 24" aria-hidden="true">${ic2[k]}</svg>${names[k]}</span>`).join('')}<span class="only2d">薄い丸：問題がまだ入っていない単元</span></div>`;
  }

  // ---- 組み合わせの層（D-031、D-035） ----
  // 地図のデータから出す 3 つ：橋の単元、単元の中で珍しい領域の組、古今東西の問題の中で少ない組・まだない組
  function viewComb() {
    const rn = r => esc(REGION_NAME[r] || r);
    const pair = r => `<span class="from">${rn(r.a)}</span><span class="x">×</span><span class="from">${rn(r.b)}</span>`;
    const uchip = id => UNITS[id] ? `<a class="from" href="#/unit/${id}" style="${lc(UNITS[id].lane)}">${id} ${esc(UNITS[id].title.replace(/（.*$/, ''))}</a>` : '';
    const bridges = LAYER.bridges.filter(inGoal).map(id => UNITS[id]).sort((a, b) => b.comb.b - a.comb.b);
    const g = GOALS.find(x => x.id === prefs.goal);
    return `
    <section class="level-head">
      <div class="eyebrow">組み合わせの層</div>
      <h1>何と何を組み合わせるか</h1>
      <p>多くの単元は、ほかの領域の考えを組み合わせてできています。ここに並べるのは手で付けたものではなく、地図の前提のつながりと、古今東西の ${LAYER.problems} 問が使う単元から数えたものです。</p>
      ${g ? `<p class="goal-banner">橋の単元は、目標「${esc(g.name)}」に要る単元だけです。<button class="pill" type="button" data-goal="all">すべての単元を見る</button></p>` : ''}
    </section>
    <section class="comb-sec">
      <h2>橋の単元 <span class="muted">${bridges.length}</span></h2>
      <p class="muted">直接の前提が、遠い領域を広く組み合わせる単元（広さ ${LAYER.cut} 以上、上位 1 割）と、珍しい組み合わせの単元。</p>
      <div class="station-list">${bridges.map(u => `<a class="station ${stateOf(u.id)}" href="#/unit/${u.id}" style="${lc(u.lane)}">
        <span class="dot ${stateOf(u.id)}"></span><span class="sid">${u.id}・水準 ${u.level}</span><span class="st">${esc(u.title)}</span>
        <span class="sub">${u.comb.rg.map(r => `<span class="from">${rn(r)}</span>`).join('')}</span></a>`).join('')}</div>
    </section>
    <section class="comb-sec">
      <h2>単元の中で珍しい組</h2>
      <p class="muted">その 2 つの領域を前提に持つ単元の数が、各領域の多さから期待される数よりずっと少ない組。橋がまだ少ないところです。</p>
      <table class="comb-table"><tr><th>領域の組</th><th>単元</th><th>期待</th><th>その単元</th></tr>
      ${LAYER.unitPairs.map(r => `<tr><td>${pair(r)}</td><td>${r.o}</td><td>${r.e}</td><td>${r.ex.map(uchip).join('')}</td></tr>`).join('')}</table>
    </section>
    <section class="comb-sec">
      <h2>問題の中で少ない組</h2>
      <p class="muted">古今東西の問題で、その 2 つの領域の単元を一緒に使う問題が、期待よりずっと少ない組。</p>
      <table class="comb-table"><tr><th>領域の組</th><th>問題</th><th>期待</th><th>その問題</th></tr>
      ${LAYER.probPairs.map(r => `<tr><td>${pair(r)}</td><td>${r.o}</td><td>${r.e}</td><td class="muted">${esc(r.ex.join('、'))}</td></tr>`).join('')}</table>
    </section>
    <section class="comb-sec">
      <h2>まだ問題のない組</h2>
      <p class="muted">期待では何問もあるはずなのに、まだ 1 問もない組。遠い組（遠さは前提の使い方の似ていなさ、0〜1）ほど上に並べます。自分で問題を作るときの材料です（2.16）。</p>
      <table class="comb-table"><tr><th>領域の組</th><th>期待</th><th>遠さ</th></tr>
      ${LAYER.probUnseen.map(r => `<tr><td>${pair(r)}</td><td>${r.e}</td><td>${r.d}</td></tr>`).join('')}</table>
    </section>`;
  }

  // ---- 考え方の水準のページ ----
  // 水準ごとに、流れの帯の中へ単元を前提の浅い順に並べる。いま進めている・次にできる単元のある流れを開いておく
  function viewLevel(n) {
    const s = THINK[n], g = GOALS.find(x => x.id === prefs.goal);
    const us = R.units.filter(u => u.level === n && inGoal(u.id)).sort(order);
    const lanes = LANE_ORDER.filter(l => us.some(u => u.lane === l)).map(l => {
      const ls = us.filter(u => u.lane === l), open = ls.some(u => ['doing', 'review', 'ready'].includes(status(u.id)));
      return `<details class="level-lane" style="${lc(l)}"${open ? ' open' : ''}>
        <summary><b>${esc(LANES[l].name)}</b><span class="muted">${ls.filter(u => isDone(u.id)).length} / ${ls.length} 単元</span></summary>
        <div class="station-list">${ls.map(station).join('')}</div></details>`;
    }).join('');
    return `
    <section class="level-head">
      <div class="eyebrow">考え方の水準 ${n}</div>
      <h1>${esc(s.name)}</h1>
      <p>${esc(s.about)}。わけの示し方は ${circled(n)} ${esc(REASON[n])}。</p>
      ${g ? `<p class="goal-banner">目標「${esc(g.name)}」の単元だけ<button class="pill" type="button" data-goal="all">すべて</button></p>` : ''}
    </section>
    <div class="legend">${['ri', 'done', 'doing', 'review', 'ready', 'later'].map(k =>
      `<span><span class="dot ${k}" style="${lc('N')}"></span>${STATUS_NAME[k]}</span>`).join('')}
      <span><span class="from" style="${lc('C')}">C-001</span>ほかの流れの前提</span></div>
    ${us.length ? lanes : '<p class="empty">この目標では、この水準の単元は要りません。</p>'}
    <div class="actions">
      ${THINK[n - 1] ? `<a class="pill" href="#/level/${n - 1}">← 水準 ${n - 1}</a>` : ''}
      ${THINK[n + 1] ? `<a class="pill" href="#/level/${n + 1}">水準 ${n + 1} →</a>` : ''}
    </div>`;
  }
  function station(u) {
    const st = stateOf(u.id), r = progress.units[u.id];
    const daysDone = Object.keys((r && r.days) || {}).length;
    const outside = u.needs.filter(x => UNITS[x].lane !== u.lane);
    const ready = u.days.filter(d => d.items && d.items.length).length;
    return `
    <a class="station ${st}${inGoal(u.id) ? '' : ' off'}" href="#/unit/${u.id}" data-id="${u.id}" style="${lc(u.lane)}">
      <span class="dot ${st}"></span>
      <span class="sid">${u.id}</span>
      <span class="st">${esc(u.title)}</span>
      <span class="sub">${st === 'doing' ? `${daysDone} / ${u.days.length} 日` : `${u.days.length} 日`}
        ${outside.map(x => `<span class="from" style="${lc(UNITS[x].lane)}">${x}</span>`).join('')}
        ${ready ? `<span class="from" style="--c: var(--ok)">問題 ${ready} 日分</span>` : ''}
        ${u.measure ? '<span class="from" style="--c: var(--muted)">大会のため</span>' : ''}</span>
    </a>`;
  }

  // ---- 単元：日の路線 ----
  function viewUnit(id) {
    const u = UNITS[id], st = status(id), r = progress.units[id] || {}, ns = nextStep(id);
    const chip = x => `<a class="from" href="#/unit/${x}" style="${lc(UNITS[x].lane)}">${x} ${esc(UNITS[x].title)}</a>`;
    const opens = R.units.filter(v => v.needs.includes(id));
    const v = r.review;
    const reviewNote = !v ? '' : v.complete ? '定着しました' : v.lapsed ? '「復習」に戻りました。確認の日をもう一度' : `次の確かめは ${v.due}`;
    return `
    <section class="unit-head" style="${lc(u.lane)}">
      <div class="eyebrow">${esc(LANES[u.lane].name)}の流れ・<a href="#/level/${u.level}">水準 ${u.level} ${esc((THINK[u.level] || {}).name || '')}</a>・${u.id}</div>
      <h1>${esc(u.title)}</h1>
      <div class="row"><span class="dot ${stateOf(id)}" style="${lc(u.lane)}"></span>${STATUS_NAME[stateOf(id)]}${r.done ? `（${r.done}）` : ''}${reviewNote ? `・${reviewNote}` : ''}</div>
      <div class="row">${u.needs.length ? `前提 ${u.needs.map(chip).join('')}` : '前提なし'}</div>
      ${u.alt ? `<div class="row">代わりの前提 ${Object.entries(u.alt).map(([n, bs]) => `<span class="muted">${n} の代わりに</span>${bs.map(chip).join('')}`).join('')}</div>` : ''}
      ${opens.length ? `<div class="row">この先 ${opens.map(v => chip(v.id)).join('')}</div>` : ''}
      ${topicsHtml(topicsOf(id))}
      ${combHtml(u)}
    </section>
    <div class="days" style="${lc(u.lane)}">${u.days.map((d, i) => {
      const n = i + 1, dr = r.days && r.days[n], skipped = (r.skip || []).includes(n);
      const isNext = ns.day === n && st !== 'later' && (ns.type === 'extra' || !dr || st === 'review');
      const cls = isNext ? 'next' : dr ? 'done' : skipped ? 'skipped' : '';
      const count = d.items && d.items.length ? `・${d.items.filter(x => x.part !== '見本').length} 問` : '・問題はまだ';
      const extra = r.extra && r.extra[n] ? `・おさらい ${r.extra[n]} 回` : '';
      const go = isNext ? (ns.type === 'extra' ? 'おさらい →' : 'つぎ →') : dr ? dr.date : skipped ? 'とばした' : '';
      return `
      <a class="day ${cls}" href="${isNext ? stepHref(id, ns) : `#/day/${id}/${n}`}">
        <span class="day-stop">${n}</span>
        <span class="day-card"><span class="k">${esc(d.kind)}${count}${extra}</span><br>
          <span class="a">${esc(d.aim || R.kinds[d.kind])}</span></span>
        <span class="go">${go}</span>
      </a>`;
    }).join('')}</div>
    ${riHtml(id)}
    ${problemsHtml(id)}`;
  }

  // ---- 難しさの 3 段と腕だめし（D-047） ----
  // 守は型をなぞる（見本、思い出す、今日、わけ）、破は型を崩して使う（挑戦）、離は型を離れる（腕だめし）。
  // 腕だめしは単元のファイルの ri に置き、単元が済になってから開く。合わせる単元（uses）がすべて済の問題から挑める。済の判定には入れない
  const TIER = { 見本: '守', 思い出す: '守', 今日: '守', わけ: '守', 挑戦: '破', 離: '離' };
  const TIER_NOTE = { 守: '守：型をなぞる', 破: '破：型を崩して使う', 離: '離：型を離れる' };
  const KIND_NAME = { 総動員: ['いろいろ つかう', 'いくつもの単元を合わせる'], 数: ['かずが ややこしい', '数がややこしい'],
    道筋: ['みちが みえにくい', '道筋が見えにくい'], 手数: ['てかずが おおい', '手数が多い'], 読み取り: ['よみとりが いる', '条件を読み取る'], 最難関: ['さいなんかん', '最難関'] };
  const kindName = (k, small) => (KIND_NAME[k] || [k, k])[small ? 0 : 1];
  const tierHtml = it => {
    const t = TIER[it.part];
    return t ? `<i class="tier t-${{ 守: 'shu', 破: 'ha', 離: 'ri' }[t]}" title="${TIER_NOTE[t]}">${t}</i>` : '';
  };
  const kindsHtml = (it, small) => (it.kinds || []).length
    ? `<div class="kinds">${it.kinds.map(k => `<span class="kind${k === '最難関' ? ' hard' : ''}">${esc(kindName(k, small))}</span>`).join('')}</div>` : '';
  const riStar = it => (progress.items[it.qid] || {}).star || 0;
  const riStars = u => (u.ri || []).reduce((a, it) => a + riStar(it), 0);
  // 施主（2026-11-10）：腕だめしは単元が済になる前でも見られるようにする。済や uses で錠をかけない
  const riOpen = u => (u.ri || []);
  // 星の少ない問題から 3 問（今日の課題・おすすめ用）
  const riPick = u => riOpen(u).map((it, i) => [it, i]).sort((a, b) => riStar(a[0]) - riStar(b[0]) || a[1] - b[1]).slice(0, 3).map(x => x[0]);
  const starsHtml = n => `<span class="stars" aria-label="星 ${n}">${'★'.repeat(n)}${'☆'.repeat(3 - n)}</span>`;
  // 腕だめしの並べ方：難しさの種類、使う知識、やさしい順
  const RI_KINDS = ['数', '読み取り', '道筋', '手数', '総動員', '最難関'];
  const riScore = it => (it.kinds || []).length * 10 + (it.uses || []).length * 3 + (typeof it.level === 'number' ? it.level : 0);
  const riSorted = u => (u.ri || []).map((it, i) => [it, i])
    .sort((a, b) => riScore(a[0]) - riScore(b[0]) || a[1] - b[1]).map(x => x[0]);
  function riGroupItems(u, key) {
    if (!key || key === 'order' || key === 'all') return riSorted(u);
    if (key.startsWith('k-')) {
      const k = key.slice(2);
      return riSorted(u).filter(it => k === 'その他' ? !(it.kinds || []).length : (it.kinds || []).includes(k));
    }
    if (key.startsWith('u-')) {
      const x = key.slice(2);
      return riSorted(u).filter(it => x ? (it.uses || []).includes(x) : !(it.uses || []).length);
    }
    return riSorted(u);
  }
  function riGroups(u, mode) {
    const its = riSorted(u);
    if (mode === 'kinds') {
      return RI_KINDS.map(k => ({ key: `k-${k}`, label: kindName(k, false), items: its.filter(it => (it.kinds || []).includes(k)) }))
        .concat([{ key: 'k-その他', label: 'その他', items: its.filter(it => !(it.kinds || []).length) }])
        .filter(g => g.items.length);
    }
    if (mode === 'uses') {
      const map = new Map();
      its.forEach(it => {
        const us = (it.uses || []).filter(x => UNITS[x]);
        if (!us.length) {
          if (!map.has('u-')) map.set('u-', { key: 'u-', label: 'この単元だけ', items: [] });
          map.get('u-').items.push(it);
        } else us.forEach(x => {
          const key = `u-${x}`;
          if (!map.has(key)) map.set(key, { key, label: `${x} ${UNITS[x].title}`, items: [], unit: x });
          map.get(key).items.push(it);
        });
      });
      return [...map.values()].sort((a, b) => {
        if (!a.unit) return -1;
        if (!b.unit) return 1;
        return (UNITS[a.unit].stage - UNITS[b.unit].stage) || a.unit.localeCompare(b.unit);
      });
    }
    return [{ key: 'order', label: 'やさしい順', items: its }];
  }
  function riHtml(id) {
    const u = UNITS[id], its = u.ri || [];
    if (!its.length) return '';
    const mode = prefs.riGroup;
    const groups = riGroups(u, mode);
    const card = (it, i, key) => `<a class="ri-card" href="#/ri/${id}/${encodeURIComponent(key)}/${i + 1}"><span class="ri-n">問 ${i + 1}</span>${starsHtml(riStar(it))}
        ${kindsHtml(it, false)}
        ${(it.uses || []).length ? `<div class="row">合わせる単元 ${it.uses.map(x => UNITS[x] ? `<span class="from" style="${lc(UNITS[x].lane)}">${isDone(x) ? '✓ ' : ''}${esc(UNITS[x].title)}</span>` : esc(x)).join(' ')}</div>` : ''}</a>`;
    const toggle = `<div class="ri-groupby">${[['order', '順番'], ['kinds', '難しさの種類'], ['uses', '使う知識']].map(([k, l]) =>
      `<button class="pill${mode === k ? ' solid' : ''}" data-rigroup="${k}" type="button">${l}</button>`).join('')}</div>`;
    const body = groups.map(g => {
      const stars = g.items.reduce((a, it) => a + riStar(it), 0);
      return `<section class="ri-group"><div class="ri-group-head"><div><h3>${esc(g.label)}</h3>
        <span class="muted">${g.items.length} 問・★ ${stars} / ${g.items.length * 3}</span></div></div>
        <div class="ri-list">${g.items.map((it, i) => card(it, i, g.key)).join('')}</div></section>`;
    }).join('');
    return `<section class="ri"><h2 class="section-title" title="型を離れた問題。済の判定には入れない。★ 解けた　★★ ヒントなし　★★★ 一度に目安の時間の内">腕だめし（離）　★ ${riStars(u)} / ${its.length * 3}</h2>
      ${toggle}
      ${mode === 'uses' ? '<p class="muted ri-note">同じ問題が、使う単元がいくつかあると、いくつかの組に出ます。</p>' : mode === 'kinds' ? '<p class="muted ri-note">同じ問題が、いくつかの種類に出ることがあります。</p>' : ''}
      ${body}
      <div class="actions"><a class="pill solid" href="#/ri/${id}/order">順番にすべて解く</a></div></section>`;
  }

  // ---- 目標：単元を組み合わせた結果として届く場所 ----
  // 古今東西の問題（problems/。著作権のある問題は骨格と出典だけ、D-020）
  const PROBS = window.PROBLEMS || [];
  const PBY = {};
  PROBS.forEach(p => (p.u || []).forEach(u => (PBY[u] = PBY[u] || []).push(p)));
  const solvable = () => PROBS.filter(p => p.u && p.u.length && p.u.every(isDone)).length;
  function problemsHtml(id) {
    const ps = (PBY[id] || []).slice().sort((a, b) => (b.pd ? 1 : 0) - (a.pd ? 1 : 0) || (a.u || []).length - (b.u || []).length || String(b.y).localeCompare(String(a.y)));
    if (!ps.length) return '';
    const shown = ps.slice(0, 24);
    return `<section class="probs"><h2 class="section-title" title="札は、その問題で一緒に使う単元。著作権のある問題は骨格だけを書き、問題は出典で読む">この単元が鍵になる古今東西の問題（${ps.length} 問）</h2>
      <div class="prob-list">${shown.map(p => `<article class="prob">
        <div class="prob-head"><b>${esc(p.src)}${p.y ? ' ' + esc(p.y) : ''}${p.no ? ' 第 ' + esc(p.no) + ' 問' : ''}</b>
          ${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">出典</a>` : ''}</div>
        <div class="prob-body">${esc(p.pd && p.text ? p.text : p.g || '')}</div>
        ${prefs.parent && p.k ? `<div class="parent"><b>鍵の一手</b> ${esc(p.k)}</div>` : ''}
        <div class="row">組み合わせ ${(p.u || []).filter(u => UNITS[u]).map(u => `<a class="from" href="#/unit/${u}" style="${lc(UNITS[u].lane)}">${u === id ? '★ ' : ''}${isDone(u) ? '✓ ' : ''}${esc(UNITS[u].title)}</a>`).join('')}</div>
      </article>`).join('')}</div>
      ${ps.length > shown.length ? `<p class="muted">ほか ${ps.length - shown.length} 問</p>` : ''}</section>`;
  }
  function viewGoal(id) {
    const g = GOALS.find(x => x.id === id), set = GOAL_SETS[id], st = goalStats(g), f = forecast(x => set.has(x));
    const next = R.units.filter(u => set.has(u.id) && ['ready', 'doing', 'review'].includes(status(u.id))).sort(order);
    const must = g.items.filter(i => !i.choice), fields = [...new Set(must.map(i => i.field))];
    const row = it => {
      if (it.none) return `<div class="topic none"><span class="mark"></span><span class="t">${esc(it.topic)}</span><span class="us muted">入れない：${esc(it.none)}</span></div>`;
      const ok = topicDone(it);
      return `<div class="topic${ok ? ' ok' : ''}"><span class="mark">${ok ? '✓' : ''}</span><span class="t">${esc(it.topic)}</span>
        <span class="us">${it.units.map(u => `<a class="from" href="#/unit/${u}" style="${lc(UNITS[u].lane)}">${isDone(u) ? '✓ ' : ''}${u} ${esc(UNITS[u].title)}</a>`).join('')}</span></div>`;
    };
    return `
    <section class="unit-head goal-head">
      <div class="eyebrow">目標・${esc(g.kind)}${g.field ? '・' + esc(g.field) : g.fields ? '・' + esc(g.fields.join('・')) : ''}・${esc(g.level)}・${esc(g.region)}</div>
      <h1>${esc(g.name)}</h1>
      <div class="row">${esc(g.note)}</div>
      ${g.basis ? `<div class="row muted">範囲の根拠：${esc(g.basis)}</div>` : ''}
      ${g.beyond ? `<div class="row muted">知識のほかに要ること：${esc(g.beyond)}</div>` : ''}
      <div class="gauge">
        <div><span class="k">届いた論題</span><b>${st.got} / ${st.topics}</b></div>
        <div><span class="k">済んだ単元</span><b>${st.done} / ${st.units}</b></div>
        <div><span class="k">見込み</span><b>残り 約 ${f.est}</b><span class="u">日</span></div>
      </div>
      <div class="row"><button class="pill solid" type="button" data-goal="${id}" data-go="#/">この目標の道だけで地図を見る</button></div>
    </section>
    <section class="next">
      <h2>次に進める単元</h2>
      <div class="next-list">${next.slice(0, 8).map(u => `
        <a class="next-card" href="#/unit/${u.id}" style="${lc(u.lane)}">
          <span class="dot ${stateOf(u.id)}"></span>
          <span class="mode">${STATUS_NAME[stateOf(u.id)]}・${esc(LANES[u.lane].name)}・水準 ${u.level}</span>
          <span class="t">${esc(u.title)}</span>
        </a>`).join('') || '<p class="muted">この目標の単元はすべて済みました。</p>'}</div>
    </section>
    <section>
      <h2 class="section-title">論題（✓ は、受け持つ単元がすべて済んで届いたもの）</h2>
      ${fields.map(fd => `<h3 class="field">${esc(fd)}</h3><div class="topics">${must.filter(i => i.field === fd).map(row).join('')}</div>`).join('')}
    </section>
    ${Object.entries(g.choices || {}).map(([k, c]) => {
      const picks = g.items.filter(i => i.choice === k), pf = [...new Set(picks.map(i => i.field))];
      return `<section>
      <h2 class="section-title">選んで解く論題：${esc(c.label)}（${c.pick} つ選ぶ）</h2>
      ${pf.map(fd => `<h3 class="field">${esc(fd)}</h3><div class="topics">${picks.filter(i => i.field === fd).map(row).join('')}</div>`).join('')}
    </section>`;
    }).join('')}`;
  }

  // ---- 今日の問題 ----
  function viewDay(id, n, type = 'day', group = 'order', start = 0) {
    const u = UNITS[id], d = u.days[n - 1];
    let items = d.items || [];
    // おさらいの日は予備の問題、なければその日の問題をもう一度
    if (type === 'extra') items = d.extra && d.extra.length ? d.extra : items.filter(x => x.part !== '見本');
    if (type === 'review') items = pickReview(u);
    if (type === 'look') items = lookItems(id, n);
    let groupLabel = '';
    if (type === 'ri') {
      items = riGroupItems(u, group);
      const k = group && group.startsWith('k-') ? group.slice(2) : '';
      const x = group && group.startsWith('u-') ? group.slice(2) : '';
      groupLabel = !group || group === 'order' || group === 'all' ? '順番'
        : k ? (k === 'その他' ? 'その他' : kindName(k, false))
        : x && UNITS[x] ? UNITS[x].title : x ? '' : 'この単元だけ';
    }
    const at = Math.max(0, Math.min(items.length ? items.length - 1 : 0, start));
    session = { id, n, type, group, groupLabel, items, start: at, idx: at, results: [], entry: '', hints: 0, tries: 0, solved: false };
    return `<section class="play" id="play" style="${lc(u.lane)}"></section>`;
  }
  // 確かめの 2 問は、単元のすべての問題から日付で決まる順に選ぶ（同じ日に開き直しても同じ問題）
  function pickReview(u) {
    const pool = u.days.flatMap(d => [...(d.items || []), ...(d.extra || [])]).filter(x => x.part !== '見本');
    const seed = Array.from(localDate() + u.id).reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const out = [];
    for (let i = 0; out.length < Math.min(RULE.reviewItems, pool.length) && i < pool.length * 2; i++) {
      const it = pool[(seed + i * 7919) % pool.length];
      if (!out.includes(it)) out.push(it);
    }
    return out;
  }
  function steps() {
    const s = session;
    let h = '';
    s.items.forEach((_, i) => {
      const r = s.results[i];
      const cls = r ? (r.first ? 'ok' : slow(r) ? 'slow' : 'help') : r === null ? 'ok' : i === s.idx ? 'on' : '';
      h += (i ? `<i class="${i <= s.idx ? 'on' : ''}"></i>` : '') + `<b class="${cls}"></b>`;
    });
    const lim = s.solved || s.dunno ? 0 : timeFor(s, s.items[s.idx]);
    return `<div class="play-top"><div class="steps">${h}</div>
      <span class="play-count">${Math.min(s.idx + 1, s.items.length)} / ${s.items.length}</span>${lim ? `<span class="clock" id="clock" data-lim="${lim}" title="目安の時間">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle class="arc" cx="12" cy="12" r="9" pathLength="100" stroke-dasharray="0 100"/></svg>
        <span class="clock-t"></span></span>` : ''}</div>`;
  }
  function pathsHtml(it) {
    return `<div class="paths">${(it.paths || []).map((p, i) => `
      <div><div class="path-label">${i ? 'べつの みちすじ' : 'みちすじ'}</div>
        <div class="path">${p.map((x, j) => {
          const t = i * .7 + j * .28;
          return (j ? `<span class="link" style="animation-delay:${t - .1}s"></span>` : '') +
            `<span class="stn" style="animation-delay:${t}s">${fmtLinks(x)}</span>`;
        }).join('')}</div></div>`).join('')}</div>`;
  }
  function parentHtml(it) {
    if (!prefs.parent) return '';
    if (it.part === '見本') return '';
    if (it.part === 'わけ') return `<div class="parent"><b>手本</b> ${fmtLinks(it.explain)}
      ${(it.paths || []).map((p, i) => `<br>${i ? '別の道' : '道筋'}：${p.map(fmtLinks).join(' → ')}`).join('')}
      <div class="actions" style="justify-content:flex-start;margin-top:10px"><button class="pill" data-act="skip" type="button">この問題をとばす</button></div></div>`;
    return `<div class="parent"><b>こたえ</b> ${fmt(it.answer)}
      ${(it.paths || []).map((p, i) => `<br>${i ? '別の道' : '道筋'}：${p.map(fmtLinks).join(' → ')}`).join('')}
      ${it.note ? `<br><b>見どころ</b> ${fmtLinks(it.note)}` : ''}
      <div class="actions" style="justify-content:flex-start;margin-top:10px"><button class="pill" data-act="skip" type="button">この問題をとばす</button></div></div>`;
  }
  // ---- 目安の時間（D-045） ----
  // 段の 1 日の分（stages の minutes）の 8 割を、問題の種類の重みで割り振る（30 秒きざみ）。問題に time（秒）を書けば、それにする。
  // 目安をすぎても解き続けられる。ただし、そうしてできた問題は「一度にできた」に数えない（確認の 8 割、おさらい、練習をとばす判定）
  const TIME_W = { 思い出す: 1, 今日: 1.5, 挑戦: 3, わけ: 2, 離: 6 };
  const STAGE_TIME = Object.fromEntries(R.stages.map(st => {
    const reason = (st.reason || [1, 1]).reduce((a, b) => a + b, 0) / 2;
    const w = Object.entries(st.day || {}).reduce((a, [p, k]) => a + k * (TIME_W[p] || 1), 0) + reason * TIME_W['わけ'];
    const per = (st.minutes || 20) * 60 * .8 / (w || 1);
    return [st.id, Object.fromEntries(Object.entries(TIME_W).map(([p, x]) => [p, Math.max(30, Math.round(per * x / 30) * 30)]))];
  }));
  const timeFor = (s, it) => s.type === 'look' || !it || it.part === '見本' ? 0 : it.time || (STAGE_TIME[UNITS[s.id].stage] || {})[it.part] || 0;
  // かかった時間：画面が隠れている間は数えない。解けたとき、「わからない」を押したときに止める
  const spent = s => (s.el || 0) + (s.t0 ? Date.now() - s.t0 : 0);
  const freeze = s => { s.el = spent(s); s.t0 = 0; s.paused = true; };
  const fmtSec = x => x >= 60 ? `${Math.floor(x / 60)} 分${x % 60 ? ` ${x % 60} 秒` : ''}` : `${x} 秒`;
  // 目安をすぎたほかは一度にできた問題（点の色を変える）
  const slow = r => r.over && !r.hints && (r.tries || 1) <= 1 && !r.dunno && !r.skipped;
  function outcome(s, it, more) {
    const ms = spent(s), lim = timeFor(s, it), over = !!lim && ms > lim * 1000;
    return { first: s.tries === 1 && s.hints === 0 && !over && !s.dunno, hints: s.hints, tries: s.tries, ms,
      ...(over ? { over: true } : {}), ...(s.dunno ? { dunno: true } : {}), ...more };
  }
  function tick() {
    const c = document.getElementById('clock'), s = session;
    if (!c || !s) return;
    const lim = +c.dataset.lim, t = spent(s) / 1000, over = t > lim, small = UNITS[s.id].stage <= 2, arc = c.querySelector('.arc');
    if (arc) arc.setAttribute('stroke-dasharray', `${Math.min(100, t / lim * 100).toFixed(1)} 100`);
    c.classList.toggle('over', over);
    c.querySelector('.clock-t').textContent = (over ? (small ? 'めやすを すぎたよ' : '目安をすぎました') : (small ? 'めやす' : '目安'))
      + (prefs.parent ? ` ${fmtSec(lim)}` : '');
  }
  setInterval(tick, 500);
  document.addEventListener('visibilitychange', () => {
    const s = session;
    if (!s || !s.run || s.solved || s.paused) return;
    if (document.hidden) { s.el = spent(s); s.t0 = 0; } else s.t0 = Date.now();
  });

  // ---- わからない（D-045） ----
  // どこで止まったか（問題の意味、何から始めるか、道筋のどの一歩か）を聞き、ふりかえる単元を出す。
  // 候補は、この単元の見本と、前提の単元（2 段前まで）。止まった文と、各単元の日の文（ねらい、問題、道筋）の近さで並べる
  const WORDS = {
    small: { ask: 'どこが わからない？', mean: 'もんだいの いみ', start: 'なにから するか', mid: 'とちゅうから',
      here: 'ここまでは わかる？', yes: 'わかる', no: 'ここが わからない', allok: 'ぜんぶ わかるね。こたえまで あと すこし。もう いちど やってみよう。',
      read: 'おうちの ひとに、もんだいを ゆっくり よんで もらおう。', first: 'さいしょは ここから かんがえるよ', stuck: 'ここで とまったね',
      offer: 'ふりかえる ところ', now: 'いま ふりかえる', later: 'あとで', added: 'きょうの かだいに いれたよ',
      back: 'もんだいに もどる', skip: 'この もんだいは とばす', self: 'この べんきょうの みほん', need: 'まえの べんきょう', done: 'ふりかえり、できた！', ret: 'もとの もんだいに もどる' },
    big: { ask: 'どこが分からない？', mean: '問題の意味', start: '何から始めるか', mid: '途中から',
      here: 'ここまでは分かる？', yes: '分かる', no: 'ここが分からない', allok: 'どの段も分かるなら、あとは答えまで。もう一度やってみよう。',
      read: '問題の文を、区切りながらゆっくり読み直そう。分からない言葉は、おうちの人に聞こう。', first: '最初はここから考える', stuck: 'ここで止まった',
      offer: 'ふりかえる単元', now: '今ふりかえる', later: 'あとで', added: '今日の課題に入れた',
      back: '問題にもどる', skip: 'この問題はとばす', self: 'この単元の見本', need: '前の単元', done: 'ふりかえり、できた！', ret: 'もとの問題にもどる' },
  };
  const words = id => WORDS[UNITS[id].stage <= 2 ? 'small' : 'big'];
  // 文字の 1 つ組（ひらがなを除く）と 2 つ組。数字、空白、句読点は除く
  function grams(t) {
    const s = String(t || '').replace(/[\s\d.,、。・「」『』（）()？！?!:：]/g, ''), g = new Set();
    for (let i = 0; i < s.length; i++) {
      if (!/[ぁ-ゟ]/.test(s[i])) g.add(s[i]);
      if (i + 1 < s.length) g.add(s.slice(i, i + 2));
    }
    return g;
  }
  const DAY_GRAMS = {};
  function dayGrams(id, k) {
    const key = id + '/' + k;
    if (!DAY_GRAMS[key]) {
      const u = UNITS[id], d = u.days[k - 1];
      DAY_GRAMS[key] = grams([u.title, d.aim || '', ...[...(d.items || []), ...(d.extra || [])]
        .flatMap(it => [it.text, it.explain || '', ...(it.paths || []).flat()])].join(' '));
    }
    return DAY_GRAMS[key];
  }
  function lookCands(s, text, why) {
    const u = UNITS[s.id], w = new Map(), alt = u.alt || {};
    const add = (id, x) => { if (UNITS[id] && !w.has(id)) w.set(id, x); };
    if (why !== 'mid') add(u.id, 1.3);
    ((s.items[s.idx] || {}).uses || []).forEach(x => add(x, 1.1));
    u.needs.forEach(n => [n, ...(alt[n] || [])].forEach(x => add(x, 1)));
    u.needs.forEach(n => (UNITS[n] ? UNITS[n].needs : []).forEach(x => add(x, .7)));
    add(u.id, .8);
    const q = grams(text), cand = [...w].map(([id, x]) => ({ id, x, days: id === u.id ? s.n : UNITS[id].days.length }));
    // 候補のうち少ない単元にしか出ない文字の組ほど重く数える
    const df = {};
    cand.forEach(c => {
      const seen = new Set();
      for (let k = 1; k <= c.days; k++) dayGrams(c.id, k).forEach(g => { if (q.has(g)) seen.add(g); });
      seen.forEach(g => { df[g] = (df[g] || 0) + 1; });
    });
    return cand.map(c => {
      let best = 0, day = 1;
      for (let k = 1; k <= c.days; k++) {
        const dg = dayGrams(c.id, k);
        let sc = 0;
        q.forEach(g => { if (dg.has(g)) sc += Math.log(1 + cand.length / df[g]); });
        sc /= Math.sqrt(dg.size || 1);
        if (sc > best) { best = sc; day = k; }
      }
      const self = c.id === u.id;
      return { id: c.id, day: self && why !== 'mid' ? 1 : day, score: best * c.x, self };
    }).sort((a, b) => b.score - a.score).slice(0, 3);
  }
  function dkOffer(s, it, why, i = 0) {
    const path = ((it.paths || [])[0] || []).slice(0, -1);
    // 比べる文：止まった一歩と、そこに当たるヒント（ヒントには「わり切れる」のような考えの言葉が入る）
    const hint = why === 'start' ? 0 : why === 'mid' ? Math.min(i, 2) : null, ht = hint !== null ? (it.hints || [])[hint] || '' : '';
    const text = why === 'mid' ? `${path[i]} ${ht}` : why === 'start' ? `${it.text} ${path[0] || ''} ${ht}` : `${it.text} ${it.explain || ''}`;
    if (hint !== null && (it.hints || [])[hint]) s.hints = Math.max(s.hints, hint + 1);
    s.dk = { step: 'offer', why, i, hint, cands: lookCands(s, text, why) };
  }
  function dunnoHtml(s, it) {
    const W = words(s.id), k = s.dk, path = ((it.paths || [])[0] || []).slice(0, -1);
    if (k.step === 'what') return `<div class="dk"><p class="dk-q">${W.ask}</p><div class="dk-opts">
      <button class="pill" data-act="dk" data-w="mean" type="button">${W.mean}</button>
      <button class="pill" data-act="dk" data-w="start" type="button">${W.start}</button>
      ${path.length ? `<button class="pill" data-act="dk" data-w="mid" type="button">${W.mid}</button>` : ''}</div>
      <div class="actions"><button class="pill" data-act="dk-close" type="button">${W.back}</button></div></div>`;
    if (k.step === 'path') return `<div class="dk"><div class="dk-path">${path.slice(0, k.i + 1)
      .map((x, j) => `<span class="stn${j === k.i ? ' cur' : ''}">${fmt(x)}</span>`).join('<span class="link"></span>')}</div>
      <p class="dk-q">${W.here}</p><div class="dk-opts"><button class="pill" data-act="dk-yes" type="button">${W.yes}</button>
      <button class="pill solid" data-act="dk-no" type="button">${W.no}</button></div></div>`;
    if (k.step === 'allok') return `<div class="dk"><p class="dk-q">${W.allok}</p>
      <div class="actions"><button class="pill solid" data-act="dk-close" type="button">${W.back}</button></div></div>`;
    const head = k.why === 'mean' ? `<p class="dk-note">${W.read}</p>`
      : k.why === 'start' && path.length ? `<p class="dk-note"><b>${W.first}</b>　${fmt(path[0])}</p>`
      : k.why === 'mid' ? `<p class="dk-note"><b>${W.stuck}</b>　${fmt(path[k.i])}</p>` : '';
    const hint = k.hint !== null && (it.hints || [])[k.hint] ? `<div class="hints"><div class="hint" data-n="${k.hint + 1}">${fmtLinks(it.hints[k.hint])}</div></div>` : '';
    const asks = progress.asks || [];
    return `<div class="dk">${head}${hint}<h3 class="dk-h">${W.offer}</h3><div class="dk-cands">${k.cands.map(c => {
      const cu = UNITS[c.id], put = asks.some(a => a.u === c.id);
      return `<div class="dk-cand" style="${lc(cu.lane)}"><span class="mode">${c.self ? W.self : W.need}・${STATUS_NAME[status(c.id)]}</span>
        <span class="t">${esc(cu.title)}</span><span class="dk-btns">
        <button class="pill solid" data-act="look-now" data-u="${esc(c.id)}" data-day="${c.day}" type="button">${W.now}</button>
        <button class="pill" data-act="look-later" data-u="${esc(c.id)}" data-day="${c.day}" type="button" title="今日の課題に入れる"${put ? ' disabled' : ''}>${put ? W.added : W.later}</button></span></div>`;
    }).join('')}</div>
      <div class="actions"><button class="pill" data-act="dk-close" type="button">${W.back}</button>
        ${it.part === '見本' ? '' : `<button class="pill" data-act="skip" type="button">${W.skip}</button>`}</div></div>`;
  }
  // ふりかえり：その日の見本と、思い出す・今日の問題から 4 問まで（その日に見本がなければ 1 日目の見本を前に置く）
  function lookItems(id, k) {
    const u = UNITS[id], d = u.days[k - 1] || u.days[0], its = d.items || [];
    let show = its.filter(x => x.part === '見本');
    if (!show.length) show = (u.days[0].items || []).filter(x => x.part === '見本').slice(0, 1);
    return [...show.slice(0, 2), ...its.filter(x => x.part === '思い出す' || x.part === '今日')].slice(0, 4);
  }
  // 今日の課題に入れる（同じ単元は 1 つだけ、30 件まで）
  function addAsk(s, id, day) {
    const a = progress.asks || (progress.asks = []), it = s.items[s.idx];
    if (a.some(x => x.u === id)) return;
    a.push({ u: id, day, key: UNITS[id].days[day - 1].key, from: s.id, qid: it && it.qid, why: s.dk && s.dk.why, date: localDate(), t: Date.now() });
    if (a.length > 30) a.splice(0, a.length - 30);
    persist();
  }
  // 今ふりかえる：解いている日を残したまま、ふりかえりの問題を出し、済んだらもとの問題にもどる
  function startLook(id, day, back) {
    session = { id, n: day, type: 'look', items: lookItems(id, day), idx: 0, results: [], entry: '', hints: 0, tries: 0, solved: false, back };
    const el = $('#play');
    if (el) el.setAttribute('style', lc(UNITS[id].lane));
    Music.tap(); drawItem(); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function endLook() {
    const b = session && session.back;
    if (!b) return;
    b.dk = null; session = b;
    const el = $('#play');
    if (el) el.setAttribute('style', lc(UNITS[b.id].lane));
    Music.tap(); drawItem();
  }
  function drawItem() {
    const s = session, el = $('#play'), u = UNITS[s.id], d = u.days[s.n - 1];
    if (!s.run && !s.solved && s.idx < s.items.length) { s.run = true; s.el = 0; s.paused = false; s.t0 = document.hidden ? 0 : Date.now(); }
    if (!s.items.length) {
      el.innerHTML = `<div class="card empty"><span class="part">${esc(d.kind)}</span>
        <h2 style="margin:18px 0 8px">${esc(s.type === 'ri' ? '腕だめし（離）' + (s.groupLabel ? '・' + s.groupLabel : '') : d.aim || R.kinds[d.kind])}</h2>
        <p>${s.type === 'ri' ? 'この単元の腕だめしは、まだ作っていません。' : 'この日の問題は、まだ作っていません。'}</p>
        <div class="actions"><a class="pill" href="#/unit/${s.id}">単元へもどる</a></div></div>`;
      return;
    }
    if (s.idx >= s.items.length) return drawFinish();
    const it = s.items[s.idx];
    // 図の並びが折り返すと意味が変わるので、いちばん長い行が 1 行に収まる大きさにする
    // 半角（数字、英字、空白）は全角の半分ほどの幅として数え、数字の多い行で字が小さくなりすぎないようにする
    const width = l => Array.from(l).reduce((w, c) => w + (c.codePointAt(0) < 0x2000 ? .55 : 1), 0);
    const longest = it.figure ? Math.max(...String(it.figure).split('\n').map(width)).toFixed(2) : 0;
    // 図：文字の図（figure）と、線や形の図（svg、D-040）。svg は地図の問題ファイルに書いたものだけを出す（道具が確かめる）
    const fig = (it.figure ? `<div class="fig" style="--n:${longest}" aria-label="え">${esc(it.figure)}</div>` : '')
      + (it.svg ? `<div class="fig fig-svg" role="img" aria-label="ず">${it.svg}</div>` : '')
      + (it.balance ? balanceHtml(it.balance) : '');
    let body;
    const dk = s.type === 'look' ? '' : '<button class="pill" data-act="dunno" type="button">わからない</button>';
    if (s.dk && !s.solved) {
      body = `${fig}${dunnoHtml(s, it)}`;
    } else if (it.part === 'わけ' && !s.solved) {
      // わけを口で言う問題：保護者が聞いて「言えた」を押す（D-016）
      const hints = (it.hints || []).slice(0, s.hints).map((h, i) => `<div class="hint" data-n="${i + 1}">${fmtLinks(h)}</div>`).join('');
      const st = UNITS[s.id].stage, ask = st <= 2 ? ['くちで いってみよう。いえたら、おうちの ひとに「いえた」を おしてもらおう。', 'いえた']
        : st === 3 ? ['ノートに、わけを文で書いてみよう。書けたら、おうちの人に見せて「書けた」をおしてもらおう。', '書けた']
        : ['決めたこと（文字や約束）から順に、筋道を立ててノートに書こう。書けたら、おうちの人に見てもらって「書けた」を押そう。', '書けた'];
      const first = (it.paths || [])[0] || [];
      const order = first.length > 1
        ? `<div class="what"><div class="t">${st <= 2 ? 'はなす じゅんばん' : '説明する順序'}</div><ol>${first.map(p => `<li>${fmtLinks(p)}</li>`).join('')}</ol></div>`
        : '';
      body = `${fig}<div class="explain">${ask[0]}</div>${order}
        <div class="hints">${hints}</div>
        <div class="actions">${s.hints < 3 ? `<button class="pill" data-act="hint" type="button">ヒント ${s.hints + 1} / 3</button>` : ''}
          ${dk}<button class="pill solid" data-act="said" type="button">${ask[1]}</button></div>`;
    } else if (it.part === 'わけ') {
      body = `${fig}<div class="feedback">よく いえたね！</div>${pathsHtml(it)}
        <div class="actions"><button class="pill solid" data-act="next" type="button">つぎへ</button></div>`;
    } else if (it.part === '見本') {
      body = `${fig}<div class="explain">${fmtExplain(it.explain)}</div>
        <div class="actions">${dk}<button class="pill solid" data-act="next" type="button">わかった</button></div>`;
    } else if (s.solved) {
      body = `${fig}<div class="feedback">できた！ こたえは <b>${fmt(it.answer)}</b></div>${pathsHtml(it)}
        <div class="actions"><button class="pill solid" data-act="next" type="button">つぎへ</button></div>`;
    } else {
      const input = it.choices
        ? `<div class="choices">${it.choices.map(c => `<button class="choice" data-choice="${esc(c)}" type="button">${fmt(c)}</button>`).join('')}</div>`
        : `<div class="answer-box"><div class="display" id="display">${fmt(s.entry) || '？'}</div>
            <div class="pad${padKeys(s.id).length ? ' wide' : ''}">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, ...padKeys(s.id)].map(k => `<button data-key="${k}" type="button">${k}</button>`).join('')}
              <button data-key="del" type="button" aria-label="ひとつ けす">←</button>
              <button class="ok" data-key="ok" type="button">こたえる</button></div></div>`;
      const hints = (it.hints || []).slice(0, s.hints).map((h, i) => `<div class="hint" data-n="${i + 1}">${fmtLinks(h)}</div>`).join('');
      body = `${fig}${input}<div class="feedback" id="fb"></div><div class="hints">${hints}</div>
        <div class="actions">${s.hints < 3 ? `<button class="pill" data-act="hint" type="button">ヒント ${s.hints + 1} / 3</button>` : ''}${dk}</div>`;
    }
    el.innerHTML = steps() + `<article class="card" id="card" data-qid="${esc(it.qid || '')}">
      <span class="part">${esc(it.part === '離' ? '腕だめし' : it.part)}${tierHtml(it)}</span>${s.type === 'ri' && s.groupLabel ? `<span class="ri-scope">${esc(s.groupLabel)}</span>` : ''}${kindsHtml(it, u.stage <= 2)}<p class="q">${fmt(it.text)}</p>${body}${parentHtml(it)}</article>`;
    figMath(el);
    tick();
  }
  function submit(val) {
    const s = session, it = s.items[s.idx];
    if (s.solved || val === '') return;
    s.tries++;
    if (isRight(it, val)) {
      s.solved = true;
      s.results[s.idx] = outcome(s, it); freeze(s);
      noteItem(it, s.results[s.idx]); persist();
      Music.good(s.idx);
      drawItem();
    } else {
      Music.miss();
      s.entry = '';
      const card = $('#card'), fb = $('#fb'), disp = $('#display');
      if (disp) disp.textContent = '？';
      fb.textContent = s.tries >= 2 && s.hints < 3 ? 'ヒントを みてみよう。' : 'おしい！ もう いちど かんがえてみよう。';
      card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
    }
  }
  function advance(skipped) {
    const s = session, it = s.items[s.idx];
    if (it.part === '見本') s.results[s.idx] = null;
    else if (skipped) { s.results[s.idx] = outcome(s, it, { first: false, skipped: true }); noteItem(it, s.results[s.idx]); persist(); }
    Object.assign(s, { idx: s.idx + 1, entry: '', hints: 0, tries: 0, solved: false, run: false, el: 0, t0: 0, paused: false, dunno: false, dk: null });
    drawItem();
  }
  function drawFinish() {
    const s = session, u = UNITS[s.id], d = u.days[s.n - 1], el = $('#play');
    if (s.type === 'ri') {
      // 腕だめし：判定はしない。星を見せる
      const res = s.results.filter(Boolean), got = res.map(x => x.skipped ? 0 : x.first ? 3 : !x.hints && !x.dunno ? 2 : 1);
      Music.melody(res); s.melody = res;
      const rest = s.items.slice(s.start || 0), groupStars = rest.reduce((a, it) => a + riStar(it), 0);
      el.innerHTML = `<article class="card finish"><span class="part">腕だめし${tierHtml({ part: '離' })}</span>
        <h1>${got.length && got.every(x => x === 3) ? 'みごと！' : 'よく いどんだね！'}</h1>
        <div class="ri-got">${got.map(starsHtml).join('')}</div>
        <p class="muted">${esc(u.title)}の腕だめし${s.groupLabel ? '（' + esc(s.groupLabel) + '）' : ''} ★ ${groupStars} / ${rest.length * 3}</p>
        <div class="actions"><button class="pill" data-act="replay" type="button">もう一度きく</button>
          <a class="pill" href="#/unit/${s.id}">単元へ</a><a class="pill solid" href="#/">地図へ</a></div></article>`;
      return;
    }
    if (s.type === 'look') {
      // ふりかえり：判定はしない。今日の課題から外し、もとの問題があればもどる
      const W = words(s.id);
      progress.asks = (progress.asks || []).filter(a => a.u !== s.id);
      (progress.askDone || (progress.askDone = {}))[s.id] = Date.now(); persist();
      Music.melody(s.results.filter(Boolean));
      el.innerHTML = `<article class="card finish"><span class="part">ふりかえり</span><h1>${W.done}</h1>
        <p class="score">${esc(u.title)}</p>
        <div class="actions">${s.back ? `<button class="pill solid" data-act="back" type="button">${W.ret}</button>`
          : `<a class="pill" href="#/unit/${s.id}">単元へ</a><a class="pill solid" href="#/">地図へ</a>`}</div></article>`;
      return;
    }
    const res = s.results.filter(Boolean), firsts = res.filter(r => r.first).length;
    const overN = res.filter(x => x.over).length, dunN = res.filter(x => x.dunno).length;
    const rate = res.length ? firsts / res.length : 1, r = rec(s.id), today = localDate(), before = satisfied();
    let title = 'きょうの みちすじ、できた！', note = 'たどった みちすじが、メロディに なりました。';
    if (s.type === 'review') {
      const v = r.review || (r.review = { step: 0, fails: 0 });
      if (firsts === res.length) {
        v.fails = 0; v.step = (v.step || 0) + 1;
        if (v.step >= RULE.intervals.length) { v.complete = true; title = 'しっかり 身に ついた！'; note = 'この単元は定着しました。'; }
        else { v.due = addDays(RULE.intervals[v.step]); title = 'おぼえて いた！'; note = `次は ${v.due} に確かめます。`; }
      } else {
        v.fails = (v.fails || 0) + 1; v.due = addDays(1);
        if (v.fails >= 2) { v.lapsed = true; title = 'もう一度 ふりかえろう'; note = 'この単元は「復習」に戻りました。確認の日をもう一度ためしましょう。'; }
        else { title = 'あと すこし！'; note = 'あした、もう一度確かめます。'; }
      }
    } else if (s.type === 'extra') {
      r.extra[s.n] = (r.extra[s.n] || 0) + 1;
      if (rate >= RULE.low) {
        r.pending = null; r.low = 0; title = 'おさらい、できた！';
        note = d.kind === '確認' ? 'もう一度、確認の日にためしましょう。' : '次の日へ進みます。';
      } else if ((r.low = (r.low || 0) + 1) >= 2) {
        r.pending = null; title = 'よく がんばった！';
        note = u.needs.length ? `前の単元（${u.needs.map(x => UNITS[x].title).join('、')}）をふりかえってみましょう。` : '少し日をおいて、またためしましょう。';
      } else { title = 'おさらい、できた！'; note = 'もう 1 日、おさらいをしましょう。'; }
    } else {
      r.days[s.n] = { date: today, first: firsts, total: res.length, hints: res.reduce((a, x) => a + x.hints, 0), key: d.key, ...(overN ? { over: overN } : {}), ...(dunN ? { dunno: dunN } : {}) };
      if (d.kind === '確認') {
        if (rate >= RULE.pass) {
          r.done = today; r.pending = null; r.low = 0; r.ver = u.ver;
          r.review = { step: 0, due: addDays(RULE.intervals[0]), fails: 0 };
          title = 'この単元を クリア！'; note = 'あした、1 週後、1 か月後に、2 問ずつ確かめます。';
        } else { r.pending = s.n; title = 'あと すこし！'; note = '8 割で通過です。おさらいの日をはさんでから、もう一度ためしましょう。'; }
      } else if (rate < RULE.low) {
        r.pending = s.n; r.low = 1; note = '次は、同じ型のおさらいの日です。';
      } else {
        r.low = 0;
        const prev = r.days[s.n - 1], next = u.days[s.n];
        if (rate >= RULE.high && prev && prev.total && prev.first / prev.total >= RULE.high && next && next.kind === '練習' && !r.days[s.n + 1]) {
          if (!r.skip.includes(s.n + 1)) r.skip.push(s.n + 1);
          note = `とてもよくできたので、${s.n + 1} 日目の練習はとばして先へ進みます。`;
        }
      }
    }
    const lg = progress.log || (progress.log = {});
    (lg[today] || (lg[today] = { n: 0, ok: 0, sec: 0, days: 0 })).days++;
    persist();
    Music.melody(res);
    s.melody = res;
    // この単元で新しく届いた論題（済んだ単元の組み合わせでできるようになったこと）
    const gained = [...satisfied()].filter(k => !before.has(k)).map(k => {
      const [gid, iid] = k.split(':'), g = GOALS.find(x => x.id === gid);
      return `${g.name}「${g.items.find(i => i.id === iid).topic}」`;
    });
    if (gained.length) note += `<br><b>届いた論題</b> ${gained.slice(0, 6).map(esc).join('、')}${gained.length > 6 ? `、ほか ${gained.length - 6}` : ''}`;
    const label = s.type === 'review' ? '確かめ' : s.type === 'extra' ? 'おさらい' : d.kind;
    el.innerHTML = `<article class="card finish">
      <span class="part">${esc(label)}</span>
      <h1>${title}</h1>
      <p class="score">${res.length} 問のうち、ヒントなしで一度にできたのは ${firsts} 問。</p>
      ${overN || dunN ? `<p class="note2">${overN ? `<span class="tag slow" title="一度にできた数には入れません">⏱ 目安すぎ ${overN}</span>` : ''}${dunN ? `<span class="tag">？ わからない ${dunN}</span>` : ''}</p>` : ''}
      <div class="line">${res.map((x, i) => (i ? '<i></i>' : '') + `<b class="${x.first ? 'ok' : slow(x) ? 'slow' : 'help'}"></b>`).join('')}</div>
      <p class="muted">${note}</p>
      <div class="actions">
        <button class="pill" data-act="replay" type="button">もう一度きく</button>
        <a class="pill" href="#/unit/${s.id}">単元へ</a>
        <a class="pill solid" href="#/">地図へ</a>
      </div></article>`;
  }

  // ---- 操作 ----
  $('#view').addEventListener('click', e => {
    const gk = e.target.closest('[data-goalkind]');
    if (gk) { prefs.goalKind = gk.dataset.goalkind; save(PREF, prefs); Music.tap(); render(); return; }
    const rg = e.target.closest('[data-rigroup]');
    if (rg) { prefs.riGroup = rg.dataset.rigroup; save(PREF, prefs); Music.tap(); render(); return; }
    const g = e.target.closest('[data-goal]');
    if (g) {
      prefs.goal = g.dataset.goal; X.sel = null; X.pair = null; CARD = '';  // 目標が変わると星の選択は外す（前の目標の鎖を残さない）
      if (GOAL_SETS[prefs.goal]) prefs.goalKind = GOALS.find(x => x.id === prefs.goal).kind;
      save(PREF, prefs); Music.tap();
      if (g.dataset.go && location.hash !== g.dataset.go) location.hash = g.dataset.go; else render();
      return;
    }
    if (!session) return;
    const t = e.target.closest('[data-act], [data-choice], [data-key]');
    if (!t) return;
    const s = session;
    if (t.dataset.choice !== undefined) return submit(t.dataset.choice);
    if (t.dataset.key !== undefined) {
      const k = t.dataset.key;
      if (k === 'ok') return submit(s.entry);
      Music.tap();
      s.entry = k === 'del' ? s.entry.slice(0, -1) : (s.entry + k).slice(0, padMax(s.id));
      const disp = $('#display');
      if (disp) disp.innerHTML = fmt(s.entry) || '？';
      return;
    }
    const act = t.dataset.act;
    if (act === 'hint') { s.hints = Math.min(3, s.hints + 1); Music.hint(); drawItem(); }
    if (act === 'said') {
      s.solved = true; s.tries = 1;
      s.results[s.idx] = outcome(s, s.items[s.idx]); freeze(s);
      noteItem(s.items[s.idx], s.results[s.idx]); persist();
      Music.good(s.idx); drawItem();
    }
    if (act === 'next') { Music.tap(); advance(false); }
    if (act === 'skip') advance(true);
    if (act === 'replay') Music.melody(s.melody || []);
    // わからない（D-045）
    const it = s.items[s.idx];
    if (act === 'dunno') {
      s.dunno = true; freeze(s); Music.hint();
      if (it.part === '見本') dkOffer(s, it, 'mean'); else s.dk = { step: 'what' };
      drawItem();
    }
    if (act === 'dk') { if (t.dataset.w === 'mid') s.dk = { step: 'path', i: 0 }; else dkOffer(s, it, t.dataset.w); Music.tap(); drawItem(); }
    if (act === 'dk-yes') { s.dk.i++; if (s.dk.i >= ((it.paths || [])[0] || []).length - 1) s.dk = { step: 'allok' }; Music.tap(); drawItem(); }
    if (act === 'dk-no') { dkOffer(s, it, 'mid', s.dk.i); Music.hint(); drawItem(); }
    if (act === 'dk-close') { s.dk = null; Music.tap(); drawItem(); }
    if (act === 'look-later') { addAsk(s, t.dataset.u, +t.dataset.day); Music.tap(); drawItem(); }
    if (act === 'look-now') { addAsk(s, t.dataset.u, +t.dataset.day); startLook(t.dataset.u, +t.dataset.day, s); }
    if (act === 'back') endLook();
  });
  document.addEventListener('keydown', e => {
    if (!session || session.solved || session.dk || $('#menu').open) return;
    const it = session.items[session.idx];
    if (!it || it.part === '見本' || it.choices) return;
    const k = e.key === '-' ? '−' : e.key;
    if (/^\d$/.test(k) || padKeys(session.id).includes(k)) { session.entry = (session.entry + k).slice(0, padMax(session.id)); }
    else if (e.key === 'Backspace') { session.entry = session.entry.slice(0, -1); }
    else if (e.key === 'Enter') { return submit(session.entry); }
    else return;
    const disp = $('#display');
    if (disp) disp.innerHTML = fmt(session.entry) || '？';
  });
  document.addEventListener('pointerdown', () => Music.unlock());
  document.addEventListener('click', e => { if (e.target.closest('a[href^="#"], .icon')) Music.tap(); });

  const btnMusic = $('#btn-music'), btnParent = $('#btn-parent');
  const sync = () => { btnMusic.setAttribute('aria-pressed', prefs.music); btnParent.setAttribute('aria-pressed', prefs.parent); };
  btnMusic.addEventListener('click', () => { prefs.music = !prefs.music; Music.set(prefs.music); save(PREF, prefs); sync(); });
  btnParent.addEventListener('click', () => { prefs.parent = !prefs.parent; save(PREF, prefs); sync(); if (session) drawItem(); });
  $('#btn-today').addEventListener('click', () => {
    const o = options()[0];
    location.hash = o ? o.href : '#/';
  });
  const menu = $('#menu');
  $('#btn-menu').addEventListener('click', () => menu.showModal());
  // だれの記録か（D-044）：人を切り替える、足す、呼び名を変える
  const who = () => store.profiles[store.current];
  const tomb = pid => { (store.deleted || (store.deleted = {}))[pid] = localDate(); };
  function useProfile(pid) {
    store.current = pid; progress = store.profiles[pid].rec; persist();
    syncWho(); render();
  }
  function syncWho() {
    const b = $('#btn-who');
    if (b) { b.textContent = who().name; b.hidden = Object.keys(store.profiles).length < 2 && who().name === '1 人目'; }
    const list = $('#who-list');
    if (list) list.innerHTML = Object.entries(store.profiles).map(([pid, pr]) =>
      `<button type="button" class="pill" data-who="${esc(pid)}" aria-pressed="${pid === store.current}">${esc(pr.name)}</button>`).join('');
  }
  $('#btn-who').addEventListener('click', () => { syncWho(); menu.showModal(); });
  $('#btn-menu').addEventListener('click', syncWho);
  $('#who-list').addEventListener('click', e => { const b = e.target.closest('[data-who]'); if (b && b.dataset.who !== store.current) useProfile(b.dataset.who); });
  $('#btn-who-add').addEventListener('click', () => {
    const name = (prompt('呼び名（この端末の中だけで使います）', '') || '').trim();
    if (!name) return;
    const pid = newPid();
    store.profiles[pid] = newProfile(name); useProfile(pid);
  });
  $('#btn-who-rename').addEventListener('click', () => {
    const name = (prompt('新しい呼び名', who().name) || '').trim();
    if (name) { who().name = name; who().named = Date.now(); persist(); syncWho(); }
  });
  // 書き出し：いまの人の記録だけ。形の版（schema）と、書き出したときの地図の単元の数を付ける
  $('#btn-export').addEventListener('click', () => {
    const body = { kind: 'michisuji-record', schema: 2, name: who().name, exported: localDate(), units: R.units.length, rec: progress };
    const blob = new Blob([JSON.stringify(body, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `michisuji-${who().name.replace(/[\\/:*?"<>|\s]+/g, '_')}-${localDate()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  // 読み込み：人ごとの記録（版 2）、端末の記録全体、前の形（1 人分の units）のどれでも読む
  $('#file-import').addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const v = JSON.parse(await f.text());
      const got = v && v.kind === 'michisuji-record' && v.rec ? [[v.name || '読み込んだ記録', v.rec]]
        : v && v.schema === 2 && v.profiles ? Object.values(v.profiles).map(pr => [pr.name, pr.rec])
        : v && typeof v.units === 'object' ? [['読み込んだ記録', { units: v.units, items: {} }]] : null;
      if (!got) throw new Error('形が違う');
      let last = null;
      got.forEach(([name, rec]) => {
        migrate(rec);
        const same = Object.entries(store.profiles).find(([, pr]) => pr.name === name);
        if (same && confirm(`「${name}」の記録を、読み込んだ記録で置き換えますか（キャンセルなら、別の人として足します）`)) {
          // 置き換えは、前の記号を消した印にして新しい記号で入れる（ドライブの前の記録と混ざらないように）
          tomb(same[0]); delete store.profiles[same[0]];
          const pid = newPid(); store.profiles[pid] = newProfile(name, rec); last = pid; return;
        }
        const pid = newPid();
        store.profiles[pid] = newProfile(same ? name + '（読み込み）' : name, rec); last = pid;
      });
      menu.close(); e.target.value = '';
      useProfile(last);
    } catch (err) { alert('読み込めませんでした（' + err.message + '）'); }
  });
  // 消す：いまの人の記録だけ。ほかに人がいれば、その人を消す（1 人だけなら記録を空にする）
  $('#btn-reset').addEventListener('click', () => {
    const others = Object.keys(store.profiles).filter(pid => pid !== store.current);
    if (!confirm(`「${who().name}」の記録を消します。よろしいですか。`)) return;
    // 消した人の記号を残し、ドライブと合わせても戻らないようにする。1 人だけなら、同じ呼び名で新しい記号の人にする
    const name = who().name;
    tomb(store.current); delete store.profiles[store.current]; menu.close();
    if (others.length) useProfile(others[0]);
    else { const pid = newPid(); store.profiles[pid] = newProfile(name); useProfile(pid); }
  });
  // ---- Google ドライブと合わせる（D-049） ----
  // ログインした人の Google ドライブの、このページ専用の隠しフォルダに、端末の記録全体（人ごとの記録の束）を置く。
  // 合わせるときは、ドライブの記録と端末の記録を合わせて、進んだほうを残す。こちらのサーバは使わない（R-23）。
  // クライアント ID は index.html の meta に書く。空なら、この欄は出さない
  const CLIENT_ID = (document.querySelector('meta[name="google-client-id"]') || {}).content || '';
  // 共有された記録を選ぶ Google のファイル選び（Picker）の鍵と、Google Cloud のプロジェクトの番号（クライアント ID の頭）
  const API_KEY = (document.querySelector('meta[name="google-api-key"]') || {}).content || '', APP_ID = CLIENT_ID.split('-')[0];
  // ログインを保つサーバ（D-058）。空なら、ログインは約 1 時間で切れる
  const AUTH_URL = (document.querySelector('meta[name="michisuji-auth"]') || {}).content || '';
  // 前のファイルでは人が混ざったので（D-051）、ファイルを新しくし、すべての端末で一度ログインし直してもらう
  const DRIVE_KEY = 'michisuji.drive.v2';
  const drive = Object.assign({ on: false, at: '', who: '' }, load(DRIVE_KEY, {}));
  let driveTimer = 0, driveBusy = false, driveAgain = false, driveState = drive.on ? 'wait' : 'off';  // off、ok、wait、offline、need、err
  let askedLogin = false;  // ログインの窓を出したか（開いているあいだに 1 度だけ、D-059）
  const lastDay = r => Object.values((r && r.days) || {}).reduce((a, v) => v && v.date > a ? v.date : a, '');
  const newer = (p, q) => ((p && p.date) || '') >= ((q && q.date) || '') ? p : q;
  function keys2(a, b, f) {
    const o = {};
    new Set([...Object.keys(a || {}), ...Object.keys(b || {})]).forEach(k => { const v = f((a || {})[k], (b || {})[k]); if (v !== undefined) o[k] = v; });
    return o;
  }
  // 確かめの進み：段の進んだほう。同じ段なら、復習に戻ったほう、次の日付の遅いほう
  function mergeReview(p, q) {
    if (!p || !q) return p || q;
    const sc = v => (v.complete ? 100 : 0) + (v.step || 0) * 2 + (v.lapsed ? 1 : 0);
    return sc(p) !== sc(q) ? (sc(p) > sc(q) ? p : q) : ((p.due || '') >= (q.due || '') ? p : q);
  }
  // 単元：日は両方を合わせ（同じ日は新しいほう）、とばした日も合わせ、済は早いほうの日付。ほかは最近やったほうの記録
  function mergeUnit(p, q) {
    if (!p || !q) return p || q;
    const o = { ...(lastDay(p) >= lastDay(q) ? p : q) };
    o.days = keys2(p.days, q.days, (a, b) => !a || !b ? a || b : newer(a, b));
    o.extra = keys2(p.extra, q.extra, (a, b) => Math.max(a || 0, b || 0));
    o.skip = [...new Set([...(p.skip || []), ...(q.skip || [])])];
    o.done = p.done && q.done ? (p.done <= q.done ? p.done : q.done) : p.done || q.done;
    if (o.done) { o.pending = null; o.ver = p.done && (!q.done || p.done <= q.done) ? p.ver : q.ver; }
    const rv = mergeReview(p.review, q.review);
    if (rv) o.review = rv;
    return o;
  }
  // 問題：数は大きいほう（同じ記録から伸びたものなので足さない）、ほかは最後に解いたほう
  const ITEM_MAX = ['n', 'ok', 'h', 'w', 's', 'd', 'o', 'star'];
  function mergeItem(p, q) {
    if (!p || !q) return p || q;
    const o = { ...((p.last || '') >= (q.last || '') ? p : q) };
    ITEM_MAX.forEach(k => { const v = Math.max(p[k] || 0, q[k] || 0); if (v) o[k] = v; });
    return o;
  }
  function mergeRec(x, y) {
    x = x || {}; y = y || {};
    const askDone = keys2(x.askDone, y.askDone, (a, b) => Math.max(a || 0, b || 0));
    const asks = [];
    [...(x.asks || []), ...(y.asks || [])].forEach(a => {
      if (!asks.some(b => b.u === a.u) && !(askDone[a.u] >= (a.t || 0) && a.t)) asks.push(a);
    });
    return { ...y, ...x,
      units: keys2(x.units, y.units, mergeUnit),
      items: keys2(x.items, y.items, mergeItem),
      log: keys2(x.log, y.log, (p, q) => !p || !q ? p || q : { n: Math.max(p.n, q.n), ok: Math.max(p.ok, q.ok), sec: Math.max(p.sec, q.sec), days: Math.max(p.days, q.days) }),
      asks, askDone };
  }
  // 端末の記録全体（D-051）：人は、記号（pid）が同じか、記号が違っても呼び名が同じなら、同じ人として合わせる。
  // 呼び名で合わせたときは、どの端末でも同じになるよう記号の小さいほうを残す。消した人の記号（deleted）は戻さない。呼び名は後で付けたほう
  function mergeProfile(x, y) {
    return { name: (y.named || 0) > (x.named || 0) ? y.name : x.name, named: Math.max(x.named || 0, y.named || 0),
      created: (x.created || '') <= (y.created || '') ? x.created : y.created, rec: mergeRec(x.rec, y.rec) };
  }
  function mergeStore(a, b) {
    const deleted = { ...(b.deleted || {}), ...(a.deleted || {}) }, profiles = {}, alias = {};
    const live = s => Object.entries(s.profiles || {}).filter(([k]) => !deleted[k]);
    // 新しい端末で最初にできる空の「1 人目」は、相手に人がいれば足さない（D-052）
    const blank = pr => pr.name === '1 人目' && !Object.keys((pr.rec && pr.rec.units) || {}).length && !Object.keys((pr.rec && pr.rec.items) || {}).length;
    const LA0 = live(a), LB0 = live(b), LA = LB0.length ? LA0.filter(([, x]) => !blank(x)) : LA0, LB = LA.length ? LB0.filter(([, y]) => !blank(y)) : LB0;
    const restA = [], takenB = new Set();
    LA.forEach(([pa, x]) => {
      const y = (b.profiles || {})[pa];
      if (y && LB.some(([pb]) => pb === pa)) { profiles[pa] = mergeProfile(x, y); takenB.add(pa); } else restA.push([pa, x]);
    });
    const restB = LB.filter(([pb]) => !takenB.has(pb));
    restA.forEach(([pa, x]) => {
      const i = restB.findIndex(([, y]) => y.name === x.name);
      if (i < 0) { profiles[pa] = mergeProfile(x, x); return; }
      const [pb, y] = restB.splice(i, 1)[0], id = pa < pb ? pa : pb;
      profiles[id] = mergeProfile(x, y); alias[pa] = alias[pb] = id;
    });
    restB.forEach(([pb, y]) => { profiles[pb] = mergeProfile(y, y); });  // 片方にしかいない人も、同じ形にそろえる
    if (!Object.keys(profiles).length) profiles[newPid()] = newProfile('1 人目');
    Object.values(profiles).forEach(pr => migrate(pr.rec));
    const cur = alias[a.current] || a.current;
    return { schema: 2, current: profiles[cur] ? cur : Object.keys(profiles)[0], profiles, deleted };
  }
  function driveChip() {
    const b = $('#btn-sync');
    if (b) {
      b.hidden = !CLIENT_ID || !drive.on;
      b.dataset.s = driveState;
      // 言葉は保存にそろえる（D-057、施主「ドライブという言い方がわかりにくい」）。ログインはログインと言う（D-059）
      const t = b.querySelector('.t');
      if (t) t.textContent = { ok: '保存済み', wait: '保存中', offline: '保存待ち', need: 'ログイン', err: '未保存' }[driveState] || '保存';
      b.title = { ok: '保存済み（どの端末でも開けます）', wait: '保存の途中です', offline: 'つながったら保存します',
        need: 'ログインが切れました。押すとログインして保存します', err: '保存できませんでした。押すともう一度保存します' }[driveState] || '';
    }
    const st = $('#drive-status');
    if (st) st.textContent = !drive.on ? 'この端末だけに保存'
      : [drive.who, drive.at && drive.at + ' に保存', DriveSync.linked && '家族と共有中', driveState === 'offline' && 'つながったら保存します',
        driveState === 'need' && 'ログインし直してください', driveState === 'err' && '保存できませんでした'].filter(Boolean).join('・');
    const show = showEl;
    show('#btn-drive-in', !drive.on || driveState === 'need');
    show('#btn-drive-take', !drive.on);
    show('#btn-drive-now', drive.on && driveState !== 'need');
    show('#btn-drive-out', drive.on);
    familyChip();
    askLogin();
  }
  // ログインが切れていて電波があるときは、ログインの窓を自動で出す（D-059、施主「オンラインなのにつながってなかったら自動でログイン画面」）。
  // Google の窓は押したときしか開けない（ブラウザが止める）ので、この窓のボタンを 1 回押してもらう。
  // 開いているあいだに 1 度だけ。問題を解いている途中と、ほかの窓が開いているときは出さず、あとで出す
  function askLogin() {
    if (askedLogin || driveState !== 'need' || !drive.on || navigator.onLine === false) return;
    if (['day', 'join'].includes(parse().name) || document.querySelector('dialog[open]')) return;
    askedLogin = true;
    let d = $('#login-sheet');
    if (!d) { d = document.createElement('dialog'); d.id = 'login-sheet'; d.className = 'sheet'; document.body.appendChild(d); }
    d.innerHTML = `<h2>ログインが切れました</h2>${drive.who ? `<p class="muted">${esc(drive.who)}</p>` : ''}
      <div class="row"><button class="pill solid" type="button" data-login>Google でログイン</button><button class="pill" type="button" data-sheetclose>あとで</button></div>`;
    d.onclick = e => {
      // 押したその場で Google の窓を開く（待つと、ブラウザが止める）
      if (e.target.closest('[data-login]')) { d.close(); driveSync(true); return; }
      if (e.target.closest('[data-sheetclose]') || e.target === d) d.close();
    };
    d.showModal();
  }
  const showEl = (id, on) => { const e = $(id); if (e) e.hidden = !on; };
  // ---- 家族と共有する（D-052） ----
  // 共有する人のドライブに見えるファイル「みちすじの記録」を作って相手に編集の権限を付け、相手は Google のファイル選びで一度選ぶ。
  // 以後は 2 人とも同じファイルを読み書きし、いつもの合わせ方で合わせる。こちらは預からない（R-23）
  let family = { members: [], gone: false };
  function familyChip() {
    const l = window.DriveSync && DriveSync.linked;
    showEl('#drive-family', drive.on);
    showEl('#btn-family-open', !!API_KEY && !l);
    showEl('#btn-family-leave', !!l || family.gone);
    const st = $('#family-status');
    if (!st) return;
    const others = family.members.filter(m => m.emailAddress !== drive.who).map(m => m.emailAddress);
    st.textContent = family.gone ? '共有の記録が開けません（持ち主が共有をやめたか、ファイルを消しました）'
      : !l ? 'まだ共有していません' : (l.mine ? '共有している人：' : '共有の記録を使っています：') + (others.join('、') || '—');
  }
  async function refreshFamily() {
    if (!window.DriveSync || !DriveSync.usable()) { familyChip(); return; }
    try { await DriveSync.readLink(); family.members = await DriveSync.members(); } catch { /* 出せなくても使える */ }
    familyChip();
  }
  // 共有する：まず自分のドライブと合わせ、合わせた記録で共有のファイルを作り（まだなら）、相手に編集の権限を付ける
  async function familyShare() {
    const inp = $('#family-email'), email = (inp.value || '').trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { alert('相手の Google アカウントのメールアドレスを入れてください'); return; }
    if (!(await fileConsent())) return;
    await driveSync(true);
    if (driveState !== 'ok' || driveBusy) return;
    driveBusy = true;
    try {
      await DriveSync.share(email, store);
      inp.value = ''; family.gone = false;
      alert(`${email} と共有しました。相手に Google からお知らせが届きます。`);
    } catch (err) { alert(err.code === 'scope' ? NO_FILE : '共有できませんでした（' + err.message + '）'); }
    finally { driveBusy = false; }
    await refreshFamily(); driveChip();
  }
  // ファイルの権限の入った鍵を用意する（押したその場で Google の窓を開く。iPhone でも開けるように、ほかを待たずに呼ぶ）
  const NO_FILE = 'ファイルの権限が許可されていません。もう一度押し、Google の確認で、ドライブのファイルの項目を許可してください。';
  async function fileConsent() {
    if (!window.DriveSync || !DriveSync.ready) return false;
    if (DriveSync.needsConsent()) {
      try { await DriveSync.signIn(); } catch (err) { if (err.code !== 'popup_closed') alert('ログインできませんでした（' + err.message + '）'); return false; }
    }
    if (!DriveSync.hasFile()) { alert(NO_FILE); return false; }
    return true;
  }
  // 共有された記録を開く：Google のファイル選びで「みちすじの記録」を選び、この端末の記録と合わせる
  async function familyOpen() {
    if (!API_KEY || !window.DriveSync || driveBusy) return;
    let id = null;
    if (!(await fileConsent())) return;
    driveBusy = true;
    try {
      id = await DriveSync.pick(API_KEY, APP_ID);
    } catch (err) { if (err.code !== 'popup_closed') alert(err.code === 'scope' ? NO_FILE : '開けませんでした（' + err.message + '）'); }
    finally { driveBusy = false; }
    if (!id) return;
    family.gone = false;
    await driveSync(true);
    await refreshFamily();
  }
  // 共有の専用のリンク（#/join/<ファイル>、D-054）：ボタン 1 つで、ログインし、そのファイルだけが並ぶ Google の窓で選ぶ
  function viewJoin(id) {
    const l = window.DriveSync && DriveSync.linked, done = l && l.fileId === id;
    return `<section class="join"><article class="card join-card">
      <div class="join-ic">${'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm10 2a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM2 20c.5-3.6 2.4-5.5 5-5.5s4.5 1.9 5 5.5M13.5 20c.4-2.4 1.6-3.7 3.5-3.7s3.1 1.3 3.5 3.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'}</div>
      <h1>${done ? '共有の記録を開いています' : '家族から、みちすじの記録が共有されました'}</h1>
      ${done ? '<a class="pill solid big" href="#/">地図へ</a>'
        : CLIENT_ID && API_KEY ? '<button class="pill solid big" id="btn-join" type="button">記録を開く</button>' : '<p class="muted">この画面では、まだ開けません。</p>'}
    </article></section>`;
  }
  async function joinOpen(id) {
    if (!API_KEY || !window.DriveSync || driveBusy) return;
    if (!(await fileConsent())) return;
    let got = null;
    driveBusy = true;
    try { got = await DriveSync.pick(API_KEY, APP_ID, id); }
    catch (err) { if (err.code !== 'popup_closed') alert(err.code === 'scope' ? NO_FILE : '開けませんでした（' + err.message + '）'); }
    finally { driveBusy = false; }
    if (!got) return;
    family.gone = false;
    await driveSync(true);
    await refreshFamily();
    if (driveState === 'ok') location.hash = '#/';
  }
  // 共有をやめる：自分のドライブの記録に戻る（共有のファイルはそのまま残る）
  async function familyLeave() {
    if (!window.DriveSync || driveBusy) return;
    if (!confirm('共有をやめて、自分だけの記録に戻ります。共有の記録はそのまま残ります。')) return;
    driveBusy = true;
    try {
      if (!DriveSync.usable()) await DriveSync.signIn();
      await DriveSync.leave(); family = { members: [], gone: false };
    } catch (err) { if (err.code !== 'popup_closed') alert('やめられませんでした（' + err.message + '）'); }
    finally { driveBusy = false; }
    await driveSync(true);
    familyChip();
  }
  // 中身が同じかを比べる：キーの並びをそろえ、どの人を選んでいるか（端末ごとに違う）は除く
  const canon = s => JSON.stringify(s, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(x => [x, v[x]])) : v);
  const sameStore = (a, b) => !!a && !!b && canon({ ...a, current: 0 }) === canon({ ...b, current: 0 });
  // 合わせる：ドライブから読み、端末の記録と合わせ、合わせたものを端末とドライブの両方に置く。
  // interactive は、ボタンを押したとき（ログインが切れていれば Google の確認の窓を開く）
  async function driveSync(interactive) {
    if (!CLIENT_ID || !window.DriveSync) return;
    if (driveBusy) { driveAgain = true; return; }
    if (interactive) askedLogin = true;  // 自分で押したら、ログインの窓は出さない（Google の窓を閉じたときなど）
    driveBusy = true;
    try {
      if (!DriveSync.ready) await DriveSync.init(CLIENT_ID, AUTH_URL);
      if (!DriveSync.usable()) {
        if (!interactive) { driveState = 'need'; return; }
        await DriveSync.signIn();
      }
      // 変わったかどうかは、並び順をそろえて比べる（合わせると並び順だけが変わることがあり、そのたびに描き直さないように）
      const remote = await DriveSync.pull(), before = canon(store);
      if (remote && remote.schema === 2 && remote.profiles) {
        store = mergeStore(store, remote);
        progress = store.profiles[store.current].rec;
        save(STORE_KEY, store);
      }
      // ドライブの中身と同じなら書き戻さない（1 分ごとに読みにいくので、D-056）
      // ドライブの中身も同じ合わせ方で形をそろえてから比べる（形だけの違いで書き戻さないように）
      if (!remote || !remote.profiles || !sameStore(store, mergeStore(remote, remote))) await DriveSync.push(store);
      if (!drive.who) { const u = await DriveSync.who(); if (u) drive.who = u.emailAddress || u.displayName || ''; }
      drive.on = true; drive.at = new Date().toLocaleString('sv-SE').slice(0, 16); save(DRIVE_KEY, drive);
      driveState = 'ok';
      if (canon(store) !== before) { syncWho(); refresh(); }
    } catch (err) {
      if (err.code === 'popup_closed') driveState = drive.on ? 'need' : 'off';
      // 電波がないときは、つながったら合わせる（下の online）。押したときだけ知らせる
      else if (err.code === 'offline') { driveState = drive.on ? 'offline' : 'off'; if (interactive) alert('つながっていません。つながったら保存します。'); }
      else if (err.code === 'gone') { family.gone = true; driveState = 'err'; }
      else {
        driveState = err.code === 'auth' || err.code === 'scope' ? 'need' : 'err';
        if (interactive && err.code !== 'auth') alert(err.code === 'scope' ? NO_FILE : '保存できませんでした（' + err.message + '）');
      }
    } finally {
      driveBusy = false; driveChip();
      if (driveAgain) { driveAgain = false; driveDirty(); }
    }
  }
  // ドライブの記録で置き換える（D-051）：この端末の記録は使わず、ドライブの記録をそのまま読み込む。
  // ログインを先にする（iPhone では、確認の窓のあとだと Google の窓を開けないことがある）
  async function driveTake() {
    if (!CLIENT_ID || !window.DriveSync || driveBusy) return;
    driveBusy = true;
    try {
      if (!DriveSync.ready) await DriveSync.init(CLIENT_ID, AUTH_URL);
      if (!DriveSync.usable()) await DriveSync.signIn();
      const remote = await DriveSync.pull();
      if (!remote || remote.schema !== 2 || !remote.profiles || !Object.keys(remote.profiles).length) {
        alert('保存してある記録がまだありません。先に、記録のある端末で「Google でログイン」を押してください。');
        return;
      }
      const names = Object.values(remote.profiles).map(pr => pr.name).join('、');
      if (!confirm(`この端末の記録を、保存してある記録（${names}）で置き換えます。この端末だけにある記録は消えます。`)) return;
      Object.values(remote.profiles).forEach(pr => migrate(pr.rec));
      if (!remote.profiles[remote.current]) remote.current = Object.keys(remote.profiles)[0];
      store = remote; progress = store.profiles[store.current].rec; save(STORE_KEY, store);
      if (!drive.who) { const u = await DriveSync.who(); if (u) drive.who = u.emailAddress || u.displayName || ''; }
      drive.on = true; drive.at = new Date().toLocaleString('sv-SE').slice(0, 16); save(DRIVE_KEY, drive);
      driveState = 'ok';
      syncWho(); if (parse().name !== 'day') render();
    } catch (err) {
      if (err.code !== 'popup_closed') alert('保存してある記録を読み込めませんでした（' + err.message + '）');
    } finally { driveBusy = false; driveChip(); }
  }
  // 記録を保存するたびに、少し待ってからドライブへ送る（続けて解いている間は、まとめて 1 回）
  function driveDirty() {
    if (!CLIENT_ID || !drive.on) return;
    if (driveState !== 'need') driveState = 'wait';
    clearTimeout(driveTimer);
    driveTimer = setTimeout(() => driveSync(false), 4000);
    driveChip();
  }
  if (CLIENT_ID) {
    const box = $('#drive-box');
    if (box) box.hidden = false;
    // Google のログインを先に読み込んでおく（押したその場で確認の窓を開けるように）
    if (window.DriveSync) DriveSync.init(CLIENT_ID, AUTH_URL).then(() => { if (drive.on) driveSync(false); })
      .catch(() => { if (drive.on) { driveState = navigator.onLine === false ? 'offline' : 'err'; driveChip(); } });
    const go = () => driveSync(true);
    $('#btn-sync').addEventListener('click', go);
    $('#btn-drive-in').addEventListener('click', go);
    $('#btn-drive-now').addEventListener('click', go);
    $('#btn-drive-take').addEventListener('click', driveTake);
    $('#btn-family-share').addEventListener('click', familyShare);
    $('#btn-family-open').addEventListener('click', familyOpen);
    $('#btn-family-leave').addEventListener('click', familyLeave);
    $('#btn-menu').addEventListener('click', refreshFamily);
    $('#btn-drive-out').addEventListener('click', () => {
      if (!confirm('この端末でログアウトします。記録はこの端末に残り、保存してある記録も消えません。ほかの端末はログインしたままです。')) return;
      DriveSync.signOut(); drive.on = false; drive.who = ''; save(DRIVE_KEY, drive); driveState = 'off'; driveChip();
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden && driveState === 'wait') { clearTimeout(driveTimer); driveSync(false); } });
    // 開いているあいだは 1 分ごとに、ほかのアプリやタブから戻ったときはすぐに、ドライブを読みにいく（D-056、施主「1 分とか」）。
    // 送る前の変更があるとき（wait）は、そちらの送りに任せる
    const drivePoll = () => { if (drive.on && !document.hidden && window.DriveSync && DriveSync.usable() && !driveBusy && driveState !== 'wait') driveSync(false); };
    setInterval(drivePoll, 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) drivePoll(); });
    // 電波が戻ったら、すぐに合わせる（D-058、施主「オンラインに戻ったら勝手につなぐぐらいでいい」）
    window.addEventListener('online', () => { if (drive.on && !driveBusy) { clearTimeout(driveTimer); driveSync(false); } });
    onPersist = driveDirty;
  }
  driveChip();

  syncWho();

  window.addEventListener('hashchange', render);
  window.addEventListener('hashchange', askLogin);  // 問題を解き終えて地図などに戻ったとき
  window.addEventListener('resize', () => { if (parse().name !== 'map') return; setBarH(); if (cosmos) cosmos.resize(); if (X.view === '2d') paint(); });

  Music.init(prefs.music);
  sync();
  render();
  // ホーム画面に置けるアプリ（PWA、D-049）：電波がなくても開けるように、開いたファイルをとっておく
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['127.0.0.1', 'localhost'].includes(location.hostname))) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* とっておけなくても画面は使える */ });
  }
})();
