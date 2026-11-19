// 図の確かめ（D-138 の試し）：tools/figlint.py が作った頁を画面なしのブラウザで描き、文字の重なり・はみ出し・小さい字を測って JSON で返す。
//   node tools/figlint.mjs <頁の html>
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { open } from './headless.mjs';

const page = process.argv[2];
const b = await open({ width: 1100, height: 900 });
try {
  await b.go(pathToFileURL(path.resolve(page)).href, 1500);
  const out = await b.ev(`JSON.stringify([...document.querySelectorAll('.c')].map(c => {
    const svg = c.querySelector('svg'), issues = [];
    if (!svg) return null;
    const vb = svg.viewBox && svg.viewBox.baseVal, sr = svg.getBoundingClientRect();
    if (!vb || !vb.width) return { where: c.dataset.where, issues: ['viewBox がない'] };
    const k = sr.width / vb.width;
    const toVb = r => ({ x: (r.left - sr.left) / k + vb.x, y: (r.top - sr.top) / k + vb.y, w: r.width / k, h: r.height / k });
    const boxes = [];
    svg.querySelectorAll('text').forEach(t => {
      const r = t.getBoundingClientRect();
      if (!r.width || !t.textContent.trim()) return;
      const b = toVb(r), s = t.textContent.trim().slice(0, 10);
      if (b.x < vb.x - 2 || b.y < vb.y - 2 || b.x + b.w > vb.x + vb.width + 2 || b.y + b.h > vb.y + vb.height + 2) issues.push('文字が枠からはみ出す「' + s + '」');
      const px = parseFloat(getComputedStyle(t).fontSize) * (t.getScreenCTM() ? t.getScreenCTM().a : k);
      if (px < 10.5) issues.push('字が小さい「' + s + '」（' + px.toFixed(1) + 'px）');
      boxes.push({ b, s });
    });
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const p = boxes[i].b, q = boxes[j].b;
      const w = Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x), h = Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y);
      if (w > 0 && h > 0 && w * h > 0.25 * Math.min(p.w * p.h, q.w * q.h)) issues.push('文字が重なる「' + boxes[i].s + '」と「' + boxes[j].s + '」');
    }
    // 絵全体（svg の子の箱を合わせたもの）が枠からはみ出していないか
    let u = null;
    [...svg.children].forEach(el => {
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return;
      u = u ? { l: Math.min(u.l, r.left), t: Math.min(u.t, r.top), r: Math.max(u.r, r.right), b: Math.max(u.b, r.bottom) } : { l: r.left, t: r.top, r: r.right, b: r.bottom };
    });
    if (u) {
      const g = toVb({ left: u.l, top: u.t, width: u.r - u.l, height: u.b - u.t });
      if (g.x < vb.x - 4 || g.y < vb.y - 4 || g.x + g.w > vb.x + vb.width + 4 || g.y + g.h > vb.y + vb.height + 4) issues.push('絵が枠からはみ出す');
    }
    return { where: c.dataset.where, issues };
  }).filter(x => x && x.issues.length))`);
  console.log(out);
  if (b.errors.length) console.error(b.errors.join('\n'));
} finally {
  await b.close();
}
