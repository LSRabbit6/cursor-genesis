# domain-menu · 要方案的入口（v0.2.1）

> 你的 harness 想知道「这件事你们有没有现成的」时用它：向菜单服务要一份自查清单，在你自己的仓里答完、选出类型交回去；有包就装，没有就登记、拿回一个编号和一份通用骨架。
> 推演在你家（你的模型读你的仓），服务那边只查表，不跑模型。服务只管「拿」，装进来的东西都在你仓里，服务停了照样能用。

<!--
WHY（2026-09-24，从 delivery-data-app 里拆出来单立）：
触发事件：用户点名「我们这边起一个服务、通过域名暴露，他那边 skill 想要方案时调一下；给他自查清单，他把类型给回来，我们返回相关的工具包或设定」。
         v0.1 的 domain-menu 是装进 delivery-data-app 的静态清单（文件末尾写着「不联网、不调用任何服务」），环整个没有。
参照系：toys self-analysis/2026-09-23-体系对外-一轴三态-设计稿-观测件.md——这不是「服务态」（我家的模型出产物），是发布态换了到场方式：
       从「把文件拷进对方仓」换成「对方按需来拿」；kg llm-value-at-ends-not-routing（LLM 在两端，中间查表）。
排除项：留在 delivery-data-app 里（它是所有类型的入口，不该跟某一类的包绑在一起；且 delivery-data-app 一更新就会把客户端覆盖回静态版）；
       在服务端跑模型替对方判类型（07-25 认证红线 + 推演该在有上下文的那一家）。
-->

## 装法

两种都行。已经装过 delivery-data-app 0.1.0 的，装这个会把旧的静态清单换成客户端。

```bash
# 从 GitHub（在你的项目根目录）
git clone --filter=blob:none --sparse https://github.com/LSRabbit6/cursor-genesis.git .cursor-genesis
cd .cursor-genesis && git sparse-checkout set stable/packs/domain-menu scripts && cd ..
python .cursor-genesis/scripts/install-pack.py domain-menu . --source .cursor-genesis

# 或者直接从服务拿（客户端自己更新自己也是这条）
python .agents/skills/domain-menu/scripts/menu.py install domain-menu
```

**到场**：Codex 原生读 `.agents/skills/`；Claude Code 把 `.agents/skills/domain-menu` 复制或软链到 `.claude/skills/`。入口是用户点名（「选领域」「要方案」），不靠 AI 想起来。

## 一次典型的活

```bash
python .agents/skills/domain-menu/scripts/menu.py checklist            # 拿清单：规矩、几问、类型表、JSON 模板
# harness 在本仓自查，答案写成 JSON 存仓外
python .agents/skills/domain-menu/scripts/menu.py submit /tmp/answers.json
python .agents/skills/domain-menu/scripts/menu.py install delivery-data-app   # 回执说有包的
python .agents/skills/domain-menu/scripts/menu.py status T-xxxxxx             # 回执说已登记的，过几天查
python .agents/skills/domain-menu/scripts/menu.py feedback --category misfit --where "某页面" --text "原话"
```

## 协议（服务端）

| 方法 | 路径 | 令牌 | 干什么 |
|:--|:--|:--|:--|
| GET | `/v1/checklist` | 不要 | 自查清单 + 类型表 + 答案模板 |
| GET | `/v1/catalog` | 不要 | 每一类我们有什么、要备什么材料 |
| GET | `/v1/packs` | 不要 | 可装的包、版本、sha256 |
| GET | `/v1/packs/<名>.zip` | 不要 | 包本体 = 本仓 main 上 `stable/packs/<名>` + `scripts/install-pack.py` 原样打包 |
| POST | `/v1/requests` | 要 | `kind: solution`（类型 + 答案 + 已装版本）或 `kind: feedback`（misfit / validator / want） |
| GET | `/v1/tickets/<编号>` | 要 | 登记进度：open / accepted / ready / declined |

不要令牌的四条，内容与本仓 GitHub 上公开的一样。令牌只用来认「谁在登记」，防收件箱被刷。没有令牌的，开 [issue](https://github.com/LSRabbit6/cursor-genesis/issues)。

## 负空间

- 服务端代码不在本仓（在维护者的工作台），这里只有客户端和协议表。
- 类型表只有五类，其中只有「数据应用后台」有包；企业交付的包装不了（安装清单引用了共享原子，安装器会拒），零售、病理只有模式名。
- 只在 Windows 开发机上端到端跑过；macOS 上还没跑过。
