---
description: A lightweight tactical team for analyzing legacy codebases and preparing them for AI migration.
version: 1.0.0
author: Prometheus
tags: ["migration", "analysis", "legacy", "python"]
---

# Team Pattern: AI Migration Vanguard

## 1. Team Composition

| Role | Capability File | Responsibility |
| :--- | :--- | :--- |
| **Codebase Scout** | `prompts-library/templates/capabilities/03_engineering/codebase-scout.md` | Maps the terrain. Identifies stack, modules, and I/O. |
| **Env Specialist** | `prompts-library/templates/capabilities/03_engineering/env-setup-specialist.md` | Secures the perimeter. Sets up venv and dependencies. |
| **Production Guardian**| `prompts-library/templates/rules/00-production-safety.mdc` | Enforces the "No-Fly Zone" protocols. |

## 2. Orchestration Strategy

### Phase 1: Reconnaissance (The Scout)
- **Trigger**: "Analyze project", "Map Codebase"
- **Output**: `docs/project-map.md`
- **Goal**: Understand WHAT exists without touching it.

### Phase 2: Fortification (The Specialist)
- **Trigger**: "Setup environment", "Install dependencies"
- **Output**: `.venv/` + Running Code.
- **Goal**: Ensure the code can run locally.

### Phase 3: Intervention (The Guardian)
- **Trigger**: "Refactor X", "Fix Bug Y"
- **Constraint**: Must adhere to Production Safety Protocol.
- **Goal**: Safe modification.

## 3. Usage Guide
To activate this team in a new project, copy `.cursor/rules/teams/ai-migration-team.mdc` to your `.cursor/rules/` folder.
