# 提示词库重构记录 (Refactoring Log)

**日期**: 2025-11-27
**主题**: 提示词资产化与全生命周期管理架构 (V2.1.0)

---

## 1. 背景与痛点
在之前的版本中，提示词 (`roles/`) 仅仅是扁平化的文件堆砌，存在以下问题：
*   **缺乏复用性**: 每个角色都混杂了通用能力和具体业务逻辑。
*   **维护困难**: 更新一个通用技能（如 Streamlit 最佳实践）需要修改多个文件。
*   **结构混乱**: “模板维护工具”与“用户交付资产”混在一起。

## 2. 核心决策：三层资产架构
我们确立了全新的**“三层资产架构”**，实现了提示词的工程化管理：

### A. 交付层 (`prompts-library`)
这是交付给最终用户的核心资产。
*   **原子能力 (`templates/capabilities`)**: 不可再分的技能点。
    *   `product/`: 引入 Technical PM，强调伪代码逻辑。
    *   `development/`: 引入 Code Detective，强调遗留代码维护。
    *   `testing/`: 引入 Rubric Specialist，强调质量量规。
    *   `ops/`: 引入 Python Packager，强调环境隔离。
*   **协作模式 (`templates/patterns`)**: 定义团队的组装方式。
    *   创建了 `virtual-streamlit-team.md`，定义了 5 步闭环工作流。
*   **方法论 (`guides`)**:
    *   统一了 `prompt-writing-guide.md`，强制执行 XML 插槽标准。

### B. 维护层 (`_meta`)
这是用于维护模板本身的工具，不随项目发布。
*   **图书管理员 (`_meta/prompts/ops/librarian.md`)**:
    *   升级为 V3.0 架构师级角色。
    *   具备“逆向工程”能力，能从成品提示词中提取出 Capabilities 和 Patterns。

### C. 运行层 (`.cursor/rules`)
*   **动态加载**: `virtual-streamlit-team.mdc` 现在直接动态读取 `templates/` 下的原子文件。
*   **双层地图机制**: 确立了“简图入规则 (`project-map-summary`)，详图留文档 (`项目导航地图`)”的上下文管理策略。

## 3. 关键成果
1.  **提炼了六大核心角色**: 覆盖了从需求到交付的全链路。
2.  **建立了 Pattern 机制**: 让角色不再孤立，而是形成有机的虚拟团队。
3.  **实现了自动化闭环**: 通过 Librarian 角色，我们可以持续从实战项目中“蒸馏”出新的原子能力，反哺母版。

## 4. 下一步展望
*   **实战验证**: 在下一个新项目中，使用 `generate-project.ps1` 生成项目，并完全依赖虚拟团队进行开发，验证 Pattern 的流畅度。
*   **Librarian 自动化**: 探索将 Librarian 集成到 CI/CD 或脚本中，实现自动化的资产提取。

---
*记录人: AI Assistant*

