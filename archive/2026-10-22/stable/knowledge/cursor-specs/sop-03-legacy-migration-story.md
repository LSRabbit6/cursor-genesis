# SOP-03: 实战故事 - 旧项目重生记 (The Legacy Migration Story)

> **Context**: 本文档以叙事方式，展示如何利用 Cursor 模板体系接管并重构一个未知技术栈的旧项目。
> **核心逻辑**: 母版赋能 -> 侦察适配 -> 逆向建模 -> 隔离开发 -> 资产回流。

## 🎬 序幕：未知的挑战 (The Challenge)

**主角**: Alex (Tech Lead)
**配角**: Cursor AI (搭载 Prometheus 架构)
**任务**: 接手一个 5 年前的旧项目（技术栈未知），在不破坏现有业务的前提下，开发新的“企业支付”模块，并建立长期维护秩序。

---

## 📅 Day 1: 母版赋能 (The Genesis)
> **目标**: 生成一个具备“高智商”的空壳工作区，准备接纳旧代码。

1.  **操作**: Alex 在**母版项目**中打开 Chat。
2.  **指令**: "我要接手一个旧项目（代码在 git 上），准备做 AI 治理。请帮我生成一个名为 `Legacy-Upgrade` 的工作区，启用迁移团队。"
3.  **AI 动作 (Project Incubator)**:
    *   运行 `generate-project.ps1 -ProjectName Legacy-Upgrade`。
    *   **解释**: "工作区已生成。它现在是一个空的‘兵工厂’，里面有规则（Rules）、智力（Prompts）和工具（Tools）。请把你的旧代码放进去。"
4.  **操作**: Alex 将旧项目代码 clone 到 `Legacy-Upgrade/src/legacy_app` 目录下。

---

## 📅 Day 2: 侦察与适配 (Scout & Adapt) -> *关键修正点*
> **目标**: 识别技术栈。如果模板库里没有，就现场造一个。

1.  **指令**: "@Codebase Scout 扫描 `src/legacy_app`。**注意：此目录为生产环境，设为只读禁区。**"
2.  **AI 动作 (Codebase Scout)**:
    *   **锁定**: 将 "src/legacy_app IS READ-ONLY" 写入全局规则 `.cursor/rules/project-map-summary.mdc`。
    *   **分析**: "发现这是一个 **Python Django** 项目。当前 `code-templates` 只有 Java 和 Vue。"
    *   **策略 (Auto-Adapt)**: "检测到技术栈缺失。我将参考 `java-spring-boot` 的 DDD 结构，为您现场定制一个 `django-ddd` 临时脚手架。"
3.  **AI 动作 (Architect)**:
    *   读取 `code-templates/backend/java-spring-boot` 的目录结构。
    *   在 `code-templates/backend/custom-django` 中生成对应的 Python 版本结构 (Interface/App/Domain/Infra)。
    *   **反馈**: "Django DDD 适配模板已就绪，等待使用。"

---

## 📅 Day 3: 逆向建模 (Reverse Modeling)
> **目标**: 从旧代码的混乱中提取出清晰的“知识三角”。

1.  **指令**: "@Domain Architect 基于旧代码的 Order 模块，逆向生成领域模型。"
2.  **AI 动作**:
    *   **初始化**: 自动运行 `init-ddd.ps1`。
    *   **读取**: 解析 Django Models (`models.py`)。
    *   **映射**: 生成 `docs/domain/domain_model.xml`（现状快照）。
3.  **交互**: Alex 指出："Order 和 User 耦合太紧了，在逻辑模型里把它们拆开。" AI 更新 XML。

---

## 📅 Day 4: 隔离设计 (The Design)
> **目标**: 在“净土”中设计新功能。

1.  **指令**: "我要设计'企业支付'功能。请根据新模型写 Spec。"
2.  **AI 动作**:
    *   调用 `domain_tools.py lite` 读取模型。
    *   生成 `docs/domain/features/corporate_pay.md`。
    *   **关键约束**: Spec 中明确 "New Payment Logic (Python)" 必须通过 ID 引用 "Old Order (Django)"，严禁直接 import 旧 Model 类。

---

## 📅 Day 5: 混合架构开发 (Hybrid Coding)
> **目标**: 使用“现场定制”的模板进行开发。

1.  **指令**: "基于 Spec 开发后端代码，放在 `src/new_module`。"
2.  **AI 动作**:
    *   **加载**: 调用 `domain_tools.py full` 获取 Schema。
    *   **脚手架**: 自动应用 Day 2 生成的 `custom-django` 模板。
    *   **编码**: 生成符合 DDD 的 Python 代码 (`PaymentService`, `PaymentRepo`)。
    *   **防腐层**: 生成 `LegacyOrderAdapter.py` 来封装对旧系统的调用。

---

## 📅 Day 6: 验收与回流 (Review & Feedback)
> **目标**: 确保质量，并将这次“定制”转化为永久资产。

1.  **指令**: "@Logic Auditor 检查代码结构。"
2.  **AI 动作**: 确认新代码没有违反分层原则，没有侵入只读区。
3.  **指令**: "这次生成的 Django 模板很好，请提炼并保存。"
4.  **AI 动作 (Pattern Distiller)**:
    *   提取 `code-templates/backend/custom-django`。
    *   将其标准化为 `code-templates/backend/python-django-ddd`。
    *   **回流**: 将其放入 `_meta/wisdom-inbox` 或直接存入模板库（取决于权限），供下次直接使用。

---

## 🏁 结局
Alex 不仅完成了任务，还留下了一套标准的 Django DDD 开发范式。下一个人接手时，直接套用即可。
