# 工作台包 · Codex 薄适配样板

> 规约正本是工作台根目录的 `AGENTS.md`。Codex 原生读它，也原生发现 `.agents/skills/`，所以这一层几乎不用放文件。
> 这里记的是 Codex 自己的几处规矩，装的时候照着核。
> 对照的清单：[cross-host-thin-adapters](../../../../stable/packs/harness-engineering/skills/cross-host-thin-adapters/SKILL.md)。

## 放哪

| 要什么 | Codex 怎么到场 | 装的时候做什么 |
|---|---|---|
| 规约 | 原生读根目录 `AGENTS.md`；进了子目录，还会读更近的那份 | 什么都不用放。研究级、项目级的规约写在各自目录的 `AGENTS.md` |
| 技能 | 原生发现 `.agents/skills/` | 什么都不用放 |
| hook | 非托管 hook 按定义信任 | 本包 v0.1.0 不带 hook。货架包带了的，装完在交互式 Codex 里跑一次 `/hooks`，审过命令再信任；不改信任数据库绕过 |
| 登录 | 用使用者自己的账号 | 让使用者自己登录；不导入别人的登录态 |
| 用户配置 | `config.toml` 是使用者私有的 | 不碰 |

## 逐条对清单

| 清单条 | 本样板怎么做 |
|---|---|
| ① 项目规约：AGENTS.md 单一作者源，Codex 原生读取 | 不放任何导入文件；规约只在 `AGENTS.md` |
| ① 已确认 Skill：`.agents/skills/` 是作者源 | Codex 直接读作者源，不复制 |
| ① UserPromptSubmit 路由：共用中立路由器，找不到配置就静默放行 | 本包不带路由器。以后带，就按这条 |
| ② 永不统一：登录态、权限、sandbox | 使用者自己登录；审批模式和 sandbox 用使用者的默认 |
| ② 永不统一：MCP 授权与信任 | 不带 MCP，不导入维护者的 MCP |
| ② 永不统一：宿主 auto-memory | 不碰。偏好写进工作台的画像文件 |
| ② 永不统一：宿主独有的 hook 事件名和工具名 | Claude Code 的 hook 注册段不搬过来；Codex 的 hook 另写、另信任 |
| ③ 中立运行时装在宿主无关的位置 | 本包不装运行时 |
| ④ 验收要行为级；清单写着 Codex「未验证」 | 现场按 SETUP-FOR-AI 第 5 步验，结果记进回执。没跑过就记「未验」 |

## 现场核三件

1. 新开会话，它能说出铁律，并说出是从 `AGENTS.md` 读到的。
2. 进一个子目录再问一次，它能说出那一级 `AGENTS.md` 多出来的规矩（有子目录规约时才做）。
3. `.agents/skills/` 下的技能能被发现。发现不了就让它直接读 `SKILL.md`，记「自动发现未验证」。
