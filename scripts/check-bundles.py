#!/usr/bin/env python3
"""check-bundles.py — 读出 bundles/*/bundle.yaml，核字段和引用（格式见 bundles/README.md）。

    python scripts/check-bundles.py               # 全部清单
    python scripts/check-bundles.py --kg <kg根>    # 另把 condition_label.basis 喂给 kg tools/pin-check.py 比钉

只读。有 ERROR 时 exit 1；比钉结果只报不判（重判在人，kg storage-contract 第九节）。
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("需要 PyYAML：pip install pyyaml", file=sys.stderr)
    sys.exit(2)

REPO_ROOT = Path(__file__).resolve().parents[1]
TOP_KEYS = ["bundle", "version", "for", "gate", "recipients", "packs", "adapters", "setup", "condition_label"]
LABEL_KEYS = ["basis", "environment", "rejudge_when"]
ENV_KEYS = ["model_tier", "host", "project", "date", "reading", "source"]
GATES = {"passed", "pending", "placeholder"}
SEMVER = re.compile(r"^\d+\.\d+\.\d+$")
PACK_REF = re.compile(r"^(?P<name>[A-Za-z0-9_-]+)@(?P<version>\d+\.\d+\.\d+)$")


def pack_version(name, repo_root):
    manifest = repo_root / "stable" / "packs" / name / "install-manifest.yaml"
    if not manifest.is_file():
        return None
    data = yaml.safe_load(manifest.read_text(encoding="utf-8")) or {}
    return str(data.get("version")) if data.get("version") is not None else None


def is_todo(value):
    return isinstance(value, str) and value.strip().startswith("TODO")


def check_path(value, bundle_dir):
    if value is None or is_todo(value):
        return True
    return (bundle_dir / str(value).split("#", 1)[0]).exists()


def check_bundle(bundle_dir, repo_root):
    errors, warnings = [], []
    manifest = bundle_dir / "bundle.yaml"
    try:
        data = yaml.safe_load(manifest.read_text(encoding="utf-8")) or {}
    except yaml.YAMLError as exc:
        return {}, [f"YAML 解析失败：{exc}"], []

    for key in TOP_KEYS:
        if key not in data:
            errors.append(f"缺字段 {key}")
    if data.get("bundle") not in (None, bundle_dir.name):
        errors.append(f"bundle 名 {data.get('bundle')} 与目录名 {bundle_dir.name} 不一致")
    if "version" in data and not SEMVER.match(str(data["version"])):
        errors.append(f"version 不是语义化版本：{data['version']}")

    gate = data.get("gate")
    if gate is not None and gate not in GATES:
        errors.append(f"gate 只能是 {sorted(GATES)}，现在是 {gate}")
    if gate == "passed" and not data.get("recipients"):
        errors.append("gate 是 passed 但 recipients 为空：过门要真收件人")

    for ref in data.get("packs") or []:
        match = PACK_REF.match(str(ref))
        if not match:
            errors.append(f"packs 条目要写成 名@版本：{ref}")
            continue
        name, version = match["name"], match["version"]
        if not (repo_root / "stable" / "packs" / name).is_dir():
            errors.append(f"货架上没有 {name}")
            continue
        current = pack_version(name, repo_root)
        if current is None:
            warnings.append(f"{name} 没有 install-manifest.yaml 的 version，钉 {version} 核不了")
        elif current != version:
            warnings.append(f"{name} 钉 {version}，货架现在是 {current}")

    adapters = data.get("adapters")
    if adapters is not None and not isinstance(adapters, dict):
        errors.append("adapters 要是 宿主: 路径 的映射")
    elif adapters:
        for host, path in adapters.items():
            if not check_path(path, bundle_dir):
                errors.append(f"adapters.{host} 指的路径不在：{path}")
    elif gate != "placeholder":
        errors.append("adapters 为空：只有 placeholder 包可以不带宿主适配层")

    if "setup" in data and not check_path(data["setup"], bundle_dir):
        errors.append(f"setup 指的文件不在：{data['setup']}")

    label = data.get("condition_label") or {}
    for key in LABEL_KEYS:
        if key not in label:
            errors.append(f"condition_label 缺 {key}")
    env = label.get("environment") or {}
    for key in ENV_KEYS:
        if key not in env:
            errors.append(f"condition_label.environment 缺 {key}")
    for key in ENV_KEYS:
        if is_todo(env.get(key)):
            warnings.append(f"environment.{key} 待认领：{env[key]}")
    return data, errors, warnings


def pin_check(addresses, kg_root):
    tool = Path(kg_root) / "tools" / "pin-check.py"
    if not tool.is_file():
        return None, f"找不到 {tool}"
    proc = subprocess.run(
        [sys.executable, str(tool)],
        input="\n".join(addresses),
        capture_output=True,
        text=True,
        encoding="utf-8",
        cwd=str(kg_root),
    )
    if proc.returncode != 0:
        return None, proc.stderr.strip()
    return json.loads(proc.stdout), None


def main(argv=None):
    parser = argparse.ArgumentParser(description="核 bundles/*/bundle.yaml")
    parser.add_argument("--root", default=str(REPO_ROOT), help="cg 仓根目录（默认本脚本所在仓）")
    parser.add_argument("--kg", help="kg 仓根目录；给了就调它的 tools/pin-check.py 比钉")
    args = parser.parse_args(argv)

    repo_root = Path(args.root)
    bundle_dirs = sorted(p.parent for p in (repo_root / "bundles").glob("*/bundle.yaml"))
    if not bundle_dirs:
        print("bundles/ 下没有清单")
        return 1

    failed = False
    basis = {}
    for bundle_dir in bundle_dirs:
        data, errors, warnings = check_bundle(bundle_dir, repo_root)
        packs = ", ".join(data.get("packs") or []) or "-"
        hosts = ", ".join((data.get("adapters") or {}).keys()) or "-"
        print(f"{bundle_dir.name}@{data.get('version')}  gate={data.get('gate')}  "
              f"收件人={len(data.get('recipients') or [])}  packs={packs}  宿主={hosts}")
        for line in errors:
            print(f"  ERROR {line}")
        for line in warnings:
            print(f"  WARN  {line}")
        failed = failed or bool(errors)
        for address in (data.get("condition_label") or {}).get("basis") or []:
            basis.setdefault(address, []).append(bundle_dir.name)

    if args.kg and basis:
        results, problem = pin_check(list(basis), args.kg)
        print("比钉（kg pin-check）：")
        if problem:
            print(f"  ERROR {problem}")
            failed = True
        else:
            for item in results:
                flag = " 未认" if item.get("unconfirmed") else ""
                owners = ",".join(basis.get(item["address"], []))
                note = f"  {item['note']}" if item.get("note") else ""
                print(f"  {item['status']}{flag}  {item['address']}  ← {owners}{note}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
