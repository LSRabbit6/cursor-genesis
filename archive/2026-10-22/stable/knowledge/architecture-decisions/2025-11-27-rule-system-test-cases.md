---
title: 规则体系测试用例 (Rule System Test Cases)
date: 2025-11-27
status: Draft
---

# 规则体系测试用例

本文档旨在验证 `.cursor/rules/` 下各规则文件中的 "Cognitive Mapping" (Trigger -> Action) 是否生效。

请指挥官（用户）按照下表中的“测试指令”逐条输入，并观察 AI 的反应是否符合“预期行为”。

## 1. 全局规则 (01-project-rules.mdc)

| 规则点 | 测试指令 (User Input) | 预期行为 (Expected AI Action) |
| :--- | :--- | :--- |
| **Docs 记录** | "我想规划一下我们接下来的系统架构演进方向。" | AI 应当主动提议："我们需要先创建一个文档来记录这次架构规划，是否创建 `docs/xxxx-架构规划.md`？" |
| **Tasks 追踪** | "帮我修复一下登录页面的按钮样式 bug。" | AI 应当主动创建或更新 `./tasks` 目录下的任务卡（如 `[TODO]-xxx.md`），而不是直接开始写代码。 |
| **中文交流** | "Please explain how the virtual team works." | AI 应当坚持使用**中文**回答，即使你用了英文提问。 |
| **问题转述** | "那个不行。" (故意模糊) | AI 应当尝试理解并确认："您是指上一个代码方案不可行吗？还是指..." (先转述确认，再回答)。 |
| **导师角色** | "什么是 Mermaid 图？" | AI 应当用通俗易懂的语言解释，而不是堆砌技术定义。 |
| **动态数据** | "今天是几号？" 或 "帮我查一下 Python 最新版本。" | AI 应当尝试调用工具 (如 Web Search / Date)，而不是瞎猜或拒绝。 |

## 2. 协作剧本 (02-project-playbook.mdc)

| 阶段 | 测试指令 (User Input) | 预期行为 (Expected AI Action) |
| :--- | :--- | :--- |
| **项目启动** | "我们来做一个新的 Streamlit 数据看板项目。" | AI 应当执行 [启动规程]：检查目录结构 -> 检查地图 -> 复述目标 -> 提议创建第一个任务。 |
| **任务循环** | "帮我写个脚本读取 CSV 文件。" | AI 应当进入 [定义-执行-评审] 循环：先复述计划 ("我计划使用 pandas...")，再执行。 |
| **记忆更新** | "我刚才修改了规则，请更新你的记忆。" | AI 应当回答："好的，正在重新加载项目规则..." 并确认已刷新。 |

## 3. 模板维护模式 (template-maintenance-mode.mdc)

**注意**: 本章节测试仅在维护 `_meta` 或 `prompts-library` 时生效。

| 场景 | 测试指令 (User Input) | 预期行为 (Expected AI Action) |
| :--- | :--- | :--- |
| **文档位置(Factory)** | "我想记录一下模板版本发布的策略。" | AI 应当识别这是**工厂运维文档**，并提议存储在 `_meta/docs/` 下，而不是 `docs/`。 |
| **文档位置(Demo)** | "给用户写个示例，展示项目结构应该是啥样的。" | AI 应当识别这是**演示文档**，提议存储在 `docs/` 下。 |
| **地图辨析** | "修改一下项目地图，加上 PromptExtractor 角色。" | AI 应当询问："您是指修改**模板工厂的地图** (`_meta/docs/模板项目地图.md`)，还是**演示用的样例地图** (`docs/项目导航地图.md`)？" |
| **规则冲突测试** | "我在修改 _meta 下的提示词，需要写个文档总结一下。" | AI 应当优先遵循 `template-maintenance-mode.mdc` 的优先级，将文档放入 `_meta/docs/`。 |

## 4. 动态进化闭环 (Dynamic Evolution Loop) - **UPDATED**

**核心测试**: 验证 AI 的“模式匹配 -> 缺口分析 -> 自动组装”能力。

| 测试点 | 测试指令 (User Input) | 预期行为 (Expected AI Action) |
| :--- | :--- | :--- |
| **缺口自动发现** | "我要做一个 Vue3 + FastAPI 的全栈项目。" | 1. AI **自动扫描** `prompts-library/templates/patterns/`。<br>2. AI **主动报告**："我发现现有模板库中仅有 Streamlit 团队，缺乏 Vue+FastAPI 团队。"<br>3. AI 提议启动**动态组装**流程。 |
| **项目生成与注入** | "好的，就按这个配置，创建项目 `FullStackDemo`。" | 1. AI 调用 `generate-project.ps1`。<br>2. AI **主动**在生成后的项目中创建或修改 `.cursor/rules/virtual-team.mdc`，填入组装好的配置。 |
| **逆向提纯 (Distill)** | "这个 `FullStackDemo` 跑得很顺。帮我把这套团队模式提取出来，以后我想直接用。" | 1. AI 扮演 `PromptExtractor`。<br>2. AI 剥离业务细节，生成通用的 `vue-fastapi-team.md`。<br>3. AI 提议将其保存到 `prompts-library/templates/patterns/`，并更新地图。 |

## 5. 项目简图 (project-map-summary.mdc)

| 触发场景 | 测试指令 (User Input) | 预期行为 (Expected AI Action) |
| :--- | :--- | :--- |
| **结构查询** | "这个项目的 prompts-library 目录是干嘛的？" | AI 应当查阅 `project-map-summary.mdc` 或详细地图，准确解释其职责（核心资产）。 |
| **架构变更** | "我想加一个 FastAPI 的后端服务。" | AI 应当警告或建议：这属于架构变更，需要查阅地图并更新文档。 |

## 6. 虚拟团队 (virtual-streamlit-team.mdc)

| 角色/场景 | 测试指令 (User Input) | 预期行为 (Expected AI Action) |
| :--- | :--- | :--- |
| **启动团队** | "启动虚拟团队。" | AI 应当询问当前处于什么阶段（需求/开发/维护），或者自动介绍团队成员。 |
| **呼叫 TPM** | "呼叫 TPM，我有个新想法。" | AI 应当明确加载 `technical-pm.md` (Product Manager)，并以产品经理的口吻（伪代码/PRD）回应。 |
| **打包发布** | "项目开发完了，帮我打包。" | AI 应当加载 `python-distributor.md` (OPS)，检查 `requirements.txt` 并准备打包命令。 |
| **呼叫 QA** | "这个功能做好了，帮我验收一下。" | AI 应当加载 `rubric-specialist.md` (QA)，生成评分量规进行验收。 |

## 7. 用户偏好 (03-user-preferences.mdc)

*注：当前该文件内主要为注释示例，尚未定义强制规则。*

| 测试点 | 测试指令 (User Input) | 预期行为 (Expected AI Action) |
| :--- | :--- | :--- |
| **触发机制** | "我希望以后写 Python 都用 f-string，请帮我记录到偏好里。" | AI 应当识别这是“偏好设置”场景，并更新 `03-user-preferences.mdc` 文件。 |

---

## 测试记录表

*(测试时可在下方打勾)*

- [ ] 01-Docs 记录
- [ ] 01-Tasks 追踪
- [ ] 01-中文交流
- [ ] 01-问题转述
- [ ] 02-项目启动
- [ ] 02-任务循环
- [ ] 03-模板维护(文档位置)
- [ ] 03-模板维护(地图辨析)
- [ ] 04-闭环(缺口发现)
- [ ] 04-闭环(项目注入)
- [ ] 04-闭环(逆向提纯)
- [ ] 05-结构查询
- [ ] 06-启动团队
- [ ] 06-呼叫 TPM
