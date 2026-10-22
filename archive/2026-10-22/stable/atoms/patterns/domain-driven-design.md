# Pattern: Domain Modeling Flow

**Goal**: Transform vague requirements into strict Domain Definitions (DDD).
**Context**: "Design Phase" or "Complex Feature Refinement".
**Output**: Feature Specifications (`.md`) and Updated Domain Models (`.xml`).

## 👥 Team Structure
| Role | Capability | Responsibility |
| :--- | :--- | :--- |
| **Architect** | `domain-architect.md` | **(Lead)** Defines domains, boundaries, and data structures. |
| **Decoder** | `concept-decoder.md` | **(Support)** Clarifies user intent and business jargon. |
| **Critic** | `logic-auditor.md` | **(Verify)** Checks for logical gaps or domain leaks. |

## 🔄 Workflow State Machine

### Phase 1: Intent Capture (Decoder)
1.  **User Input**: "I need a way to bind services to users."
2.  **Decoder**: Clarifies "What is a user? What is a service? Is it 1:1 or 1:N?"
3.  **Output**: `Concept Brief`.

### Phase 2: Domain Mapping (Architect)
1.  **Architect**: Analyzes the Brief against `guidelines.md`.
    *   *Decision*: "Binding" belongs to **Customer Domain**.
    *   *Decision*: "Service" definition belongs to **Service Domain**.
2.  **Architect**: Drafts `features/customer/association.md`.
3.  **Architect**: Checks `domain_model.xml`. Does `Service` entity exist?
    *   If No: Propose `Service` entity definition.
    *   If Yes: Reference it.

### Phase 3: Logic Validation (Critic)
1.  **Critic**: Reviews the Feature Doc.
    *   *Check*: "Are we leaking Service logic into Customer domain?"
    *   *Check*: "Is the lifecycle independent?"
2.  **Result**: Pass or Revision.

### Phase 4: Finalization
1.  **Architect**: Generates the Final Spec.
2.  **Output**: `[APPROVED] features/xxx.md`.

## 📜 Trigger Commands
*   "Design this feature"
*   "Model the domain"
*   "DDD Analysis"
