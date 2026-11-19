# 置き去りの画面なしの Edge を止める（D-137）。係のコマンドが時間切れで止められると node は消えるが、Windows では
# node が立てた Edge は残り、メモリを食い続ける（2026-11-19 に 138 組・約 20 GB たまった）。
# user-data-dir に michisuji-headless- を含む本体（--type= のないもの）のうち、指定の分より前にできたものだけを木ごと止める。
# ふだんの Edge には触らない。tools/headless.mjs がブラウザを立てるたびに（2 分に 1 回まで）裏で呼ぶ。
#   python tools/reap_edge.py            … 数えるだけ
#   python tools/reap_edge.py --kill 15  … 15 分より前にできたものを止める
import sys, re, ctypes, subprocess, time
from ctypes import wintypes
if sys.platform != 'win32':
    sys.exit(0)
sys.stdout.reconfigure(encoding='utf-8')
k32, ntdll = ctypes.windll.kernel32, ctypes.windll.ntdll
k32.OpenProcess.restype = wintypes.HANDLE


class TH32(ctypes.Structure):
    _fields_ = [('dwSize', wintypes.DWORD), ('cntUsage', wintypes.DWORD), ('th32ProcessID', wintypes.DWORD),
                ('th32DefaultHeapID', ctypes.c_void_p), ('th32ModuleID', wintypes.DWORD), ('cntThreads', wintypes.DWORD),
                ('th32ParentProcessID', wintypes.DWORD), ('pcPriClassBase', ctypes.c_long), ('dwFlags', wintypes.DWORD),
                ('szExeFile', ctypes.c_wchar * 260)]


def procs():
    snap = k32.CreateToolhelp32Snapshot(2, 0)
    e = TH32(); e.dwSize = ctypes.sizeof(TH32)
    ok = k32.Process32FirstW(snap, ctypes.byref(e))
    while ok:
        yield e.th32ProcessID, e.szExeFile
        ok = k32.Process32NextW(snap, ctypes.byref(e))
    k32.CloseHandle(snap)


def info(pid):
    """起動の引数と、できてからの分"""
    h = k32.OpenProcess(0x1000, False, pid)
    if not h:
        return None, None
    try:
        buf = ctypes.create_string_buffer(65536); ret = wintypes.ULONG()
        cl = None
        if ntdll.NtQueryInformationProcess(h, 60, buf, len(buf), ctypes.byref(ret)) == 0:
            ln, ptr = ctypes.c_ushort.from_buffer(buf, 0).value, ctypes.c_void_p.from_buffer(buf, 8).value
            cl = ctypes.wstring_at(ptr, ln // 2) if ptr else ''
        c, x, kk, u = (wintypes.FILETIME() for _ in range(4))
        age = None
        if k32.GetProcessTimes(h, ctypes.byref(c), ctypes.byref(x), ctypes.byref(kk), ctypes.byref(u)):
            age = (time.time() - ((c.dwHighDateTime << 32 | c.dwLowDateTime) / 1e7 - 11644473600)) / 60
        return cl, age
    finally:
        k32.CloseHandle(h)


roots = []
for pid, name in procs():
    if name.lower() != 'msedge.exe':
        continue
    cl, age = info(pid)
    if cl and 'michisuji-headless-' in cl and '--type=' not in cl and re.search(r'user-data-dir="?[^" ]*michisuji-headless-', cl):
        roots.append((pid, age or 0))
lim = float(sys.argv[sys.argv.index('--kill') + 1]) if '--kill' in sys.argv else None
old = [p for p, a in roots if lim is not None and a > lim]
for p in old:
    subprocess.run(['taskkill', '/PID', str(p), '/T', '/F'], capture_output=True)
print(f'画面なしの Edge {len(roots)} 組' + (f'、{lim:.0f} 分より前の {len(old)} 組を止めた' if lim is not None else ''))
