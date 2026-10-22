# SOP-02: Cursor 协作开发手册 (The Collaboration Manual)

> **核心定义**: 本项目不仅仅是一个代码模板，它是一套 **"人机协同操作系统"**。
> 你不是在对着一个编辑器打字，你是在指挥一个由 specialized Agents 组成的虚拟研发团队。

## 🗺️ 第一部分：SOP 体系全景

### 1. 软资产 (The Brain) -> `prompts-library/`
*   这是 AI 的"智力储备"。
*   包含：架构师思维 (Architect)、产品经理思维 (TPM)、测试思维 (QA)。
*   **用法**: 通过聊天窗口触发，如 "启动 DDD 设计"。

### 2. 硬资产 (The Body) -> `code-templates/`
*   这是工程的"物理模具"。
*   包含：DDD 目录结构、Java Spring Boot 脚手架、Vue Admin 脚手架。
*   **用法**: 通过 `use-template.ps1` 脚本注入到项目中。

### 3. 操作系统 (The OS) -> `.cursor/rules/`
*   这是自动化的"触发器"。
*   **机制**: 当你打开某个文件或输入特定关键词时，Cursor 会自动加载对应的 Rules。
*   **例子**: 编辑 `features/*.md` 时，自动激活 `Domain Architect`。

---

## 🔄 第二部分：Agentic Workflow (智能体流水线)

我们摒弃了"一次性把所有文件丢给 AI"的做法，采用 **"渐进式上下文加载" (Progressive Context Loading)**。

### 🛠️ 核心工具链
*   `tools/domain_tools.py map`: **看地图** (获取全局领域关系)。
*   `tools/domain_tools.py list`: **看目录** (有哪些领域文件夹)。
*   `tools/domain_tools.py lite`: **看摘要** (设计阶段，只看表名/概念)。
*   `tools/domain_tools.py full`: **看详情** (开发阶段，看字段/类型)。

### 🌊 三步走流水线 (The Seeker Protocol)

#### Phase 1: 咨询模式 (Consultant)
*   **场景**: "我想做个会员功能，但不确定怎么设计。"
*   **AI 动作**: 调用 `map` 查看现有领域，建议在 `Customer` 领域新增实体。
*   **产出**: 决策方案。

#### Phase 2: 架构模式 (Architect)
*   **场景**: "确定要做会员功能，涉及表 A 和表 B。"
*   **AI 动作**: 调用 `lite` 查看表名，撰写 `features/vip_member.md`。
*   **产出**: **Feature Spec (规格书)**。这是开发前的"签字画押"。

#### Phase 3: 工兵模式 (Worker)
*   **场景**: "规格书已确认，写代码吧。"
*   **AI 动作**: 调用 `full` 获取全量字段信息，精确生成 Java/Vue 代码。
*   **产出**: 生产级代码。

---

## 👨‍✈️ 第三部分：人类指挥官职责 (Human Requirements)

在这个体系中，人类不再是"打字员"，而是 **"指挥官 (Commander)"**。

### 1. 定义意图 (Intent)
*   你不需要知道代码怎么写，但你必须知道 **"我要解决什么业务问题"**。
*   **Do**: "我要限制同一 IP 的注册频率。"
*   **Don't**: "帮我写个 for 循环。"

### 2. 审核规格 (Audit)
*   AI 生成的 `features/*.md` 是最重要的交付物。
*   **必须检查**:
    *   业务流程是否通顺？
    *   是否漏掉了关键字段？
    *   是否违反了 Guidelines (如直接 JOIN)？
*   **原则**: 文档不准，代码必错。文档改对，代码自成。

### 3. 拒绝平庸 (Refuse)
*   如果 AI 生成的代码没有使用模板中的结构（如没有用 `PlusTable`，而是手写 HTML），**直接拒绝**。
*   **指令**: "请参考 `code-templates/frontend` 的标准写法重写。"
