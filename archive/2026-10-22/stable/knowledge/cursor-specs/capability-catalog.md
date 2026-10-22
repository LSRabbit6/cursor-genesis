# 原子能力目录 (Capability Catalog)

> **描述**: 本文档是 `prompts-library/templates/capabilities` 的官方索引。所有原子角色在此注册。

## 📂 01_Insight (洞察与定义)
> **核心职能**: 需求去模糊化、市场价值分析、用户共情。

| Role ID | 角色名称 | 文件路径 | 思维模型 (Mental Model) | 适用场景 |
| :--- | :--- | :--- | :--- | :--- |
| **R-01** | Concept Decoder | `01_insight/concept-decoder.md` | **EARS语法**：将模糊语言转化为结构化需求。 | 项目启动初期，老板只有一句话需求时。 |
| **R-02** | Market Hunter | `01_insight/market-analyst.md` | **价值锚点**：构建 User Story，寻找差异化竞争点。 | 商业计划书撰写、产品卖点提炼。 |
| **R-03** | User Empathizer | `01_insight/project-advocate.md` | **情感共鸣**：站在小白用户角度思考体验。 | 交互设计评审、宣发文案审核。 |
| **R-04** | Technical PM | `01_insight/technical-pm.md` | **任务拆解**：将需求转化为具体的开发任务。 | 需求分析、Backlog 梳理。 |

## 📂 02_Architecture (结构与设计)
> **核心职能**: 技术可行性评估、系统架构设计。

| Role ID | 角色名称 | 文件路径 | 思维模型 (Mental Model) | 适用场景 |
| :--- | :--- | :--- | :--- | :--- |
| **A-01** | Tech Realist | `02_architecture/tech-feasibility-auditor.md` | **Traceability**：确保技术投入能带来业务产出。 | 战略研判 Phase 3，技术选型。 |
| **A-02** | Systems Designer | `02_architecture/systems-designer.md` | **分层架构**：HLD/LLD 设计，模块解耦。 | 正规项目开发前夕。 |
| **A-03** | Map Updater | `02_architecture/project-mapper.md` | **拓扑映射**：维护项目文件结构地图。 | 文件增删改时、项目结构重构时。 |
| **A-04** | Prometheus | `02_architecture/prometheus-prompt-engineer.md` | **Meta-Prompting**：设计提示词的提示词。 | 编写新角色、优化现有 Prompt。 |

## 📂 03_Engineering (实现与执行)
> **核心职能**: 代码编写、工程落地。

| Role ID | 角色名称 | 文件路径 | 思维模型 (Mental Model) | 适用场景 |
| :--- | :--- | :--- | :--- | :--- |
| **E-01** | Streamlit Expert | `03_engineering/streamlit-expert.md` | **Session State**：管理 Streamlit 的复杂状态。 | 快速构建数据看板、内部工具。 |
| **E-02** | Code Detective | `03_engineering/code-maintainer.md` | **工匠思维**：代码异味嗅探、重构。 | 修复 Bug、优化代码质量。 |
| **E-03** | Distributor | `03_engineering/python-distributor.md` | **环境隔离**：依赖管理、打包分发。 | 项目交付、生成 exe/docker。 |

## 📂 04_Quality (质量与风控)
> **核心职能**: 逻辑审计、验收标准制定。

| Role ID | 角色名称 | 文件路径 | 思维模型 (Mental Model) | 适用场景 |
| :--- | :--- | :--- | :--- | :--- |
| **Q-01** | Logic Critic | `04_quality/logic-auditor.md` | **Pre-mortem**：事前尸检，极限压力测试。 | 战略研判 Phase 4，方案评审。 |
| **Q-02** | Rubric Specialist | `04_quality/rubric-specialist.md` | **量化验收**：制定具体的 Pass/Fail 标准。 | 测试用例生成、验收评审。 |

## 📂 05_Learning (教学与成长) [规划中]
> **核心职能**: 知识内化、技能传授。

| Role ID | 角色名称 | 文件路径 | 思维模型 (Mental Model) | 适用场景 |
| :--- | :--- | :--- | :--- | :--- |
| **L-01** | Topic Tutor | `(Pending)` | **苏格拉底式教学**：引导式提问。 | 学习新概念。 |

