# data-app-norms-check · 产物规范机器检查契约

> contract_version: 0.2 · 2026-11-07（0.1 首版 2026-09-23，见文末版本）
> 类型：机器可验证契约（Machine Enforced 档）
> 消费方式：随 delivery-data-app 装进 `.agents/validators/`；收工 Stop hook 调用，或手动跑
> 挂在哪：挂**准入**（收工那一步），不挂流程——换了 harness 或换了写法，出门都得回答同一句「这四条过了没」

## 检查项

| 码 | 对应规范 | 判定 | 结果 |
|:--|:--|:--|:--|
| R1 | charset / viewport | 文件前 4096 字节内有 `<meta charset="utf-8">`（大小写、引号不敏感）且全文有 `<meta name="viewport"`；文件必须能按 UTF-8 解码 | 缺任一 → FAIL |
| R3 | 零外部依赖 | `<script/link/img/iframe/source/video/audio>` 的 `src`/`href` 指向 `http(s)://` 或 `//`；样式里 `url(http…)` / `@import url(http…)` | 出现 → FAIL（`<a href>` 不算） |
| S2 | 列表必带检索 | 每张 `<table>` 数自己的 `<tr>`、每个 `<ul>` / `<ol>` 数自己的 `<li>`（嵌套的归最里层），最长那个 ≥ 阈值（默认 12），且页面静态标记里没有 `<input>`、`<select>`、`data-filter` 属性，也没有「搜索 / 检索 / 筛选 / 过滤 / search / filter」字样。`<script>`、`<style>` 的内容和 HTML 注释不算：里面的 `<tr>` 不算行，里面的字样不算检索控件 | 命中 → FAIL |
| R7 | 内部术语黑名单 | 只在 `--terms a,b` 或 `terms.txt` 给了黑名单时查；原文出现即报 | 出现 → FAIL |
| S3 | 空态提示 | 有列表容器但全文没有「暂无 / 没有 / 无数据 / 空 / empty / no data」字样，也没有 `data-empty` 属性 | WARN；`--strict` 时 FAIL |

## 语义

- **缺失比不达标更红**：文件读不出、解码失败，按 R1 FAIL，不按「跳过」。
- **只看产物不看自陈**：检查的是 HTML 文件本身，不读任何「已检查」的声明。
- **范围**：默认只扫 `--changed`（git 工作区里改过或新增的 `.html` / `.htm`），也可以给路径；跳过 `node_modules/`、`.git/`、`dist/`。
- **退出码**：0 = 全过或无 HTML 可查；1 = 有 FAIL；`--stop-hook` 模式下有 FAIL 时输出 `{"decision":"block","reason":…}` 并退出 0（Claude Code Stop hook 约定），无 FAIL 静默。
- **不查的**：R2 溢出、R4 配色、R5 用语、R6 不确定性标注、S1 卡片墙、S4 回执——全是人判，规范文件里标了。

## 版本

- 0.1（2026-09-23）：首版，四条机器查 + 一条 warn。阈值与黑名单可配，其余不可配。
- 0.2（2026-11-07，随 delivery-data-app 0.2.2）：S2 改按单张表、单个列表计数，不再把整份文件的行数加在一起；`<script>`、`<style>`、注释里的字样和标签不算。起因是菜单服务反馈 T-439165：一份原稿三个页签的静态说明表合起来 45 个 `<tr>`，被当成一张长列表报 FAIL；同一页之前内联 ECharts 时，库代码里的 search 字样又让检查误以为有检索框。
