# Intent — genesis_manager

**ID**: INT-001
**Version**: 0.2.0
**Date**: 2026-03-16
**Status**: Approved

---

## The Problem

Abiogenesis drives software construction autonomously. The person supervising that work has no clean surface to understand what is being built, trust its current state, or steer it deliberately.

The supervision gap exists at the **abiogenesis layer** — not at any specific methodology built on top of it. Any project managed by abiogenesis (whether using genesis_sdlc, a custom GTL spec, or a bespoke graph) has the same observability problem.

---

## The Intent

Build a **builder supervision console** — the control surface for a person supervising any abiogenesis-managed project.

The primary user is:
- supervising one or more projects managed by abiogenesis
- usually focused on one project at a time
- needing to understand the project's structure, current state, and what requires attention
- approving human gates, reviewing evidence, and occasionally steering

The product must answer these questions at any moment:

1. What is this project building? (the GTL spec — assets, edges, evaluators)
2. How far has it gotten? (convergence state per edge)
3. What is blocked, wrong, or uncertain? (failing evaluators, stuck edges)
4. What does the engine want to do next? (next dispatched job)
5. What does the engine need from me right now? (pending human gates)
6. Why should I trust its current status? (event history, evaluator evidence)
7. What changed since I last looked? (event stream delta)
8. Is this ready to ship? (full convergence, UAT state)

---

## Architectural Scope

genesis_manager is an **abiogenesis observer** — it reads the canonical abiogenesis workspace and renders it. It is NOT genesis_sdlc-specific.

The abiogenesis layer defines:
- **Workspace layout**: `.ai-workspace/events/events.jsonl`, `features/`, `fp_manifests/`, `fp_results/`, `reviews/`
- **Project config**: `.genesis/genesis.yml` → resolves the GTL Package and Worker
- **GTL Package**: the graph topology — Package, Assets, Edges, Jobs, Evaluators, Requirements
- **Event types**: `edge_started`, `fp_dispatched`, `fp_assessment`, `fh_gate_pending`, `review_approved`, `edge_converged`, `bug_fixed`, etc.
- **Gap report**: `gen gaps` output — delta per edge, failing/passing evaluators

genesis_manager works over any project that has a `.genesis/genesis.yml` and `.ai-workspace/`.

---

## What genesis_manager Surfaces

### Layer 1 — Project Structure (from GTL spec)
The GTL Package is the project's constitution. Surface it first:
- Graph topology: assets and edges
- Per-edge: evaluators (F_D / F_P / F_H), convergence criteria, context constraints
- Requirements registry: all REQ-* keys defined in the Package

### Layer 2 — Convergence State (from gen gaps)
- Delta per edge (0 = converged, >0 = work needed)
- Which evaluators are passing / failing
- Overall project convergence

### Layer 3 — Event Stream (from events.jsonl)
- Chronological event history
- Gate events pending human action
- F_P dispatches in flight
- What changed since the last session

### Layer 4 — Feature Vectors (from .ai-workspace/features/)
- Active and completed features
- REQ key coverage (which spec keys are satisfied)
- Per-feature trajectory through the graph

### Layer 5 — Control Surface
- Approve / reject human gates
- Trigger gen-start or gen-iterate (via subprocess)
- Surface proxy-log decisions for human review

---

## Core Product Invariant

**Every visible technical identifier is a navigation handle into deeper context.**

REQ keys, feature IDs, edge names, event IDs — all are clickable addresses into canonical detail pages.

---

## Technology

- **Frontend**: React + Vite + TypeScript, Tailwind CSS, Radix UI
- **Backend**: Express server — reads workspace from filesystem, runs genesis commands
- **Data sources**: `.genesis/genesis.yml`, GTL Package (Python import via subprocess), `.ai-workspace/events.jsonl`, feature YAMLs, gap report (gen gaps)
- **Testing**: Vitest (unit), Playwright (e2e)

---

## Prior Art

A substantial implementation exists at `ai_sdlc_method/projects/genesis_manager/imp_react_vite/`. That implementation assumed a genesis_sdlc-specific domain model. This project refactors from the abiogenesis layer up — the domain model is the GTL Package, not any specific methodology built on top of it.

---

## What This Is Not

- Not gsdlc-specific (works over any abiogenesis project)
- Not a PM dashboard
- Not a methodology teaching tool
- Not a raw log viewer
