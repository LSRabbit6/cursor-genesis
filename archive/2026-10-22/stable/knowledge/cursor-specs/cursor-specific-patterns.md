# Cursor-Specific Prompt Patterns (Cursor 专用提示词模式)

> **描述**: 针对 Cursor IDE 及其 Agent (Claude 3.5 / Gemini 2.5) 特性的高级提示词技巧。
> **用途**: 供 Prometheus 角色参考，用于构建高健壮性的 Rules 和 Agents。

## 1. 强制工具调用 (Forced Tool Invocation)

AI 往往会偷懒，只说“我会读文件”而不真的读。必须使用特定的**停止序列 (Stop Sequence)** 和 **指令 (Instruction)** 来强制执行。

### A. 必须读取文件 (Mandatory Read)
用于 Rule 文件中，确保上下文加载。

```markdown
**CRITICAL INSTRUCTION**:
You cannot proceed without the full content of the following files.
**ACTION REQUIRED**: Immediately execute `read_file` for the paths below.
> **Wait for the tool output before generating any response text.**

Targets:
- `path/to/file1.md`
- `path/to/file2.md`
```

### B. 必须搜索代码 (Mandatory Search)
用于维护类角色，防止瞎猜文件名。

```markdown
**SEARCH PROTOCOL**:
Before proposing a fix, you MUST locate the definition.
1. Execute `codebase_search` with query: "..."
2. Analyze the results.
3. ONLY THEN read the specific file.
> Do not guess file paths. Use the tools.
```

## 2. 上下文锚定 (Context Anchoring)

### A. 显式链接 (Explicit Linking)
在 Pattern 中引用 Capability 时，即使 Rule 已经加载了文件，也要保留物理路径作为“指针”。

```markdown
| Role ID | Capability Source |
| :--- | :--- |
| R1 | `prompts-library/templates/capabilities/01_insight/concept-decoder.md` |
```
*原理*: 强化 Explicit Reference，减少语义漂移。

### B. 伪代码协议 (Pseudo-code Protocols)
Cursor 对 Markdown 代码块中的逻辑遵循度极高。

```markdown
<protocol>
  IF user_input contains "Bug":
    THEN activate_role("FIX")
  ELSE:
    activate_role("TPM")
</protocol>
```

## 3. 认知阻断 (Cognitive Interrupts)

### A. 思考槽 (Thinking Slot)
强制模型在输出结果前进行 CoT 推理。

```markdown
### Phase 1: Reflection <thinking>
(Internal Monologue: Analyze the request, check constraints, plan steps)
...
</thinking>
```

### B. 确认阻断 (Confirmation Gating)
防止 AI 进行破坏性操作。

```markdown
**STOP CONDITION**:
IF the plan involves deleting > 5 files OR overwriting configuration:
  1. STOP execution.
  2. Ask user: "CONFIRM DELETION?"
  3. Wait for explicit "YES".
```

## 4. 文件操作安全 (File Safety)

*   **Always Read Before Write**: 修改文件前必须先读，确保 Context 是最新的。
*   **Atomic Writes**: 尽量一次性写完，避免 "Rest of file..." 这种省略（除非文件巨大）。

