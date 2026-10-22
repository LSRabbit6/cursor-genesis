# delivery-data-app · 业务交付 · 数据应用（v0.2.1）

> 0.2.1 内容和 0.2.0 一样：0.2.0 的发布锁在 Windows 上算错过一次（f1f16cf，没有发出去），发布锁规矩要求同一个版本号哈希不能变，所以升一个补丁号。

> 给「会用 Claude Code / Codex / Cursor，但不懂产品设计」的人。你的 harness 已经能把东西做出来；这个包补的是**做出来的东西该长什么样、怎么判它做对没**——列表要不要带检索、页面能不能离线打开、手机上会不会乱码、空了该说什么。
> 发布态（cg 对外一轴三态的第一态）：没有人替你推演，全是查表就能用的东西。装了之后你的 harness 多三样：一份规范、一个检查器、一份设计稿模板。领域清单入口 0.2.0 起是单独的 [domain-menu](../domain-menu/README.md) 包（菜单服务的客户端）。

<!--
WHY（2026-09-23，cg 第一份面向外部 harness 用户的 pack）：
触发事件：用户看一位朋友用 Codex 独立做出的后台页「基本都有、效果也在，但站程序设计角度有很大优化空间」（品类多该是列表加检索），点名要「最纯粹通用的对外」。
参照系：kg 根 design-layer-is-the-durable-skill（使用层 AI 接管、设计层稀缺）；toys self-analysis/2026-09-23-体系对外-一轴三态-设计稿-观测件.md §2 发布态；cg 08-12 harness-engineering pack 的原则「判断内核留 kg，pack 存可执行的操作面」。
排除项：不装任何 kg 判断（S2 以上不出门）；不带任何具体业务的口径（零售章只出模式）；不靠 AI「想起来」加载——入口是用户点名的 skill，检查器挂 Stop hook。
-->

## 装了之后多什么

| 件 | 文件 | 它管什么 | 保证级别 |
|:--|:--|:--|:--|
| 规范 | `rules/data-app-norms.md` | 产物规范 7 条（呈现）+ 信息架构规范 4 条（结构） | guidance；其中 4 条由检查器机器查 |
| 检查器 | `validators/data-app-norms-check/` | 收工时扫改过的 HTML：charset / viewport / 外部依赖 / 长列表无检索 | enforced（stdlib-only，可独立跑） |
| 设计稿模板 | `plan-templates/design-doc-six-sections.md` | 让你的 harness 动手前先写六段，其中「验收」「不变量」必填 | procedure |
| 宿主适配 | `adapters/claude-code/settings.hooks.json` | Claude Code 的 Stop hook 一段，复制进你项目的 `.claude/settings.json` | — |

## 装法

```bash
# 在你的项目根目录
git clone --filter=blob:none --sparse https://github.com/LSRabbit6/cursor-genesis.git .cursor-genesis
cd .cursor-genesis && git sparse-checkout set stable/packs/delivery-data-app scripts && cd ..
python .cursor-genesis/scripts/install-pack.py delivery-data-app . --source .cursor-genesis
```

装完 `.agents/` 下多出 rules / validators / plan-templates / adapters 四处，`.agents/installed-packs.yaml` 记着版本。

**到场（装了不等于生效）**

- **Codex**：`/hooks` 里审一次检查器命令并信任。
- **Claude Code**：Stop hook 把 `adapters/claude-code/settings.hooks.json` 里的一段并进 `.claude/settings.json`。
- **Cursor**：规范与模板能读，hook 降级，检查器手动跑。
- 三个宿主都要做的一步：把 `rules/AGENTS-snippet.md` 那几行贴进你项目的 `AGENTS.md`（或 `CLAUDE.md`），规范才会每轮到场。

## 用法（一次典型的活）

1. 装了 [domain-menu](../domain-menu/README.md) 的，说「选领域」拿清单、自查、交回类型；这个包就是「数据应用后台」那一类回给你的东西。
2. 让 harness 按 `plan-templates/design-doc-six-sections.md` 先写设计稿，验收条要带能跑的命令。
3. 照设计稿做。收工时检查器扫改过的 HTML，不过就拦一次，说清哪条没过。
4. 手动跑：`python .agents/validators/data-app-norms-check/scripts/check_data_app_norms.py --changed`

## 回流（用过再回，没用过的不收）

- 规范哪条不合身、检查器误报：装了 domain-menu 的用 `menu.py feedback`；没装的开 issue 或按 [downstream-spec §3](../../../docs/downstream-spec.md) 走 `.knowledge/downstream/`。

## 负空间（v0.1.0 没做的）

- 检查器只机器查 4 条（R1 R2 R3 S2），空态提示（S3）只 warn；其余是人判。
- 本包不联网；要方案、报不合身走 domain-menu 包连菜单服务。产品态（推演在你家）与服务态（推演在我家）不在本包。
- 结构两条（S2 列表检索、S3 空态）只对静态 HTML 有效：纯脚本渲染的页面，机器看不到列表也看不到控件，只能 WARN 或沉默。触发本包的那一页（一个 Codex 独立做的后台）正是这种——四条机器检查全过，用户看到的「品类多却没有列表加检索」在静态文件里不可见。这层缺口今天靠设计稿「验收」段和人判，不靠检查器。
- 只在 Windows + Codex / Claude Code 上跑过检查器与安装；Cursor 未验。
