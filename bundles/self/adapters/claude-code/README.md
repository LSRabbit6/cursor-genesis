# 受限场 · Claude Code 适配层

> 组件说明在 [../../components/sandboxed-session.md](../../components/sandboxed-session.md)。这里只放 Claude Code 才有的：开法、参数、坑、收货脚本。
> 读数：10-17 在 toys 审计场实测（版本号没记）；10-28 在 2.1.299 上复测锁还在（下文「读数」）。版本变了先重测。

## 件

| 件 | 做什么 |
|---|---|
| [open-sandbox.ps1](open-sandbox.ps1) | 在交接包目录里开受限场：设输出上限、拼命令、开会话。`-DryRun` 只打印命令 |
| [check_sandbox_session.py](check_sandbox_session.py) | 收货核对：读这场的会话记录，沿主线查工具、路径、读法、写了什么、回执 |

## 开

```powershell
.\open-sandbox.ps1 -Dir D:\...\audit-pack                    # 默认 claude-fable-5-1、xhigh、五个文件工具
.\open-sandbox.ps1 -Dir D:\...\audit-pack -Resume <会话ID> -AddDir ..\stage2,..\reasoning
```

它拼出来的就是这一行（10-17 样板原样）：

```powershell
$env:CLAUDE_CODE_MAX_OUTPUT_TOKENS = "32000"
claude --restricted --strict-mcp-config --tools "Read,Write,Edit,Grep,Glob" --model claude-fable-5-1 --effort xhigh
```

| 参数 | 管什么 |
|---|---|
| `--restricted` | 文件工具只能碰工作目录和 `--add-dir`；Bash、PowerShell、WebFetch 移除；不读用户、项目、本地三层设置，所以 hook 和每轮注入都不进来（CLAUDE.md 进不进来没测） |
| `--strict-mcp-config` | MCP 也不加载 |
| `--tools` | 只留这几个工具 |
| `--model`、`--effort` | 哪个模型进笼子、开多深 |
| `--add-dir` | 接续开下一阶段时加挂目录，挂上的能读，别的照样拒 |
| `--resume <ID>` | 接续上一阶段那场 |

## 坑

1. **输出上限退回 12000**：受限模式不读用户设置，那边配的 32000 不生效。xhigh 一次写大段报告会报「exceeded the 12000 output token maximum」。开之前在同一个终端设 `CLAUDE_CODE_MAX_OUTPUT_TOKENS=32000`，脚本已代做。帮助文本说 `--settings` 仍生效，可能是另一条路，没测。
2. **`--add-dir` 会吞后面的提示词**：开起来以后再粘开场白。
3. **接续用 `--resume <ID>`，不用 `--continue`**：后者接「这个目录里最近一场」。10-17 主会话测试时用了它，两次误接进审计那场，在会话文件里留了一条支线。核对脚本只沿主线核，所以没受影响。
4. **长件会被截**：Read 单次有行数上限（10-17 截在 480 行），它会带 offset 补读。脚本只把不带 offset、limit 的读算「整件读」，补读要人看一眼判。

## 核

会话记录在 `~/.claude/projects/<工作目录换成短横线>/<会话ID>.jsonl`。不给 `--session` 时脚本按 `--cwd` 找那个目录里最新的一场。

```bash
# 一阶段：八件按顺序整件读，只写报告，回执码对；到第一次读二阶段提示词为止
python check_sandbox_session.py --cwd . \
  --order 07-audit-prompt.md --order 00-MANIFEST.md ... \
  --write audit-report.md --codes ../progress/read-codes.json \
  --until-read ../stage2/stage2-prompt.md

# 二阶段：从第一次读二阶段提示词起；白名单照开场时的 --add-dir 给
python check_sandbox_session.py --cwd . --add-dir ../stage2 --add-dir ../external-codex \
  --from-read ../stage2/stage2-prompt.md --write ../stage2/stage2-report.md \
  --order ../stage2/stage2-prompt.md --order ../external-codex/README.md ... \
  --codes ../progress/read-codes.json --tail 10    # JSON 没登记码的件，取末行最后 10 个字当回执
```

给了 `--order` 又开了回执检查（`--codes` 或 `--tail`），清单里哪件既没登记码、`--tail` 也取不到，直接判 FAIL，不悄悄跳过。

全 PASS 才收。最后一行 MANUAL 是人工项：它报的现状拿场外读数核。

## 读数

- 10-17（toys 审计场）：读 `audit-plan.md`、`external-codex/README.md` 被宿主拒，包内正常，工具只剩五个；接续加受限加挂目录可用。
- 10-28（2.1.299，haiku 无头小测）：读工作目录外的文件，宿主回「is outside … --restricted confines the file tools to the working directory」；包内读写正常。核对脚本把这次试读判成 FAIL——宿主拒了也算，收货要知道它试过。
- 回归：核对脚本对 10-17 审计场（会话 c8b5f763）一阶段的判定，跟 toys 原脚本 `check_audit_session.py` 逐条一致；二阶段带 `--tail 10`，7 行回执全对，跟 `check_stage2_session.py` 一致。两边都报出同一处多写（这场会话后来被续用写了 next-block）。
- 10-28 Codex 复核指出两处缺口（漏登记码的件被悄悄跳过；没有末行取码），已补；反例「读两件只登记一件」现在判 FAIL。
