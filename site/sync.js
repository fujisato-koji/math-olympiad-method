/* 記録を Google ドライブに置く（D-049、D-052）。こちらのサーバは使わない。
   - ふだんは、ログインした人のドライブの、このページ専用の隠しフォルダ（appDataFolder）にファイルを 1 つ置く。
   - 家族と共有するときは、共有する人のドライブに見えるファイル「みちすじの記録」を作り、相手に編集の権限を付ける。
     共有された人は、Google のファイル選び（Picker）で一度そのファイルを選ぶ。どのファイルを使うかの目印（link）は、
     それぞれの隠しフォルダに置くので、同じアカウントのほかの端末では選び直さなくてよい。
   - ログインを保つサーバ（index.html の meta michisuji-auth、D-058）があれば、Google のコードの方式でログインする。
     サーバは更新の鍵を暗号にした塊（blob）を返し、端末はそれを localStorage に置く。鍵（約 1 時間）が切れたら、
     塊をサーバに渡して黙って取り直すので、ログインは切れない。サーバは何も保存せず、記録も通らない。
   - サーバがなければ、Google のトークン方式（ブラウザだけで完結し、約 1 時間で切れる）。
   - 鍵（アクセストークン）はこのタブの中（sessionStorage）だけに置く。
   - 権限は drive.appdata（このアプリの隠しフォルダ）と drive.file（このアプリで作ったファイルと、自分で選んだファイル）だけ。
   記録をどう合わせるかは app.js が決める。 */
(() => {
  'use strict';
  const SCOPE = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file';
  // 前のファイル（michisuji-store.json）では人が混ざったので使わない（D-051）
  const FILE = 'michisuji-records.json', LINK = 'michisuji-link.json', SHARED_NAME = 'みちすじの記録.json';
  const API = 'https://www.googleapis.com/drive/v3', UP = 'https://www.googleapis.com/upload/drive/v3';
  const TOKEN_KEY = 'michisuji.gtoken', KEEP_KEY = 'michisuji.gkeep';
  // granted は、いまの鍵で許された権限（空白で区切る）。前の版の鍵には入っていない（D-053）
  let client = null, token = null, exp = 0, granted = '', waiters = [];
  // authUrl はログインを保つサーバ、keep は塊と、その塊で許された権限（D-058）
  let authUrl = '', keep = null, resuming = null;
  const FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
  let fileId = null, linkId, link;  // linkId と link は、読むまで undefined
  try {
    const t = JSON.parse(sessionStorage.getItem(TOKEN_KEY) || 'null');
    if (t && t.exp > Date.now()) { token = t.token; exp = t.exp; granted = t.scope || ''; }
  } catch { /* 保存できない環境では、ログインのたびに聞く */ }
  try {
    const k = JSON.parse(localStorage.getItem(KEEP_KEY) || 'null');
    if (k && k.blob) { keep = k; if (!token) granted = k.scope || ''; }
  } catch { /* 置けない環境では、鍵が切れるたびにつなぎ直す */ }

  function loadScript(src, ready) {
    return new Promise((ok, ng) => {
      if (ready()) return ok();
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = ok; s.onerror = () => { s.remove(); ng(navigator.onLine === false ? offline() : new Error('Google の部品を読み込めませんでした')); };
      document.head.appendChild(s);
    });
  }
  const settle = (fn, arg) => { const w = waiters; waiters = []; w.forEach(x => x[fn](arg)); };
  // Google かサーバから受けた鍵を持つ
  function take(r) {
    token = r.access_token; exp = Date.now() + (Number(r.expires_in || 3600) - 60) * 1000; granted = r.scope || '';
    try { sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ token, exp, scope: granted })); } catch { /* 同上 */ }
    return token;
  }
  function setKeep(k) {
    keep = k && k.blob ? k : null;
    try { if (keep) localStorage.setItem(KEEP_KEY, JSON.stringify(keep)); else localStorage.removeItem(KEEP_KEY); } catch { /* 同上 */ }
  }
  const offline = () => Object.assign(new Error('つながっていません'), { code: 'offline' });
  // ログインを保つサーバを呼ぶ。開けない塊や取り消された鍵（401）は code: 'auth'
  async function post(path, body) {
    let r;
    try {
      r = await fetch(authUrl + path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XmlHttpRequest' }, body: JSON.stringify(body) });
    } catch { throw offline(); }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error('ログインのサーバが ' + r.status + ' を返しました' + (j.error ? `：${j.error}` : '')), { status: r.status, code: r.status === 401 ? 'auth' : undefined });
    return j;
  }
  // ログインで受けた一回きりの番号を、サーバで鍵と塊に換える
  async function exchange(code) {
    const j = await post('/auth', { code });
    take(j);
    if (j.blob) setKeep({ blob: j.blob, scope: granted });
    return token;
  }
  async function init(clientId, auth) {
    if (client) return;
    authUrl = (auth || '').replace(/\/+$/, '');
    await loadScript('https://accounts.google.com/gsi/client', () => window.google && google.accounts && google.accounts.oauth2);
    const error_callback = e => settle('ng', Object.assign(new Error((e && e.type) || 'popup_failed'), { code: (e && e.type) || 'popup_failed' }));
    // コードの方式では、Google はログインのたびに同意の画面を出し、更新の鍵を必ず付ける（access_type=offline、prompt=consent）
    client = authUrl ? google.accounts.oauth2.initCodeClient({
      client_id: clientId, scope: SCOPE, ux_mode: 'popup', error_callback,
      callback: r => r.error ? settle('ng', new Error(r.error)) : exchange(r.code).then(t => settle('ok', t), e => settle('ng', e)),
    }) : google.accounts.oauth2.initTokenClient({
      client_id: clientId, scope: SCOPE, error_callback,
      callback: r => r.error ? settle('ng', new Error(r.error)) : settle('ok', take(r)),
    });
  }
  const valid = () => !!token && Date.now() < exp;
  // 鍵が切れていても、塊があれば窓を開かずに取り直せる
  const usable = () => valid() || !!(authUrl && keep);
  // 鍵が切れていたら、塊から取り直す。取り直せたら true。塊が使えなくなっていたら捨てて false
  function resume() {
    if (valid()) return Promise.resolve(true);
    if (!authUrl || !keep) return Promise.resolve(false);
    if (!resuming) {
      const blob = keep.blob;
      resuming = post('/token', { blob }).then(j => {
        take(j);
        if (keep) setKeep({ blob: j.blob || blob, scope: granted });  // 取り直すあいだに「つながない」を押したら、置き直さない
        return true;
      }, e => { if (e.code === 'auth') { setKeep(null); return false; } throw e; }).finally(() => { resuming = null; });
    }
    return resuming;
  }
  // 家族と共有するには、ファイルの権限（drive.file）の入った鍵が要る。なければ、押したその場でログインし直す
  const hasFile = () => granted.split(' ').includes(FILE_SCOPE);
  const needsConsent = () => !usable() || !hasFile();
  // ログイン：ボタンを押したときだけ呼ぶ（Google の確認の窓を開くので、押したその場で呼ぶ）
  function signIn() {
    return new Promise((ok, ng) => {
      if (!client) return ng(new Error('Google のログインの準備ができていません'));
      waiters.push({ ok, ng });
      if (authUrl) client.requestCode(); else client.requestAccessToken({ prompt: '' });
    });
  }
  // この端末でつなぐのをやめる。サーバを使うときは、Google の許可を取り消さない（取り消すと、ほかの端末の塊も使えなくなる）。
  // この端末の塊を捨てるだけにする。すべての端末でやめるときは、Google アカウントの設定で取り消す
  function signOut() {
    if (!authUrl && token && window.google && google.accounts && google.accounts.oauth2) google.accounts.oauth2.revoke(token, () => {});
    token = null; exp = 0; granted = ''; fileId = null; linkId = undefined; link = undefined;
    setKeep(null);
    try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* 同上 */ }
  }
  const authError = () => Object.assign(new Error('ログインが切れました'), { code: 'auth' });
  async function call(url, opt = {}, again = true) {
    if (!(await resume())) throw authError();
    let r;
    try { r = await fetch(url, { ...opt, headers: { ...(opt.headers || {}), Authorization: 'Bearer ' + token } }); } catch { throw offline(); }
    // 鍵が先に切れていたら（取り消されたときなど）、塊から一度だけ取り直して試す
    if (r.status === 401) { token = null; exp = 0; if (again && authUrl && keep) return call(url, opt, false); throw authError(); }
    if (!r.ok) {
      // 断られた理由を出す。権限が足りないとき（前の版の鍵など）は code: 'scope'
      const j = await r.json().catch(() => null), e0 = j && j.error, reason = (e0 && ((e0.errors && e0.errors[0] && e0.errors[0].reason) || e0.status)) || '';
      const scope = r.status === 403 && /insufficientPermissions|insufficientScopes|ACCESS_TOKEN_SCOPE_INSUFFICIENT|PERMISSION_DENIED/i.test(reason + ' ' + ((e0 && e0.message) || ''));
      throw Object.assign(new Error('ドライブが ' + r.status + ' を返しました' + (reason ? `：${reason}` : '')), { status: r.status, code: scope ? 'scope' : undefined });
    }
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
  // 共有の目印は毎回読み直す（開いたままの画面でも、ほかの端末で共有を始めたりやめたりしたのが入るように、D-058）
  async function pull() {
    link = undefined;
    const l = await readLink();
    if (l && l.fileId) {
      try { return (await call(`${API}/files/${l.fileId}?alt=media`)).json(); } catch (e) { if (e.code !== 'scope' && (e.status === 404 || e.status === 403)) e.code = 'gone'; throw e; }
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
    // お知らせのメールに、共有の記録を開く専用のリンクを入れる（D-054）。添付のように見えるファイルは開かなくてよい
    const url = location.origin + location.pathname + '#/join/' + l.fileId;
    const msg = encodeURIComponent(`みちすじの記録を共有しました。次のリンクを開いて「記録を開く」を押してください（下のファイルは開かなくて大丈夫です）。\n${url}`);
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
  // only を渡すと、そのファイルだけを並べる（共有の専用のリンクから開いたとき、D-054）
  async function pick(apiKey, appId, only) {
    if (!(await resume())) throw authError();
    await loadScript('https://apis.google.com/js/api.js', () => window.gapi);
    await new Promise(ok => gapi.load('picker', ok));
    const id = await new Promise(ok => {
      const view = new google.picker.DocsView(google.picker.ViewId.DOCS).setMimeTypes('application/json');
      if (only) view.setFileIds(only); else view.setQuery('みちすじの記録');
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
  window.DriveSync = { init, signIn, signOut, pull, push, who, valid, usable, hasFile, needsConsent, share, members, pick, leave, readLink,
    get ready() { return !!client; }, get linked() { return link || null; } };
})();
