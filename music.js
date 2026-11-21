/* みちすじ：ブラウザの中で合成する音楽と効果音（音源のファイルは使わない） */
window.Music = (() => {
  'use strict';
  let ctx = null, master, music, sfx, timer = null;
  let on = false, scene = 'map', next = 0, beat = 0, last = 74;
  const BPM = 66, SPB = 60 / BPM;
  // C → Am → F → G の和音（中音域）と根音
  const CHORDS = [
    { pad: [60, 64, 67], root: 48 },
    { pad: [57, 60, 64], root: 45 },
    { pad: [57, 60, 65], root: 41 },
    { pad: [59, 62, 67], root: 43 },
  ];
  const PENTA = [0, 2, 4, 7, 9];
  const SCENES = { map: { level: 1, density: .42 }, play: { level: .55, density: .22 } };

  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const penta = i => 60 + 12 * Math.floor(i / 5) + PENTA[((i % 5) + 5) % 5];

  function impulse(sec) {
    const len = Math.floor(ctx.sampleRate * sec), buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    return buf;
  }

  function ensure() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = .9; master.connect(ctx.destination);
    const verb = ctx.createConvolver(); verb.buffer = impulse(3);
    const wet = ctx.createGain(); wet.gain.value = .32; verb.connect(wet).connect(master);
    music = ctx.createGain(); music.gain.value = 0; music.connect(master); music.connect(verb);
    sfx = ctx.createGain(); sfx.gain.value = .55; sfx.connect(master); sfx.connect(verb);
    return true;
  }

  function tone(dest, midi, t, dur, o = {}) {
    const { type = 'sine', gain = .1, attack = .01, release = .6, cutoff = 3200 } = o;
    const osc = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    osc.type = type; osc.frequency.value = mtof(midi);
    f.type = 'lowpass'; f.frequency.value = cutoff;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.setTargetAtTime(0, t + attack + dur, release / 3);
    osc.connect(f).connect(g).connect(dest);
    osc.start(t); osc.stop(t + attack + dur + release * 2);
  }

  function schedule() {
    while (next < ctx.currentTime + .4) {
      const bar = Math.floor(beat / 4) % CHORDS.length, chord = CHORDS[bar], s = SCENES[scene];
      if (beat % 4 === 0) {
        chord.pad.forEach(m => tone(music, m, next, SPB * 3.6, { gain: .045, attack: 1.1, release: 1.6, cutoff: 1100 }));
        tone(music, chord.root, next, SPB * 3, { gain: .05, attack: .05, release: 1.2, cutoff: 600 });
      }
      if (Math.random() < s.density) {
        // ペンタトニックの上を、近い音へゆっくり歩く
        const choices = [-2, -1, 1, 2, 0];
        let idx = PENTA.indexOf((last - 60 + 120) % 12) + 5 * (Math.floor((last - 60) / 12) + 1);
        idx = Math.max(5, Math.min(13, idx + choices[Math.floor(Math.random() * choices.length)]));
        last = penta(idx);
        tone(music, last, next + (Math.random() < .3 ? SPB / 2 : 0), .12, { type: 'triangle', gain: .055, attack: .004, release: 1.3, cutoff: 2600 });
      }
      next += SPB; beat++;
    }
  }

  function start() {
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (timer) return;
    next = ctx.currentTime + .1;
    timer = setInterval(schedule, 120);
    music.gain.cancelScheduledValues(ctx.currentTime);
    music.gain.setTargetAtTime(SCENES[scene].level, ctx.currentTime, .8);
  }
  function stop() {
    if (!ctx) return;
    music.gain.cancelScheduledValues(ctx.currentTime);
    music.gain.setTargetAtTime(0, ctx.currentTime, .3);
    clearInterval(timer); timer = null;
  }
  function play(fn) {
    if (!on || !ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
    fn(ctx.currentTime + .02);
  }

  return {
    get on() { return on; },
    init(v) { on = v; },  // 最初の操作までは音を鳴らさない（ブラウザの自動再生の決まり）
    set(v) { on = v; v ? start() : stop(); },
    unlock() { if (on) start(); },
    scene(name) {
      scene = SCENES[name] ? name : 'map';
      if (ctx && timer) music.gain.setTargetAtTime(SCENES[scene].level, ctx.currentTime, .6);
    },
    tap() { play(t => tone(sfx, 84, t, .04, { type: 'triangle', gain: .06, release: .25 })); },
    hint() { play(t => { tone(sfx, 76, t, .08, { gain: .08 }); tone(sfx, 79, t + .14, .1, { gain: .08 }); }); },
    good(i = 0) { play(t => [0, 1, 2, 3].forEach((k, j) => tone(sfx, penta(5 + i + k), t + j * .08, .1, { type: 'triangle', gain: .08, release: .9 }))); },
    miss() { play(t => { tone(sfx, 64, t, .12, { gain: .07, cutoff: 1400 }); tone(sfx, 62, t + .16, .18, { gain: .06, cutoff: 1200 }); }); },
    // その日のみちすじを 1 本のメロディにして鳴らす（1 問が 1 音、ヒントを使った問題は柔らかく）
    melody(results) {
      play(t => {
        let idx = 5;
        results.forEach((r, j) => {
          idx += r.first ? 1 : 0;
          tone(sfx, penta(idx), t + j * .32, .22, { type: 'triangle', gain: r.first ? .1 : .055, release: 1.1 });
        });
        const end = t + results.length * .32 + .1;
        [60, 64, 67, 72].forEach(m => tone(sfx, m + 12, end, .9, { gain: .05, attack: .05, release: 2 }));
      });
    },
  };
})();
