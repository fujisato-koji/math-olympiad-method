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
  const STATUS_NAME = { done: '済', doing: 'いま', review: '復習', ready: '次にできる', later: 'まだ' };
  // 問題の量の決まり（R-33〜R-35）。値は仮の設計点で、記録を見て直す。
  // prior は係数の前置き（基本の日数を何日分混ぜるか）。済んだ単元が少ないうちに係数がぶれないようにする。
  const RULE = { low: .6, high: .9, pass: .8, intervals: [1, 7, 30], reviewItems: 2, reviewDay: .25, prior: 20 };

  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lc = id => `--c: var(--lane-${id})`;
  // 問題の文の数式の見せ方（D-042）：1 文字の小文字（x、a、n）は斜体のセリフ体にして × と見分け、
  // 3/4 や x/2 は分子と分母を上下に重ねる。数のすぐ後に空白をはさむ 1 文字（5 m、300 g）は単位とみて変えない。
  // 書き方（3/4、3x）は変えないので、答え合わせ、check の式、鍵盤はそのまま
  const FRAC = /(?<![\w.\/□])(\d+|[a-z]|□)\/(\d+|[a-z]|□)(?![\w.\/□])|[A-Za-z]+/g;
  function fmt(s) {
    s = String(s ?? '');
    const v = x => /^[a-z]$/.test(x) ? `<i class="v">${x}</i>` : esc(x);
    let out = '', last = 0, m;
    FRAC.lastIndex = 0;
    while ((m = FRAC.exec(s))) {
      out += esc(s.slice(last, m.index));
      if (m[1] !== undefined) out += `<span class="frac" role="math" aria-label="${esc(m[2])}ぶんの${esc(m[1])}"><span>${v(m[1])}</span><span>${v(m[2])}</span></span>`;
      else {
        const w = m[0], before = s.slice(Math.max(0, m.index - 2), m.index), after = s[m.index + w.length] || '';
        out += w.length === 1 && /[a-z]/.test(w) && !/\d\s$/.test(before) && after !== '/' && !before.endsWith('/') ? `<i class="v">${w}</i>` : esc(w);
      }
      last = FRAC.lastIndex;
    }
    return out + esc(s.slice(last));
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

  // ---- 記録（この端末のブラウザの中だけ） ----
  function load(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 保存できない環境でも表示は続ける */ } }
  let progress = load(KEY, null);
  if (!progress || typeof progress.units !== 'object') progress = { units: {} };
  // 記号の付け替え（N1-01 → N-001 など）の前に保存された記録を読み替える
  function migrate(p) {
    const ren = R.renamed || {};
    let moved = false;
    Object.keys(p.units).forEach(k => {
      if (ren[k] && !p.units[ren[k]]) { p.units[ren[k]] = p.units[k]; delete p.units[k]; moved = true; }
    });
    if (moved) save(KEY, p);
    return p;
  }
  progress = migrate(progress);
  // わけの深さ（D-016）。考え方の水準と同じ軸（D-028）
  const REASON = ['', '例で見せて口で言う', '代表の例で文に書く', '約束した定義と事実から筋道を立てて書く', '公理から体系として書く', '定義を選び直す'];
  const circled = n => '①②③④⑤'[n - 1] || '';
  const prefs = Object.assign({ music: true, parent: false, goal: 'all' }, load(PREF, {}));
  // 目標：網羅表が指す単元とその前提。'all' はすべての単元（大会のための単元も含む）
  const GOALS = R.goals || [];
  const GOAL_SETS = Object.fromEntries(GOALS.map(g => [g.id, new Set(g.units)]));
  if (prefs.goal !== 'all' && !GOAL_SETS[prefs.goal]) prefs.goal = 'all';
  const inGoal = id => prefs.goal === 'all' || GOAL_SETS[prefs.goal].has(id);
  // 選んで解く論題（選択科目）の駅：道のりには入らないが、関係図に薄く描く
  const CHOICE_SETS = Object.fromEntries(GOALS.map(g => [g.id, new Set(g.choiceUnits || [])]));
  const inChoice = id => prefs.goal !== 'all' && CHOICE_SETS[prefs.goal].has(id);
  // 論題に届いた＝その論題を受け持つ単元がすべて済
  const isDone = id => !!(progress.units[id] && progress.units[id].done);
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
    const bridge = BRIDGES.has(u.id) ? '<a class="pill rare" href="#/comb">橋の駅</a>' : '';
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
  // 近い目標：まだ届いていない目標のうち、論題の割合が高く、残りの駅が少ないもの。種類ごとに 1 つ
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
    return [...due, ...doing, ...ready];
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
    if (p[0] === 'goal' && GOAL_SETS[p[1]]) return { name: 'goal', goal: p[1] };
    if (p[0] === 'comb') return { name: 'comb' };
    return { name: 'map' };
  }
  function crumbs(r) {
    const parts = [['#/', '全体の地図']];
    if (r.name === 'goal') parts.push(['', '目標：' + GOALS.find(g => g.id === r.goal).name]);
    if (r.name === 'comb') parts.push(['', '組み合わせの層']);
    const lv = r.name === 'level' ? r.level : r.id ? UNITS[r.id].level : null;
    if (THINK[lv]) parts.push([`#/level/${lv}`, `水準 ${lv} ${THINK[lv].name}`]);
    if (r.id) parts.push([`#/unit/${r.id}`, UNITS[r.id].title]);
    if (r.name === 'day') parts.push(['', r.type === 'review' ? '確かめ' : r.type === 'extra' ? `${r.day} 日目のおさらい` : `${r.day} 日目`]);
    return parts.map(([href, t], i) => i === parts.length - 1
      ? `<span class="here">${esc(t)}</span>`
      : `<a href="${href}">${esc(t)}</a><span class="sep">›</span>`).join('');
  }

  let session = null;
  function render() {
    const r = parse(), view = $('#view');
    if (r.name !== 'day') session = null;
    Music.scene(r.name === 'day' ? 'play' : 'map');
    view.innerHTML = r.name === 'level' ? viewLevel(r.level)
      : r.name === 'unit' ? viewUnit(r.id)
      : r.name === 'day' ? viewDay(r.id, r.day, r.type)
      : r.name === 'goal' ? viewGoal(r.goal) : r.name === 'comb' ? viewComb() : viewMap();
    view.classList.remove('enter'); void view.offsetWidth; view.classList.add('enter');
    const ex = $('#explore');
    if (r.name === 'map') { ex.hidden = false; ex.innerHTML = exploreHtml(); mountExplore(); }
    else { ex.hidden = true; if (cosmos) cosmos.pause(); }
    $('#crumbs').innerHTML = crumbs(r);
    document.title = (r.name === 'map' ? '' : $('#crumbs .here').textContent + ' — ') + 'みちすじ';
    if (r.name === 'day') drawItem();
    window.scrollTo(0, 0);
  }

  // ---- 全体の地図 ----
  function viewMap() {
    const f = forecast(), opts = options(), kind = kindNow(), near = nearGoals(5);
    return `
    <section class="hero hero-rest">
      <div class="goal-pick levels" role="group" aria-label="考え方の水準"><span class="k">水準</span>${(R.levels || []).map(l => {
        const us = R.units.filter(u => u.level === l.id && inGoal(u.id));
        return `<a class="pill" href="#/level/${l.id}">${l.id} ${esc(l.name)}<span class="n">${us.filter(u => isDone(u.id)).length} / ${us.length}</span></a>`;
      }).join('')}</div>
      <div class="reach"><span class="k">近い目標</span>${near.list.map(([g, st]) =>
        `<a class="reach-item" href="#/goal/${g.id}"><span class="ring" style="--p:${st.pct}"></span>${esc(g.name)} ${st.pct}%<span class="muted">（論題 ${st.got} / ${st.topics}）</span></a>`).join('')}
        <span class="reach-item">届いた目標 ${near.reached} / ${GOALS.length}</span>
        <span class="reach-item">古今東西の問題 ${solvable()} / ${PROBS.length} 問<span class="muted">（済んだ駅だけで組み合わせがそろう問題）</span></span></div>
      <div class="gauge">
        <div><span class="k">基本</span><b>${f.base}</b><span class="u">日分</span></div>
        <div><span class="k">いまの見込み</span><b>残り 約 ${f.est}</b><span class="u">日</span></div>
        <p class="muted">見込みは、できぐあいに合わせて毎日計算し直します。</p>
      </div>
    </section>
    <section class="next">
      <h2>つぎの みちすじ</h2>
      <div class="next-list">${opts.map(o => `
        <a class="next-card" href="${o.href}" style="${lc(o.u.lane)}">
          <span class="dot ${status(o.u.id)}"></span>
          <span class="mode">${o.mode}・${esc(LANES[o.u.lane].name)}・${o.label}</span>
          <span class="t">${esc(o.u.title)}</span>
        </a>`).join('') || '<p class="muted">すべての駅を通りました。</p>'}
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
            <span class="goal-nums">論題 ${st.got} / ${st.topics}・駅 ${st.done} / ${st.units}・見込み 残り約 ${f.est} 日</span>
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
        <div class="xseg" role="group" aria-label="見方">
          <button type="button" data-mapcomb="0" aria-pressed="${!prefs.mapComb}" title="前提のつながり">前提</button>
          <button type="button" data-mapcomb="1" aria-pressed="${!!prefs.mapComb}" title="橋の星と、領域をまたぐ前提">橋</button>
        </div>
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
        <div class="cosmos-title"><div class="eyebrow">知の宇宙</div><p id="x-caption">${caption()}</p></div>
        <input class="cosmos-q" id="cosmos-q" type="search" placeholder="星をさがす（光合成、フーリエ、確率…）" autocomplete="off" aria-label="星をさがす">
      </div>
      ${barHtml()}
      <div class="xpop" id="xpop" hidden></div>
      <div class="cosmos-tip" id="cosmos-tip" hidden></div>
      <div class="cosmos-card" id="cosmos-card"${CARD ? '' : ' hidden'}>${CARD}</div>
      <div class="cosmos-hover" id="cosmos-hover" hidden></div>
      <button class="xdown" type="button" data-x="down">つぎのみちすじ ▾</button>
    </div>`;
  }
  const caption = () => X.view === '3d'
    ? `${R.units.length} の星。中心は数える・観る駅、外へ行くほど最前線、方角は分野。星を押すと、そこへ続く道が光ります。`
    : `${R.units.length} の駅。横は理解の深さ、縦は領域、上の目盛りは考え方の水準。駅を押すと鎖が光り、もう一度押すと駅に入ります。`;
  function syncBar() {
    const nav = $('.xbar');
    if (nav) nav.outerHTML = barHtml();
    const c = $('#cosmos'); if (c) c.dataset.view = X.view;
    const cap = $('#x-caption'); if (cap) cap.textContent = caption();
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
      cosmos.setStates(status);
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
    host.querySelectorAll('circle').forEach(c => {
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
        <a class="cpill solid" href="#/unit/${id}">駅をひらく</a>
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
      const el = $('#explore');
      if (document.fullscreenElement) document.exitFullscreen(); else if (el && el.requestFullscreen) el.requestFullscreen();
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
        <p class="muted">目標を選ぶと、その目標に要る星だけが星座のように残ります。3D でも 2D でも同じです。</p>
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
  document.addEventListener('fullscreenchange', () => { if (cosmos) cosmos.resize(); if (X.view === '2d' && parse().name === 'map') paint(); });

  // 平面の関係図（2D）：横は理解の深さ（前提の鎖の長さ）、縦は名前を付けた領域（D-019）
  function drawMap() {
    const host = $('#map');
    if (!host) return;
    // 目標を選んでいるときは、その目標の駅と、その駅がある島だけで描き直す（D-015）
    const grp = group()[2];
    const shown = id => inGoal(id) || inChoice(id);
    const shownRegions = (R.regions || []).filter(grp).filter(rg => R.units.some(u => u.region === rg.id && shown(u.id)));
    const shownIds = new Set(shownRegions.map(r => r.id));
    const shownUnits = R.units.filter(u => shownIds.has(u.region) && shown(u.id));
    if (!shownUnits.length) {
      host.innerHTML = `<p class="muted">${prefs.goal === 'all' ? 'この切り替えの駅はまだありません。' : 'この範囲には、選んでいる目標の駅がありません。範囲を「すべて」にすると見えます。'}</p>`;
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
    // 考え方の水準：描いている駅の深さの中央値を、水準ごとにおよその位置として上に置く
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
      return p ? `<circle class="${status(u.id)}${inGoal(u.id) ? '' : inChoice(u.id) ? ' choice' : ' off'}${BRIDGES.has(u.id) ? ' bridge' : ''}" data-u="${u.id}" cx="${p[0]}" cy="${p[1]}" r="6" style="${lc(u.lane)}"><title>${esc(u.id + ' ' + u.title)}</title></circle>` : '';
    }).join('') + '</g></svg>';
    host.innerHTML = svg;
    POS2D = pos;
    apply2D();
  }

  // ---- 組み合わせの層（D-031、D-035） ----
  // 地図のデータから出す 3 つ：橋の駅、単元の中で珍しい領域の組、古今東西の問題の中で少ない組・まだない組
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
      ${g ? `<p class="goal-banner">橋の駅は、目標「${esc(g.name)}」に要る駅だけです。<button class="pill" type="button" data-goal="all">すべての駅を見る</button></p>` : ''}
    </section>
    <section class="comb-sec">
      <h2>橋の駅 <span class="muted">${bridges.length}</span></h2>
      <p class="muted">直接の前提が、遠い領域を広く組み合わせる駅（広さ ${LAYER.cut} 以上、上位 1 割）と、珍しい組み合わせの駅。</p>
      <div class="station-list">${bridges.map(u => `<a class="station ${status(u.id)}" href="#/unit/${u.id}" style="${lc(u.lane)}">
        <span class="dot ${status(u.id)}"></span><span class="sid">${u.id}・水準 ${u.level}</span><span class="st">${esc(u.title)}</span>
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
  // 水準ごとに、流れの帯の中へ駅を前提の浅い順に並べる。いま進めている・次にできる駅のある流れを開いておく
  function viewLevel(n) {
    const s = THINK[n], g = GOALS.find(x => x.id === prefs.goal);
    const us = R.units.filter(u => u.level === n && inGoal(u.id)).sort(order);
    const lanes = LANE_ORDER.filter(l => us.some(u => u.lane === l)).map(l => {
      const ls = us.filter(u => u.lane === l), open = ls.some(u => ['doing', 'review', 'ready'].includes(status(u.id)));
      return `<details class="level-lane" style="${lc(l)}"${open ? ' open' : ''}>
        <summary><b>${esc(LANES[l].name)}</b><span class="muted">${ls.filter(u => isDone(u.id)).length} / ${ls.length} 駅</span></summary>
        <div class="station-list">${ls.map(station).join('')}</div></details>`;
    }).join('');
    return `
    <section class="level-head">
      <div class="eyebrow">考え方の水準 ${n}</div>
      <h1>${esc(s.name)}</h1>
      <p>${esc(s.about)}。わけの示し方は ${circled(n)} ${esc(REASON[n])}。</p>
      ${g ? `<p class="goal-banner">目標「${esc(g.name)}」に要る駅だけで組み替えています。<button class="pill" type="button" data-goal="all">すべての駅を見る</button></p>` : ''}
    </section>
    <div class="legend">${['done', 'doing', 'review', 'ready', 'later'].map(k =>
      `<span><span class="dot ${k}" style="${lc('N')}"></span>${STATUS_NAME[k]}</span>`).join('')}
      <span><span class="from" style="${lc('C')}">C-001</span>ほかの流れの前提</span></div>
    ${us.length ? lanes : '<p class="empty">この目標では、この水準の駅は要りません。</p>'}
    <div class="actions">
      ${THINK[n - 1] ? `<a class="pill" href="#/level/${n - 1}">← 水準 ${n - 1}</a>` : ''}
      ${THINK[n + 1] ? `<a class="pill" href="#/level/${n + 1}">水準 ${n + 1} →</a>` : ''}
    </div>`;
  }
  function station(u) {
    const st = status(u.id), r = progress.units[u.id];
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
      <div class="row"><span class="dot ${st}" style="${lc(u.lane)}"></span>${STATUS_NAME[st]}${r.done ? `（${r.done}）` : ''}${reviewNote ? `・${reviewNote}` : ''}</div>
      <div class="row">${u.needs.length ? `前提 ${u.needs.map(chip).join('')}` : '前提なし。ここから始められます。'}</div>
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
    ${problemsHtml(id)}`;
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
    return `<section class="probs"><h2 class="section-title">この駅が鍵になる古今東西の問題（${ps.length} 問）</h2>
      <p class="muted">組み合わせの札が、その問題を解くのに一緒に使う駅です。著作権のある問題は、骨格だけを書き、問題そのものは出典で読みます。</p>
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
      <div class="row">${esc(g.note.replace(/。$/, ''))}。単元を組み合わせた結果として届く場所です。</div>
      ${g.basis ? `<div class="row muted">範囲の根拠：${esc(g.basis)}</div>` : ''}
      ${g.beyond ? `<div class="row muted">知識のほかに要ること：${esc(g.beyond)}（地図が受け持つのは知識の土台だけです）</div>` : ''}
      <div class="gauge">
        <div><span class="k">届いた論題</span><b>${st.got} / ${st.topics}</b></div>
        <div><span class="k">済んだ駅</span><b>${st.done} / ${st.units}</b></div>
        <div><span class="k">見込み</span><b>残り 約 ${f.est}</b><span class="u">日</span></div>
      </div>
      <div class="row"><button class="pill solid" type="button" data-goal="${id}" data-go="#/">この目標の道だけで地図を見る</button></div>
    </section>
    <section class="next">
      <h2>次に進める駅</h2>
      <div class="next-list">${next.slice(0, 8).map(u => `
        <a class="next-card" href="#/unit/${u.id}" style="${lc(u.lane)}">
          <span class="dot ${status(u.id)}"></span>
          <span class="mode">${STATUS_NAME[status(u.id)]}・${esc(LANES[u.lane].name)}・水準 ${u.level}</span>
          <span class="t">${esc(u.title)}</span>
        </a>`).join('') || '<p class="muted">この目標の駅はすべて済みました。</p>'}</div>
    </section>
    <section>
      <h2 class="section-title">論題（✓ は、受け持つ駅がすべて済んで届いたもの）</h2>
      ${fields.map(fd => `<h3 class="field">${esc(fd)}</h3><div class="topics">${must.filter(i => i.field === fd).map(row).join('')}</div>`).join('')}
    </section>
    ${Object.entries(g.choices || {}).map(([k, c]) => {
      const picks = g.items.filter(i => i.choice === k), pf = [...new Set(picks.map(i => i.field))];
      return `<section>
      <h2 class="section-title">選んで解く論題：${esc(c.label)}</h2>
      <p class="muted">得意な論題を選んで解く問題です。道のりには入れず、届いた論題は ${c.pick} つまで数えます。</p>
      ${pf.map(fd => `<h3 class="field">${esc(fd)}</h3><div class="topics">${picks.filter(i => i.field === fd).map(row).join('')}</div>`).join('')}
    </section>`;
    }).join('')}`;
  }

  // ---- 今日の問題 ----
  function viewDay(id, n, type = 'day') {
    const u = UNITS[id], d = u.days[n - 1];
    let items = d.items || [];
    // おさらいの日は予備の問題、なければその日の問題をもう一度
    if (type === 'extra') items = d.extra && d.extra.length ? d.extra : items.filter(x => x.part !== '見本');
    if (type === 'review') items = pickReview(u);
    session = { id, n, type, items, idx: 0, results: [], entry: '', hints: 0, tries: 0, solved: false };
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
      const cls = r ? (r.first ? 'ok' : 'help') : r === null ? 'ok' : i === s.idx ? 'on' : '';
      h += (i ? `<i class="${i <= s.idx ? 'on' : ''}"></i>` : '') + `<b class="${cls}"></b>`;
    });
    return `<div class="play-top"><div class="steps">${h}</div>
      <span class="play-count">${Math.min(s.idx + 1, s.items.length)} / ${s.items.length}</span></div>`;
  }
  function pathsHtml(it) {
    return `<div class="paths">${(it.paths || []).map((p, i) => `
      <div><div class="path-label">${i ? 'べつの みちすじ' : 'みちすじ'}</div>
        <div class="path">${p.map((x, j) => {
          const t = i * .7 + j * .28;
          return (j ? `<span class="link" style="animation-delay:${t - .1}s"></span>` : '') +
            `<span class="stn" style="animation-delay:${t}s">${fmt(x)}</span>`;
        }).join('')}</div></div>`).join('')}</div>`;
  }
  function parentHtml(it) {
    if (!prefs.parent) return '';
    if (it.part === '見本') return '';
    if (it.part === 'わけ') return `<div class="parent"><b>手本</b> ${fmt(it.explain)}
      ${(it.paths || []).map((p, i) => `<br>${i ? '別の道' : '道筋'}：${p.map(fmt).join(' → ')}`).join('')}
      <div class="actions" style="justify-content:flex-start;margin-top:10px"><button class="pill" data-act="skip" type="button">この問題をとばす</button></div></div>`;
    return `<div class="parent"><b>こたえ</b> ${fmt(it.answer)}
      ${(it.paths || []).map((p, i) => `<br>${i ? '別の道' : '道筋'}：${p.map(fmt).join(' → ')}`).join('')}
      ${it.note ? `<br><b>見どころ</b> ${fmt(it.note)}` : ''}
      <div class="actions" style="justify-content:flex-start;margin-top:10px"><button class="pill" data-act="skip" type="button">この問題をとばす</button></div></div>`;
  }
  function drawItem() {
    const s = session, el = $('#play'), u = UNITS[s.id], d = u.days[s.n - 1];
    if (!s.items.length) {
      el.innerHTML = `<div class="card empty"><span class="part">${esc(d.kind)}</span>
        <h2 style="margin:18px 0 8px">${esc(d.aim || R.kinds[d.kind])}</h2>
        <p>この日の問題は、まだ作っていません。</p>
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
    if (it.part === 'わけ' && !s.solved) {
      // わけを口で言う問題：保護者が聞いて「言えた」を押す（D-016）
      const hints = (it.hints || []).slice(0, s.hints).map((h, i) => `<div class="hint" data-n="${i + 1}">${fmt(h)}</div>`).join('');
      const st = UNITS[s.id].stage, ask = st <= 2 ? ['くちで いってみよう。いえたら、おうちの ひとに「いえた」を おしてもらおう。', 'いえた']
        : st === 3 ? ['ノートに、わけを文で書いてみよう。書けたら、おうちの人に見せて「書けた」をおしてもらおう。', '書けた']
        : ['決めたこと（文字や約束）から順に、筋道を立ててノートに書こう。書けたら、おうちの人に見てもらって「書けた」を押そう。', '書けた'];
      body = `${fig}<p class="explain">${ask[0]}</p>
        <div class="hints">${hints}</div>
        <div class="actions">${s.hints < 3 ? `<button class="pill" data-act="hint" type="button">ヒント ${s.hints + 1} / 3</button>` : ''}
          <button class="pill solid" data-act="said" type="button">${ask[1]}</button></div>`;
    } else if (it.part === 'わけ') {
      body = `${fig}<div class="feedback">よく いえたね！</div>${pathsHtml(it)}
        <div class="actions"><button class="pill solid" data-act="next" type="button">つぎへ</button></div>`;
    } else if (it.part === '見本') {
      body = `${fig}<p class="explain">${fmt(it.explain)}</p>
        <div class="actions"><button class="pill solid" data-act="next" type="button">わかった</button></div>`;
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
      const hints = (it.hints || []).slice(0, s.hints).map((h, i) => `<div class="hint" data-n="${i + 1}">${fmt(h)}</div>`).join('');
      body = `${fig}${input}<div class="feedback" id="fb"></div><div class="hints">${hints}</div>
        <div class="actions">${s.hints < 3 ? `<button class="pill" data-act="hint" type="button">ヒント ${s.hints + 1} / 3</button>` : ''}</div>`;
    }
    el.innerHTML = steps() + `<article class="card" id="card">
      <span class="part">${esc(it.part)}</span><p class="q">${fmt(it.text)}</p>${body}${parentHtml(it)}</article>`;
  }
  function submit(val) {
    const s = session, it = s.items[s.idx];
    if (s.solved || val === '') return;
    s.tries++;
    if (isRight(it, val)) {
      s.solved = true;
      s.results[s.idx] = { first: s.tries === 1 && s.hints === 0, hints: s.hints, tries: s.tries };
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
    else if (skipped) s.results[s.idx] = { first: false, hints: s.hints, tries: s.tries, skipped: true };
    Object.assign(s, { idx: s.idx + 1, entry: '', hints: 0, tries: 0, solved: false });
    drawItem();
  }
  function drawFinish() {
    const s = session, u = UNITS[s.id], d = u.days[s.n - 1], el = $('#play');
    const res = s.results.filter(Boolean), firsts = res.filter(r => r.first).length;
    const rate = res.length ? firsts / res.length : 1, r = rec(s.id), today = localDate(), before = satisfied();
    let title = 'きょうの みちすじ、できた！', note = 'たどった みちすじが、メロディに なりました。';
    if (s.type === 'review') {
      const v = r.review || (r.review = { step: 0, fails: 0 });
      if (firsts === res.length) {
        v.fails = 0; v.step = (v.step || 0) + 1;
        if (v.step >= RULE.intervals.length) { v.complete = true; title = 'しっかり 身に ついた！'; note = 'この駅は定着しました。'; }
        else { v.due = addDays(RULE.intervals[v.step]); title = 'おぼえて いた！'; note = `次は ${v.due} に確かめます。`; }
      } else {
        v.fails = (v.fails || 0) + 1; v.due = addDays(1);
        if (v.fails >= 2) { v.lapsed = true; title = 'もう一度 ふりかえろう'; note = 'この駅は「復習」に戻りました。確認の日をもう一度ためしましょう。'; }
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
      r.days[s.n] = { date: today, first: firsts, total: res.length, hints: res.reduce((a, x) => a + x.hints, 0) };
      if (d.kind === '確認') {
        if (rate >= RULE.pass) {
          r.done = today; r.pending = null; r.low = 0;
          r.review = { step: 0, due: addDays(RULE.intervals[0]), fails: 0 };
          title = 'この駅を通過！'; note = 'あした、1 週後、1 か月後に、2 問ずつ確かめます。';
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
    save(KEY, progress);
    Music.melody(res);
    s.melody = res;
    // この駅で新しく届いた論題（済んだ単元の組み合わせでできるようになったこと）
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
      <div class="line">${res.map((x, i) => (i ? '<i></i>' : '') + `<b class="${x.first ? 'ok' : 'help'}"></b>`).join('')}</div>
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
      s.results[s.idx] = { first: s.hints === 0, hints: s.hints, tries: 1 };
      Music.good(s.idx); drawItem();
    }
    if (act === 'next') { Music.tap(); advance(false); }
    if (act === 'skip') advance(true);
    if (act === 'replay') Music.melody(s.melody || []);
  });
  document.addEventListener('keydown', e => {
    if (!session || session.solved || $('#menu').open) return;
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
  $('#btn-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(progress, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `michisuji-progress-${localDate()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('#file-import').addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const v = JSON.parse(await f.text());
      if (!v || typeof v.units !== 'object') throw new Error('形が違う');
      progress = migrate(v); save(KEY, progress); menu.close(); render();
    } catch (err) { alert('読み込めませんでした（' + err.message + '）'); }
  });
  $('#btn-reset').addEventListener('click', () => {
    if (!confirm('この端末の記録をすべて消します。よろしいですか。')) return;
    progress = { units: {} }; save(KEY, progress); menu.close(); render();
  });
  window.addEventListener('hashchange', render);
  window.addEventListener('resize', () => { if (parse().name !== 'map') return; setBarH(); if (cosmos) cosmos.resize(); if (X.view === '2d') paint(); });

  Music.init(prefs.music);
  sync();
  render();
})();
