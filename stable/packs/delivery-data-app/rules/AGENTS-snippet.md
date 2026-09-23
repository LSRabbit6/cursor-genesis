# 贴进你项目 AGENTS.md（或 CLAUDE.md）的几行

把下面这段原样贴进你项目根目录的 `AGENTS.md`。这是让规范每轮到场的唯一机制——放在 `.agents/rules/` 里不贴指针，harness 不会自己去读。

```markdown
## 产物规范（页面、报告、推送）

任何面向人的产物先读 `.agents/rules/data-app-norms.md`：呈现七条 + 结构四条。
动手前按 `.agents/plan-templates/design-doc-six-sections.md` 写设计稿，「验收」「不变量」必填。
收工前跑 `python .agents/validators/data-app-norms-check/scripts/check_data_app_norms.py --changed`，不过不收工。
选领域、要材料清单：说「选领域」，读 `.agents/skills/domain-menu/SKILL.md`。
```
