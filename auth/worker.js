/* ログインを保つ小さなサーバ（Cloudflare Workers、D-058）。
   - Google のコードの方式で画面が受けた一回きりの番号（code）を、アクセストークンと更新の鍵（リフレッシュトークン）に換える。
   - 更新の鍵はここに置かない。暗号にした塊（blob）にして画面へ返し、画面がその塊を持ってきたら、アクセストークンを取り直す。
   - 記録（ドライブの中身）はここを通らない。何も保存しない（R-23 のまま）。
   設定：GOOGLE_CLIENT_ID と ALLOWED_ORIGINS は wrangler.toml（公開してよい値）、
   GOOGLE_CLIENT_SECRET は Cloudflare の secret（施主がダッシュボードで入れる。リポジトリにも Claude にも渡さない）。 */
const TOKEN = 'https://oauth2.googleapis.com/token';
const enc = new TextEncoder(), dec = new TextDecoder();
const AAD = enc.encode('michisuji-blob-v1');
const b64u = a => btoa(String.fromCharCode(...a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

// 塊を閉じる鍵は、クライアント シークレットから導く（入れていただく秘密を 1 つにするため）。
// シークレットを替えると、すべての端末の塊が開けなくなり、各端末で一度つなぎ直す
async function sealKey(env) {
  const base = await crypto.subtle.importKey('raw', enc.encode(env.GOOGLE_CLIENT_SECRET), 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: enc.encode('michisuji'), info: enc.encode('refresh-blob-v1') },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function seal(env, rt) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: AAD }, await sealKey(env),
    enc.encode(JSON.stringify({ rt, t: Date.now() }))));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv); out.set(ct, iv.length);
  return 'v1.' + b64u(out);
}
// 開けない塊（形が違う、鍵が替わった、書き換えられた）は null
async function unseal(env, blob) {
  if (typeof blob !== 'string' || !blob.startsWith('v1.') || blob.length > 4096) return null;
  try {
    const b = unb64u(blob.slice(3));
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b.slice(0, 12), additionalData: AAD }, await sealKey(env), b.slice(12));
    return JSON.parse(dec.decode(pt)).rt || null;
  } catch { return null; }
}
async function google(env, params) {
  const r = await fetch(TOKEN, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, ...params }) });
  return { ok: r.ok, status: r.status, j: await r.json().catch(() => ({})) };
}
const tokens = j => ({ access_token: j.access_token, expires_in: j.expires_in, scope: j.scope || '' });

export default {
  async fetch(req, env) {
    // 公開ページからの呼び出しだけを受ける（ブラウザの外からは Origin を偽れるが、塊がなければ何も取れない）
    const origin = req.headers.get('Origin') || '';
    if (!(env.ALLOWED_ORIGINS || '').split(/\s+/).includes(origin) || !origin) return new Response('forbidden', { status: 403 });
    const cors = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With', 'Access-Control-Max-Age': '86400', Vary: 'Origin' };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const reply = (status, body) => new Response(JSON.stringify(body), { status,
      headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    if (req.method !== 'POST') return reply(405, { error: 'method' });
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return reply(500, { error: 'not_configured' });
    let input;
    try { input = await req.json(); } catch { return reply(400, { error: 'bad_request' }); }
    const path = new URL(req.url).pathname;

    // ログイン：番号を換え、更新の鍵を塊にして返す
    if (path === '/auth') {
      const code = input && input.code;
      if (typeof code !== 'string' || !code || code.length > 2048) return reply(400, { error: 'bad_request' });
      // ポップアップでは、交換の redirect_uri は呼んだページの origin（Google の説明）。合わないと言われたら、前からの書き方 postmessage で試す
      let g = await google(env, { grant_type: 'authorization_code', code, redirect_uri: origin });
      if (!g.ok && g.j.error === 'redirect_uri_mismatch') g = await google(env, { grant_type: 'authorization_code', code, redirect_uri: 'postmessage' });
      if (!g.ok) return reply(g.status === 400 ? 400 : 502, { error: g.j.error || 'google' });
      return reply(200, { ...tokens(g.j), blob: g.j.refresh_token ? await seal(env, g.j.refresh_token) : null });
    }
    // 取り直す：塊を開き、更新の鍵でアクセストークンを取る。取り消された鍵や開けない塊は 401（画面はつなぎ直しを求める）
    if (path === '/token') {
      const rt = await unseal(env, input && input.blob);
      if (!rt) return reply(401, { error: 'invalid_blob' });
      const g = await google(env, { grant_type: 'refresh_token', refresh_token: rt });
      if (!g.ok) return reply(g.j.error === 'invalid_grant' ? 401 : 502, { error: g.j.error || 'google' });
      return reply(200, { ...tokens(g.j), ...(g.j.refresh_token ? { blob: await seal(env, g.j.refresh_token) } : {}) });
    }
    return reply(404, { error: 'not_found' });
  },
};
