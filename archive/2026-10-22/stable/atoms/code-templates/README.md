# 🏭 Code Templates & Scaffolds

This directory contains **Production-Grade Templates** (Hard Assets) ready to be injected into your project.

## 📦 Available Inventory

| Template ID | Description | Source Path | Recommended Target |
| :--- | :--- | :--- | :--- |
| **`ddd`** | **Domain Driven Design Kit**<br>Guidelines, Model XML, Spec Templates. | `design/ddd-structure` | `docs/domain/` |
| **`java`** | **Spring Boot DDD Scaffold**<br>Layered Architecture (Interface/App/Domain/Infra). | `backend/java-spring-boot` | `src/backend/` |
| **`vue`** | **Vue 3 Admin Scaffold**<br>Element Plus, Pinia, Axios encapsulation. | `frontend/vue-admin` | `src/frontend/` |

## 🛠️ How to Use

Use the helper script `use-template.ps1` to install any template.

```powershell
# 1. Install DDD Design Structure (Recommended for new projects)
.\code-templates\use-template.ps1 -Name ddd

# 2. Install Java Backend
.\code-templates\use-template.ps1 -Name java -Target src/my-app-backend

# 3. Install Vue Frontend
.\code-templates\use-template.ps1 -Name vue -Target src/my-app-frontend
```

## 🤖 AI Collaboration
*   **Domain Architect**: Will ask you to install the `ddd` template first.
*   **Java/Vue Architect**: Will expect the project to follow the structure in `java`/`vue` templates.
