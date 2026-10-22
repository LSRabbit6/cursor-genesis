# Domain Modeling Workflow

## 🟢 Phase 1: Definition (The "What")
1.  **Trigger**: New requirement arrives.
2.  **Action**: Create `features/xxx-feature-name.md`.
3.  **Template**:
    ```markdown
    # Feature: [Name]
    ## Domain
    [Service / Customer / Resource]
    ## Logic
    ...
    ## Schema Impact
    ...
    ```

## 🟡 Phase 2: Modeling (The "Structure")
1.  **Check**: Does this introduce a new Noun (Entity)?
2.  **Action**: If yes, add to `domain_model.xml`.
3.  **Verify**: Does it violate the Triad Separation? (Consult `guidelines.md`).

## 🔴 Phase 3: Implementation (The "How")
1.  **Handover**: Pass the `features/xxx.md` to the **Tech Architect** (Java/Vue).
2.  **Execution Loop** (See `code-templates/guides/ai-collaboration-workflow.md`):
    *   **Consult**: "What's the best way to implement this Aggregator?"
    *   **Refine**: Update `features/xxx.md` with technical decisions (e.g., "Use Stream API").
    *   **Code**: "Generate the Java code based on the refined Spec."
3.  **Reflect**: If code requires changing logic, update the spec FIRST.
