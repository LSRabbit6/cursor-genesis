#!/usr/bin/env python3
"""domain-menu 客户端：向菜单服务要自查清单、交自查结果、装回来的包。只用标准库。

在项目根目录跑:
    python .agents/skills/domain-menu/scripts/menu.py checklist
    python .agents/skills/domain-menu/scripts/menu.py submit ANSWERS.json      # 或 - 从 stdin 读
    python .agents/skills/domain-menu/scripts/menu.py install PACK [PACK ...]
    python .agents/skills/domain-menu/scripts/menu.py packs
    python .agents/skills/domain-menu/scripts/menu.py status TICKET
    python .agents/skills/domain-menu/scripts/menu.py feedback --category misfit|validator|want --where WHERE --text TEXT
    python .agents/skills/domain-menu/scripts/menu.py resend

服务地址：环境变量 CG_MENU_URL，默认 https://menu.lsrabbit.space
令牌（交东西、查进度要）：环境变量 CG_MENU_TOKEN，或文件 ~/.config/cg-menu/token
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

CLIENT_VERSION = "0.2.0"
DEFAULT_URL = "https://menu.lsrabbit.space"
CONFIG_DIR = Path.home() / ".config" / "cg-menu"
PENDING_DIR = CONFIG_DIR / "pending"
MARK = {"ready": "✔", "partial": "△", "skeleton": "△", "blank": "○", "unknown": "○"}
STATUS_CN = {"ready": "有包", "partial": "能读、装不了", "skeleton": "只有骨架", "blank": "我们没有", "unknown": "类型表里没有",
             "open": "已登记，等判", "accepted": "决定补，在写", "declined": "暂不做", "resolved": "已处理", "closed": "已撤回"}


class Offline(Exception):
    pass


def base_url() -> str:
    return os.environ.get("CG_MENU_URL", DEFAULT_URL).rstrip("/")


def token() -> str | None:
    t = os.environ.get("CG_MENU_TOKEN")
    if t:
        return t.strip()
    f = CONFIG_DIR / "token"
    return f.read_text(encoding="utf-8").strip() if f.exists() else None


def project_root() -> Path:
    try:
        out = subprocess.run(["git", "rev-parse", "--show-toplevel"], capture_output=True, text=True, check=True)
        return Path(out.stdout.strip())
    except (OSError, subprocess.CalledProcessError):
        return Path.cwd()


def installed_packs(root: Path) -> dict:
    """读 .agents / .cursor 下 installed-packs.yaml 的 名字→版本；不依赖 pyyaml。"""
    found = {}
    for rec in (root / ".agents" / "installed-packs.yaml", root / ".cursor" / "installed-packs.yaml"):
        if not rec.exists():
            continue
        current = None
        for line in rec.read_text(encoding="utf-8").splitlines():
            m = re.match(r"^  ([A-Za-z0-9_.-]+):\s*$", line)
            if m:
                current = m.group(1)
                continue
            m = re.match(r"^    version:\s*['\"]?([^'\"\s]+)", line)
            if m and current and current not in found:
                found[current] = m.group(1)
    return found


def _request(method: str, path: str, body: dict | None = None, auth=False, raw=False):
    headers = {"User-Agent": f"cg-menu-client/{CLIENT_VERSION}", "Accept": "application/json"}
    data = None
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    if auth:
        t = token()
        if not t:
            sys.exit("没有令牌：设环境变量 CG_MENU_TOKEN，或把令牌写进 ~/.config/cg-menu/token（一行）")
        headers["Authorization"] = f"Bearer {t}"
    req = urllib.request.Request(base_url() + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            payload = r.read()
            return (payload, dict(r.headers)) if raw else json.loads(payload.decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            err = json.loads(e.read().decode("utf-8"))
        except Exception:  # noqa: BLE001
            err = {"error": e.reason}
        msg = err.get("error", "")
        hint = err.get("hint") or err.get("detail") or ""
        sys.exit(f"服务回 {e.code}：{msg}" + (f"\n  {hint}" if hint else ""))
    except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
        raise Offline(str(getattr(e, "reason", e))) from e


def _park(body: dict) -> Path:
    PENDING_DIR.mkdir(parents=True, exist_ok=True)
    p = PENDING_DIR / f"{time.strftime('%Y%m%d-%H%M%S')}-{body.get('kind', 'x')}.json"
    p.write_text(json.dumps(body, ensure_ascii=False, indent=1), encoding="utf-8")
    return p


def _post_or_park(body: dict):
    try:
        return _request("POST", "/v1/requests", body, auth=True)
    except Offline as e:
        p = _park(body)
        print(f"服务连不上（{base_url()}：{e}）。\n这次要交的内容存在 {p}，联网后跑 `menu.py resend` 补交。"
              f"\n手上的活照做，别等。")
        sys.exit(3)


# ── 命令 ────────────────────────────────────────────────────────────────

def cmd_checklist(_):
    try:
        c = _request("GET", "/v1/checklist")
    except Offline as e:
        sys.exit(f"服务连不上（{base_url()}：{e}），拿不到清单。手上的活照做，稍后再试。")
    print(f"# 自查清单 v{c['version']}\n\n{c['intro']}\n\n## 规矩\n")
    for r in c["rules"]:
        print(f"- {r}")
    print("\n## 要答的几问（answers 的键）\n")
    for q in c["questions"]:
        print(f"- `{q['id']}`：{q['ask']}")
    print("\n## 类型表（types 从这里选 id）\n\n| id | 名称 | 什么时候选 | 我们这边 | 动手前要备的材料 |\n|:--|:--|:--|:--|:--|")
    for t in c["types"]:
        mats = "；".join(t.get("materials", [])) or "见下方「选 other 时」"
        print(f"| `{t['id']}` | {t['name']} | {t['pick_when']} | {STATUS_CN.get(t['status'], t['status'])} | {mats} |")
    print("\n## 选 other 时，materials 尽量填这六项（给不出写「给不出」）\n")
    for i, m in enumerate(c["materials_for_other"], 1):
        print(f"{i}. {m}")
    print("\n## 答完写成这样，存到仓外的临时文件，再 `menu.py submit <文件>`\n")
    print("```json\n" + json.dumps(c["answer_template"], ensure_ascii=False, indent=2) + "\n```")


def _print_result(r: dict):
    mark = MARK.get(r["status"], "·")
    print(f"\n### {mark} {r['name']}（`{r['type']}`）：{STATUS_CN.get(r['status'], r['status'])}")
    if r["status"] == "ready":
        for p in r["packs"]:
            if p["action"] == "up-to-date":
                print(f"- 包 `{p['name']}` {p['version']}：已是最新，不用动")
            elif p["action"] == "update":
                print(f"- 包 `{p['name']}`：你装的是 {p['installed']}，最新 {p['version']} → `menu.py install {p['name']}`")
            else:
                print(f"- 包 `{p['name']}` {p['version']}：没装 → `menu.py install {p['name']}`")
        for s in r.get("settings", []):
            print(f"\n**设定**：{s['what']}\n\n```\n{s['text'].rstrip()}\n```")
        return
    if r.get("note"):
        print(f"- {r['note']}")
    if r.get("have"):
        print(f"- 我们有：{r['have']}")
    if r.get("read"):
        print(f"- 能读：{r['read']}")
    if r.get("materials"):
        print(f"- 要备的材料：{'；'.join(r['materials'])}")
    again = "（同一件事之前登记过，这次算重复出现）" if r.get("repeat") else ""
    print(f"- 已登记，编号 **{r['ticket']}**{again}。过几天 `menu.py status {r['ticket']}` 查。")
    if r.get("materials_for_other"):
        print("- 选 other 的：下面六项没填全的，补给用户问，问到了再 submit 一次：")
        for i, m in enumerate(r["materials_for_other"], 1):
            print(f"  {i}. {m}")
    if r.get("skeleton"):
        print("\n" + r["skeleton"].rstrip())


def cmd_submit(a):
    raw = sys.stdin.read() if a.file == "-" else Path(a.file).read_text(encoding="utf-8")
    body = json.loads(raw)
    body.setdefault("kind", "solution")
    root = project_root()
    body.setdefault("project", root.name)
    body["installed"] = installed_packs(root)
    resp = _post_or_park(body)
    print(f"# 回执 {resp['request_id']}")
    for r in resp.get("results", []):
        _print_result(r)
    _print_client_update(resp)


def _print_client_update(resp: dict):
    u = resp.get("client_update")
    if u:
        print(f"\n> 客户端本身有新版：domain-menu {u['installed']} → {u['version']}，`menu.py install domain-menu`")


def cmd_packs(_):
    try:
        listing = _request("GET", "/v1/packs")
    except Offline as e:
        sys.exit(f"服务连不上（{base_url()}：{e}）")
    mine = installed_packs(project_root())
    print(f"cursor-genesis {listing['cg_ref']} @ {listing['cg_commit']}\n")
    for p in listing["packs"]:
        have = mine.get(p["name"])
        state = "没装" if have is None else ("最新" if have == p["version"] else f"装的 {have}，可更新")
        print(f"- {p['name']} {p['version']}（{state}）：{p['description']}")


def cmd_install(a):
    root = project_root()
    try:
        listing = {p["name"]: p for p in _request("GET", "/v1/packs")["packs"]}
    except Offline as e:
        sys.exit(f"服务连不上（{base_url()}：{e}），装不了。已装的东西照常能用。")
    for name in a.packs:
        if name not in listing:
            sys.exit(f"服务上没有包 {name}；`menu.py packs` 看有哪些")
        info = listing[name]
        data, _ = _request("GET", info["zip"], raw=True)
        sha = hashlib.sha256(data).hexdigest()
        if sha != info["sha256"]:
            sys.exit(f"{name}.zip 校验不过（期望 {info['sha256'][:12]}，拿到 {sha[:12]}），没装")
        with tempfile.TemporaryDirectory(prefix="cg-menu-") as tmp:
            with zipfile.ZipFile(io.BytesIO(data)) as z:
                for member in z.namelist():
                    if member.startswith(("/", "\\")) or ".." in Path(member).parts:
                        sys.exit(f"{name}.zip 里有越界路径 {member}，没装")
                z.extractall(tmp)
            cmd = [sys.executable, str(Path(tmp) / "scripts" / "install-pack.py"), name, str(root),
                   "--source", tmp, "--record-source", f"{base_url()} ({info['sha256'][:12]})"]
            r = subprocess.run(cmd)
            if r.returncode != 0:
                sys.exit(f"{name} 安装器退出码 {r.returncode}")
        print(f"\n装好 {name} {info['version']}。`git status` 看落了哪些文件；照回执里的「设定」贴到位才算到场。")


def cmd_status(a):
    try:
        t = _request("GET", f"/v1/tickets/{a.ticket}", auth=True)
    except Offline as e:
        sys.exit(f"服务连不上（{base_url()}：{e}）")
    print(f"{t['id']}（{t['kind']} · {t['type']}）：{STATUS_CN.get(t['status'], t['status'])}")
    for k in ("note", "why", "choice"):
        if t.get(k):
            print(f"- {t[k]}")
    for p in t.get("packs", []):
        print(f"- 包 `{p['name']}` {p['version']} → `menu.py install {p['name']}`")


def cmd_feedback(a):
    root = project_root()
    body = {"kind": "feedback", "category": a.category, "where": a.where, "text": a.text,
            "project": root.name, "installed": installed_packs(root)}
    resp = _post_or_park(body)
    print(f"已登记，编号 {resp['ticket']}。{resp['note']}")
    _print_client_update(resp)


def cmd_resend(_):
    files = sorted(PENDING_DIR.glob("*.json")) if PENDING_DIR.exists() else []
    if not files:
        print("没有待补交的")
        return
    for f in files:
        body = json.loads(f.read_text(encoding="utf-8"))
        try:
            resp = _request("POST", "/v1/requests", body, auth=True)
        except Offline as e:
            sys.exit(f"还是连不上（{e}），{len(files)} 份原样留着")
        f.unlink()
        tickets = [r.get("ticket") for r in resp.get("results", [])] + [resp.get("ticket")]
        print(f"补交 {f.name} → {resp['request_id']} 编号 {', '.join(t for t in tickets if t) or '无（全是有包的）'}")


def main():
    for s in (sys.stdout, sys.stderr):
        try:
            s.reconfigure(encoding="utf-8")
        except AttributeError:
            pass
    ap = argparse.ArgumentParser(description="domain-menu 客户端")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("checklist").set_defaults(fn=cmd_checklist)
    p = sub.add_parser("submit")
    p.add_argument("file")
    p.set_defaults(fn=cmd_submit)
    p = sub.add_parser("install")
    p.add_argument("packs", nargs="+")
    p.set_defaults(fn=cmd_install)
    sub.add_parser("packs").set_defaults(fn=cmd_packs)
    p = sub.add_parser("status")
    p.add_argument("ticket")
    p.set_defaults(fn=cmd_status)
    p = sub.add_parser("feedback")
    p.add_argument("--category", required=True, choices=["misfit", "validator", "want"])
    p.add_argument("--where", default="")
    p.add_argument("--text", required=True)
    p.set_defaults(fn=cmd_feedback)
    sub.add_parser("resend").set_defaults(fn=cmd_resend)
    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
