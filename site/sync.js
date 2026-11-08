/* 記録を Google ドライブに置く（D-049、D-052）。こちらのサーバは使わない。
   - ふだんは、ログインした人のドライブの、このページ専用の隠しフォルダ（appDataFolder）にファイルを 1 つ置く。
   - 家族と共有するときは、共有する人のドライブに見えるファイル「みちすじの記録」を作り、相手に編集の権限を付ける。
     共有された人は、Google のファイル選び（Picker）で一度そのファイルを選ぶ。どのファイルを使うかの目印（link）は、
     それぞれの隠しフォルダに置くので、同じアカウントのほかの端末では選び直さなくてよい。
   - ログインは Google のトークン方式（ブラウザだけで完結し、約 1 時間で切れる）。トークンはこのタブの中（sessionStorage）だけに置く。
   - 権限は drive.appdata（このアプリの隠しフォルダ）と drive.file（このアプリで作ったファイルと、自分で選んだファイル）だけ。
   記録をどう合わせるかは app.js が決める。 */
(() => {
  'use strict';
  const SCOPE = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file';
  // 前のファイル（michisuji-store.json）では人が混ざったので使わない（D-051）
  const FILE = 'michisuji-records.json', LINK = 'michisuji-link.json', SHARED_NAME = 'みちすじの記録.json';
  const API = 'https://www.googleapis.com/drive/v3', UP = 'https://www.googleapis.com/upload/drive/v3';
  const TOKEN_KEY = 'michisuji.gtoken';
  let client = null, token = null, exp = 0, waiters = [];
  let fileId = null, linkId, link;  // linkId と link は、読むまで undefined
  try {
    const t = JSON.parse(sessionStorage.getItem(TOKEN_KEY) || 'null');
    if (t && t.exp > Date.now()) { token = t.token; exp = t.exp; }
  } catch { /* 保存できない環境では、ログインのたびに聞く */ }

  function loadScript(src, ready) {
    return new Promise((ok, ng) => {
      if (ready()) return ok();
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = ok; s.onerror = () => ng(new Error('Google の部品を読み込めませんでした'));
      document.head.appendChild(s);
    });
  }
  const settle = (fn, arg) => { const w = waiters; waiters = []; w.forEach(x => x[fn](arg)); };
  async function init(clientId) {
    if (client) return;
    await loadScript('https://accounts.google.com/gsi/client', () => window.google && google.accounts && google.accounts.oauth2);
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
    token = null; exp = 0; fileId = null; linkId = undefined; link = undefined;
    try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* 同上 */ }
  }
  const authError = () => Object.assign(new Error('ログインが切れました'), { code: 'auth' });
  async function call(url, opt = {}) {
    if (!valid()) throw authError();
    const r = await fetch(url, { ...opt, headers: { ...(opt.headers || {}), Authorization: 'Bearer ' + token } });
    if (r.status === 401) { token = null; exp = 0; throw authError(); }
    if (!r.ok) throw Object.assign(new Error('ドライブが ' + r.status + ' を返しました'), { status: r.status });
    return r;
  }
  const multipart = (meta, body) => {
    const b = 'michisuji' + Math.random().toString(36).slice(2);
    return { type: `multipart/related; boundary=${b}`,
      body: `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${b}--` };
  };
  async function create(meta, body) {
    const m = multipart(meta, body);
    return (await (await call(`${UP}/files?uploadType=multipart&fields=id`, { method: 'POST', headers: { 'Content-Type': m.type }, body: m.body })).json()).id;
  }
  const patch = (id, body) => call(`${UP}/files/${id}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body });
  async function appFind(name) {
    const q = encodeURIComponent(`name='${name}'`);
    const r = await (await call(`${API}/files?spaces=appDataFolder&q=${q}&orderBy=modifiedTime%20desc&fields=files(id%2CmodifiedTime)`)).json();
    return r.files && r.files.length ? r.files[0].id : null;
  }
  // 共有の目印：{fileId, mine}。共有していなければ null
  async function readLink() {
    if (link !== undefined) return link;
    linkId = await appFind(LINK);
    link = linkId ? await (await call(`${API}/files/${linkId}?alt=media`)).json() : null;
    if (!link || !link.fileId) link = null;  // 形の違う中身は、共有していないとみなす
    return link;
  }
  async function writeLink(v) {
    await readLink();
    if (!v) { if (linkId) await call(`${API}/files/${linkId}`, { method: 'DELETE' }); linkId = null; link = null; return; }
    if (linkId) await patch(linkId, JSON.stringify(v));
    else linkId = await create({ name: LINK, parents: ['appDataFolder'], mimeType: 'application/json' }, JSON.stringify(v));
    link = v;
  }
  // 読む：ファイルがなければ null。共有のファイルが消えたか、権限がなくなったときは code: 'gone'
  async function pull() {
    const l = await readLink();
    if (l && l.fileId) {
      try { return (await call(`${API}/files/${l.fileId}?alt=media`)).json(); } catch (e) { if (e.status === 404 || e.status === 403) e.code = 'gone'; throw e; }
    }
    if (!fileId) fileId = await appFind(FILE);
    return fileId ? (await call(`${API}/files/${fileId}?alt=media`)).json() : null;
  }
  // 書く：共有していれば共有のファイルに、していなければ隠しフォルダのファイルに
  async function push(data) {
    const body = JSON.stringify(data), l = await readLink();
    if (l && l.fileId) { await patch(l.fileId, body); return; }
    if (!fileId) fileId = await appFind(FILE);
    if (fileId) await patch(fileId, body);
    else fileId = await create({ name: FILE, parents: ['appDataFolder'], mimeType: 'application/json' }, body);
  }
  // 家族と共有する：まだなら、自分のドライブに見えるファイルを作って記録を入れ、相手に編集の権限を付ける（Google から相手にお知らせが届く）
  async function share(email, data) {
    let l = await readLink();
    if (!l || !l.fileId) {
      const id = await create({ name: SHARED_NAME, mimeType: 'application/json',
        description: 'みちすじ（https://fujisato-koji.github.io/math-olympiad-method/）の記録。家族と共有しています。' }, JSON.stringify(data));
      await writeLink({ fileId: id, mine: true });
      l = link;
    }
    const msg = encodeURIComponent('みちすじの記録を共有しました。https://fujisato-koji.github.io/math-olympiad-method/ を開き、記録の窓の「共有された記録を開く」から、このファイルを選んでください。');
    await call(`${API}/files/${l.fileId}/permissions?sendNotificationEmail=true&emailMessage=${msg}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'user', role: 'writer', emailAddress: email }) });
  }
  // 共有している人（取れなければ空）
  async function members() {
    const l = await readLink();
    if (!l || !l.fileId) return [];
    try {
      const r = await (await call(`${API}/files/${l.fileId}/permissions?fields=permissions(emailAddress%2Crole%2CdisplayName)`)).json();
      return (r.permissions || []).filter(p => p.emailAddress);
    } catch { return []; }
  }
  // 共有された記録を開く：Google のファイル選びで「みちすじの記録」を選ぶ。選んだら目印を置き、以後はそのファイルを使う
  async function pick(apiKey, appId) {
    await loadScript('https://apis.google.com/js/api.js', () => window.gapi);
    await new Promise(ok => gapi.load('picker', ok));
    const id = await new Promise(ok => {
      const view = new google.picker.DocsView(google.picker.ViewId.DOCS).setMimeTypes('application/json').setQuery('みちすじの記録');
      new google.picker.PickerBuilder().addView(view).setOAuthToken(token).setDeveloperKey(apiKey).setAppId(appId)
        .setTitle('みちすじの記録を選ぶ').setLocale('ja')
        .setCallback(d => {
          if (d.action === google.picker.Action.PICKED) ok(d.docs && d.docs[0] && d.docs[0].id);
          else if (d.action === google.picker.Action.CANCEL) ok(null);
        }).build().setVisible(true);
    });
    if (id) await writeLink({ fileId: id, mine: false });
    return id;
  }
  // 共有をやめる：目印を消し、自分の隠しフォルダのファイルに戻る（共有のファイルそのものは消さない）
  const leave = () => writeLink(null);
  // だれのドライブか（画面に出すだけ。どこにも送らない）。取れなければ null
  async function who() {
    try { return (await (await call(`${API}/about?fields=user(emailAddress%2CdisplayName)`)).json()).user || null; } catch { return null; }
  }
  window.DriveSync = { init, signIn, signOut, pull, push, who, valid, share, members, pick, leave, readLink,
    get ready() { return !!client; }, get linked() { return link || null; } };
})();
