// ログインを保つサーバ（worker.js、D-058）の確かめ。Google の返事はここで作る。node auth/test.mjs
import worker from './worker.js';
import assert from 'node:assert/strict';

const ORIGIN = 'https://fujisato-koji.github.io';
const env = { GOOGLE_CLIENT_ID: 'cid', GOOGLE_CLIENT_SECRET: 'secret-1', ALLOWED_ORIGINS: ORIGIN };
const google = { calls: [], revoked: new Set(), redirect: ORIGIN, rotate: false };
globalThis.fetch = async (url, opt) => {
  assert.equal(url, 'https://oauth2.googleapis.com/token');
  const p = Object.fromEntries(new URLSearchParams(opt.body));
  google.calls.push(p);
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  if (p.client_id !== 'cid' || p.client_secret !== 'secret-1') return json(401, { error: 'invalid_client' });
  if (p.grant_type === 'authorization_code') {
    if (p.redirect_uri !== google.redirect) return json(400, { error: 'redirect_uri_mismatch' });
    if (p.code !== 'good-code') return json(400, { error: 'invalid_grant' });
    return json(200, { access_token: 'at-1', expires_in: 3599, scope: 'drive.appdata drive.file', refresh_token: 'rt-1' });
  }
  if (p.grant_type === 'refresh_token') {
    if (google.revoked.has(p.refresh_token)) return json(400, { error: 'invalid_grant' });
    return json(200, { access_token: 'at-2', expires_in: 3599, scope: 'drive.appdata drive.file', ...(google.rotate ? { refresh_token: 'rt-2' } : {}) });
  }
  return json(400, { error: 'unsupported_grant_type' });
};
const call = (path, body, { origin = ORIGIN, method = 'POST', e = env } = {}) => worker.fetch(new Request('https://michisuji-auth.example.workers.dev' + path, {
  method, headers: { ...(origin ? { Origin: origin } : {}), 'Content-Type': 'application/json' }, ...(method === 'POST' ? { body: JSON.stringify(body) } : {}) }), e);
const ok = [];
const check = async (name, fn) => { await fn(); ok.push(name); };

let blob;
await check('ログインで塊が返り、塊に更新の鍵がそのまま見えない', async () => {
  const r = await call('/auth', { code: 'good-code' }), j = await r.json();
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  assert.equal(j.access_token, 'at-1');
  assert.match(j.blob, /^v1\./);
  assert.ok(!j.blob.includes('rt-1') && !Buffer.from(j.blob.slice(3), 'base64url').toString('latin1').includes('rt-1'));
  assert.equal(google.calls.at(-1).redirect_uri, ORIGIN);
  blob = j.blob;
});
await check('交換の redirect_uri が合わないと言われたら postmessage で試す', async () => {
  google.redirect = 'postmessage';
  const r = await call('/auth', { code: 'good-code' });
  assert.equal(r.status, 200);
  assert.deepEqual(google.calls.slice(-2).map(c => c.redirect_uri), [ORIGIN, 'postmessage']);
  google.redirect = ORIGIN;
});
await check('塊から取り直せる', async () => {
  const r = await call('/token', { blob }), j = await r.json();
  assert.equal(r.status, 200);
  assert.equal(j.access_token, 'at-2');
  assert.equal(google.calls.at(-1).refresh_token, 'rt-1');
  assert.equal(j.blob, undefined);
});
await check('Google が更新の鍵を替えたら、新しい塊を返す', async () => {
  google.rotate = true;
  const j = await (await call('/token', { blob })).json();
  assert.match(j.blob, /^v1\./);
  assert.notEqual(j.blob, blob);
  google.rotate = false;
});
await check('書き換えた塊、形の違う塊は 401', async () => {
  const bad = blob.slice(0, -4) + (blob.endsWith('AAAA') ? 'BBBB' : 'AAAA');
  for (const b of [bad, 'v1.xyz', 'rt-1', '', null, 'v1.' + 'A'.repeat(5000)]) assert.equal((await call('/token', { blob: b })).status, 401, String(b).slice(0, 20));
});
await check('シークレットを替えると、前の塊は開けない', async () => {
  assert.equal((await call('/token', { blob }, { e: { ...env, GOOGLE_CLIENT_SECRET: 'secret-2' } })).status, 401);
});
await check('取り消された鍵は 401（画面はつなぎ直しを求める）', async () => {
  google.revoked.add('rt-1');
  const r = await call('/token', { blob });
  assert.equal(r.status, 401);
  assert.equal((await r.json()).error, 'invalid_grant');
  google.revoked.delete('rt-1');
});
await check('使えない番号は 400、変な番号は Google に送らない', async () => {
  assert.equal((await call('/auth', { code: 'bad-code' })).status, 400);
  const n = google.calls.length;
  for (const c of ['', 5, 'x'.repeat(3000)]) assert.equal((await call('/auth', { code: c })).status, 400);
  assert.equal(google.calls.length, n);
});
await check('ほかのページからは受けない', async () => {
  assert.equal((await call('/auth', { code: 'good-code' }, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await call('/token', { blob }, { origin: '' })).status, 403);
});
await check('下調べ（OPTIONS）に答え、POST のほかは断る', async () => {
  const r = await call('/token', null, { method: 'OPTIONS' });
  assert.equal(r.status, 204);
  assert.match(r.headers.get('Access-Control-Allow-Headers'), /Content-Type/);
  assert.equal((await call('/token', null, { method: 'GET' })).status, 405);
  assert.equal((await call('/nothing', {})).status, 404);
});
await check('シークレットが入っていなければ 500', async () => {
  assert.equal((await call('/token', { blob }, { e: { ...env, GOOGLE_CLIENT_SECRET: '' } })).status, 500);
});
console.log(ok.map(s => '✓ ' + s).join('\n'));
