# SOP-01: 完美软件工程结构标准 (The Engineering Standard)

> **核心定义**: 在 AI 辅助开发时代，"完美"不再意味着代码写得有多快，而是指 **"上下文 (Context)" 是否完整**。
> 只有当以下 **"知识铁三角"** 全部就位时，AI 才能产出生产级代码。

## 📐 第一部分：全栈工程结构 (The Knowledge Triad)

### 1. 🧠 领域设计层 (The Brain)
这是软件的灵魂，定义了业务的边界与规则。
*   **宪法 (Guidelines)**: `docs/domain/guidelines.md`
    *   作用：定义服务、客户、资源三领域的拆分原则。
    *   *AI 检查点*：代码是否违反了分层原则（如直接 JOIN）？
*   **地图 (Global Model)**: `docs/domain/domain_model.xml`
    *   作用：定义核心实体（Entity）及其关系。
    *   *AI 检查点*：新的功能是否引入了未定义的实体？
*   **规格 (Feature Specs)**: `docs/domain/features/*.md`
    *   作用：自然语言描述的业务逻辑。
    *   *AI 检查点*：**拒绝**在没有 Spec 的情况下编写代码。

### 2. 🦴 后端工程层 (The Skeleton)
这是承载业务的骨架。
*   **分层架构 (Layering)**:
    *   Interface (Web/DTO) -> Application (Service) -> Domain (Entity) -> Infrastructure (Repo/Mapper).
*   **聚合模式 (Aggregator & CQRS)**:
    *   **写操作 (Command)**: 严禁跨聚合/跨领域的 SQL JOIN。聚合之间只能通过 ID 引用。
    *   **读操作 (Query)**:
        *   **首选**: 应用层内存组装 (Fetch IDs -> Batch Fetch -> Assemble)。保持领域解耦。
        *   **特定场景**: 如果性能要求极高且在单体架构下，允许在 **Infrastructure 层** (Mapper XML) 编写关联查询 SQL，但**必须返回 DTO (View Object)**，绝不允许映射为 Entity 关联。
*   **原子仓储 (Repository)**:
    *   只负责单表/单聚合根的 CRUD。

### 3. 🎨 前端工程层 (The Skin)
这是用户交互的界面。
*   **Schema 定义**:
    *   `schema.ts` / `columns`：定义表格列、搜索字段、表单验证。
*   **适配器 (Adapter)**:
    *   `api/*.js`：统一处理后端接口的 DTO 转换。
*   **UI 模式**:
    *   **Schema-Driven**: 优先使用配置化组件（如 `PlusTable`），而非手写 HTML。

---

## 🛠️ 第二部分：场景化补全指南 (Scenario Workflows)

当结构不完整时，按照以下剧本进行补全。

### 🟢 场景 A：从零开始 (Greenfield)
*   **状态**：空目录。
*   **行动流**：
    1.  **初始化**: 运行 `init-ddd.ps1` + `init-java.ps1` + `init-vue.ps1`。
    2.  **共创模型**: 人类口述业务 -> AI 生成 `domain_model.xml`。
    3.  **生成规格**: AI 根据模型起草 `features/xxx.md` -> 人类审核。
    4.  **落地代码**: AI 调用 `full` 模式读取 Schema，生成前后端代码。

### 🟡 场景 B：旧项目重构 (Legacy Refactoring)
*   **状态**：有代码，无文档，结构混乱。
*   **行动流**：
    1.  **逆向考古**: AI 扫描 Java 实体类 -> 反向生成 `domain_model.xml` (现状快照)。
    2.  **诊断重构**: 人类指出不合理的依赖 -> AI 提出重构方案 (`features/refactor.md`)。
    3.  **搬运迁移**: AI 按照新模板 (`code-templates`) 将旧代码拆解归位。

### 🔵 场景 C：半成品对齐 (Mid-flight Alignment)
*   **状态**：后端接口已好，前端未动；或反之。
*   **行动流**：
    1.  **Schema 提取**: AI 读取后端 VO/Entity -> 自动生成前端 `columns` 定义。
    2.  **横向对齐**: 检查前端字段是否涵盖了后端的所有数据；检查后端接口是否满足前端的搜索需求。
    3.  **组件组装**: 调用前端模板生成 UI。
