#!/usr/bin/env python3
"""Import deliberately reviewed workbench summaries; never publish or overwrite."""
import argparse
import json
from pathlib import Path
import re
import shutil
import tempfile

FIELDS = {'problem': '解决什么', 'source': '来源与复现', 'boundary': '适用边界',
          'proposal': '改进与使用方法', 'verification': '如何验证', 'limitations': '已知失败与限制'}

def validate(packet):
    if not isinstance(packet, dict) or set(packet) != {'version', 'ticket', 'request', 'category', 'created', 'summary'}:
        raise ValueError('回流材料字段不符，拒绝导入原始记录或未知内容。')
    if type(packet['version']) is not int or packet['version'] != 1:
        raise ValueError('不支持这个回流版本。')
    for key, prefix in [('ticket', 'T'), ('request', 'R')]:
        if not isinstance(packet[key], str) or not re.fullmatch(prefix + r'-[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}', packet[key]):
            raise ValueError('来源编号不正确。')
    if packet['category'] not in ('misfit', 'validator', 'want'):
        raise ValueError('回流类别不正确。')
    from datetime import datetime
    if not isinstance(packet['created'], str): raise ValueError('日期不正确。')
    datetime.fromisoformat(packet['created'].replace('Z', '+00:00'))
    summary = packet['summary']
    if not isinstance(summary, dict) or set(summary) != set(FIELDS):
        raise ValueError('回流摘要必须包含且只包含六项。')
    if any(not isinstance(v, str) or not v.strip() or len(v) > 6000 for v in summary.values()):
        raise ValueError('每项摘要须为 1–6000 字。')
    return packet

def import_packet(path, destination):
    if path.stat().st_size > 262144: raise ValueError('回流材料过大。')
    packet = validate(json.loads(path.read_text(encoding='utf-8')))
    destination = destination.resolve()
    destination.mkdir(parents=True, exist_ok=True)
    target = destination / packet['ticket']
    if target.exists() or target.is_symlink(): raise ValueError('此编号已导入，不覆盖现有审核材料。')
    temp = Path(tempfile.mkdtemp(prefix='.import-', dir=destination))
    try:
        text = f"# CG 回流候选\n\n来源编号：{packet['ticket']}\n请求编号：{packet['request']}\n类别：{packet['category']}\n整理时间：{packet['created']}\n状态：待审核；未自动提交、合并或发布。\n"
        for key, title in FIELDS.items(): text += f"\n## {title}\n\n{packet['summary'][key]}\n"
        (temp / 'SUBMISSION.md').write_text(text, encoding='utf-8')
        (temp / 'source.json').write_text(json.dumps(packet, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        (temp / 'content').mkdir()
        (temp / 'tests').mkdir()
        (temp / 'tests/README.md').write_text('将复现命令与验证结果放在这里；摘要中的说明不等于已验证。\n', encoding='utf-8')
        # Reserve without replacement, including an existing empty directory.
        target.mkdir()
        try:
            for entry in temp.iterdir(): entry.rename(target / entry.name)
        except BaseException:
            shutil.rmtree(target)
            raise
        return target
    finally:
        shutil.rmtree(temp)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('file', type=Path)
    parser.add_argument('--destination', type=Path, default=Path('.knowledge/downstream/pending/workbench'))
    args = parser.parse_args()
    try: print(f'已导入候选：{import_packet(args.file, args.destination)}；请审核后提交 PR，并回工作台关联地址。')
    except (ValueError, OSError, KeyError, TypeError) as e: parser.exit(1, str(e) + '\n')

if __name__ == '__main__': main()
