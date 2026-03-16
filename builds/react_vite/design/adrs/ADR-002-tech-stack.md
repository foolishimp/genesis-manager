# ADR-002 — Tech Stack

**Status**: Accepted
**Date**: 2026-03-17
**Implements**: All features (cross-cutting)

---

## Decision

**Frontend**: React 18 + Vite + TypeScript
**Styling**: Tailwind CSS + Radix UI primitives
**Graph visualisation**: React Flow (nodes = assets, edges = transitions)
**Unit tests**: Vitest + React Testing Library
**E2E tests**: Playwright

**Backend**: Node.js + Express
**Subprocess**: Node `child_process.spawn` for genesis commands
**Streaming**: Server-Sent Events (SSE) for live process output
**File reads**: Node `fs` — synchronous for small files, streaming for events.jsonl > 1000 lines

**Language**: TypeScript throughout (frontend and backend share type definitions
for the domain model JSON shape, gap report shape, and event schema)

---

## Rationale

React + Vite: standard, fast cold-start, first-class TypeScript. Matches prior art.

Tailwind + Radix UI: utility-first styling with accessible primitives. Radix handles
keyboard navigation and ARIA for the gate queue and modal dialogs without custom
implementation.

React Flow: purpose-built for graph topology visualisation. Assets as nodes, edges
as connections. Supports custom node renderers for markov condition display.

Vitest: co-located with Vite, runs in < 1s for unit tests. No Jest config overhead.

Playwright: browser-level e2e needed for UAT-001–013; jsdom cannot test SSE streams
or real subprocess invocation from the browser.

Express: minimal, well-understood. The backend is a thin adapter layer — no framework
features needed beyond routing and middleware.

SSE over WebSocket: gen-start runs are bounded in time (minutes, not hours). SSE is
unidirectional (server → client), sufficient for process output streaming, simpler
than WebSocket handshake and reconnect handling.

---

## Shared Type Definitions

Shared types live in `builds/react_vite/src/types/` and are imported by both
frontend components and the Express server (compiled together by Vite build).

Key shared types:
- `DomainModel` — normalised package/worker shape from WS-009 contract (see ADR-001)
- `GapReport` — gen gaps JSON output shape
- `WorkspaceEvent` — single events.jsonl entry
- `FeatureVector` — parsed feature YAML
- `GateState` — derived gate lifecycle state (pending | approved | rejected | superseded)
- `NextAction` — next-action preview shape (edge, requiresHuman, requiresFp, blockingFd)
