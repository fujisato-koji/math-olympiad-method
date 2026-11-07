/* みちすじ：全体の地図 → 考え方の水準のページ・組み合わせの層 → 単元の日 → 今日の問題を 1 問ずつ */
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
    $('#crumbs').innerHTML = crumbs(r);
    document.title = (r.name === 'map' ? '' : $('#crumbs .here').textContent + ' — ') + 'みちすじ';
    if (r.name === 'map') { requestAnimationFrame(drawMap); document.fonts && document.fonts.ready.then(drawMap); }
    if (r.name === 'day') drawItem();
    window.scrollTo(0, 0);
  }

  // ---- 全体の地図 ----
  function viewMap() {
    const f = forecast(), opts = options(), kind = kindNow(), near = nearGoals(5);
    return `
    <section class="hero">
      <div class="eyebrow">ものを数えるところから、研究の最前線まで</div>
      <h1>たくさんの道から、ひとすじを。</h1>
      <p>${R.units.length} の駅。前提が済んだ駅なら、どこからでも始められ、流れごとに進み方が違ってかまいません。駅には、考え方の水準（1〜5）を付けています。</p>
      <div class="goal-pick levels" role="group" aria-label="考え方の水準"><span class="k">水準</span>${(R.levels || []).map(l => {
        const us = R.units.filter(u => u.level === l.id && inGoal(u.id));
        return `<a class="pill" href="#/level/${l.id}">${l.id} ${esc(l.name)}<span class="n">${us.filter(u => isDone(u.id)).length} / ${us.length}</span></a>`;
      }).join('')}</div>
      <div class="goal-pick" role="group" aria-label="目標の種類">
        <span class="k">目標</span>
        ${KINDS.map(k => `<button class="pill kind" type="button" data-goalkind="${esc(k)}" aria-pressed="${kind === k}">${esc(k)}<span class="n">${goalsOf(k).length}</span></button>`).join('')}
        <button class="pill" type="button" data-goal="all" aria-pressed="${prefs.goal === 'all'}">すべての駅</button>
      </div>
      <div class="goal-pick sub" role="group" aria-label="${esc(kind)}の目標">
        ${goalsOf(kind).map(g => `<button class="pill" type="button" data-goal="${g.id}" aria-pressed="${prefs.goal === g.id}">${esc(g.name)}</button>`).join('')}
      </div>
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
    <section class="overview">
      <h2 class="section-title">全体の関係図</h2>
      <div class="legend">${['done', 'doing', 'ready', 'later'].map(s =>
        `<span><span class="dot ${s}" style="${lc('N')}"></span>${STATUS_NAME[s]}</span>`).join('')}
        ${prefs.goal !== 'all' && CHOICE_SETS[prefs.goal].size ? `<span><span class="dot later choice" style="${lc('N')}"></span>選択の論題だけ</span>` : ''}
        <span>横は理解の深さ（右ほど多くの前提の上にある）、縦は領域。上の目盛りは考え方の水準のおよその位置</span></div>
      ${GOAL_SETS[prefs.goal] ? `<p class="muted">目標「${esc(GOALS.find(g => g.id === prefs.goal).name)}」に要る ${GOAL_SETS[prefs.goal].size} 駅だけを描いています${CHOICE_SETS[prefs.goal].size ? `。選んで解く論題（選択科目）だけに要る ${CHOICE_SETS[prefs.goal].size} 駅は薄く描きます` : ''}。全体は目標の「すべての駅」で見られます。</p>` : ''}
      <div class="goal-pick map-groups" role="group" aria-label="関係図の範囲"><span class="k">範囲</span>${MAP_GROUPS.map(([id, name]) =>
        `<button class="pill" type="button" data-mapgroup="${id}" aria-pressed="${(prefs.mapGroup || 'all') === id}">${esc(name)}</button>`).join('')}</div>
      <div class="goal-pick map-groups" role="group" aria-label="関係図の見方"><span class="k">見方</span>
        <button class="pill" type="button" data-mapcomb="0" aria-pressed="${!prefs.mapComb}">前提のつながり</button>
        <button class="pill" type="button" data-mapcomb="1" aria-pressed="${!!prefs.mapComb}">組み合わせ（橋の駅と、領域をまたぐ前提）</button>
        <a class="pill" href="#/comb">組み合わせの層を見る</a></div>
      <div class="map-wrap"><div id="map" class="map${prefs.mapComb ? ' comb' : ''}"></div></div>
      <div id="map-info" class="map-info muted">駅を押すと、その駅の前提の鎖と、その先に開ける駅が浮かび上がります。もう一度押すと駅に入ります。</div>
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
  let selected = null;
  // 関係図の切り替え：島が多いので、流れのまとまりごとに見られるようにする
  const SCHOOL_REGIONS = new Set(['kazu', 'keisan', 'seisu', 'seisuron', 'houteishiki', 'kansu', 'shiki', 'futoshiki', 'kazoekata',
    'kakuritsu', 'graph', 'katachi', 'hakaru', 'shomei-zukei', 'zahyo', 'haichi', 'suiri', 'ronpo']);
  const MAP_GROUPS = [
    ['all', 'すべて', () => true],
    // 1 つのボタンは 1 つの分野（流れ）。違う分野を「〇と〇」で抱き合わせない（D-033）
    ['school', '小中高の数学', rg => SCHOOL_REGIONS.has(rg.id)],
    ['univ', '大学の数学', rg => !SCHOOL_REGIONS.has(rg.id) && ('NACGLDMRTS'.includes(rg.lane) || rg.id === 'suchi')],
    ['cs', '計算機科学', rg => rg.lane === 'K' && rg.id !== 'suchi'],
    ...'PHBWIQVEF'.split('').map(l => [l, LANES[l].name, rg => rg.lane === l]),
  ];
  function drawMap() {
    const host = $('#map');
    if (!host) return;
    // 目標を選んでいるときは、その目標の駅と、その駅がある島だけで描き直す（D-015）
    const grp = (MAP_GROUPS.find(g => g[0] === prefs.mapGroup) || MAP_GROUPS[0])[2];
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
    const X0 = 168, span = Math.max(1, maxD - minD), avail = Math.max(host.parentElement.clientWidth - 32, 820);
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
    if (selected && UNITS[selected]) highlight(selected);
  }
  // 選んだ駅の前提の鎖（上流）と、その先に開ける駅（下流）だけを浮かび上がらせる
  function highlight(id) {
    const host = $('#map'), info = $('#map-info');
    if (!host) return;
    // 目標を選んでいるときは、その目標の中の鎖だけ（目標の道のりは前提で閉じているので、途中の駅も目標の中にある）
    const near = x => inGoal(x) || inChoice(x);
    const up = new Set([...closure(id, 'up')].filter(near)), down = new Set([...closure(id, 'down')].filter(near));
    const on = new Set([id, ...up, ...down]);
    host.classList.add('focus');
    host.querySelectorAll('circle').forEach(c => { c.classList.toggle('hl', on.has(c.dataset.u)); c.classList.toggle('sel', c.dataset.u === id); });
    host.querySelectorAll('.edges path').forEach(p => {
      const a = p.dataset.a, b = p.dataset.b;
      p.classList.toggle('hl', ((up.has(a)) && (up.has(b) || b === id)) || ((down.has(b)) && (down.has(a) || a === id)));
    });
    const u = UNITS[id];
    info.classList.remove('muted');
    info.innerHTML = `<span class="dot ${status(id)}" style="${lc(u.lane)}"></span><b>${esc(u.title)}</b>
      <span class="muted">${u.id}・${esc(LANES[u.lane].name)}・水準 ${u.level}${inChoice(id) ? '・選択の論題' : ''}・${STATUS_NAME[status(id)]}・前提 ${up.size} 駅・この先 ${down.size} 駅</span>
      <a class="pill solid" href="#/unit/${id}">駅をひらく</a><button class="pill" type="button" data-act="unfocus">もどす</button>`;
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
            `<span class="stn" style="animation-delay:${t}s">${esc(x)}</span>`;
        }).join('')}</div></div>`).join('')}</div>`;
  }
  function parentHtml(it) {
    if (!prefs.parent) return '';
    if (it.part === '見本') return '';
    if (it.part === 'わけ') return `<div class="parent"><b>手本</b> ${esc(it.explain)}
      ${(it.paths || []).map((p, i) => `<br>${i ? '別の道' : '道筋'}：${p.map(esc).join(' → ')}`).join('')}
      <div class="actions" style="justify-content:flex-start;margin-top:10px"><button class="pill" data-act="skip" type="button">この問題をとばす</button></div></div>`;
    return `<div class="parent"><b>こたえ</b> ${esc(it.answer)}
      ${(it.paths || []).map((p, i) => `<br>${i ? '別の道' : '道筋'}：${p.map(esc).join(' → ')}`).join('')}
      ${it.note ? `<br><b>見どころ</b> ${esc(it.note)}` : ''}
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
    const longest = it.figure ? Math.max(...String(it.figure).split('\n').map(l => Array.from(l).length)) : 0;
    const fig = it.figure ? `<div class="fig" style="--n:${longest}" aria-label="え">${esc(it.figure)}</div>` : '';
    let body;
    if (it.part === 'わけ' && !s.solved) {
      // わけを口で言う問題：保護者が聞いて「言えた」を押す（D-016）
      const hints = (it.hints || []).slice(0, s.hints).map((h, i) => `<div class="hint" data-n="${i + 1}">${esc(h)}</div>`).join('');
      body = `${fig}<p class="explain">くちで いってみよう。いえたら、おうちの ひとに「いえた」を おしてもらおう。</p>
        <div class="hints">${hints}</div>
        <div class="actions">${s.hints < 3 ? `<button class="pill" data-act="hint" type="button">ヒント ${s.hints + 1} / 3</button>` : ''}
          <button class="pill solid" data-act="said" type="button">いえた</button></div>`;
    } else if (it.part === 'わけ') {
      body = `${fig}<div class="feedback">よく いえたね！</div>${pathsHtml(it)}
        <div class="actions"><button class="pill solid" data-act="next" type="button">つぎへ</button></div>`;
    } else if (it.part === '見本') {
      body = `${fig}<p class="explain">${esc(it.explain)}</p>
        <div class="actions"><button class="pill solid" data-act="next" type="button">わかった</button></div>`;
    } else if (s.solved) {
      body = `${fig}<div class="feedback">できた！ こたえは <b>${esc(it.answer)}</b></div>${pathsHtml(it)}
        <div class="actions"><button class="pill solid" data-act="next" type="button">つぎへ</button></div>`;
    } else {
      const input = it.choices
        ? `<div class="choices">${it.choices.map(c => `<button class="choice" data-choice="${esc(c)}" type="button">${esc(c)}</button>`).join('')}</div>`
        : `<div class="answer-box"><div class="display" id="display">${esc(s.entry) || '？'}</div>
            <div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(k => `<button data-key="${k}" type="button">${k}</button>`).join('')}
              <button data-key="del" type="button" aria-label="ひとつ けす">←</button>
              <button class="ok" data-key="ok" type="button">こたえる</button></div></div>`;
      const hints = (it.hints || []).slice(0, s.hints).map((h, i) => `<div class="hint" data-n="${i + 1}">${esc(h)}</div>`).join('');
      body = `${fig}${input}<div class="feedback" id="fb"></div><div class="hints">${hints}</div>
        <div class="actions">${s.hints < 3 ? `<button class="pill" data-act="hint" type="button">ヒント ${s.hints + 1} / 3</button>` : ''}</div>`;
    }
    el.innerHTML = steps() + `<article class="card" id="card">
      <span class="part">${esc(it.part)}</span><p class="q">${esc(it.text)}</p>${body}${parentHtml(it)}</article>`;
  }
  function submit(val) {
    const s = session, it = s.items[s.idx];
    if (s.solved || val === '') return;
    s.tries++;
    if (String(val) === String(it.answer)) {
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
    const dot = e.target.closest('#map circle[data-u]');
    if (dot) {
      const id = dot.dataset.u;
      if (selected === id) { location.hash = `#/unit/${id}`; return; }
      selected = id; Music.tap(); highlight(id); return;
    }
    if (e.target.closest('[data-act=unfocus]')) { selected = null; drawMap(); $('#map').classList.remove('focus');
      $('#map-info').className = 'map-info muted'; $('#map-info').textContent = '駅を押すと、その駅の前提の鎖と、その先に開ける駅が浮かび上がります。もう一度押すと駅に入ります。'; return; }
    const mc = e.target.closest('[data-mapcomb]');
    if (mc) { prefs.mapComb = mc.dataset.mapcomb === '1'; save(PREF, prefs); Music.tap(); render(); return; }
    const mg = e.target.closest('[data-mapgroup]');
    if (mg) { prefs.mapGroup = mg.dataset.mapgroup; save(PREF, prefs); selected = null; Music.tap(); render(); return; }
    const gk = e.target.closest('[data-goalkind]');
    if (gk) { prefs.goalKind = gk.dataset.goalkind; save(PREF, prefs); Music.tap(); render(); return; }
    const g = e.target.closest('[data-goal]');
    if (g) {
      prefs.goal = g.dataset.goal; selected = null;  // 目標が変わると駅の選択は外す（前の目標の鎖を残さない）
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
      s.entry = k === 'del' ? s.entry.slice(0, -1) : (s.entry + k).slice(0, 3);
      const disp = $('#display');
      if (disp) disp.textContent = s.entry || '？';
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
    if (/^\d$/.test(e.key)) { session.entry = (session.entry + e.key).slice(0, 3); }
    else if (e.key === 'Backspace') { session.entry = session.entry.slice(0, -1); }
    else if (e.key === 'Enter') { return submit(session.entry); }
    else return;
    const disp = $('#display');
    if (disp) disp.textContent = session.entry || '？';
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
  window.addEventListener('resize', () => { if (parse().name === 'map') drawMap(); });

  Music.init(prefs.music);
  sync();
  render();
})();
