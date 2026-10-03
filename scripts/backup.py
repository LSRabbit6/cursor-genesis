#!/usr/bin/env python3
"""Consistent SQLite backup and non-destructive restore for standalone CG."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import sqlite3
from datetime import datetime, timezone

FILES = ('workbench.sqlite', 'access.json')

def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as source:
        for data in iter(lambda: source.read(1024 * 1024), b''): h.update(data)
    return h.hexdigest()

def check_database(path):
    with sqlite3.connect(path.resolve().as_uri() + '?mode=ro', uri=True) as db:
        if db.execute('PRAGMA quick_check').fetchall() != [('ok',)] or db.execute('PRAGMA foreign_key_check').fetchall():
            raise ValueError('数据库完整性检查失败。')
        names = {r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        if not {'requests','tickets','events','tokens','_local_migrations'} <= names:
            raise ValueError('不是完整的 CG 数据库。')
        return [r[0] for r in db.execute('SELECT name FROM _local_migrations ORDER BY name')]

def check_access(path):
    data = json.loads(path.read_text(encoding='utf-8'))
    if data.get('version') != 1 or not isinstance(data.get('owner'), str) or not data['owner']:
        raise ValueError('访问配置格式不正确。')
    value = data.get('key_hash')
    if not isinstance(value, str) or len(value) != 64 or any(x not in '0123456789abcdef' for x in value):
        raise ValueError('访问配置摘要不正确。')

def reserve(path):
    path.mkdir(mode=0o700, parents=False, exist_ok=False)

def backup(database, access, output):
    check_access(access)
    reserve(output)
    try:
        # SQLite online backup includes committed WAL contents in a standalone snapshot.
        with sqlite3.connect(database.resolve().as_uri() + '?mode=ro', uri=True) as source:
            with sqlite3.connect(output / FILES[0]) as target: source.backup(target)
        shutil.copyfile(access, output / FILES[1])
        migrations = check_database(output / FILES[0])
        manifest = {'version': 1, 'created': datetime.now(timezone.utc).isoformat(),
                    'migrations': migrations, 'files': {name: digest(output / name) for name in FILES}}
        (output / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
        for name in (*FILES, 'manifest.json'): os.chmod(output / name, 0o600)
    except BaseException:
        shutil.rmtree(output)
        raise

def restore(source, output):
    for name in (*FILES, 'manifest.json'):
        if (source / name).is_symlink() or not (source / name).is_file(): raise ValueError('备份缺少文件或包含链接。')
    manifest = json.loads((source / 'manifest.json').read_text(encoding='utf-8'))
    if manifest.get('version') != 1 or set(manifest.get('files', {})) != set(FILES):
        raise ValueError('备份清单不正确。')
    if any(digest(source / n) != manifest['files'][n] for n in FILES): raise ValueError('备份摘要不一致，拒绝恢复。')
    if check_database(source / FILES[0]) != manifest.get('migrations'): raise ValueError('迁移记录不一致。')
    check_access(source / FILES[1])
    reserve(output)
    try:
        for name in FILES:
            shutil.copyfile(source / name, output / name)
            os.chmod(output / name, 0o600)
        check_database(output / FILES[0])
    except BaseException:
        shutil.rmtree(output)
        raise

def main():
    os.umask(0o077)
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest='action', required=True)
    b = sub.add_parser('backup'); b.add_argument('--db', required=True, type=Path); b.add_argument('--access', required=True, type=Path); b.add_argument('--output', required=True, type=Path)
    r = sub.add_parser('restore'); r.add_argument('--from', dest='source', required=True, type=Path); r.add_argument('--output', required=True, type=Path)
    args = p.parse_args()
    try:
        if args.action == 'backup': backup(args.db, args.access, args.output)
        else: restore(args.source, args.output)
        print('完成：' + str(args.output) + '；数据库完整性和文件摘要已核验。')
    except (ValueError, OSError, sqlite3.Error, KeyError, TypeError) as e: p.exit(1, str(e) + '\n')

if __name__ == '__main__': main()
