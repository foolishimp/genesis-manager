# ADR-001 — Backend API and Transport Contract

**Status**: Accepted
**Date**: 2026-03-17
**Implements**: REQ-F-WS-001–016, REQ-F-STATE-001–004, REQ-F-EVT-001–007,
               REQ-F-CTL-001–007, REQ-F-GATE-003–004, REQ-F-GATE-009 (removed from spec),
               REQ-F-UX-001, REQ-F-UX-004, REQ-F-ERR-004

---

## Decision

The Express server is the sole process that touches the filesystem and invokes genesis
commands. The React frontend reads all workspace data through the API. The frontend
never reads files directly.

---

## API Endpoints

### Workspace discovery

```
GET /api/workspaces?root={path}
```
Walks the filesystem from `root`, finds all directories containing `.genesis/genesis.yml`.
Returns: `[{name, path, genesis_yml_path}]`

```
GET /api/workspace/:id/domain
```
Sources the domain model for the given workspace. Tries `gen describe --workspace {path}`
first (F_D path). If that exits non-zero or the command is absent, falls back to reading
`.genesis/gtl/core.py` and `gtl_spec/packages/<slug>.py` and synthesising the model (F_P
path). Caches result keyed on kernel version string; invalidates when version changes.

Response shape (identical from both paths):
```json
{
  "kernel_version": "0.1.5",
  "source_mode": "fd_describe | fp_synthesized",
  "package": {
    "name": "...",
    "assets": [...],
    "edges": [...],
    "evaluators": {...},
    "requirements": [...]
  },
  "worker": { "id": "...", "jobs": [...] }
}
```

### Gap state

```
GET /api/workspace/:id/gaps
```
Runs `PYTHONPATH=.genesis python -m genesis gaps --workspace {path}` and returns the
parsed JSON. Includes `per_edge` array with `{edge, delta, failing, passing}`.
On command failure: returns `{error: true, returncode, stderr}` — never returns stale
state as current.

### Event stream

```
GET /api/workspace/:id/events?since={seq}&type={event_type}&limit={n}
```
Reads `.ai-workspace/events/events.jsonl`. Returns events with `seq > since` (sequence
numbers assigned by read order, 0-indexed). Limit defaults to 200. Supports type filter.
For files > 1000 events: always paginated; total count included in response envelope.

Response:
```json
{ "total": 4821, "events": [...], "next_seq": 4821 }
```

### Feature vectors

```
GET /api/workspace/:id/features
```
Reads all `.yml` files from `.ai-workspace/features/active/` and `features/completed/`.
Returns `[{id, status, satisfies, dependencies, yaml_text}]`.

### Control operations

```
POST /api/workspace/:id/control/start
Body: { "flags": ["--auto"] | ["--auto", "--human-proxy"] | ["--edge", "E"] | ["--feature", "F"] }
```
Spawns `PYTHONPATH=.genesis python -m genesis start {flags} --workspace {path}` as a
subprocess. Rejects with 409 if a process is already running for this workspace.
Streams stdout+stderr via SSE on a companion endpoint:

```
GET /api/workspace/:id/control/start/stream  (SSE)
```
Client subscribes before or immediately after POST. Events: `{type: "output", data: "line"}`,
`{type: "done", exitCode: N}`. Output retained server-side until next invocation.

```
POST /api/workspace/:id/control/emit
Body: { "type": "fp_assessment | review_approved | review_rejected | ...", "data": {...} }
```
Calls `python -m genesis emit-event --type {type} --data '{json}'`. Validates `type`
against known event schema before passing to subprocess. For `fp_assessment`, enforces
`spec_hash` present in data. For `review_rejected`, enforces `reason` present in data.

Gate payloads:
- Approve: `{ type: "review_approved", data: { feature, edge, actor: "human", reason?: "..." } }`
- Reject:  `{ type: "review_rejected", data: { feature, edge, actor: "human", reason: "..." } }`

```
GET /api/workspace/:id/fp-results
```
Lists files in `.ai-workspace/fp_results/`. For each, returns manifest link (matching
file in `.ai-workspace/fp_manifests/`) and parsed evaluator results.

---

## Refresh Mechanism

Gap state and events are polled by the frontend. Default interval: 10 seconds.
Interval is configurable per-project (stored in localStorage under
`genesis-manager.{workspace_id}.refresh_interval_ms`). Last-updated timestamp
shown in the UI header.

Process output (gen-start / gen-iterate) uses SSE rather than polling — the subprocess
lifetime is bounded and the stream closes naturally on exit.

---

## Session Watermark Persistence

The event-stream read watermark (which events the operator has seen) is stored in
`localStorage` under `genesis-manager.{workspace_id}.watermark` as a sequence number.
It is updated only on explicit operator action ("mark as seen") or on tab focus if
the operator has not interacted with the event view in the current session.
It is never updated automatically while the operator is actively reading.

Project recency list (`REQ-F-WS-011`) stored under `genesis-manager.recent_projects`
as an ordered array of `{name, path}` capped at 10 entries.

---

## Consequences

- Frontend is purely a rendering layer; no filesystem access, no genesis subprocess calls.
- SSE for process output avoids polling overhead during long-running gen-start loops.
- Polling for gap state and events is simpler than WebSocket and sufficient for the
  refresh-on-demand supervision use case.
- localStorage for watermark and recency: acceptable for a local-first tool; no server
  session state needed.
