# archive · 归档区

> 这里放从现行目录搬出来的旧内容。**只搬不删**：原路径结构照留，git 历史跟着走。要恢复，`git mv archive/<日期>/<原路径> <原路径>` 即可。
> 现有内容各进哪个包、哪些归档，见仓根 [INVENTORY.md](../INVENTORY.md)。

## 2026-10-22：Cursor 时代的三个包和它们专用的规则

维护者 10-22「照清单做吧」（清单＝INVENTORY 第五节，范围收到「没有被留下的东西指着的」）。

| 原路径 | 是什么 | 为什么归档 |
|---|---|---|
| `stable/packs/knowledge-manage/` | 知识体系管理包（含叶子节点模板、可视化器） | 休眠；没有进任何结合包 |
| `stable/packs/cursor-templates/` | Cursor 项目模板 | Cursor 2026-09-24 冻结 |
| `stable/packs/v1-talk/` | 对话场景包（6 个团队模式，Cursor Rules 路由） | 同上 |
| `stable/atoms/rules/teams/`、`rules/meta/`、根下 5 个 `.mdc` | v1-talk、knowledge-manage 用的 Cursor 规则 | 随上面两个包走；`rules/enterprise/` 留在原处 |
| `install.sh` | v1.2.0 的预设安装器 | 装的是上面这些；现行装法见各货架包 README（`scripts/install-pack.py`） |
| `.cursor/rules/` | 维护本仓用的 Cursor 规则 | Cursor 冻结 |

**没搬的**（有留下的东西指着，搬了会断）：`stable/atoms/patterns/`（kg `index/relations.yaml`）、`stable/atoms/standalone/`（kg `index/topics/ai-collaboration.yaml`）、`stable/atoms/code-templates/`、`stable/atoms/commands/`（kg 的文档）、`stable/knowledge/`（kg `index/domains.yaml`、registry `index_file`）、`stable/packs/enterprise/`（kg registry：接单线独立对外时再物理拆）。

**会留着旧指向的地方**（只是文字，没有程序读）：
- `stable/knowledge/` 里的历史文档按文件名提到这些规则。
- `stable/atoms/capabilities/02_architecture/prometheus-prompt-engineer.md` 提到 `rules/teams`。
- 老安装链 `scripts/sync.sh`、`scripts/mcp-server.py`、`stable/atoms/skills/` 里的 cg-install 等和 `resources-catalog.yaml` 还按旧路径列着它们。这条链没有接到任何宿主的 MCP 或 hook 配置上（10-22 查 `~/.claude.json`、`~/.codex/config.toml`），待分诊。
- kg 的 `docs/`、`meta/leaf-node-spec.md` 等按旧路径提到 v1-talk、knowledge-manage，归 kg 会话撞到再改。

## 2026-10-22 第二轮：kg 不再指着以后能搬的那些

前提：维护者 10-22 定了「kg 引用叶子只到节点级，经叶子入口读」（kg `meta/leaf-node-spec-v2.md` §2.5，kg c219dd1），kg 先把 domains、relations、topics 里钉在 cg 内部的指针收了。维护者「能」。

| 原路径 | 为什么能搬 |
|---|---|
| `stable/knowledge/knowledge-system/` | kg 提炼过；kg `meta/archives/知识体系整理/` 有逐行对齐的副本（只差一行本机路径，kg 09-15 修过）。toys 原话索引改指 kg 副本 |
| `stable/knowledge/architecture-decisions/`、`cursor-specs/`、`prompt-engineering/`、`local-only.yaml` | kg 07-03 载体层全量提炼过；prompt-engineering 是空目录 |
| `stable/knowledge/learnings/` 里 2025-12 两篇、2026-02-25 一篇 | 提炼过；2026-06 企业交付那篇没提炼，留在原处 |
| `stable/atoms/standalone/`、`code-templates/`、`commands/` | kg 不再指着；CI、测试不用 |
| `stable/atoms/patterns/` 其余 4 个 | 只有已归档的 v1-talk、knowledge-manage 用；topic-research-team、strategic-research-team 是工作台包候选，留 |
| `stable/atoms/skills/` 的 cg-install、kg-search、kg-assemble、`resources-catalog.yaml`，`scripts/sync.sh`、`scripts/mcp-server.py` | 老安装链，没接到任何宿主的 MCP 或 hook 配置 |

**留下的叶子入口**：`stable/knowledge/index.yaml` 重写，只列结合包、协作机制（harvest-session、state-header）、工作台候选、货架包、还在用的 learnings 和发布包。kg 要指件就写这里条目的锚。

**已知的老问题（不是这次弄出来的）**：`scripts/legacy_scanner.py` 的 `PROMPT_LIB` 从 02-25 起就算到了仓库外面，`standalone/legacy/` 的两份提示词一直没读到；要用先改路径，提示词在本目录 `stable/atoms/standalone/legacy/`。
