# DDD Guidelines: The Triad Separation & Structural Law

## 1. Model Layering (模型分层)
We strictly separate the "High-Level Concept" from the "Detailed Definition".

### Level 1: Core Concepts (`domain_model.xml`)
*   **Location**: Root of `docs/domain/`.
*   **Content**: Only the **Core Concepts** that this domain exposes to others.
*   **Format**: Concept Name + Key Relationship + Core Business Attribute (Chinese Concept).
*   **Usage**: Fed to AI for global context understanding and design.

### Level 2: Full Schema (`[Domain]/schema.xml`)
*   **Location**: Inside each domain folder (e.g., `docs/domain/service/schema.xml`).
*   **Content**: **All** business attributes, based on the Database perspective.
*   **Format**: Field Name (DB) + Business Description (Chinese). No specific Java/TS types (AI infers them).
*   **Usage**: Used by AI to generate actual Entity/DTO/Component code.

## 2. The Elevation Rule (引用与提升规则)
**Principle**: "If it is shared, it must be elevated."

*   **Private**: Used only within Domain A -> Keep in `docs/domain/A/`.
*   **Shared**: Used by Domain A AND Domain B -> **MUST MOVE** to `docs/domain/common/` (or a shared parent).
*   **Constraint**: Domain A cannot directly import a private definition from `docs/domain/B/`. It must request a "Refactor to Common" first.

## 3. The Triad Separation (Old Rules)
1.  **No Direct Database Joins**: Customer logic should not `JOIN` Service tables directly in code (Logic Coupling).
2.  **Association via IDs**: Use "Mapping Tables" or "Foreign Keys" solely for reference.
3.  **Read-Only Services**: If Customer needs to check Service validity, it calls a `ServiceValidityChecker` (Interface), not the Service Entity itself.
