/* ご意見の箱（Cloudflare Workers と D1、D-247）。
   - 画面の吹き出しのボタンから送られた短い文を、ページの住所と場所（単元・日・問題などの記号）といっしょに D1 に貯める。
   - 名前・メール・IP アドレスは保存しない。送りすぎを止めるため、IP と日付と秘密の塩から作った、日ごとに変わり IP に戻せない印（who）だけを残す。
   - 受けるのは ALLOWED_ORIGINS からの POST だけ。1 つの印から 1 日 20 通まで。
   設定：ALLOWED_ORIGINS は wrangler.toml、FEEDBACK_SALT は Cloudflare の secret（だれも値を知らなくてよい乱数）。 */
const MAX_TEXT = 1000, MAX_PER_DAY = 20;
const enc = new TextEncoder();
const clip = (v, n) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').slice(0, n);

async function mark(env, ip, day) {
  const h = await crypto.subtle.digest('SHA-256', enc.encode(`${ip}|${day}|${env.FEEDBACK_SALT || ''}`));
  return [...new Uint8Array(h)].slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    if (!origin || !(env.ALLOWED_ORIGINS || '').split(/\s+/).includes(origin)) return new Response('forbidden', { status: 403 });
    const cors = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return new Response('method', { status: 405, headers: cors });
    const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
    if (!env.FEEDBACK_SALT || !env.DB) return json({ error: 'config' }, 500);
    let b;
    try { b = await req.json(); } catch { return json({ error: 'json' }, 400); }
    const text = clip(b && b.text, MAX_TEXT + 1).trim();
    if (!text) return json({ error: 'empty' }, 400);
    if (text.length > MAX_TEXT) return json({ error: 'long' }, 413);
    const now = new Date(), day = now.toISOString().slice(0, 10);
    const who = await mark(env, req.headers.get('CF-Connecting-IP') || '', day);
    const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM notes WHERE who = ? AND at >= ?').bind(who, day).first();
    if (n && n.n >= MAX_PER_DAY) return json({ error: 'many' }, 429);
    await env.DB.prepare('INSERT INTO notes (at, page, place, kind, text, who) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(now.toISOString(), clip(b.page, 500), clip(b.place, 200), clip(b.kind, 20), text, who).run();
    return json({ ok: true });
  },
};
