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
const PREFIX = 'michisuji-headless-';
function kill(child) {
  try {
    if (process.platform === 'win32') execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    else child.kill('SIGKILL');
  } catch { /* もう止まっている */ }
}
// 待つあいだ CPU を回さない（前は空回りの繰り返しで待っていた。D-132）
const sleepSync = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
function removeSync(dir, tries = 8) {
  for (let i = 0; i < tries; i++) {
    try { fs.rmSync(dir, { recursive: true, force: true }); if (!fs.existsSync(dir)) return true; } catch { /* ブラウザかウイルス対策がまだ握っている */ }
    sleepSync(250);
  }
  return !fs.existsSync(dir);
}
async function removeAsync(dir, ms = 30000) {
  for (const t0 = Date.now(); Date.now() - t0 < ms;) {
    try { await fs.promises.rm(dir, { recursive: true, force: true }); if (!fs.existsSync(dir)) return true; } catch { /* まだ握っている */ }
    await sleep(500);
  }
  return !fs.existsSync(dir);
}
// 前に消しそこねたプロフィールを掃除する（D-132）。3 時間より古く、使っていないもの（lockfile が消せる）だけ。
// 1 回に max 個まで。ほかの道具と同時に掃除しないよう、目印のファイルで 2 分に 1 回にする。
export async function sweep({ hours = 3, max = 30 } = {}) {
  const tmp = os.tmpdir(), stamp = path.join(tmp, PREFIX + 'sweep.stamp');
  try { if (Date.now() - fs.statSync(stamp).mtimeMs < 120000) return 0; } catch { /* 目印がない */ }
  try { fs.writeFileSync(stamp, String(process.pid)); } catch { return 0; }
  let n = 0;
  const old = fs.readdirSync(tmp, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.startsWith(PREFIX))
    .map(d => { const p = path.join(tmp, d.name); try { return { p, t: fs.statSync(p).birthtimeMs }; } catch { return null; } })
    .filter(x => x && Date.now() - x.t > hours * 3600e3)
    .sort((a, b) => a.t - b.t);
  for (const { p } of old) {
    if (n >= max) break;
    try { fs.rmSync(path.join(p, 'lockfile'), { force: true }); } catch { continue; /* 使っている */ }
    try { await fs.promises.rm(p, { recursive: true, force: true }); n++; } catch { /* あとで */ }
  }
  return n;
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
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), PREFIX));
  // キャッシュ・拡張機能・裏の通信を作らせない（プロフィールが小さくなり、作るのも消すのも軽い。D-132）
  const child = spawn(exe, ['--headless=new', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--hide-scrollbars',
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-component-update',
    '--disable-background-networking', '--disable-sync', '--disable-default-apps', '--disable-gpu-shader-disk-cache',
    '--disk-cache-size=1', '--media-cache-size=1',
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, `--window-size=${width},${height}`, 'about:blank'], { stdio: 'ignore' });
  const exited = new Promise(r => child.once('exit', r));
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
    // ブラウザが本当に終わるのを待ってから、最大 30 秒まで消し直す（前は 5 秒であきらめ、プロフィールが残っていた。D-132）
    await Promise.race([exited, sleep(10000)]);
    await removeAsync(profile);
    live.delete(b);
    await sweep().catch(() => 0);
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
//   何枚も撮るとき：node tools/headless.mjs --jobs <jobs.json>
//   （jobs.json は [{url, png, width, height, sec}, …]。ブラウザを 1 回だけ立てて順に撮る。
//     立ち上げとプロフィールづくりが 1 回で済むので PC が軽い。D-132）
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const argv = process.argv.slice(2);
  let jobs;
  if (argv[0] === '--jobs') {
    if (!argv[1]) { console.error('使い方：node tools/headless.mjs --jobs <jobs.json>'); process.exit(2); }
    jobs = JSON.parse(fs.readFileSync(argv[1], 'utf-8')).map(j => ({ width: 1300, height: 860, sec: 6, ...j }));
  } else {
    const [url, png, w = '1300', h = '860', sec = '6'] = argv;
    if (!url || !png) { console.error('使い方：node tools/headless.mjs <url> <png> [幅] [高さ] [待つ秒]'); process.exit(2); }
    jobs = [{ url, png, width: +w, height: +h, sec: +sec }];
  }
  if (!jobs.length) process.exit(0);
  // 窓はいちばん大きい頁に合わせて立て、頁ごとに大きさを合わせる
  const b = await open({ width: Math.max(...jobs.map(j => +j.width)), height: Math.max(...jobs.map(j => +j.height)) });
  try {
    for (const j of jobs) {
      await b.send('Emulation.setDeviceMetricsOverride', { width: +j.width, height: +j.height, deviceScaleFactor: 1, mobile: false });
      b.errors.length = 0;
      await b.go(j.url, +j.sec * 1000);
      await b.shot(path.resolve(j.png));
      console.log('撮った', path.resolve(j.png));
      console.log(b.errors.length ? b.errors.join('\n') : '例外なし');
    }
  } finally {
    await b.close();
  }
}
