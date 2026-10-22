# bundles · 结合包

> cg 的单位是结合包。**按使用方分，宿主是包里的一层。**
> 定位正本在 kg `index/nodes-registry.yaml` 的 cg 段，本目录只放清单和包内的件。

<!--
黑匣子（2026-10-22，定位级：cg 的单位从「三类资产」改成「结合包」）
触发：10-22 维护者拍「甲可以」——结合包按使用方分，宿主是包里一层；同场认 ① 改写句。
参照：10-17 正本句；kg 分层关联设计 §2.9 J；方法路扫描里过门的三簇，全是按人交出去的。
排除：按宿主分包（同一组件要放两份，成了第二份事实）；cg 存方法正文的发布版（同样是第二份事实，方法正本在 kg methods/）。
-->

## 一个包四层

| 层 | 装什么 | 放哪 |
|---|---|---|
| 组件层 | 组件包，就是 `stable/packs/` 里的货架 | 清单的 `packs` 栏，各钉一版 |
| 宿主适配层 | hook 注册段、skill 壳、薄导入 | 包下 `adapters/<宿主>/`，或指到货架包自带的 adapters |
| 自装层 | 给对方 AI 的部署说明；对方 AI 照着装；现场验收 | 清单的 `setup` 栏 |
| 清单 | 收哪些包、各是哪版、条件标签、宿主、包的版本号 | `bundle.yaml` |

## 进包的门

- 能脱离项目复用，且有第二个使用方（2026-10-09 的门槛，不变）。
- 第二使用方只算真收到东西的人。公开仓的读者不算。
- 「没进任何结合包的组件不进 cg」只管新进来的。现有的先在 [INVENTORY.md](../INVENTORY.md) 标「未入包」，不赶走。
- 收件人在 cg 里只写角色，不写人名。

## 现有三个包

| 包 | 使用方 | 门 | 清单 |
|---|---|---|---|
| 工作台包 | 交给真人专家，由对方的 AI 自装 | 过（两位真收件人收到过前身） | [workbench/bundle.yaml](workbench/bundle.yaml) |
| 交付包 | 会用 harness、没做过产品设计的外部使用者 | 待核（收件人没查到） | [delivery/bundle.yaml](delivery/bundle.yaml) |
| 自用包 | 维护者自己的另一台机器 | 占位 | [self/bundle.yaml](self/bundle.yaml) |

## 清单怎么写

字段照 [workbench/bundle.yaml](workbench/bundle.yaml)。几条规矩：

- `version` 用语义化版本。**包按版本发布，发布出来的包就是快照。** 组件版本随包走。
- 组件的版本史正本不在这里，在组件自己的仓（维护者那边是各组件的 `LINEAGE.yml`），记「随某包某版发布」。
- `gate` 三个值：`passed` 过门、`pending` 待核、`placeholder` 只立位置。
- 跨仓引用一律写 `库名:路径#锚@版本`（kg `meta/storage-contract.md` 第六节）。cg 自己的库名是 `cursor-genesis`。
- `condition_label` 三栏照 kg `meta/storage-contract.md` 第九节：`basis` 写据以做成的 kg 件；`environment` 四维写事实，没验过写 `TODO: 未验`；`rejudge_when` 写环境那一半什么变了要重判。只用了库和服务、没用 kg 件的，`basis` 留空。

## 检查

```bash
python scripts/check-bundles.py                       # 读出全部清单，核字段和引用
python scripts/check-bundles.py --kg <kg 仓根目录>     # 另把 basis 喂给 kg tools/pin-check.py 比钉
```

## 组件层留的一格：skill 现拼（方向已定，没实现）

- 组件 = 模板 + 部件清单，用的时候现拼。
- 两档：模板那档自动跟最新；部件里引用的判断和方法跟钉，上游改了就标脏、通知维护者，3 天默认通过。
- 现拼落地前，结合包照静态文件发。清单已留 `basis` 栏，到时不改格式。
