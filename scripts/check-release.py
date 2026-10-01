#!/usr/bin/env python3
"""Verify the online release boundary, its index and immutable version checksums."""
import argparse
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
LOCK = ROOT / 'release-lock.json'

def catalog_builder():
    spec = importlib.util.spec_from_file_location('catalog_builder', ROOT / 'scripts/build-pack-catalog.py')
    module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
    return module

def check(base=None, write=False):
    with tempfile.TemporaryDirectory(prefix='cg-release-') as tmp:
        catalog = catalog_builder().build(Path(tmp))
    current = {p['name']: {'version': p['version'], 'sha256': p['sha256']} for p in catalog['packs']}
    index = (ROOT / 'stable/knowledge/index.yaml').read_text(encoding='utf-8')
    for name in current:
        block = re.search(r'^  ' + re.escape(name) + r':\n(.*?)(?=^  [\w-]+:|\Z)', index, re.M | re.S)
        if not block: raise ValueError(f'发布包未登记知识索引：{name}')
        if f'path: ../packs/{name}/' not in block[1]: raise ValueError(f'发布包索引路径不符：{name}')
        paths = re.findall(r'^        file: (.+)$', block[1], re.M)
        if not paths: raise ValueError(f'发布包索引没有材料：{name}')
        folder = ROOT / 'stable/packs' / name
        for path in paths:
            target = (folder / path.strip()).resolve()
            if not target.is_relative_to(folder.resolve()) or not target.is_file():
                raise ValueError(f'发布包索引失效：{name}/{path}')
    if base:
        subprocess.run(['git', 'rev-parse', '--verify', base + '^{commit}'], cwd=ROOT, check=True, capture_output=True)
        old = subprocess.run(['git', 'show', f'{base}:release-lock.json'], cwd=ROOT, capture_output=True, text=True)
        if old.returncode == 0:
            for name, previous in json.loads(old.stdout).items():
                if name in current and previous['version'] == current[name]['version'] and previous['sha256'] != current[name]['sha256']:
                    raise ValueError(f'{name} 内容改变但仍为 {previous["version"]}；必须提升安装清单版本。')
    if write: LOCK.write_text(json.dumps(current, indent=2) + '\n', encoding='utf-8')
    elif not LOCK.exists() or json.loads(LOCK.read_text(encoding='utf-8')) != current:
        raise ValueError('发布内容与 release-lock.json 不一致；核对版本后运行 --write。')
    print(f'发布边界检查通过：{len(current)} 个在线包，安装源、索引和摘要一致。')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base'); parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    try: check(args.base, args.write)
    except (ValueError, OSError, subprocess.CalledProcessError) as e: parser.exit(1, str(e) + '\n')
