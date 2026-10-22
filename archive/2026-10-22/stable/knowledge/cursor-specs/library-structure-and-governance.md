# 库结构与治理规范 (Library Structure & Governance)

> **描述**: 定义 Prompt 库的目录规范、工程分级标准以及维护原则。

## 1. 目录治理规范 (Directory Governance)

为了解决“含义零散”的问题，我们采用**认知层次（Cognitive Layers）**分类法：

*   **`01_insight`**: **想清楚**。涉及需求定义、市场分析、用户洞察。
*   **`02_architecture`**: **设计好**。涉及技术评估、架构蓝图、元提示词。
*   **`03_engineering`**: **做出来**。涉及代码实现、环境部署、维护。
*   **`04_quality`**: **测明白**。涉及逻辑审计、验收标准。
*   **`05_learning`**: **学进去**。涉及教学、辅导、知识整理。

## 2. 工程分级标准 (Engineering Tiering)

在 `03_engineering` 类别中，必须严格区分两种思维模式，不可混用：

| 维度 | 🟢 Mode A: 快速原型 (Rapid Prototype) | 🔵 Mode B: 工程软件 (Software Engineering) |
| :--- | :--- | :--- |
| **目标** | 验证想法，解决临时问题 | 长期运行，多人协作 |
| **文件结构** | 单文件 (Single Script) | 模块化 (MVC/DDD) |
| **依赖管理** | 尽量用标准库 | 使用 requirements.txt / pyproject.toml |
| **代码风格** | 允许 Hardcode，从简 | 必须符合 Style Guide，严禁 Magic Number |
| **测试要求** | 能跑通即可 | 必须有 Unit Test 覆盖 |
| **适用角色** | `Rapid Prototyper` (待建) | `Software Engineer` / `Streamlit Expert` |

## 3. 维护原则

1.  **Neuron-Hook-Logic**: 所有的功能扩展必须遵循三层架构（Capability -> Pattern -> Rule）。
2.  **Atomic Design**: Capability 必须是原子的，不包含具体的项目上下文。
3.  **Mandatory Context Loading**: Rule 必须显式加载所有依赖的 Capability 文件。

