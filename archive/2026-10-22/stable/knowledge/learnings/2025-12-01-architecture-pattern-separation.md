---
title: Architecture Evolution - The "Neuron-Hook-Logic" Triad
date: 2025-12-01
tags: [architecture, patterns, refactoring, prometheus]
---

# Learning Record: The "Neuron-Hook-Logic" Architecture

## 📅 Context
During the refactoring of the **Strategic Research Team (SRA)**, we identified a critical flaw in the "Monolith Pattern" approach. Initially, we over-simplified the Pattern file, stripping away business logic in favor of pure role loading. This led to a "brain-dead" orchestrator that knew *who* to call but not *what* to do.

## 💡 The Core Insight (The Triad)
We crystallized a 3-layer architecture that defines the "Team Genesis Protocol":

### 1. Capabilities = Neurons (Static Potential)
*   **Definition**: Atomic role files (`capabilities/**/*.md`).
*   **Function**: Defines "Who am I?" and "What are my biases?".
*   **Insight**: These must be comprehensive but **context-agnostic**. Like neurons in a brain, they wait to be activated. They don't know about the workflow, only their craft.

### 2. Rules = Hooks (Kinetic Trigger)
*   **Definition**: Cursor rules (`.cursor/rules/**/*.mdc`).
*   **Function**: Defines "When do I wake up?".
*   **Insight**: These are the sensory organs. They use file globs or semantic intent to detect the need for a specific team. They are the bridge between the IDE context and the AI Agents.

### 3. Patterns = Business Logic (Dynamic Execution)
*   **Definition**: Orchestrator files (`templates/patterns/**/*.md`).
*   **Function**: Defines "How do we dance?".
*   **Insight**: This is where the **SOP (Standard Operating Procedure)** lives. It dictates the flow, the state machine, the interaction continuity, and the specific outputs. **A Pattern is not just a loader; it is a Playbook.**

## 🔄 The Evolution
*   **Before**: SRA was a monolith (Roles + Logic mixed) or an empty shell (Roles only).
*   **After**: SRA is now a **Rich Orchestrator**. It references atomic capabilities (Neurons) but contains a detailed `Interaction Workflow` (Logic).

## 🚀 Action Items (Completed)
1.  Refactored SRA roles into `capabilities/product/` and `capabilities/testing/`.
2.  Restored deep business logic (Pre-mortem, EARS syntax) into `strategic-research-team.md`.
3.  Updated `Prometheus` (The Meta-Architect) to enforce this "Atomic Design Rule" for all future teams.

