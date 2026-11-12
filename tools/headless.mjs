// 画面なしのブラウザで画面を確かめる道具（D-125）。
// ブラウザのプロフィール（1 回 15〜110 MB）は OS の一時フォルダ（リポジトリと Documents の外）に作り、
// 終わったら消す。途中で止まったとき（Ctrl+C、例外）も消す。リポジトリの中（.tmp など）には何も作らない。
//
// 使い方（node 22 以上。組み込みの WebSocket を使う）：
//   import { open } from './tools/headless.mjs';
//   const b = await open({ width: 1300, height: 860 });   // Edge（なければ Chrome）を立てる
//   await b.go('http://127.0.0.1:8765/index.html');       // 開く（キャッシュと Service Worker は通さない）
//   console.log(await b.ev('document.title'));            // 式を評価して値を返す
//   await b.shot('C:/…/out.png');                         // 撮る（置き場はリポジトリの外に）
//   console.log(b.errors);                                // 例外とコンソールの誤り
//   await b.close();                                      // ブラウザを止め、プロフィールを消す
// コマンドとしても使える：node tools/headless.mjs <url> <png> [幅] [高さ] [待つ秒]
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const BROWSERS = [
  process.env.HEADLESS_BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

const live = new Set();   // 止めていないブラウザ（途中で止まったときの後片付け用）
function kill(child) {
  try {
    if (process.platform === 'win32') execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    else child.kill('SIGKILL');
  } catch { /* もう止まっている */ }
}
function removeSync(dir) {
  for (let i = 0; i < 20; i++) {
    try { fs.rmSync(dir, { recursive: true, force: true }); if (!fs.existsSync(dir)) return true; } catch { /* ブラウザがまだ握っている */ }
    const t = Date.now() + 250; while (Date.now() < t) { /* 少し待つ */ }
  }
  return !fs.existsSync(dir);
}
function cleanupAll() {
  for (const b of live) { kill(b.child); removeSync(b.profile); }
  live.clear();
}
process.on('exit', cleanupAll);
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => { cleanupAll(); process.exit(130); });
process.on('uncaughtException', e => { console.error(e); cleanupAll(); process.exit(1); });

export async function open({ width = 1300, height = 860, port = 9200 + Math.floor(Math.random() * 700), browser } = {}) {
  const exe = browser || BROWSERS.find(p => fs.existsSync(p));
  if (!exe) throw new Error('Edge か Chrome が見つからない（HEADLESS_BROWSER で場所を渡せる）');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'michisuji-headless-'));
  const child = spawn(exe, ['--headless=new', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--hide-scrollbars',
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, `--window-size=${width},${height}`, 'about:blank'], { stdio: 'ignore' });
  const b = { child, profile, errors: [] };
  live.add(b);
  let version = null;
  for (let i = 0; i < 80 && !version; i++) {
    try { version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await sleep(250); }
  }
  if (!version) { await close(); throw new Error(`ブラウザにつながらない（口 ${port}）`); }
  const page = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  let id = 0; const wait = new Map();
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') b.errors.push('例外 ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 400));
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') b.errors.push('console.error ' + JSON.stringify(m.params.args.map(a => a.value ?? a.description)).slice(0, 400));
  });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Network.setBypassServiceWorker', { bypass: true });
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  async function close() {
    try { ws.close(); } catch { /* */ }
    kill(child);
    await sleep(300);
    removeSync(profile);
    live.delete(b);
  }
  return Object.assign(b, {
    send,
    ev: async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value,
    go: async (url, ms = 5000) => { await send('Page.navigate', { url }); await sleep(ms); },
    shot: async file => { const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(file, Buffer.from(s.result.data, 'base64')); return file; },
    close,
  });
}

// コマンドとして：node tools/headless.mjs <url> <png> [幅] [高さ] [待つ秒]
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const [url, png, w = '1300', h = '860', sec = '6'] = process.argv.slice(2);
  if (!url || !png) { console.error('使い方：node tools/headless.mjs <url> <png> [幅] [高さ] [待つ秒]'); process.exit(2); }
  const b = await open({ width: +w, height: +h });
  try {
    await b.go(url, +sec * 1000);
    await b.shot(path.resolve(png));
    console.log('撮った', path.resolve(png));
    console.log(b.errors.length ? b.errors.join('\n') : '例外なし');
  } finally {
    await b.close();
  }
}
