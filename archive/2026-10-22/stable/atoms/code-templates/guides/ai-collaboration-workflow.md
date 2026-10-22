# AI Collaboration Workflow: The "Three-Step" Method

> **Context**: This is the **Micro-Workflow** used during the **Implementation Phase** of DDD.
> It guides HOW to interact with AI to generate the code defined in your Domain Models.

## Phase 1: Consultant Mode (咨询模式)
*   **Goal**: Explore technical solutions for a Feature.
*   **Context**: You have a Domain Model, but don't know the tech stack details (e.g., "How to do efficient paging in Spring Boot?").
*   **Prompt**:
    > "I need to implement [Goal]. What are the mature solutions in [Tech Stack]? Please list pros and cons, NO CODE."
*   **Outcome**: You learn the keywords (e.g., "Virtual Scroll", "CQRS"). You make a decision.

## Phase 2: Architect Mode (设计模式)
*   **Goal**: Define the "Blueprint".
*   **Trigger**: You have chosen a solution (e.g., "Use Lazy Loading").
*   **Action**: Write it into the Feature Spec (`features/xxx.md`).
    > **Spec**: "Frontend uses `el-tree`. Strategy: Enable `lazy` prop, implement `load` function for level-0 requests."
*   **Outcome**: A design document that anchors the AI's behavior.

## Phase 3: Worker Mode (工兵模式)
*   **Goal**: Generate production code.
*   **Trigger**: The Spec is ready.
*   **Prompt**:
    > "Based on `@xxx.md`, generate the code. Implement the `load` logic exactly as described."
*   **Outcome**: Precise code generation with minimal hallucinations.

## Summary Matrix

| State | User Input | AI Mode |
| :--- | :--- | :--- |
| **Confused** | "How do I do X?" | **Chat** (Consultant) |
| **Decided** | "We will use Library Y." (Write to Doc) | **Editor** (Architect) |
| **Ready** | "Generate code from Doc." | **Composer** (Worker) |
