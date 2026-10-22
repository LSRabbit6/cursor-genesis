# INVENTORY · cg 现有内容各进哪个包（2026-10-22）

> 结合包重排后的一次盘点。**只标注，不搬不删。** 搬删都是档 1，要维护者逐条拍。
> 包的定义和门槛见 [bundles/README.md](bundles/README.md)。「未入包」只是标注：管新进来的那条门槛不赶走存量。
> 文件数和日期是 2026-10-22 读数（日期＝最后一次提交）。

## 一、货架包（stable/packs/）

| 包 | 版本 | 文件 | 最后提交 | 进哪个包 | 动作 |
|---|---|---|---|---|---|
| delivery-data-app | 0.2.1 | — | 2026-09-24 | 交付包（组件层） | 标注 |
| domain-menu | 0.2.1 | — | 2026-09-24 | 交付包（组件层）。菜单服务的客户端，0.2.0 从 delivery-data-app 拆出 | 标注 |
| second-loop-compounding | 0.1.3 | 9 | 2026-10-22 | 交付包候选，还没有真收件人 | 标注 |
| harness-engineering | — | 8 | 2026-09-24 | 货架。其中 cross-host-thin-adapters 当宿主适配层的参考，工作台包的两份样板逐条对过它 | 标注 |
| create-toolkit | 1.6.0 | 71 | 2026-08-16 | 自用包候选 | 标注 |
| deep-research | 1.0.0 | 12 | 2026-08-17 | 自用包候选 | 标注 |
| knowledge-manage | — | 70 | 2026-08-16 | 未入包。休眠 | **已归档**（2026-10-22，`archive/2026-10-22/`） |
| enterprise | 1.2.0 | 7 | 2026-07-21 | 未入包。逻辑上已拆给 kg 的 enterprise-delivery 节点，物理搬走候选 | 搬删，档 1 |
| cursor-templates | — | 2 | 2026-07-21 | 未入包。Cursor 已冻结 | **已归档**（2026-10-22，`archive/2026-10-22/`） |
| v1-talk | — | 2 | 2026-07-21 | 未入包。Cursor 已冻结 | **已归档**（2026-10-22，`archive/2026-10-22/`） |

## 二、原子（stable/atoms/，97 个文件）

默认：被包引用的留下，其余归档候选。下表多出一条读数：**capabilities 和两个 pattern 已经真发出去过一次**——2026-10-19 随科研工作者的工作台发出，22 个文件，钉在 cg `426a73d`，字节一致带哈希。只有三版里的 starter 版带了它们。这是 cg 第一次有记录的「被取出」。

| 区块 | 文件 | 最后提交 | 谁引用 | 进哪个包 | 动作 |
|---|---|---|---|---|---|
| capabilities/（四层） | 21 | 2026-02-25 | 科研工作者的工作台（真收件人）；v1-talk、knowledge-manage | 工作台包候选 | 标注 |
| patterns/topic-research-team.md、strategic-research-team.md | 2 | 2026-02-25 | 同上 | 工作台包候选 | 标注 |
| patterns/ 其余 4 个 | 4 | 2026-02-25 | v1-talk、knowledge-manage（已归档） | 未入包 | **已归档**（2026-10-22 第二轮，`archive/2026-10-22/`） |
| skills/harvest-session | 2 | 2026-08-16 | create-toolkit 的说明里指向它；维护者自己的收尾技能是它的个人适配 | 自用包候选 | 标注 |
| skills/java-backend-test-ops | 1 | 2026-06-22 | enterprise | 跟 enterprise 走 | 搬删，档 1 |
| skills/ 其余（cg-install、kg-search、kg-assemble、resources-catalog） | 4 | 2026-09-24 | 老安装链，没接到任何宿主 | 未入包 | **已归档**（2026-10-22 第二轮，`archive/2026-10-22/`）；README 留着 |
| validators/state-header | 4 | 2026-08-17 | 第一个消费方是维护者的工作台 | 自用包候选 | 标注 |
| rules/enterprise | 4 | 2026-03-30 | enterprise | 跟 enterprise 走 | 搬删，档 1 |
| rules/teams、rules/meta、rules/ 根下 5 个 .mdc | 13 | 2026-03-30 | v1-talk、knowledge-manage；Cursor 格式 | 未入包 | **已归档**（2026-10-22，`archive/2026-10-22/`） |
| plan-templates/ | 2 | 2026-07-21 | enterprise | 跟 enterprise 走 | 搬删，档 1 |
| commands/ | 6 | 2026-07-21 | Cursor 斜杠命令格式 | 未入包 | **已归档**（2026-10-22 第二轮，`archive/2026-10-22/`） |
| standalone/ | 17 | 2026-02-27 | scripts/legacy_scanner 名义上用 legacy/ 两份提示词（脚本路径早就算错，没读到过） | 未入包 | **已归档**（2026-10-22 第二轮，`archive/2026-10-22/`） |
| code-templates/ | 16 | 2026-02-25 | create-toolkit 里不在安装清单的 create-project 命令 | 未入包 | **已归档**（2026-10-22 第二轮，`archive/2026-10-22/`） |

## 三、知识（stable/knowledge/，50 个文件）

默认：方法正文迁到 kg 方法格，或归档。跨仓搬，档 1。
**搬之前要先改 kg**：kg registry 的 cg 段 `index_file` 指着 `stable/knowledge/index.yaml`，搬走会断。

| 区块 | 文件 | 最后提交 | kg 提炼过吗 | 动作 |
|---|---|---|---|---|
| knowledge-system/ | 19 | 2026-02-25 | 提炼过；kg `meta/archives/知识体系整理/` 有逐行对齐的副本 | **已归档**（2026-10-22 第二轮，`archive/2026-10-22/`）；kg domains、toys origin-review 改指 kg 副本 |
| architecture-decisions/ | 10 | 2026-02-25 | 提炼过（2026-07-03 载体层全量） | **已归档**（2026-10-22 第二轮，`archive/2026-10-22/`） |
| cursor-specs/ | 13 | 2026-03-31 | 提炼过（同上） | **已归档**（2026-10-22 第二轮，`archive/2026-10-22/`） |
| learnings/ | 5 | 2026-06-29 | 2025-12、2026-02 那三篇提炼过；2026-06 企业交付那篇没提炼 | 三篇**已归档**（2026-10-22 第二轮，`archive/2026-10-22/`）；企业那篇留，跟 enterprise 走 |
| prompt-engineering/ | 1 | 2026-02-25 | 空目录（只有 .gitkeep） | **已归档**（2026-10-22 第二轮，`archive/2026-10-22/`） |
| index.yaml、local-only.yaml | 2 | 2026-10-22 | — | index.yaml 重写成叶子入口（kg 只经它读 cg，leaf-node-spec-v2 §2.5）；local-only.yaml 已归档 |

## 四、其余

| 区块 | 进哪个包 | 动作 |
|---|---|---|
| stable/archetypes/ | 休眠。正本已迁 kg docs/archetypes/，这里留指针 | 不动 |
| scripts/install-pack.py | 交付包的装法要用 | 留 |
| scripts/check-bundles.py | 本次新增，核清单 | 留 |
| scripts/legacy_scanner.py、backflow.sh、pr-monitor.sh | 未入包 | 没细查，待分诊（sync.sh、mcp-server.py 已随老安装链归档） |
| install.sh | 未入包。v1.2.0 的预设安装器 | **已归档**（2026-10-22，`archive/2026-10-22/`） |
| .cursor/rules/ | Cursor 已冻结 | **已归档**（2026-10-22，`archive/2026-10-22/`） |
| docs/downstream-spec.md | 交付包的回流说明引用它 | 留 |
| docs/architecture.md、pr-monitoring.md | 未入包 | 没细查，待分诊 |
| .knowledge/ | 节点元信息，不是资产 | 留 |

## 四½、服务线（2026-09-26～10-03 远端合入）

盘点第一版时本地没有这条线，合并远端后补。维护者 10-22「可以」：读作各包共用的**交付与回流通道**，不单列成包。

| 区块 | 去向 | 动作 |
|---|---|---|
| service/、web/、db/、drizzle/、deploy/、Dockerfile、package.json 等 | 交付与回流通道：取包、回执、反馈、维护处理 | 留 |
| docs/harness-api.md、collaboration-workbench.md、collaboration-map.html、self-hosting.md、maintenance-*.md、docs/design/ | 通道的说明和设计稿 | 留 |
| release-lock.json、scripts/check-release.py、build-pack-catalog.py、verify.mjs、.github/workflows/ | 发布锁和 CI：在线包（delivery-data-app、second-loop-compounding）改内容必须升版本 | 留 |

## 五、搬删清单（档 1，等拍）

> 10-22 做了两轮。第二轮在 kg 立「kg 只到叶子入口」（leaf-node-spec-v2 §2.5）、收掉 kg 指着 cg 内部的指针之后做。

1. ✅ knowledge-manage、cursor-templates、v1-talk 三个货架包归档（10-22）。
2. enterprise 货架包，连同 rules/enterprise、skills/java-backend-test-ops、plan-templates/、learnings 里企业那批，物理搬到 enterprise-delivery 那边。
3. ✅ 两轮做完（10-22）：第一轮 rules/teams、rules/meta、根下 5 个 .mdc；第二轮 patterns 其余 4 个、standalone、code-templates、commands、skills 老安装链。留下的：capabilities 与两个 pattern（工作台候选）、validators、plan-templates、rules/enterprise、harvest-session、java-backend-test-ops。
4. ✅ 第二轮做完（10-22）：stable/knowledge 四类历史文档和三篇 learnings 归档，index.yaml 改成叶子入口；kg 先立「只到叶子入口」规则并收了指针（kg c219dd1）。
5. ✅ install.sh、.cursor/rules/ 归档（10-22）。

第 2 条没动：enterprise 照 kg registry 等接单线独立对外。明细见 [archive/README.md](archive/README.md)。

## 六、这次没查到的

- `scripts/tests/test_release` 在 Windows 检出上失败：release-lock.json 按 LF 算，Windows 检出是 CRLF。CI（ubuntu）不受影响。修法候选：给 `stable/packs/` 加 `.gitattributes` 强制 LF。

- delivery-data-app 有没有真交到触发它的那位朋友手里。
- 科研工作者的工作台打了三版，哪一版装上了。capabilities 那批只在 starter 版里；装的不是 starter 版，就等于没发出去。
- README 里装法的 clone 地址有两个账号（「三分钟」段和「Current Cursor Reference Usage」段不一样），哪个是对的没核。
