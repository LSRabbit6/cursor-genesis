#!/usr/bin/env python3
"""check_sandbox_session.py — 受限场收货核对：沿会话记录主线，查笼子里的模型用了什么工具、碰了哪些路径、写了什么、读没读全。

    python check_sandbox_session.py --cwd <受限场工作目录> [选项]

    --session F        会话 jsonl；不给就取 ~/.claude/projects/ 下与 --cwd 对应目录里最新的一场
    --add-dir D        开场时加挂的目录，可多次；路径白名单 = --cwd + 这些
    --tools LIST       开场时给的工具，默认 Read,Write,Edit,Grep,Glob
    --write F          允许写的文件，可多次；不给就只列出写了什么，不判
    --order F          要求按这个顺序整件读（不带 offset/limit）的文件，可多次
    --codes J          回执校验码 JSON {文件名或相对路径: 码}；码要出现在回复或写出的文件里
    --tail N           --order 里 JSON 没登记码的件，取它末行最后 N 个字当码；都没有就判 FAIL
    --from-read F      从第一次读 F 起算（接续开场的后一阶段）
    --until-read F     到第一次读 F 为止（不把后一阶段算进来），可多次

只读。全 PASS 时 exit 0。它报的「还剩什么」实不实，脚本判不了，最后一行提醒人拿场外读数核。
主线算法照 toys self-analysis/2026-10-15-system-review-doubao/progress/check_audit_session.py：
从最新一条往回顺 parentUuid 走到头，别的进程误接进同一会话文件的支线不算。
"""

import argparse
import io
import json
import re
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def project_dir(cwd):
    slug = re.sub(r"[^A-Za-z0-9]", "-", str(cwd)).lower()
    root = Path.home() / ".claude" / "projects"
    hits = [d for d in root.iterdir() if d.is_dir() and d.name.lower() == slug]
    return hits[0] if hits else None


def main_chain(session):
    entries = []
    for line in io.open(session, encoding="utf-8"):
        try:
            o = json.loads(line)
        except ValueError:
            continue
        if o.get("uuid") and not o.get("isSidechain"):
            entries.append(o)
    by = {e["uuid"]: e for e in entries}
    u, seen, chain = max(entries, key=lambda e: e.get("timestamp", ""))["uuid"], set(), []
    while u in by and u not in seen:
        seen.add(u)
        chain.append(by[u])
        u = by[u].get("parentUuid") or by[u].get("logicalParentUuid")
    return list(reversed(chain)), len(entries) - len(chain)


def resolve(p, cwd):
    q = Path(p)
    return (q if q.is_absolute() else cwd / q).resolve()


def tail_code(p, n):
    """末行最后 n 个字当回执（toys check_stage2_session.py 的做法）。"""
    if not p.exists():
        return None
    lines = [l for l in p.read_text(encoding="utf-8").splitlines() if l.strip()]
    return lines[-1].strip()[-n:] if lines else None


def collect(chain, cwd, from_read, until_read):
    """按会话顺序取工具调用和回复文字，截在 from_read / until_read 之间。"""
    calls, texts, started = [], [], from_read is None
    for e in chain:
        if e.get("type") != "assistant":
            continue
        for b in (e.get("message") or {}).get("content") or []:
            if b.get("type") == "tool_use":
                inp = b.get("input") or {}
                path = inp.get("file_path")
                if b.get("name") == "Read" and path:
                    target = resolve(path, cwd)
                    if not started and target == from_read:
                        started = True
                    elif started and target in until_read:
                        return calls, texts
                if started:
                    calls.append((b.get("name"), inp))
            elif b.get("type") == "text" and started:
                texts.append(b.get("text") or "")
    return calls, texts


def main(argv=None):
    ap = argparse.ArgumentParser(description="受限场收货核对")
    ap.add_argument("--cwd", required=True)
    ap.add_argument("--session")
    ap.add_argument("--add-dir", action="append", default=[])
    ap.add_argument("--tools", default="Read,Write,Edit,Grep,Glob")
    ap.add_argument("--write", action="append", default=[])
    ap.add_argument("--order", action="append", default=[])
    ap.add_argument("--codes")
    ap.add_argument("--tail", type=int, default=0)
    ap.add_argument("--from-read")
    ap.add_argument("--until-read", action="append", default=[])
    a = ap.parse_args(argv)

    cwd = Path(a.cwd).resolve()
    roots = [cwd] + [resolve(d, cwd) for d in a.add_dir]
    allowed = {t.strip() for t in a.tools.split(",") if t.strip()}

    if a.session:
        session = Path(a.session)
    else:
        d = project_dir(cwd)
        if d is None:
            print(f"ERROR 找不到 {cwd} 对应的会话目录，用 --session 指定")
            return 2
        session = max(d.glob("*.jsonl"), key=lambda f: f.stat().st_mtime)
    chain, off = main_chain(session)
    print("INFO 会话记录：", session)
    print(f"INFO 主线 {len(chain)} 条；主线以外 {off} 条不算")

    from_read = resolve(a.from_read, cwd) if a.from_read else None
    until_read = {resolve(f, cwd) for f in a.until_read}
    calls, texts = collect(chain, cwd, from_read, until_read)
    if from_read and not calls:
        print(f"ERROR 会话里没读过 {from_read}，起点找不到")
        return 2
    print(f"INFO 核 {len(calls)} 次工具调用")

    ok = True

    def say(flag, msg):
        nonlocal ok
        ok &= flag
        print(("PASS " if flag else "FAIL ") + msg)

    def inside(p):
        q = resolve(p, cwd)
        return any(q == r or r in q.parents for r in roots)

    bad_tools = sorted({n for n, _ in calls if n not in allowed})
    say(not bad_tools, f"只用了 {','.join(sorted(allowed))}（多出 {bad_tools}）")

    order = [resolve(f, cwd) for f in a.order]
    full, outside, writes, before_first, early = [], [], [], [], []
    for name, inp in calls:
        path = inp.get("file_path") or inp.get("path")
        pattern = str(inp.get("pattern") or "")
        if name == "Glob" and Path(pattern).is_absolute():
            path = path or pattern
        if path and not inside(path):
            outside.append(f"{name} {path}")
        if name == "Read" and path and not inp.get("offset") and not inp.get("limit"):
            target = resolve(path, cwd)
            if target in order and target not in full:
                full.append(target)
        if order and name in ("Grep", "Glob") and len(full) < len(order):
            (before_first if not full else early).append(f"{name} {pattern}")
        if name in ("Write", "Edit", "NotebookEdit"):
            writes.append(resolve(path, cwd) if path else Path("?"))

    say(not outside, f"没去碰白名单以外的路径，宿主拒了的也算（碰了 {outside}）")

    if order:
        say(full == order, f"{len(order)} 件都整件读过，顺序对（实际 {[p.name for p in full]}）")
        if before_first:
            print(f"WARN 读第一件之前用过搜索 {before_first}（规矩通常写在第一件里，照实记一笔）")
        say(not early, f"通读完之前没用 Grep、Glob（用了 {early}）")

    written = sorted({str(p) for p in writes})
    if a.write:
        permitted = {resolve(f, cwd) for f in a.write}
        extra = sorted({str(p) for p in writes if p not in permitted})
        say(not extra, f"只写了允许的文件（多写 {extra}）")
        for p in sorted(permitted):
            say(p.exists(), f"{p.name} 已写出")
    else:
        print(f"INFO 写过 {written or '无'}（没给 --write，不判）")

    if a.codes or a.tail:
        table = json.loads(Path(a.codes).read_text(encoding="utf-8")) if a.codes else {}
        if order:
            codes, missing_key = {}, []
            for p in order:
                hit = [k for k in table if p.as_posix() == k or p.as_posix().endswith("/" + k)]
                if hit:
                    codes[p.name] = table[hit[0]]
                elif a.tail and tail_code(p, a.tail):
                    codes[p.name] = tail_code(p, a.tail)
                else:
                    missing_key.append(p.name)
            say(not missing_key, f"读取清单每件都有期望码（没有 {missing_key}）")
        else:
            codes = table
        blob = "\n".join(texts)
        for p in {resolve(f, cwd) for f in a.write} or set(writes):
            if p.exists():
                blob += "\n" + p.read_text(encoding="utf-8")
        missing = sorted(k for k, v in codes.items() if v not in blob)
        say(bool(codes) and not missing, f"{len(codes)} 行回执的校验码都对（缺或错 {missing}）")

    print("MANUAL 它报的「还剩什么 / 待办 / 现状」它读不到场外，逐条拿场外读数核（git log、文件现状）再收")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
