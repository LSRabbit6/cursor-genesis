#!/usr/bin/env python3
"""数据应用产物规范检查器（契约见 ../CONTRACT.md）。stdlib-only。

用法：
  python check_data_app_norms.py [路径...] [--changed] [--stop-hook] [--strict]
                                 [--terms a,b] [--list-threshold N] [--json]
  路径可以是文件或目录（递归找 .html/.htm）；--changed 取 git 工作区改过或新增的 HTML。
  --stop-hook = --changed + 有 FAIL 时按 Claude Code Stop hook 约定输出 {"decision":"block"}，退出 0。
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

SKIP_DIRS = {"node_modules", ".git", "dist", "build", ".venv", "venv", "__pycache__"}
HTML_EXT = (".html", ".htm")

RE_CHARSET = re.compile(r"<meta[^>]+charset\s*=\s*[\"']?\s*utf-?8", re.I)
RE_VIEWPORT = re.compile(r"<meta[^>]+name\s*=\s*[\"']viewport[\"']", re.I)
RE_EXTERNAL_TAG = re.compile(
    r"<(script|link|img|iframe|source|video|audio)\b[^>]*\b(src|href)\s*=\s*[\"']\s*(https?:)?//", re.I
)
RE_EXTERNAL_CSS = re.compile(r"(@import\s+url\(|url\()\s*[\"']?\s*https?://", re.I)
RE_TR = re.compile(r"<tr\b", re.I)
RE_LI = re.compile(r"<li\b", re.I)
RE_LIST_CONTAINER = re.compile(r"<(table|ul|ol)\b", re.I)
RE_SCRIPT = re.compile(r"<script\b", re.I)
# 算「检索控件」的：type 为 search / text 或没写 type 的 input、select、data-filter 属性、检索字样。
# file / hidden / checkbox / radio / submit / button / password / number / date / range / color 的 input 不算。
RE_SEARCH_CONTROL = re.compile(
    r"<input\b(?![^>]*\btype\s*=\s*[\"']?(?:file|hidden|checkbox|radio|submit|button|password|number|date|range|color)\b)"
    r"|<select\b|data-filter|搜索|检索|筛选|过滤|search|filter",
    re.I,
)
RE_EMPTY_STATE = re.compile(r"暂无|没有|无数据|为空|empty|no data|data-empty", re.I)


def check_text(text: str, *, list_threshold: int = 12, terms: list[str] | None = None,
               strict: bool = False) -> list[dict]:
    """对一份 HTML 文本跑全部检查，返回 findings：{code, level, msg}。"""
    out: list[dict] = []
    head = text[:4096]
    if not RE_CHARSET.search(head):
        out.append({"code": "R1", "level": "FAIL", "msg": "前 4096 字节内没有 <meta charset=\"utf-8\">"})
    if not RE_VIEWPORT.search(text):
        out.append({"code": "R1", "level": "FAIL", "msg": "没有 <meta name=\"viewport\">"})
    ext = RE_EXTERNAL_TAG.findall(text)
    if ext:
        tags = sorted({t[0].lower() for t in ext})
        out.append({"code": "R3", "level": "FAIL", "msg": f"引用外部资源：<{'>, <'.join(tags)}> 指向 http(s)://"})
    if RE_EXTERNAL_CSS.search(text):
        out.append({"code": "R3", "level": "FAIL", "msg": "样式里 url(http…) 或 @import 外部地址"})
    rows = max(len(RE_TR.findall(text)), len(RE_LI.findall(text)))
    has_search = bool(RE_SEARCH_CONTROL.search(text))
    has_list = bool(RE_LIST_CONTAINER.search(text))
    if rows >= list_threshold and not has_search:
        out.append({"code": "S2", "level": "FAIL", "msg": f"长列表（{rows} 行）没有任何检索或筛选控件"})
    elif has_list and rows < 3 and RE_SCRIPT.search(text) and not has_search:
        out.append({"code": "S2", "level": "WARN",
                    "msg": "列表由脚本渲染，机器看不到行数也没见检索控件——列表多不多、要不要检索，人判"})
    if has_list and not RE_EMPTY_STATE.search(text):
        out.append({"code": "S3", "level": "FAIL" if strict else "WARN", "msg": "有列表容器但没写空态提示"})
    for term in terms or []:
        if term and term in text:
            out.append({"code": "R7", "level": "FAIL", "msg": f"出现内部术语「{term}」"})
    return out


def check_file(path: Path, **opts) -> list[dict]:
    try:
        raw = path.read_bytes()
    except OSError as e:
        return [{"code": "R1", "level": "FAIL", "msg": f"读不出文件：{e}"}]
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        return [{"code": "R1", "level": "FAIL", "msg": "文件不是 UTF-8 编码"}]
    return check_text(text, **opts)


def iter_html(paths: list[str]) -> list[Path]:
    found: list[Path] = []
    for p in paths:
        pp = Path(p)
        if pp.is_dir():
            for root, dirs, files in os.walk(pp):
                dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
                found += [Path(root) / f for f in files if f.lower().endswith(HTML_EXT)]
        elif pp.suffix.lower() in HTML_EXT and pp.exists():
            found.append(pp)
    return sorted(set(found))


def changed_html() -> list[Path]:
    try:
        out = subprocess.run(["git", "status", "--porcelain", "--untracked-files=all"],
                             capture_output=True, text=True, timeout=15, check=False).stdout
    except (OSError, subprocess.SubprocessError):
        return []
    files = []
    for line in out.splitlines():
        if len(line) < 4 or line[:2] in (" D", "D "):
            continue
        p = line[3:].strip().strip('"')
        if " -> " in p:
            p = p.split(" -> ", 1)[1]
        if p.lower().endswith(HTML_EXT) and not any(part in SKIP_DIRS for part in Path(p).parts):
            files.append(Path(p))
    return files


def load_terms(arg: str | None) -> list[str]:
    if arg:
        return [t.strip() for t in arg.split(",") if t.strip()]
    cfg = Path(__file__).resolve().parent.parent / "terms.txt"
    if cfg.exists():
        return [l.strip() for l in cfg.read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")]
    return []


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("paths", nargs="*")
    ap.add_argument("--changed", action="store_true")
    ap.add_argument("--stop-hook", action="store_true")
    ap.add_argument("--strict", action="store_true")
    ap.add_argument("--terms", default=None)
    ap.add_argument("--list-threshold", type=int, default=12)
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args(argv)

    files = changed_html() if (a.changed or a.stop_hook) else iter_html(a.paths)
    if a.paths and (a.changed or a.stop_hook):
        files = sorted(set(files) | set(iter_html(a.paths)))
    opts = {"list_threshold": a.list_threshold, "terms": load_terms(a.terms), "strict": a.strict}
    report = {str(f): check_file(f, **opts) for f in files}
    fails = {f: [x for x in fs if x["level"] == "FAIL"] for f, fs in report.items()}
    n_fail = sum(len(v) for v in fails.values())

    if a.stop_hook:
        if n_fail:
            lines = [f"{f}：" + "；".join(f"{x['code']} {x['msg']}" for x in v) for f, v in fails.items() if v]
            print(json.dumps({
                "decision": "block",
                "reason": (f"这次改的 HTML 有 {n_fail} 处不合产物规范（.agents/rules/data-app-norms.md）：\n"
                           + "\n".join(lines[:8]) + ("\n…" if len(lines) > 8 else "")
                           + "\n\n改完再收工；确实不适用的条目，说一句为什么并在设计稿「不变量」里记下。"),
            }, ensure_ascii=False))
        return 0

    if a.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        if not files:
            print("没有可查的 HTML 文件。")
        for f, fs in report.items():
            status = "FAIL" if fails[f] else ("WARN" if fs else "PASS")
            print(f"[{status}] {f}")
            for x in fs:
                print(f"    {x['level']} {x['code']}: {x['msg']}")
        print(f"\n{len(files)} 个文件，{n_fail} 处 FAIL。")
    return 1 if n_fail else 0


if __name__ == "__main__":
    sys.exit(main())
