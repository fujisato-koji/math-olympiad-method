# 関係から分野を見つける計算の入口。python tools/fields/run.py [--quick] [--write]
#   (a) 3 設定（typed / typed_topic2 / typed_use2。どれも前提の線を強さ×種類で重み付けし、層の比だけを変える。α=1.0）の合意の分け方（γ=0.5、ゆさぶり 5 回）
#   (b) 3 設定の合意 → out/fields.json   (c) 2 段目   (d) 3D の配置 → out/X_vos.npy
#   (e) out/fields.yaml を書く（名前は旧の relations/fields.yaml から単元の重なりで引き継ぎ、引き継げない塊は要命名）
# --write：relations/fields.yaml を書きかえる（付けなければ out/fields.yaml だけ）。
# --quick：(a) のゆさぶりを省く（keep は前の out/ の結果を使う）。
import subprocess, sys, time
from pathlib import Path

HERE = Path(__file__).resolve().parent
quick = '--quick' in sys.argv
steps = [('(a) ' + w, ['cluster2.py', 'main', w, '1.0', '--gammas', '0.5'] + (['--quick'] if quick else [])) for w in ('typed', 'typed_topic2', 'typed_use2')]
steps += [('(b) 3 設定の合意', ['cross.py']), ('(c) 2 段目', ['level2.py']), ('(d) VOS の 3D 配置', ['vos.py']), ('(e) fields.yaml', ['save_fields.py'] + (['--write'] if '--write' in sys.argv else []))]
t0 = time.time()
for name, cmd in steps:
    t = time.time()
    print(f'\n== {name}', flush=True)
    r = subprocess.run([sys.executable, str(HERE / cmd[0])] + cmd[1:], cwd=str(HERE))
    if r.returncode:
        sys.exit(f'{name} で失敗（終了コード {r.returncode}）')
    print(f'   {time.time() - t:.0f} 秒', flush=True)
print(f'\n全体 {time.time() - t0:.0f} 秒')
