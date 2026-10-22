# Domain Design Workspace (DDD)

This directory is the **"Brain"** of your business logic.
It separates the **Problem Space** (Requirements) from the **Solution Space** (Code).

> **Authority**: This directory defines the **Architectural Law**. If code templates (Java/Vue) conflict with principles here, THIS document wins.

## 📂 Directory Structure

*   **`guidelines.md`**: ⚖️ The "Constitution". Rules for separating Service vs Customer vs Resource.
*   **`workflow.md`**: 🔄 The "SOP". How to go from "I have an idea" to "Ready to Code".
*   **`domain_model.xml`**: 🗺️ The "Map". High-level entity relationships (Logical Model).
*   **`features/`**: 📄 The "Specs". One Markdown file per feature (e.g., `user_login.md`).
    *   *Note*: AI Agents refuse to code until a Spec exists here.
*   **`domain/`**: 🏗️ (Optional) Specific sub-domain breakdown if the project is huge.

## 🚀 How to Start

1.  **Define the Model**: Edit `domain_model.xml` to define your core entities (User, Order, Product).
2.  **Draft a Feature**: Create `features/01-my-feature.md`.
3.  **Call the Architect**: "Cursor, I've drafted the feature. Please review."
