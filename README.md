# cursor-genesis

> **The Human–Agent Development Collaboration Mechanisms Leaf**
> 
> *"Stop writing code. Start engineering how your AI writes code."*

## What is this?

`cursor-genesis` (CG) is the **Human–Agent Development Collaboration Mechanisms Leaf**: it studies and publishes human operation entry points, context assembly, Rule / Skill / Workflow selection, agent/model/tool invocation, deterministic guards, human gates, and capability composition, injection, distribution, and refinement.

CG is tool-independent. Cursor remains:

1. a **founding sample** whose history and design rationale are preserved;
2. a **reference implementation** from which Rules, multi-model entry points, explicit commands, Agent modes, and project-context mechanisms are generalized;
3. a **non-core platform** with no long-term compatibility promise and no role as CG's runtime dependency.

In short: **Cursor keeps its textbook role, not a constitutional role.**

Current stable assets are primarily Rules, Skills, Commands, Agent/Capability definitions, Patterns, Atoms + Packs, knowledge guides, and backflow mechanisms. `create-skill-workflow`, `create-subagent-workflow`, `create-command-workflow`, and `create-rule-workflow` now provide persisted gates/retries and machine Validators. Rule Contracts register into the project `AGENTS.md` author source; Cursor activation frontmatter remains an adapter concern. `audit-agent-assets` provides read-only, evidence-based review with Agent judgment, while `harvest-session` provides tool-neutral session-outcome triage; neither is represented as a machine Validator. Agent and Command Contracts stay tool-neutral while concrete model IDs, slash-command formats, and invocation syntax stay in host adapters. Additional Workflows, a generalized Validator framework, Hooks, and versioned runtime contracts remain planned.

CG mechanisms may be consumed during project initialization, but CG does not own concrete project-directory creation, personal workspace registration, or end-to-end workspace bootstrap.

When configuring AI for large-scale enterprise software (e.g., 50+ modules, tens of thousands of lines of code), default AI behavior degrades: it hallucinates architectures, relies too much on legacy patterns, and loses context. 

Instead of writing manual prompts for every module, CG crystallizes robust Human–Agent working mechanisms into an **Atom** and packages compatible atoms into a **Pack** for projects or peer Leaves to inject primarily during init/build. Existing `.mdc` assets are Cursor-format reference implementations, not the definition of the Atom model.

## 三分钟：装了之后你的 harness 会多什么（中文）

你已经会用 Claude Code / Codex / Cursor 把东西做出来。这个仓补的是**做出来的东西该长什么样、怎么判它做对没**——这一层不在 harness 里，在这里。

- 第一份面向外部使用者的包：[`delivery-data-app`](stable/packs/delivery-data-app/README.md)（v0.1）——产物规范 + 信息架构规范 + 收工机器检查器 + 领域清单入口 + 设计稿六段模板。给「会用 harness、不懂产品设计」的人。
- 装法（在你的项目根目录）：

```bash
git clone --filter=blob:none --sparse https://github.com/SYMlp/cursor-genesis.git .cursor-genesis
cd .cursor-genesis && git sparse-checkout set stable/packs/delivery-data-app scripts && cd ..
python .cursor-genesis/scripts/install-pack.py delivery-data-app . --source .cursor-genesis
```

- 安装后先接入项目约定和宿主入口：把 `.agents/rules/data-app-norms.AGENTS-snippet.md` 那几行贴进你项目的 `AGENTS.md`；Claude Code 用户把 `.agents/adapters/claude-code/settings.hooks.json` 里的 Stop hook 并进 `.claude/settings.json`。自动触发还须核实宿主实际加载与执行；其他宿主先按包说明手动运行检查器，不能由这份 Claude Code 配置推断已接通。
- 然后说「选领域」。清单告诉你我们在你的领域有什么、你要备哪些材料；没有你的领域就走空白领域流程，把它让你填的材料清单贴回 issue——那是下一章该写什么的唯一依据。
- 此公开包提供规范与操作面；包内静态技能不联网，具体项目的推演在你自己的 harness 里跑。

## 先看整体，再看两端（中文）

[双视角交互图](docs/collaboration-map.html) · [完整架构说明](docs/architecture.md) · [运行协作工作台](docs/collaboration-workbench.md) · [独立部署](docs/self-hosting.md) · [多 harness 接入](docs/harness-api.md)

一张总图，下面按六个环节对齐 **CG 供给 / 维护侧** 与 **使用者的 AI / 本地项目**：谁提供什么、怎样接入、怎样证明做对、问题如何回流。交互图下载后可直接在浏览器中离线打开；GitHub 上可读架构文档中的 Mermaid 图与对照表。

现在还提供可运行的协作工作台：整体架构图下面对齐两端职责，支持自查提交、回执、反馈、维护处理、包下载与执行证据。身份由 CG 自己管理，harness 通过 HTTP / Python CLI 使用各自项目令牌；不要求 ChatGPT 或任何模型平台账号。运行方式见上面的工作台文档。此实现与下游旧菜单部署相互独立；安装文件、宿主加载、自动触发和检查通过分别记录。

## Proven Assets: Enterprise Meta-Rules

Extracted from a real-world enterprise system delivery (6 domains, 50+ modules, zero to acceptance in 2 weeks), this repository still physically contains meta-rules that govern how an Agent should behave in a massive codebase. In KG, the enterprise-delivery concern has already been logically split from CG; the physical assets remain here until a later, separately approved triage or move.

Located in `stable/atoms/rules/enterprise/`:

1. **`design-authority.mdc` (Design is Authority)**
   Strictly forbids the agent from scanning legacy code to guess architecture patterns. It mandates that the Agent must read the Domain Ontology and declarative configs first, saving 60%+ in wasted, hallucinatory token reads.

2. **`routing-engine.mdc` (Intent-Based Route Engine)**
   Automatically intercepts vague natural language inputs (e.g., "the dropdown is empty") and routes them into deterministic diagnostic and file-reading pipelines. 

3. **`ontology-driven-dev.mdc` (ODD Paradigm)**
   A structured pipeline governing how the Agent should extract entity boundaries from PM specification documents, map them into a `model.yaml`, and deterministically generate code without missing fields.

4. **`rule-evolution.mdc` (Agent Self-Evolution)**
   A closed-loop system constraint. Whenever the AI detects its own behavior or cognitive path was suboptimal, it must document the failure, analyze the root cause, and rewrite its own rules to prevent future mistakes.

## Provenance & Validation Status

These meta-rules are **not theoretical**. They were extracted and generalized from a real production enterprise system (a 50+ module, full-stack Java + Vue 3 platform) delivered from zero to acceptance review in ~2 weeks — and the same workflow is still in active use in my current work.

| Rule | Origin | Production Validation |
|:---|:---|:---|
| `design-authority` | Discovered after observing 60%+ wasted token reads from legacy code scanning | Eliminated architecture drift across 50+ modules |
| `routing-engine` | Evolved through 5 documented optimization rounds with quantified before/after metrics | Reduced diagnostic file reads from 9+ to 4-6; search operations from 5+ to 0-1 |
| `ontology-driven-dev` | Created after measuring 35% field omission rate in first ontology extraction | Brought omission rate to near-zero across all modules |
| `rule-evolution` | Meta-rule created to prevent recurring behavioral failures | 5 optimization records with full root-cause analysis |

The generalized mechanisms can inform Human–Agent collaboration across tools. Their existing Cursor-format distribution remains a reference path; backflow from real adoption continues to refine the tool-independent mechanism.

## Architecture

This repository is split into two layers:

### 1. Atoms (`stable/atoms/`)
The smallest reusable units of AI cognition. Context-agnostic.
- `rules/enterprise/`: **Enterprise Meta-Rules** — the core governance system (4 rules)
- `rules/`: Additional base rules (production safety, project conventions)
- `capabilities/`: Four-layer cognition bounds (insight, architecture, engineering, quality)
- `patterns/`: Team orchestration templates (6 team patterns)
- `validators/`: Machine-verifiable contracts with runnable, stdlib-only validators (first entry: `state-header`, a truth-source staleness referee backflowed from a production personal workbench)

### 2. Packs (`stable/packs/`)
User-facing scenario combinations. Users don't pick atoms; they install packs.
- **`enterprise/`**: **Enterprise ODD Pack** — Meta-Rules + Ontology-Driven Development methodology, validated on a 50+ module production system. [→ View Pack](stable/packs/enterprise/README.md)
- `v1-talk/`: A conversational orchestration pack with 6 team patterns.
- `deep-research/`: A Plan → Execute → Synthesize research workflow.
- `knowledge-manage/`: Knowledge system management pack.
- `create-toolkit/`: Project scaffolding toolkit.
- **`delivery-data-app/`**: **Delivery · Data App Pack** (v0.1) — product norms + information-architecture norms + a stdlib validator mounted at the Stop hook + a domain-menu skill + a six-section design-doc template, for people who can run a harness but have never designed a product. [→ View Pack](stable/packs/delivery-data-app/README.md)
- **`second-loop-compounding/`**: **Second-Loop Compounding Pack** (v0.1) — the loop outside execute ⇄ verify: once a task is done, a one-page retrospective template, a per-person relationship-line template, a Claude → Codex content-handoff + receipt template pair, a framework summary, a seven-state "is this design actually in use" rubric, and call notes for the probes that show whether the loop really turns. Templates live here; the running pieces stay in the workbench. [→ View Pack](stable/packs/second-loop-compounding/README.md)

## Current Cursor Reference Usage

The repository still supports injecting its existing Cursor-format assets with Git sparse-checkout. This documents current assets; it is not a promise that Cursor remains a core platform or long-term compatibility target.

```bash
# In your new project's root directory:
git clone --filter=blob:none --sparse https://github.com/LSRabbit6/cursor-genesis.git .cursor-genesis
cd .cursor-genesis

# Option A: Inject the full enterprise pack (meta-rules + ODD methodology)
git sparse-checkout set stable/packs/enterprise stable/atoms/rules/enterprise

# Option B: Inject only the 4 meta-rules
git sparse-checkout set stable/atoms/rules/enterprise

# Copy the rules to your local cursor directory
cp -r stable/atoms/rules/enterprise/* ../.cursor/rules/
```

See [`stable/packs/enterprise/README.md`](stable/packs/enterprise/README.md) for the full ODD methodology guide and setup instructions.

## The Vision

CG aims to turn hard-to-understand Agent capabilities into Human–Agent operating mechanisms that are easy to understand, trigger, compose, validate, correct, and distribute—without letting any one tool's file format define the domain.

---
*Built for the future of AI-native engineering.*
