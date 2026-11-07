# retail-multistore · 零售经营 · 多门店（v0.1.0）

> 给在多门店零售里做办理类系统的 harness：员工在聊天里发文字和图片报事，店长、老板、会计、出纳各自处理，事后再把随口起的名字整理成正式分类。
> 这个包只给**模式**：每个模式写成能直接并进设计稿六段的段落，告诉你的 harness 每段该写什么、哪里容易走偏。**不带任何门店的口径**——必填哪几项、几点提醒、谁能整理分类、阈值多少，都留成〔待裁〕，只认你的使用者原话。

<!--
WHY（2026-11-07，cg 第一份行业章）：
触发事件：菜单服务 2026-10-18 收到一张「零售经营 · 多门店」的方案请求（类型同时选了数据应用后台），要的是「既有企业应用的图文办理、角色待办和事后名称整理设计」，
         产出是六段设计、任务文档、离线交互预览，用户是店长、老板、会计、出纳，手机优先。当时这一类在菜单上只有模式名。维护者 2026-11-07 照推荐判「补」。
参照系：模式抽自一套多门店零售经营系统 2026-10 的设计与交付实践（图文收件、岗位私聊待办、细类后置整理、业务口径回流）；
       写法照 delivery-data-app 的六段模板（目标 / 口径 / 数据源 / 分步 / 验收 / 不变量），让模式能逐段并进对方的设计稿。
排除项：不带那套系统的任何业务口径、阈值、提醒时刻、人名店名、凭据和代码（口径只认各家老板原话，cg 不出门店判断）；
       不带检查器（这四个模式的对错要看行为，静态文件查不出来，硬做一个只会给假绿灯）；
       菜单上原来列的另两个模式名（经营日报三件事、收银稽核器结构）这一版不写，等有请求再补。
-->

## 装了之后多什么

| 件 | 文件 | 它管什么 | 保证级别 |
|:--|:--|:--|:--|
| 模式总览 | `patterns/README.md` | 四个模式怎么挑、怎么并进六段；四个模式共用的分工（程序 / AI / 人） | guidance |
| 图文办理 | `patterns/image-text-intake.md` | 聊天里收文字和图片：先存后回、先 OCR 再看图、连续消息归集、只问缺项、纠错重送 | guidance |
| 角色待办 | `patterns/role-todo.md` | 每个岗位私聊收一份本人权限内的待办清单：一行一笔、按钮语义按岗位、定时汇总不漏不重 | guidance |
| 事后名称整理 | `patterns/post-hoc-naming.md` | 日常先记原名，事后由授权的人预览确认成标准细类和别名，下一笔能复用 | guidance |
| 口径收件箱 | `patterns/caliber-inbox.md` | 使用者随口说的规则先分四类记下，不当场改参数；每个数都带出处 | guidance |
| 到场片段 | `rules/AGENTS-snippet.md` | 贴进你项目 `AGENTS.md` 的几行，让模式每轮到场 | — |

## 装法

两种都行。

```bash
# 从 GitHub（在你的项目根目录）
git clone --filter=blob:none --sparse https://github.com/LSRabbit6/cursor-genesis.git .cursor-genesis
cd .cursor-genesis && git sparse-checkout set stable/packs/retail-multistore scripts && cd ..
python .cursor-genesis/scripts/install-pack.py retail-multistore . --source .cursor-genesis

# 或者装了 domain-menu 的，直接从菜单服务拿
python .agents/skills/domain-menu/scripts/menu.py install retail-multistore
```

装完 `.agents/patterns/retail-multistore/` 下多五个文件，`.agents/rules/` 下多一份到场片段，`.agents/installed-packs.yaml` 记着版本。

**到场（装了不等于生效）**：把 `rules/AGENTS-snippet.md` 里那几行贴进你项目的 `AGENTS.md`（或 `CLAUDE.md`）。不贴，harness 不会自己去读 `.agents/patterns/`。

## 用法（一次典型的活）

1. 先装 [delivery-data-app](../delivery-data-app/README.md)，拿它的设计稿六段模板。本包不重复那份模板。
2. 读 `patterns/README.md`，按这次要做的事挑模式。四个模式可以只挑一个。
3. 照模式文件的六段，逐段并进你的设计稿。模式里的〔待裁〕原样带进设计稿第 2 段「口径」，**有使用者原话就抄原话、说话人、日期；没有就留「待裁」**，不替他定。
4. 交互预览按 delivery-data-app 的产物规范做（离线可开、390px 可读、列表带检索），用合成数据，不放真实单据。

## 回流（用过再回，没用过的不收）

- 某个模式在你那里不合身、漏了一个常见坑：装了 domain-menu 的用 `menu.py feedback --category misfit --where "<模式文件>" --text "<现象或原话>"`；没装的开 [issue](https://github.com/LSRabbit6/cursor-genesis/issues)。
- 只回模式层的问题。你家的口径和数据留在你家，不用回给我们。

## 负空间（v0.1.0 没做的）

- 只有四个模式，全是 guidance：没有检查器，没有代码，没有页面样板。做对没有，靠设计稿「验收」段里写的场景和你的使用者现场看。
- 模式来自**一套**多门店零售系统，第二家还没用过。哪条只是那一家的习惯、不是行业通用，现在分不出来。
- 写法偏聊天平台（群聊、私聊、消息卡片）入口。只走网页或 App 的系统，「回执」「卡片」两处要自己换成对应的界面。
- 不管付款本身：出纳那一环只记录真实付款，不发起转账；也不管库存、成本、盘点。
- 菜单上「零售经营 · 多门店」原来列的经营日报三件事、收银稽核器结构，这一版没写。
