# 工作台包 · Claude Code 薄适配样板

> 规约正本是工作台根目录的 `AGENTS.md`。这里只放 Claude Code 自己才需要的几样，不复制规约正文。
> 对照的清单：[cross-host-thin-adapters](../../../../stable/packs/harness-engineering/skills/cross-host-thin-adapters/SKILL.md)。

## 放哪

| 本目录的件 | 装到工作台的哪 | 做什么 |
|---|---|---|
| [CLAUDE.md](CLAUDE.md) | 根目录 `CLAUDE.md` | 一行 `@AGENTS.md`，导入同一份规约 |
| [settings.example.json](settings.example.json) | `.claude/settings.json` | 权限示例：读写和跑 Python 放行，删除和推送拦下。按这个人的电脑改 |
| 技能镜像（不是文件，是一步动作） | `.claude/skills/<技能名>/` | 从 `.agents/skills/<技能名>/` 复制过来。单向：只改 `.agents/skills/`，改完再复制一次 |

本包 v0.1.0 不带 hook。带 hook 的货架包，各自在包里附注册段（例：`stable/packs/delivery-data-app/adapters/claude-code/settings.hooks.json`），并进 `.claude/settings.json` 的 `hooks` 键。

## 逐条对清单

| 清单条 | 本样板怎么做 |
|---|---|
| ① 项目规约：AGENTS.md 单一作者源，Claude Code 薄导入 | `CLAUDE.md` 只有一行 `@AGENTS.md`，不写第二份规约 |
| ① 已确认 Skill：`.agents/skills/` 单向投影到宿主的 skill 目录 | 复制到 `.claude/skills/`；不反向同步，不在 `.claude/skills/` 里改 |
| ① UserPromptSubmit 路由：共用中立路由器，找不到配置就静默放行 | 本包不带路由器。以后带，就按这条：没配置的项目静默放过 |
| ② 永不统一：登录态、权限、sandbox | `settings.example.json` 只是示例，装的时候按这个人改；用使用者自己的账号登录 |
| ② 永不统一：MCP 授权与信任 | 不带 MCP，不导入维护者的 MCP |
| ② 永不统一：宿主 auto-memory | 不碰。使用者的偏好写进工作台的画像文件，不写进 Claude 的 memory |
| ② 永不统一：宿主独有的 hook 事件名和工具名 | 本包不带 hook；货架包的注册段只给 Claude Code 用，不搬给 Codex |
| ③ 中立运行时装在宿主无关的位置 | 本包不装运行时 |
| ④ 验收要行为级，文档层兼容不等于运行时通过 | 现场按 SETUP-FOR-AI 第 5 步验：说出铁律和出处、技能能被发现。没跑过就记「未验」 |

## 现场核三件

1. 新开会话，它能说出铁律，并说出是从 `AGENTS.md` 读到的。
2. `.claude/skills/` 下的技能能被发现。发现不了就让它直接读 `.agents/skills/<技能名>/SKILL.md`，记「自动发现未验证」。
3. 试一个被拦的动作（例「删掉这个测试文件」），看它先停下来问。
