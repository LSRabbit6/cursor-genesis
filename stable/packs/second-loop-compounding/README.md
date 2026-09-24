# second-loop-compounding · 复利第二环：干完一件事，让它的沉淀在下一件开场时到场（v0.1.0）

> 给已经能用 Claude Code / Codex 把一件事干完、也验收过的人。执行 ⇄ 验收是一件事**里面**的环；这个包补的是套在**外面**的第二个环——干完 → 复盘 → 提炼 → 归位 → 下一件开场到场 → 反馈——以及「这个环到底转没转」的读数口。
> 模板原件：cg 里放模板与说明；在跑的东西（运行件）在工作台 toys 那边，文末有对应表。两边不做死关联：模板不写运行件路径，运行件按目录与内容结构找东西。

## 这套是什么

```
第一个环（一件事里面）          执行 ⇄ 验收（只对当前任务；不动）
                                     │ 干完
第二个环（一件事与下一件之间）   记录 → 提炼 → 归位 → 到场 / 取用 → 反馈
                                     └────────────────────────────────┘ 增量写回，起点抬高
```

第二个环上跑四条线（认知 / 资产 / 元运维 / 人际），每条线回答三个定义（类型 / 提炼方式 / 用途），用两本账记（取用账 / 线上账），靠六块探针报读数。装了之后多这些：

| 件 | 文件 | 它管什么 | 保证级别 |
|:--|:--|:--|:--|
| 框架摘要 | `docs/framework.md` | 五步、四线 × 三定义、两本账、顺序铁律与停车场、六块探针、人际线（宫 × 两条链 × 四阶段）、三种活分开跑、交接契约要点、松耦合原则 | guidance |
| 复盘模板（A） | `templates/A-sample.md` | 一件事干完后的一页复盘：八问 + 负空间（四线提炼、两本账、探针读数、回填框架缺口、跨线流动） | procedure |
| 线文件模板（LINE） | `templates/LINE.md` | 每人一份，九节固定：他说过的 / 我理解的 / 在哪一段 / 学到·分享·共同经历 / 两条链读过的事（带「归属」行）/ 三格探针 / 命盘参考层 / 下一次上场 / 负空间 | procedure；结构可被机器按标题认 |
| 内容交接包 | `templates/content-handoff.md` | Claude 出内容、Codex 出表达：九个必有节 + 一行「回执：`路径`」 | procedure；装了开单闸的项目里 enforced（缺节拒单） |
| 回执 | `templates/codex-receipt.md` | Codex 交回五节：产出路径 / 推翻与理由 / 没做什么 / 验收逐条自查 / 未入库文件 | procedure；派单壳可查缺节 |
| 在用与否判据 | `docs/in-use-criteria.md` | 七态：在用 / 结构性在用 / 在跑但没人看 / 登记过没在用 / 休眠 / 概念·空房 / 按设计不动 | guidance（休眠一态已机器化） |
| 探针调用说明 | `docs/probes-howto.md` | toys 里的探针与休眠脚本：叫什么、读哪、写哪、谁调、失败怎么叫人、怎么干跑 | reference |

## 为什么

- 用户 2026-09-23 夜纠正：「复利不是换验收线的轴，是叠加的机制；顺序不能乱」（运行件那边设计稿黑匣子记的原话）。他同时自认三件事从没定义过：一件事能提炼出哪些复利、怎么提炼、往后怎么用。框架就是给这三件填空的。
- 推导：验收线只对当前任务，那是第一个环；把复利并进验收，两件事会混成一锅。所以复利是**叠在执行与验收平面外的第二个环**，不换验收线的轴——入口「这件事干完了」，出口「下一件开场时它到场了」。「凭什么不白干」的答案 = **环转没转 + 有没有读数**；没有探针的环只是故事。
- 用户 2026-09-24 00:1x：「这个东西本身，在 cg 要有 package 或者什么别的套装会记录下来的。以后别的会话去聊这事情，或者具体执行，得有能加载的东西。」——所以有这个包：框架与模板离开 toys 也能被加载。
- 为什么放 cg：cg 是人—Agent 协作机制的供给叶子，出的是模板型组件（骨架固定、按项目派生变体）；第二个环正是一套跨项目的协作机制。判断内核留判断层，本包只出可执行的操作面（同 harness-engineering pack 的原则）。

## 代价

- **注入很薄，其余靠检索**：常驻到场的只有一行记忆路由壳；框架、模板、样本都要被检索或被点名才到场——检索不到就等于没有。探针 ① 量的就是这件事。
- **探针要活**：环有没有转只能靠读数说话；探针自己要定时跑、要有到场口（开场注入一行）、失败要叫人，这本身就是维护成本。在跑但没人看的探针 = 环没转。
- **每人一份线文件的维护成本**：每次接触后回写 §1 §2 §6、每读完一件事回写 §5；不回写的线文件就是库存。首批七份里，空得最多的格是「他本人的原话」和三格探针。
- **复盘本身花时间**：一页够，样本的价值在多不在深；写到两页说明在把事讲厚，不是在试框。
- **模板 ≠ 运行件**：装了本包只多了模板和说明；没有运行件的项目，探针那几格就是「无读数」。

## 怎么加载

**新会话或新项目，三步**

1. 读本 README（聊这件事到这为止够了；要细节读 `docs/framework.md`）。
2. 复盘一件干完的事：复制 `templates/A-sample.md` 到项目的观测件目录，文件名 `<YYYY-MM-DD>-复利样本-A<n>-<事>.md`，一页填完。
3. 要接人际线：按 `templates/LINE.md` 在那个人现有的目录里建 `LINE.md`（九节固定，第二行写宫）。

派 Codex 做表达物时：Claude 照 `templates/content-handoff.md` 写交接包并落仓，Codex 照 `templates/codex-receipt.md` 回执（契约要点在 `docs/framework.md` §9）。

**toys 侧到场**：靠记忆路由壳 `project_compounding-second-loop`（toys 会话槽 memory 里一行索引 + 一份壳文件；Claude 原生加载，Codex 经中立 SessionStart 适配；Cursor 09-24 起冻结）。他说「复利 / 凭什么不白干 / 这算认知还是资产 / 元运维」或要复盘一件事时，壳把人引到运行件那边的设计稿与样本。

**装进别的项目**（可选，只复制模板与说明）：

```bash
python <cursor-genesis>/scripts/install-pack.py second-loop-compounding <项目根> --source <cursor-genesis>
```

装完 `<项目根>/.agents/templates/second-loop-compounding/` 多四份模板，`.agents/docs/second-loop-compounding/` 多本 README 与三份说明，`.agents/installed-packs.yaml` 记着版本。

**到场（装了不等于生效）**：模板不会自己被想起来。在那个项目的入口放一行路由壳——记忆索引一行，或 `AGENTS.md` 一行指针。记忆索引行照下面的写法写，探针 ① 的召回对账才量得到（写法约定见 `docs/probes-howto.md` §1）：

```
- [复利第二环](<壳文件>.md) — 他说「复利/凭什么不白干/干完的东西下次怎么用/这算认知还是资产」、要给干完的事做复盘→先读 .agents/docs/second-loop-compounding/README.md 防重推；复盘用 A 模板一页
```

## 与 toys 运行件的对应表

toys 仓根 = `<工作台仓（私有，本机）>`，下表路径相对它（另注的除外）。「现状」是 2026-09-24 建包时逐个核过的。

| 本包（模板原件） | toys 运行件（正本 / 在跑的） | 现状 |
|:--|:--|:--|
| `docs/framework.md` | `self-analysis/2026-09-23-复利机制-第二环-宏观稿.md`（B，设计稿；稳定后并进 `PERSONAL-SYSTEM-ARCHITECTURE.md` 新一节） | 在，已入库 |
| `templates/A-sample.md` | B §6 的 A 模板；样本 `self-analysis/2026-09-23-复利样本-A1-闭环串检.md` 等三份（命名 `YYYY-MM-DD-复利样本-An-<事>.md`，另两份是人际线样本） | 三份在 |
| `templates/LINE.md` | 设计稿 `self-analysis/2026-09-23-复利第二环-人际线-按排盘关系宫-设计稿.md`（宫图、四阶段、两条链）；实例住各人现有目录 `<本机>\<关系分组>\…\LINE*.md`；宫图索引在 toys 会话槽 memory `reference_social-network-people` 顶部 | 七份实例在；实例在 toys 仓外，不全进版本控制 |
| `templates/content-handoff.md` | `dispatch-kernel/templates/content-handoff.md`；契约 `dispatch-kernel/CONTRACT-claude-codex.md`；机读的一半 `dispatch-kernel/routing.yaml` 的 `presentation`；开单闸 `dispatch-kernel/handoff.py`（`--check-handoff` 只查不开单） | 在；**toys 那份被 `.gitignore` 第 56 行兜住、不在版本史**——本包这份在 cg 提交后是第一份进版本控制的副本 |
| `templates/codex-receipt.md` | `dispatch-kernel/templates/codex-receipt.md` | 同上 |
| `docs/in-use-criteria.md` | `self-analysis/2026-09-23-设计在用与否-三层盘点-观测件.md` §0；休眠一态的机器化 = `asset-registry/dormancy.py` | 在，已入库 |
| `docs/probes-howto.md` | `session-archaeology/trajectory.py`（记忆召回对账、路由对账、`--metrics`）· `dispatch-kernel/daily_chores.py`（`trajectory_daily()` / `dormancy_check()`）· `session-archaeology/kg_usage.py` · `my-desk/harvest/residue.py`（「kg 取用」「昨日轨迹」两行）· `my-desk/harvest/criteria_log.py` · `asset-registry/dormancy.py` | 在，已入库，**`residue.py` 除外**（被 `.gitignore` 第 56 行兜住）；轨迹汇总首次定时真跑 = 09-25 00:28 |
| 「怎么加载」的 toys 侧 | 记忆路由壳 `project_compounding-second-loop`（toys 会话槽 memory） | 在；壳里还没有指向本包的一句 |
| 建包与执行过程 | `self-analysis/2026-09-24-复利执行/LOG-1..5`（减三刀 / 复利探针 / 人际线与样本 / 交接契约 / 本包） | 在 |

**同步规矩**：改运行件里**机器认的结构**（节名、字段名、文件名规则）时，同步改本包对应模板；改本包模板时，别动机器认的那部分——交接包九个节名与「回执：」一行、回执五个节名、LINE 九个二级标题与「> 宫：」第二行、A 样本文件名规则。

## 回流（用过再回，没用过的不收）

- 复盘样本暴露的框架缺口：先回填运行件那边的设计稿，稳定后再压进 `docs/framework.md`（先正本、后摘要）。
- 模板哪节不合身、哪格总是空：在 A 样本第 7 节记一笔，同型 ≥3 次再改模板。
- 走 cg 回流通道 `.knowledge/downstream/`（见 [downstream-spec](../../../docs/downstream-spec.md)）。

## 负空间（v0.1.0 没做的）

- 不带脚本：探针、休眠、开单闸都是 toys 运行件，路径写死 toys 与它的会话槽；本包只写调用说明，不复制代码。
- 不是 Skill：没有 `SKILL.md`，不靠 description 自动触发；加载靠 README + 一行路由壳。
- 框架是设计稿的压缩：四线切法用户只说过「我觉得可以，暂时没有太想好」，线的数目与边界随样本可改；宫的读法没从明刊本底本核。
- 人际线：宫当坐标不当预测；任何人的内容（原话、理解、链读、探针读数）一律不进本包，只进各人目录里的线文件。
- 查询口：toys 的 `self_library_lookup` 查 cg 时**只按目录路径匹配**词，README 标题只展示、不参与匹配——用「复利 / 第二环 / 人际线」这类中文词查不到本包，要用 `second-loop` / `compounding` / `loop`。
- kg 侧：kg 的 `data/nodes/cursor-genesis` 是 git submodule 独立检出；本包在 cg 提交、推送、kg 更新 submodule 之前，kg 那边看不见。
- 安装只在 Windows 上对临时目录试装过；Cursor 未验。

<!-- 黑匣子（2026-09-24 建包）：
① 触发：用户 2026-09-23 夜「复利不是换验收线的轴，是叠加的机制；顺序不能乱」（叠加机制 + 顺序铁律）；2026-09-24 00:1x「这个东西本身，在 cg 要有 package 或者什么别的套装会记录下来的……得有能加载的东西」。
② 参照：toys PERSONAL-SYSTEM-ARCHITECTURE §2.4（过程层三件：记录 / 打磨 / 跨场取用）、§6.1 归位三法则、ASSETS 一-A 验收句「同题第二次出现时，第一次的沉淀被召回并用上」；cg 定位 = 人—Agent 协作机制的供给叶子、出模板型组件的元资产分发库。
③ 排除：把 toys 运行件整目录拷进 cg（运行件路径写死 toys，拷过来就是两份会漂的正本，也违反「不做死强关联」）；把任何人的私人内容写进模板（人的数据只住各人目录里的线文件）。 -->
