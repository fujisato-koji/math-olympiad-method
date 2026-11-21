// ご意見の箱（feedback/worker.js）の試験。D1 は偽物。node feedback/test.mjs
import worker from './worker.js';

const rows = [];
const DB = {
  prepare(sql) {
    let args = [];
    const st = {
      bind(...a) { args = a; return st; },
      async first() { const [who, day] = args; return { n: rows.filter(r => r.who === who && r.at >= day).length }; },
      async run() { const [at, page, place, kind, text, who] = args; rows.push({ at, page, place, kind, text, who }); return { success: true }; },
    };
    if (!/^(SELECT|INSERT)/.test(sql)) throw new Error('想定外の SQL ' + sql);
    return st;
  },
};
const env = { ALLOWED_ORIGINS: 'https://michisuji.app', FEEDBACK_SALT: 'salt', DB };
const ORIGIN = 'https://michisuji.app';
const call = (body, { origin = ORIGIN, method = 'POST', ip = '203.0.113.7', e = env } = {}) =>
  worker.fetch(new Request('https://x.workers.dev/', {
    method, headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': ip },
    body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  }), e);

let ok = 0, ng = 0;
const t = async (name, f) => { try { await f(); console.log('✓', name); ok++; } catch (err) { console.log('✗', name, err.message); ng++; } };
const eq = (a, b) => { if (a !== b) throw new Error(`${a} ≠ ${b}`); };

await t('下調べ（OPTIONS）に答える', async () => eq((await call(null, { method: 'OPTIONS' })).status, 204));
await t('ほかの住所は断る', async () => eq((await call({ text: 'a' }, { origin: 'https://example.com' })).status, 403));
await t('POST のほかは断る', async () => eq((await call(null, { method: 'GET' })).status, 405));
await t('形の違う中身は 400', async () => eq((await call('{')).status, 400));
await t('空の文は 400', async () => eq((await call({ text: '   ' })).status, 400));
await t('1,000 字を超えると 413', async () => eq((await call({ text: 'あ'.repeat(1001) })).status, 413));
await t('塩がなければ 500', async () => eq((await call({ text: 'a' }, { e: { ...env, FEEDBACK_SALT: '' } })).status, 500));
await t('受けて貯める（IP は残さない）', async () => {
  const r = await call({ text: ' 3 日目の答えがちがう ', page: 'https://michisuji.app/#/day/N-001/3', place: '単元 N-001・3 日目', kind: '誤り' });
  eq(r.status, 200);
  const last = rows[rows.length - 1];
  eq(last.text, '3 日目の答えがちがう'); eq(last.kind, '誤り'); eq(last.place, '単元 N-001・3 日目');
  eq(JSON.stringify(last).includes('203.0.113.7'), false); eq(last.who.length, 16);
});
await t('同じ印から 1 日 20 通まで（21 通目は 429）、ほかの IP は受ける', async () => {
  rows.length = 0;
  for (let i = 0; i < 20; i++) eq((await call({ text: 'x' + i })).status, 200);
  eq((await call({ text: 'x20' })).status, 429);
  eq((await call({ text: 'y' }, { ip: '198.51.100.9' })).status, 200);
});
console.log(`${ok} 通過、${ng} 失敗`);
if (ng) process.exit(1);
