# 学习记录：基于 Spec 的严谨工程化流程分析
Date: 2025-12-01
Subject: Analysis of llm-output-classification Workflow (EARS & Correctness Properties)

## 1. 核心发现：缺失的环节
对比我们现有的 `Virtual Streamlit Team` 流程与 `llm-output-classification` 的案例，我发现了一个关键的“质量断层”：

*   **现有流程 (Agile)**: `TPM (用户故事/伪代码)` -> `DEV (实现)`
    *   *优点*：快，适合原型和UI调整。
    *   *缺点*：DEV 容易漏掉边界情况；缺乏对系统“不变量”的定义；测试通常是后置的。

*   **新发现流程 (Rigorous)**: `TPM` -> **`SPEC (系统设计)`** -> `DEV`
    *   *核心价值*：在写代码前，先定义“什么是正确的”。

## 2. 三大设计亮点

### A. 需求形式化 (EARS 语法)
案例中的 `requirements.md` 不仅仅是自然语言，而是使用了 **EARS (Easy Approach to Requirements Syntax)** 模式。
*   **格式**：`WHEN <trigger> THEN <system> SHALL <response>`
*   **价值**：消除歧义。DEV 不需要猜“大概要做成什么样”，而是有明确的执行标准。

### B. 正确性属性 (Correctness Properties)
这是 `design.md` 中最惊艳的部分。它没有止步于类图，而是定义了**属性 (Invariants)**。
*   **例子**：不仅仅说“实现加法”，而是说“对于任何输入 a, b，结果必须满足 a+b = b+a”。
*   **价值**：这直接指导了 **基于属性的测试 (Property-Based Testing)**，比普通的单元测试覆盖率高得多。

### C. 任务可追溯性 (Traceability)
`tasks.md` 中的每个任务都标记了来源（例如 `Refs: REQ-001`）。
*   **价值**：防止镀金（做多余的功能）和遗漏。

## 3. 融合方案建议：新增 "SPEC" 角色

我不建议彻底重写现有的 TPM 或 DEV，而是引入一个**可选的高级角色**：**`Systems Designer (SPEC)`**。

### 角色定义
*   **名称**：Systems Designer (系统设计师)
*   **代号**：`SPEC`
*   **定位**：位于 TPM 和 DEV 之间，负责“将模糊的需求转化为严谨的数学/逻辑规范”。

### 触发机制 (Decision Matrix Update)
并不是所有任务都需要 SPEC。
*   **简单任务** (改按钮颜色)：`TPM -> DEV` (保持现状)
*   **复杂逻辑** (计费系统、算法核心)：`TPM -> SPEC -> DEV`

### 拟定工作流
1.  **TPM** 输出 PRD（关注用户价值）。
2.  **SPEC** 介入，执行 `Prework`：
    *   将 PRD 翻译成 EARS。
    *   定义 `design.md` 中的正确性属性。
3.  **DEV** 介入：
    *   不仅仅写功能代码，还要写 `fast-check` 或 `hypothesis` 测试来验证 SPEC 定义的属性。

## 4. 结论
这个流程极大地提升了软件的**鲁棒性**。建议将 `Systems Designer` 作为一个新的 Capability 引入 `prompts-library`，并在 `Virtual Streamlit Team` 中配置为可选路径。

