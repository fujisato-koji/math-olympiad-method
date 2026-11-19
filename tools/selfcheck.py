# 書く係の確かめを 1 回で（D-189）：置き場があれば組み立て（assemble）、決まりと漢字（unitqc --no-shot）、図の測り（figlint）、ヒントの点検（hintlint）。
#   python tools/selfcheck.py <記号>
# 出力は要るところだけ（通ったものは 1 行）。Bash の timeout は 600000 にする（figlint は画面なしのブラウザを使う）。
import sys, os, subprocess, tempfile
from pathlib import Path
REPO = Path(__file__).resolve().parents[1]
sys.stdout.reconfigure(encoding='utf-8')
env = {**os.environ, 'PYTHONIOENCODING': 'utf-8', 'MSYS_NO_PATHCONV': '1'}


def run(*a):
    r = subprocess.run([sys.executable, *a], capture_output=True, text=True, encoding='utf-8', env=env, cwd=REPO)
    return r.returncode, (r.stdout + r.stderr).strip()


for uid in sys.argv[1:]:
    w = Path(tempfile.gettempdir()) / 'michisuji-work' / REPO.name / uid
    if (w / 'head.yaml').exists():
        c, o = run('tools/assemble.py', uid)
        print('組み立て：' + o)
        if c:
            print('→ 組み立てで止まった。日のファイルを直してから、もう一度')
            continue
    for tool in ('tools/unitqc.py', 'tools/figlint.py', 'tools/hintlint.py'):
        args = [tool, '--no-shot', uid] if tool.endswith('unitqc.py') else [tool, uid]
        c, o = run(*args)
        print(o)
