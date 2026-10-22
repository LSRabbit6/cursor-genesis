# 协作模式手册 (Team Patterns Catalog)

> **描述**: 定义了如何组合“原子角色”来应对不同的业务场景。这是 Orchestrator (Pattern) 文件的索引。

## 🟢 已激活团队 (Active Teams)

### 1. 战略研判小组 (Strategic Research Council)
*   **对应文件**: `templates/patterns/strategic-research-team.md`
*   **核心目标**: **Go / No-Go 决策**。对老板提出的新点子进行全方位可行性分析。
*   **触发规则**: `.cursor/rules/teams/strategic-research-team.mdc`
*   **拓扑结构**:
    *   **Orchestrator**: Strategy Lead (用户/AI)
    *   **R1**: Concept Decoder (Insight) - 去模糊
    *   **R2**: Market Hunter (Insight) - 讲价值
    *   **R3**: Tech Realist (Architecture) - 算成本
    *   **R4**: Logic Critic (Quality) - 找漏洞
*   **输出产物**: `docs/research/YYYY-MM-DD-{Topic}.md` (研判报告)

### 2. 虚拟 Streamlit 研发团队 (Virtual Streamlit Team)
*   **对应文件**: `templates/patterns/virtual-streamlit-team.md`
*   **核心目标**: **全栈开发**。专门针对 Python Streamlit 应用的研发生命周期。
*   **触发规则**: `.cursor/rules/teams/virtual-streamlit-team.mdc`
*   **拓扑结构**:
    *   **Orchestrator**: Team Lead
    *   **TPM**: Technical PM (Insight)
    *   **SPEC**: Systems Designer (Architecture)
    *   **DEV**: Streamlit Expert (Engineering)
    *   **QA**: Rubric Specialist (Quality)
    *   **OPS**: Distributor (Engineering)

### 3. 课题研究团队 (Topic Research Team)
*   **对应文件**: `templates/patterns/topic-research-team.md`
*   **核心目标**: **学术/深度技术研究**。从破题到实验设计的全流程科研辅助。
*   **触发规则**: `.cursor/rules/teams/topic-research-team.mdc`
*   **拓扑结构**:
    *   **R1**: Topic Guide (Insight) - 破题导航
    *   **R2**: Research Architect (Architecture) - 框架设计
    *   **R3**: Literature Hunter (Insight) - 文献策略
    *   **R4**: Experiment Designer (Quality) - 实验验证
    *   **R5**: Research Executor (Engineering) - 执行落地
*   **输出产物**: 研究导航图、研究框架报告、实验设计方案、执行计划。

### 4. 领域建模团队 (Domain Driven Design Team)

*   **对应文件**: `templates/patterns/domain-driven-design.md`
*   **核心目标**: **DDD 领域建模**。将模糊需求转化为严格的领域定义和特性规格。
*   **触发规则**: `.cursor/rules/teams/domain-driven-design.mdc`
*   **拓扑结构**:
    *   **Architect**: Domain Architect (Architecture) - 领域边界定义
    *   **Decoder**: Concept Decoder (Insight) - 意图澄清
    *   **Critic**: Logic Auditor (Quality) - 逻辑验证
*   **输出产物**: `features/xxx.md` (特性规格), `domain_model.xml` (领域模型)

### 5. AI迁移先遣队 (AI Migration Vanguard)

*   **对应文件**: `templates/patterns/ai-migration-team.md`
*   **核心目标**: **遗留项目接管**。安全地分析、修复和改造遗留代码库。
*   **触发规则**: `.cursor/rules/teams/ai-migration-team.mdc`
*   **拓扑结构**:
    *   **Scout**: Codebase Scout (Engineering) - 代码侦察
    *   **Specialist**: Env Specialist (Engineering) - 环境修复
    *   **Guardian**: Production Safety (Rules) - 安全守护
*   **输出产物**: `docs/project-map.md` (项目地图), `.venv/` (可运行环境)

---

## 🔵 规划中团队 (Planned Teams)

### 4. 小工具特遣队 (Virtual Prototyping Team)
*   **核心目标**: **Speed (速度)**。快速开发一次性脚本、数据清洗工具或 POC Demo。
*   **建议阵容**:
    *   **Lead**: Rapid Prototyper (Engineering)
    *   **Reviewer**: Logic Critic (Quality)
*   **工程标准**: 允许单文件，允许硬编码，无需复杂文档。

### 5. 正规军交付组 (Software Delivery Squad)
*   **核心目标**: **Robustness (健壮性)**。开发需要长期维护、多人协作的企业级应用。
*   **建议阵容**:
    *   **Architect**: Systems Designer (Architecture)
    *   **Dev**: Software Engineer (Engineering)
    *   **QA**: Rubric Specialist (Quality)
*   **工程标准**: 必须有 HLD/LLD，必须有单元测试，代码必须符合 SOLID 原则。
