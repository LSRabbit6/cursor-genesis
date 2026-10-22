# Agentic Development Lifecycle (The "Seeker" Protocol)

This document defines HOW an AI Agent interacts with the Domain Workspace to build software.
The core principle is **Progressive Context Loading**: Never dump all files at once. Seek only what is needed for the current step.

## 🛠️ The Toolbelt
*   `python code-templates/tools/domain_tools.py map`: Get the Global View.
*   `python code-templates/tools/domain_tools.py list`: See available Domains.
*   `python code-templates/tools/domain_tools.py lite [domain]`: Get Table Names (Design Mode).
*   `python code-templates/tools/domain_tools.py full [domain]`: Get Field Details (Dev Mode).

---

## 🔄 The Flow

### Phase 1: Orienteering (Discovery)
> **Goal**: Find where the relevant business logic lives.

1.  **User**: "I need to add a 'VIP Level' to users."
2.  **AI**: "Let me check the Global Map first."
    *   *Action*: `... tools/domain_tools.py map`
    *   *Observation*: "Okay, I see a 'Customer' domain."
3.  **AI**: "Let me confirm the folder name."
    *   *Action*: `... tools/domain_tools.py list`
    *   *Observation*: "Found folder `customer`."

### Phase 2: Design (Specification)
> **Goal**: Define the logic without getting bogged down in database types.

1.  **AI**: "I need to see what tables exist in 'customer' to verify where to add the field."
    *   *Action*: `... tools/domain_tools.py lite customer`
    *   *Observation*: "Found table `t_user_base`. I will add `vip_level` here."
2.  **AI**: Writes `features/vip_level.md`.
    *   *Content*: "Add `vip_level` (Enum: SILVER, GOLD) to `t_user_base`."

### Phase 3: Implementation (Coding)
> **Goal**: Write the actual Java/Vue code.

1.  **AI**: "Now I need the full definition to write the Entity class."
    *   *Action*: `... tools/domain_tools.py full customer`
    *   *Observation*: "Got it. `t_user_base` has `id`, `name`..."
2.  **AI**: Generates `UserBase.java` and `UserMapper.xml`.

---

## 🤖 Role Responsibilities

*   **Domain Architect**: Owns Phase 1 & 2. Uses `map` and `lite`.
*   **Java/Vue Architect**: Owns Phase 3. Uses `full`.
