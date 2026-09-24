# 探针与休眠脚本 · 调用说明（toys 运行件，v0.1.0）

> 性质：说明件，**不复制代码**。脚本是 toys 的运行件（路径写死 toys 与它的会话槽）；本件只写「在 toys 里叫什么、读哪、写哪、谁在什么时候调、失败怎么叫人、手动怎么干跑」。
> 共同口径：全部零模型额度（本地解析会话 jsonl / git / 文件系统，不调 claude / codex CLI）；**量不到写「不可得 / 没跑 / 无产物」，不写 0**——0 是「量了、一次没用」；失败走夜间杂务统一的「同题只叫一次」投收件箱，成功静默。
> 路径相对 toys 仓根（`<工作台仓（私有，本机）>`）；**会话槽** = `~/.claude/projects/<槽名>/`，toys 的槽名是 `d--Project-personal-toys`。

## 0 夜里谁调谁

```
dispatch-queue-tick（计划任务，每 30 分钟）
  └─ dispatch-kernel/daily_chores.py        靠日期戳一天只跑一次（约 00:28 第一次 tick）
       ├─ session-archaeology/nightly_harvest.ps1 -MechanicalOnly   夜车：机械档、打标、kg_usage.py、criteria_log.py report、residue.py
       ├─ 各哨兵                              夜车失败哨兵读 nightly.log 里「<步骤>失败 exit=N」行 → 收件箱
       ├─ dormancy_check()                    → asset-registry/dormancy.py --apply            （§6）
       ├─ trajectory_daily()                  → session-archaeology/trajectory.py 逐场 → 汇总  （§1 §2）
       └─ residue.py 重算                     哨兵投完再生成一遍，开场注入读到当晚读数        （§4）
```

**看它活没活（三处）**：`python dispatch-kernel/daily_chores.py --status`；`my-desk/harvest/nightly.log` 当晚没有「失败 exit=」行；开场注入的 RESIDUE 里「kg 取用」「昨日轨迹」两行都在、且不是「没跑 / 无产物」。

## 1 记忆召回对账 + 路由对账（探针 ① ②）—— `session-archaeology/trajectory.py`

- **是什么**：轨迹账本。把一场会话从集合视图翻回时序视图（段 = 两次人开口之间），顺带算两本对账：
  - 记忆召回：人开口撞上记忆索引某行的触发样例 = **命中**；同场主会话读 / 碰了那行指的文件（Read、命令、Grep、写都算）= **消费**；命中未消费 = **漏**（=「同题问第 N 遍」的机器版）。每个索引行一场最多记一次命中。
  - 路由对账：hook 注入命中 vs 被消费，四个数 命中 / 已消费 / 未消费 / 无判据。
- **读**：会话 jsonl；`<会话槽>/memory/MEMORY.md`（只读、一字不改）；`.agents/hook-routes.json`（每条路由可选的 `criteria` 字段当消费判据）。
- **写**：账本 `session-archaeology/data/trajectory/<sid 前 8 位>.md`（`data/` 永不进 git）；`--metrics <json>` 另写机读读数。⚠ 不给 `--out` 就写进 `data/trajectory/`，试跑一律 `--out` 到临时目录。
- **机读字段（契约，别改名）**：`human / decl / delta / next_step / faults`；`routes{hit, consumed, unconsumed, nocrit}`；`memory{available, index, entries, skipped, hit, consumed, missed, missed_names}`；`by_day`（同一套读数按人开口的本地日分桶）。
- **记忆索引行怎么写才量得到**（`parse_memory_index()` 的约定；别的项目写索引行也照这个写）：
  - 索引行以 `- ` 开头；名字 = `[名字](指针)` 的链接文字；指针 = 行内 markdown 链接，没有链接退到反引号里的路径。
  - 触发样例 = 引号（"…" / “…” / 「…」）里的一段，且：① 引号前的从句以「问 / 说 / 提(到) / 谈 / 喊 / 慌 / 口述 / 纠结」收尾（他开口的问法）；② 从句里没有「AI」；③ 引号之后、本分句结束前有「→」（格式是「触发 → 动作」，箭头后引号里的是规则原句，不算触发）。样例按 `/` 切成短语做匹配。
  - 例：`- [复利第二环](project_x.md) — 他说「复利/凭什么不白干/这算认知还是资产」→先读防重推；……`
  - 认不出触发样例的行进 `skipped`，不参与对账（不是 0 命中，是量不了）。
- **命令**：
  ```
  python session-archaeology/trajectory.py --file <jsonl> --out <临时目录>/t.md --metrics <临时目录>/t.json
  python session-archaeology/trajectory.py --sid <sid 前缀> [--project <槽名>] --out <…>
  python session-archaeology/trajectory.py --file <jsonl> --memory-index <另一份 MEMORY.md> --out <…>
  python session-archaeology/test_trajectory.py        # 自测，合成数据，不碰真实文件
  ```
- **失败怎么叫人**：手跑看退出码与 stderr；夜跑由 §2 负责叫人。
- **注意**：对账用的是**今天**的 MEMORY.md，旧会话当时的索引可能不同（记忆目录没有版本史）。

## 2 夜跑汇总 —— `dispatch-kernel/daily_chores.py` 的 `trajectory_daily()`

- **谁调、何时**：`run()` 里，排在夜车与各哨兵之后、RESIDUE 重算之前（让开场那一行读到当晚的汇总）。
- **挑场**：昨天有人开口的 toys 根会话（`<会话槽>/*.jsonl`，不含 `subagents/` 与 `agent-*`）；跨天的会话只取当天那一桶（`by_day`）。
- **写**：逐场 `session-archaeology/data/trajectory/<sid8>.md` + `.json`；当天汇总 `daily-<日期>.md`（人看）+ `daily-<日期>.json`（开场那一行只读它的 `totals`）；状态 `dispatch-kernel/state/trajectory-daily.json`。
- **失败怎么叫人**：`_alert_once` 投收件箱。指纹只取步骤名（`enumerate` / `trajectory` / `summary`）：同一步天天失败只叫一次；台账里那条丢了会重新叫（失踪自愈）；人签过字的不再叫。
- **干跑**：`python dispatch-kernel/daily_chores.py --trajectory-only [--day YYYY-MM-DD] [--traj-out <临时目录>]`——不写日期戳、不投收件箱、不写 state；产物照写（`--traj-out` 指到临时目录就不碰 `data/`）。
- **测试**：`cd dispatch-kernel && python test_daily_chores_trajectory.py`

## 3 判断层取用（探针 ③）—— `session-archaeology/kg_usage.py`

- **读**：`~/.claude/projects/*/*.jsonl`（默认 30 天滚动）；kg 的 roots / topics / derivation 文件名。只观测，不写 kg。
- **写**：`my-desk/harvest/kg-usage.json` + `kg-usage.md`（`--out-dir` 可改）。开场那一行用三个字段：`calls_daily {本地日: {all, out}}`（out = kg 工作区之外的调用）、`calls_recent`（最近 20 次：时间 / 问句 / 工作区 / 主会话还是分身）、`calls_scope`（口径一句话）。
- **真调用口径**：只认 assistant 行里 Bash / PowerShell 的 `tool_use` 命令跑了 kg 的 `search.py --query`。全行文本匹配的 `queries` 会把注入文本里的示例命令也算进去，不能当调用次数。
- **谁调**：夜车 `nightly_harvest.ps1` 用绝对路径跑 `kg_usage.py --days 30`。
- **失败怎么叫人**：夜车在 `my-desk/harvest/nightly.log` 写一行「[时刻] kg_usage 失败 exit=N」→ daily_chores 的夜车失败哨兵（`nightly_failures_check`）投收件箱，指纹只取步骤名。
- **手跑**：`python session-archaeology/kg_usage.py --days 30 --out-dir <临时目录>`（不带 `--out-dir` 会写真产物）。

## 4 开场注入的两行 —— `my-desk/harvest/residue.py` 的 `kg_line()` / `trajectory_line()`

- **读**：`kg-usage.json` 的 `calls_daily / calls_recent / generated`；`data/trajectory/daily-<昨天>.json` 的 `totals`。
- **写**：`my-desk/harvest/RESIDUE.md`（有字数预算）；由 `.agents/hook-routes.json` 的 opening 项在每场会话首条注入。
- **两行长这样**：
  ```
  > **kg 取用**：昨夜 N 次 · 近 7 天 M 次 · 最近一次 <日期>「<问句前 20 字>」 · 明细 `my-desk/harvest/kg-usage.md`
  > **昨日轨迹**：N 场 · 申报 x/y · 下一步 z/y · memory 召回 命中 a 消费 b 漏 c · 路由命中 h 消费 u（未消费 · 无判据）→ …/daily-<日期>.md
  ```
- **量不到时的措辞**：kg 行——无产物 / 读不了 / 旧格式 / 产物停在某天（带 ⚠）；轨迹行——昨夜没跑 / 昨天没有人开口的场（跑过，0 场可对账）。都不写 0。
- **谁调**：夜车里一次；daily_chores 哨兵投完后重算一次。
- **失败怎么叫人**：**不叫**——这两行出异常时返回空，不挡主产物。开场看不到这两行 = 出错了，手跑一次看。
- **手跑**：`python my-desk/harvest/residue.py`；自测 `python my-desk/harvest/residue.py --selftest`（临时目录造数据，不碰真实文件）。
- ⚠ `residue.py` 被 toys `.gitignore` 第 56 行的 `*` 兜住，不在版本史里（放不放行归用户）。

## 5 判据台账标龄（探针 ④）—— `my-desk/harvest/criteria_log.py report`

- 夜车里跑。报告首行 `> 台账最后写入 <日期>（N 天前）`；超过 7 天（或一笔没有）时同一行写「义务类『守住』读数作废」，逐条从「✅ 守住」改印「— 作废」。
- 手跑：`python my-desk/harvest/criteria_log.py report | head -3`

## 6 休眠摘出 —— `asset-registry/dormancy.py`（daily_chores 的 `dormancy_check()`）

- **读**：仓根一级目录（点开头的不算）各自的 git 最后一次非扫场提交、文件系统最后一次非扫场修改；仓根 `ASSETS.md` / `HOME.md` 的 Markdown 表格数据行；`<目录>/ASSET.yml`。
- **写（`--apply`）**：休眠目录的索引行挪到该文件末尾 `<!-- dormancy:begin` … `<!-- dormancy:end -->` 段，原行一字不改、首格前加〔休眠自 YYYY-MM-DD〕，每组前一行记原段标题；`<目录>/ASSET.yml` 写 / 删 `dormant_since`（写后还原 mtime）；再活跃自动挪回原段，原段没了报 orphan 让人处理。
- **判据**（常量在脚本头部，改那里即可）：60 天；扫场提交（点名的批量提交 + 一次碰 ≥12 个顶层目录的提交）与扫场文件（资产卡、状态件、自动重生成的清单）不算活动；「按设计不动」白名单；零证据的目录不判；一行只在它指向的目录**全部**休眠时才摘，散文行不动。
- **谁调**：daily_chores `dormancy_check()` 每天一次 `--apply`；读数落 `dispatch-kernel/state/dormancy.json`。
- **失败怎么叫人**：只叫两种——脚本出错（退出码不是 0/1、输出不是 JSON、起不来）和有行回不去原段（orphan），经 `_alert_once` 投收件箱（指纹 = 种类）。正常的摘出 / 挪回不叫人：改动留在工作区，提交时 `git diff` 看得见。
- **手跑**：
  ```
  python asset-registry/dormancy.py --check      # 只读；退出码 0 = 无待办，1 = 有待办，2 = 出错
  python asset-registry/dormancy.py --apply      # 照做
  python asset-registry/dormancy.py --check --root <仓根> --today <YYYY-MM-DD>   # 回放 / 指到别的仓
  python asset-registry/test_dormancy.py
  cd dispatch-kernel && python -m unittest test_daily_chores_dormancy
  ```
- **没有**：daily_chores 没有 `--dormancy-only` 干跑口；要干跑直接 `dormancy.py --check`。
- **换仓**：找东西只靠固定结构（仓根一级目录、仓根两个索引文件里的表格数据行、`<目录>/ASSET.yml`），不靠任何全仓索引——别的仓照这个结构长，就能用 `--root` 指过去。

## 7 别的项目要同样的读数（松耦合）

1. **先查询，不复制**：这些读数的产物都落在固定位置（`data/trajectory/daily-<日期>.json`、`my-desk/harvest/kg-usage.json`、`dispatch-kernel/state/*.json`），别的项目按目录约定去读就行。
2. **照结构长**：记忆索引行照 §1 的写法写，召回对账就量得到；目录照「一级目录 + 索引表格行 + 资产卡」长，休眠摘出就能 `--root` 指过去。
3. **真要自己的探针**：照每节的「固定落点 + 机读字段」各写一份，字段名一致，夜间汇总与开场注入就能复用同一套读法。
4. 复盘时没有这些运行件的项目，A 模板第 6 节照实写「无读数（没有运行件）」，不写 0。
