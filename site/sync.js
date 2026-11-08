/* 記録を Google ドライブに置く（D-049）。ログインした人のドライブの、このページ専用の隠しフォルダ（appDataFolder）に 1 つのファイルで置く。
   こちらのサーバは使わない。ログインは Google のトークン方式（ブラウザだけで完結し、約 1 時間で切れる）。
   トークンはこのタブの中（sessionStorage）だけに置く。記録をどう合わせるかは app.js が決める。 */
(() => {
  'use strict';
  const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
  const FILE = 'michisuji-store.json';
  const API = 'https://www.googleapis.com/drive/v3', UP = 'https://www.googleapis.com/upload/drive/v3';
  const TOKEN_KEY = 'michisuji.gtoken';
  let client = null, token = null, exp = 0, fileId = null, waiters = [];
  try {
    const t = JSON.parse(sessionStorage.getItem(TOKEN_KEY) || 'null');
    if (t && t.exp > Date.now()) { token = t.token; exp = t.exp; }
  } catch { /* 保存できない環境では、ログインのたびに聞く */ }

  function loadGis() {
    return new Promise((ok, ng) => {
      if (window.google && google.accounts && google.accounts.oauth2) return ok();
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
      s.onload = ok; s.onerror = () => ng(new Error('Google のログインを読み込めませんでした'));
      document.head.appendChild(s);
    });
  }
  const settle = (fn, arg) => { const w = waiters; waiters = []; w.forEach(x => x[fn](arg)); };
  async function init(clientId) {
    if (client) return;
    await loadGis();
    client = google.accounts.oauth2.initTokenClient({
      client_id: clientId, scope: SCOPE,
      callback: r => {
        if (r.error) return settle('ng', new Error(r.error));
        token = r.access_token; exp = Date.now() + (Number(r.expires_in || 3600) - 60) * 1000;
        try { sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ token, exp })); } catch { /* 同上 */ }
        settle('ok', token);
      },
      error_callback: e => settle('ng', Object.assign(new Error((e && e.type) || 'popup_failed'), { code: (e && e.type) || 'popup_failed' })),
    });
  }
  const valid = () => !!token && Date.now() < exp;
  // ログイン：ボタンを押したときだけ呼ぶ（Google の確認の窓を開くので、押したその場で呼ぶ）
  function signIn() {
    return new Promise((ok, ng) => {
      if (!client) return ng(new Error('Google のログインの準備ができていません'));
      waiters.push({ ok, ng });
      client.requestAccessToken({ prompt: '' });
    });
  }
  function signOut() {
    if (token && window.google && google.accounts && google.accounts.oauth2) google.accounts.oauth2.revoke(token, () => {});
    token = null; exp = 0; fileId = null;
    try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* 同上 */ }
  }
  const authError = () => Object.assign(new Error('ログインが切れました'), { code: 'auth' });
  async function call(url, opt = {}) {
    if (!valid()) throw authError();
    const r = await fetch(url, { ...opt, headers: { ...(opt.headers || {}), Authorization: 'Bearer ' + token } });
    if (r.status === 401) { token = null; exp = 0; throw authError(); }
    if (!r.ok) throw new Error('ドライブが ' + r.status + ' を返しました');
    return r;
  }
  async function find() {
    if (fileId) return fileId;
    const q = encodeURIComponent(`name='${FILE}'`);
    const r = await (await call(`${API}/files?spaces=appDataFolder&q=${q}&orderBy=modifiedTime%20desc&fields=files(id%2CmodifiedTime)`)).json();
    fileId = r.files && r.files.length ? r.files[0].id : null;
    return fileId;
  }
  // 読む：ファイルがなければ null
  async function pull() {
    const id = await find();
    return id ? (await call(`${API}/files/${id}?alt=media`)).json() : null;
  }
  // 書く：あれば中身を置き換え、なければ隠しフォルダに作る
  async function push(data) {
    const body = JSON.stringify(data), id = await find();
    if (id) {
      await call(`${UP}/files/${id}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body });
      return;
    }
    const b = 'michisuji' + Math.random().toString(36).slice(2);
    const meta = JSON.stringify({ name: FILE, parents: ['appDataFolder'], mimeType: 'application/json' });
    const multi = `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${b}--`;
    const r = await (await call(`${UP}/files?uploadType=multipart&fields=id`, { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${b}` }, body: multi })).json();
    fileId = r.id;
  }
  // だれのドライブか（画面に出すだけ。どこにも送らない）。取れなければ null
  async function who() {
    try { return (await (await call(`${API}/about?fields=user(emailAddress%2CdisplayName)`)).json()).user || null; } catch { return null; }
  }
  window.DriveSync = { init, signIn, signOut, pull, push, who, valid, get ready() { return !!client; } };
})();
