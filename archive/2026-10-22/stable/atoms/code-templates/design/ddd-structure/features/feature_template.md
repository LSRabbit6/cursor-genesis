# Feature: [Feature Name]

## 1. Context (Why)
*   **Goal**: [Describe the business goal]
*   **Stakeholders**: [Who cares about this?]

## 2. Domain Analysis (What)
*   **Bounded Context**: [Name] (Must match `domain_model.xml`)
*   **Entities Affected**:
    *   [Entity A] (Create/Update/Delete)
    *   [Entity B] (Read-Only Reference)
*   **Dependencies**:
    *   [Context B] (via Relationship X)

## 3. Data Model (Schema Impact)
*   **New Fields**:
    *   `table_name`: `field_name` (Type) - [Description]

## 4. Business Rules (Logic)
*   [Rule 1]: ...
*   [Rule 2]: ...

## 5. API Definition
*   **Input**: ...
*   **Output**: ...
