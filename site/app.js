/* みちすじ：全体の地図 → 段の路線図 → 単元の日 → 今日の問題を 1 問ずつ */
(() => {
  'use strict';
  const R = window.ROADMAP;
  const LANES = Object.fromEntries(R.lanes.map(l => [l.id, l]));
  const LANE_ORDER = R.lanes.map(l => l.id);
  const UNITS = Object.fromEntries(R.units.map(u => [u.id, u]));
  const STAGES = Object.fromEntries(R.stages.map(s => [s.id, s]));
  const KEY = 'michisuji.progress.v1', PREF = 'michisuji.prefs.v1';
  const STATUS_NAME = { done: '済', doing: 'いま', ready: '次にできる', later: 'まだ' };

  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lc = id => `--c: var(--lane-${id})`;
  const localDate = () => new Date().toLocaleDateString('sv-SE');

  // ---- 記録（この端末のブラウザの中だけ） ----
  function load(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 保存できない環境でも表示は続ける */ } }
  let progress = load(KEY, null);
  if (!progress || typeof progress.units !== 'object') progress = { units: {} };
  const prefs = Object.assign({ music: true, parent: false }, load(PREF, {}));

  const rec = id => progress.units[id] || (progress.units[id] = { days: {} });
  function status(id) {
    const r = progress.units[id];
    if (r && r.done) return 'done';
    if (r && Object.keys(r.days || {}).length) return 'doing';
    return UNITS[id].needs.every(n => progress.units[n] && progress.units[n].done) ? 'ready' : 'later';
  }
  function nextDay(id) {
    const u = UNITS[id], days = (progress.units[id] && progress.units[id].days) || {};
    for (let i = 1; i <= u.days.length; i++) if (!days[i]) return i;
    return u.days.length;
  }
  const order = (a, b) => a.stage - b.stage || LANE_ORDER.indexOf(a.lane) - LANE_ORDER.indexOf(b.lane) || a.id.localeCompare(b.id);
  function options() {
    const doing = R.units.filter(u => status(u.id) === 'doing').sort(order)
      .map(u => ({ u, day: nextDay(u.id), mode: 'つづき' }));
    const ready = R.units.filter(u => status(u.id) === 'ready').sort(order)
      .slice(0, Math.max(0, 4 - doing.length)).map(u => ({ u, day: 1, mode: 'はじめる' }));
    return [...doing, ...ready];
  }
  function currentStage() {
    const open = R.units.filter(u => ['doing', 'ready'].includes(status(u.id)));
    return open.length ? Math.min(...open.map(u => u.stage)) : R.stages[R.stages.length - 1].id;
  }

  // ---- 道順 ----
  function parse() {
    const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    if (p[0] === 'stage' && STAGES[p[1]]) return { name: 'stage', stage: +p[1] };
    if (p[0] === 'unit' && UNITS[p[1]]) return { name: 'unit', id: p[1] };
    if (p[0] === 'day' && UNITS[p[1]]) {
      const n = Math.min(Math.max(1, parseInt(p[2], 10) || 1), UNITS[p[1]].days.length);
      return { name: 'day', id: p[1], day: n };
    }
    return { name: 'map' };
  }
  function crumbs(r) {
    const parts = [['#/', '全体の地図']];
    const stage = r.name === 'stage' ? r.stage : r.id ? UNITS[r.id].stage : null;
    if (stage) parts.push([`#/stage/${stage}`, `段 ${stage} ${STAGES[stage].name}`]);
    if (r.id) parts.push([`#/unit/${r.id}`, UNITS[r.id].title]);
    if (r.name === 'day') parts.push(['', `${r.day} 日目`]);
    return parts.map(([href, t], i) => i === parts.length - 1
      ? `<span class="here">${esc(t)}</span>`
      : `<a href="${href}">${esc(t)}</a><span class="sep">›</span>`).join('');
  }

  let session = null;
  function render() {
    const r = parse(), view = $('#view');
    if (r.name !== 'day') session = null;
    Music.scene(r.name === 'day' ? 'play' : 'map');
    view.innerHTML = r.name === 'stage' ? viewStage(r.stage)
      : r.name === 'unit' ? viewUnit(r.id)
      : r.name === 'day' ? viewDay(r.id, r.day) : viewMap();
    view.classList.remove('enter'); void view.offsetWidth; view.classList.add('enter');
    $('#crumbs').innerHTML = crumbs(r);
    document.title = (r.name === 'map' ? '' : $('#crumbs .here').textContent + ' — ') + 'みちすじ';
    if (r.name === 'stage') { requestAnimationFrame(drawEdges); document.fonts && document.fonts.ready.then(drawEdges); }
    if (r.name === 'day') drawItem();
    window.scrollTo(0, 0);
  }

  // ---- 全体の地図 ----
  function viewMap() {
    const total = R.units.reduce((s, u) => s + u.days.length, 0), cur = currentStage(), opts = options();
    return `
    <section class="hero">
      <div class="eyebrow">算数から数学オリンピックへ</div>
      <h1>たくさんの道から、ひとすじを。</h1>
      <p>${R.stages.length} つの段に ${R.units.length} の駅、${total} 日分。流れが分かれているところは、どれから進んでもかまいません。</p>
    </section>
    <section class="next">
      <h2>つぎの みちすじ</h2>
      <div class="next-list">${opts.map(o => `
        <a class="next-card" href="#/day/${o.u.id}/${o.day}" style="${lc(o.u.lane)}">
          <span class="dot ${status(o.u.id)}"></span>
          <span class="mode">${o.mode}・${esc(LANES[o.u.lane].name)}・${o.day} 日目</span>
          <span class="t">${esc(o.u.title)}</span>
        </a>`).join('') || '<p class="muted">すべての駅を通りました。</p>'}
      </div>
    </section>
    <section class="zones">${R.stages.map(s => zone(s, cur)).join('')}</section>`;
  }
  function zone(s, cur) {
    const us = R.units.filter(u => u.stage === s.id);
    const done = us.filter(u => status(u.id) === 'done').length;
    const lanes = LANE_ORDER.filter(l => us.some(u => u.lane === l));
    return `
    <a class="zone ${s.id === cur ? 'current' : ''}" href="#/stage/${s.id}">
      <div class="zone-num">${s.id}</div>
      <div class="zone-card">
        <div class="zone-head">
          <h3>${esc(s.name)}</h3>
          <span class="meta">${esc(s.measure)}・1 日 ${s.minutes} 分</span>
          <span class="count">${done} / ${us.length} 駅</span>
        </div>
        <div class="tracks">${lanes.map(l => `
          <div class="track" style="${lc(l)}"><span>${esc(LANES[l].name)}</span>
            <div class="track-line">${us.filter(u => u.lane === l).map(u =>
              `<span class="mini ${status(u.id)}" title="${esc(u.id + ' ' + u.title)}"><i></i></span>`).join('')}</div>
          </div>`).join('')}
        </div>
      </div>
    </a>`;
  }

  // ---- 段の路線図 ----
  function legend() {
    return `<div class="legend">${['done', 'doing', 'ready', 'later'].map(s =>
      `<span><span class="dot ${s}" style="${lc('N')}"></span>${STATUS_NAME[s]}</span>`).join('')}
      <span>線：同じ流れの前提</span><span><span class="from" style="${lc('C')}">C1-01</span>ほかの流れや前の段の前提</span></div>`;
  }
  // 流れを横の帯にし、前提の深さを左から右へ並べる。分かれ道は帯の中で段をずらす。
  // 同じ流れの中でつながりのない駅（前の段だけが前提）は、帯の下の行に横並びでまとめる。
  function layoutStage(n) {
    const us = R.units.filter(u => u.stage === n), depth = {}, sub = {}, col = {};
    const sameLane = u => u.needs.filter(x => UNITS[x].stage === n && UNITS[x].lane === u.lane);
    const linked = new Set();
    us.forEach(u => sameLane(u).forEach(x => { linked.add(u.id); linked.add(x); }));
    const d = id => depth[id] ?? (depth[id] = Math.max(0, ...sameLane(UNITS[id]).map(x => d(x) + 1)));
    us.forEach(u => d(u.id));
    const cols = Math.max(4, ...us.map(u => depth[u.id] + 1));
    const lanes = LANE_ORDER.filter(l => us.some(u => u.lane === l)).map(l => {
      let height = 0;
      for (let c = 0; c < cols; c++) {
        const here = us.filter(u => u.lane === l && linked.has(u.id) && depth[u.id] === c).map(u => {
          const parents = sameLane(u).map(x => sub[x]);
          return { u, want: parents.length ? Math.min(...parents) : 0 };
        }).sort((a, b) => a.want - b.want || order(a.u, b.u));
        let last = -1;
        here.forEach(h => { sub[h.u.id] = Math.max(h.want, last + 1); col[h.u.id] = c; last = sub[h.u.id]; });
        height = Math.max(height, last + 1);
      }
      us.filter(u => u.lane === l && !linked.has(u.id)).sort(order).forEach((u, i) => {
        sub[u.id] = height + Math.floor(i / cols); col[u.id] = i % cols;
      });
      const free = us.filter(u => u.lane === l && !linked.has(u.id)).length;
      return { id: l, height: height + Math.ceil(free / cols) };
    });
    return { us, col, sub, cols, lanes };
  }
  function viewStage(n) {
    const s = STAGES[n], { us, col, sub, cols, lanes } = layoutStage(n);
    let row = 1, cells = '';
    lanes.forEach(l => {
      cells += `<div class="band" style="grid-row:${row} / span ${l.height};${lc(l.id)}"></div>
        <div class="lane-title" style="grid-row:${row} / span ${l.height};${lc(l.id)}">
          <b>${esc(LANES[l.id].name)}</b><small>${esc(LANES[l.id].note)}</small></div>`;
      us.filter(u => u.lane === l.id).forEach(u => {
        cells += `<div class="cell" style="grid-column:${col[u.id] + 2};grid-row:${row + sub[u.id]}">${station(u)}</div>`;
      });
      row += l.height;
    });
    const parts = Object.entries(s.day).filter(([, v]) => v).map(([k, v]) => `${k} ${v}`).join('、');
    return `
    <section class="stage-head">
      <div class="eyebrow">段 ${n}</div>
      <h1>${esc(s.name)}</h1>
      <p>物差しは ${esc(s.measure)}。1 日 ${s.minutes} 分（${parts}）。</p>
    </section>
    ${legend()}
    <div class="board-wrap"><div class="board" id="board" style="grid-template-columns:var(--lw) repeat(${cols}, var(--cw))">
      ${cells}<svg class="edges" id="edges" aria-hidden="true"></svg>
    </div></div>
    <div class="actions">
      ${STAGES[n - 1] ? `<a class="pill" href="#/stage/${n - 1}">← 段 ${n - 1}</a>` : ''}
      ${STAGES[n + 1] ? `<a class="pill" href="#/stage/${n + 1}">段 ${n + 1} →</a>` : ''}
    </div>`;
  }
  function station(u) {
    const st = status(u.id), r = progress.units[u.id];
    const daysDone = Object.keys((r && r.days) || {}).length;
    const outside = u.needs.filter(x => UNITS[x].stage !== u.stage || UNITS[x].lane !== u.lane);
    const ready = u.days.filter(d => d.items && d.items.length).length;
    return `
    <a class="station ${st}" href="#/unit/${u.id}" data-id="${u.id}" style="${lc(u.lane)}">
      <span class="dot ${st}" data-dot="${u.id}"></span>
      <span class="sid">${u.id}</span>
      <span class="st">${esc(u.title)}</span>
      <span class="sub">${st === 'doing' ? `${daysDone} / ${u.days.length} 日` : `${u.days.length} 日`}
        ${outside.map(x => `<span class="from" style="${lc(UNITS[x].lane)}">${x}</span>`).join('')}
        ${ready ? `<span class="from" style="--c: var(--ok)">問題 ${ready} 日分</span>` : ''}</span>
    </a>`;
  }
  function drawEdges() {
    const board = $('#board'), svg = $('#edges');
    if (!board || !svg) return;
    const box = board.getBoundingClientRect(), w = board.scrollWidth, h = board.scrollHeight;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`); svg.setAttribute('width', w); svg.setAttribute('height', h);
    const pos = id => {
      const el = board.querySelector(`[data-dot="${id}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 };
    };
    const title = board.querySelector('.lane-title');
    const entryX = title ? title.getBoundingClientRect().right - box.left : 0;
    let out = '';
    R.units.forEach(u => {
      const b = pos(u.id);
      if (!b) return;
      u.needs.filter(nid => UNITS[nid].lane === u.lane).forEach(nid => {
        const a = pos(nid);
        // 前の段から続く線は、帯の入口から引く（左端の列の駅だけ）
        if (!a && b.x - entryX > 60) return;
        const path = a
          ? `M${a.x},${a.y} C${(a.x + b.x) / 2},${a.y} ${(a.x + b.x) / 2},${b.y} ${b.x},${b.y}`
          : `M${entryX},${b.y} L${b.x},${b.y}`;
        out += `<path class="same${a ? '' : ' entry'}" d="${path}" stroke="var(--lane-${u.lane})"/>`;
      });
    });
    svg.innerHTML = out;
  }

  // ---- 単元：日の路線 ----
  function viewUnit(id) {
    const u = UNITS[id], st = status(id), r = progress.units[id], nd = nextDay(id);
    const chip = x => `<a class="from" href="#/unit/${x}" style="${lc(UNITS[x].lane)}">${x} ${esc(UNITS[x].title)}</a>`;
    const opens = R.units.filter(v => v.needs.includes(id));
    return `
    <section class="unit-head" style="${lc(u.lane)}">
      <div class="eyebrow">${esc(LANES[u.lane].name)}の流れ・段 ${u.stage}・${u.id}</div>
      <h1>${esc(u.title)}</h1>
      <div class="row"><span class="dot ${st}" style="${lc(u.lane)}"></span>${STATUS_NAME[st]}${r && r.done ? `（${r.done}）` : ''}</div>
      <div class="row">${u.needs.length ? `前提 ${u.needs.map(chip).join('')}` : '前提なし。ここから始められます。'}</div>
      ${opens.length ? `<div class="row">この先 ${opens.map(v => chip(v.id)).join('')}</div>` : ''}
    </section>
    <div class="days" style="${lc(u.lane)}">${u.days.map((d, i) => {
      const n = i + 1, dr = r && r.days && r.days[n];
      const cls = dr ? 'done' : n === nd && st !== 'later' ? 'next' : '';
      const count = d.items && d.items.length ? `・${d.items.filter(x => x.part !== '見本').length} 問` : '・問題はまだ';
      return `
      <a class="day ${cls}" href="#/day/${id}/${n}">
        <span class="day-stop">${n}</span>
        <span class="day-card"><span class="k">${esc(d.kind)}${count}</span><br>
          <span class="a">${esc(d.aim || R.kinds[d.kind])}</span></span>
        <span class="go">${dr ? dr.date : cls === 'next' ? 'つぎ →' : ''}</span>
      </a>`;
    }).join('')}</div>`;
  }

  // ---- 今日の問題 ----
  function viewDay(id, n) {
    const u = UNITS[id], d = u.days[n - 1];
    session = { id, n, items: d.items || [], idx: 0, results: [], entry: '', hints: 0, tries: 0, solved: false };
    return `<section class="play" id="play" style="${lc(u.lane)}"></section>`;
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
    if (it.part === '見本') {
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
    const isCheck = d.kind === '確認', pass = !isCheck || (res.length > 0 && firsts / res.length >= .8);
    const r = rec(s.id);
    r.days[s.n] = { date: localDate(), first: firsts, total: res.length, hints: res.reduce((a, x) => a + x.hints, 0) };
    if (isCheck && pass) r.done = localDate();
    save(KEY, progress);
    Music.melody(res);
    s.melody = res;
    const title = isCheck ? (pass ? 'この駅を通過！' : 'あと すこし！') : 'きょうの みちすじ、できた！';
    const note = isCheck && !pass ? '8 割で通過です。ほかの日をふりかえってから、もう一度ためしましょう。' : 'たどった みちすじが、メロディに なりました。';
    el.innerHTML = `<article class="card finish">
      <span class="part">${esc(d.kind)}</span>
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
    location.hash = o ? `#/day/${o.u.id}/${o.day}` : '#/';
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
      progress = v; save(KEY, progress); menu.close(); render();
    } catch (err) { alert('読み込めませんでした（' + err.message + '）'); }
  });
  $('#btn-reset').addEventListener('click', () => {
    if (!confirm('この端末の記録をすべて消します。よろしいですか。')) return;
    progress = { units: {} }; save(KEY, progress); menu.close(); render();
  });
  window.addEventListener('hashchange', render);
  window.addEventListener('resize', () => { if (parse().name === 'stage') drawEdges(); });

  Music.init(prefs.music);
  sync();
  render();
})();
