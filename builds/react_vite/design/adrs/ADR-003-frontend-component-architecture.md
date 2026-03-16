# ADR-003 — Frontend Component Architecture

**Status**: Accepted
**Date**: 2026-03-17
**Implements**: FT-WS-001/002, FT-SPEC-001, FT-STATE-001, FT-EVT-001, FT-FEAT-001,
               FT-GATE-001, FT-CTL-001, FT-TRUST-001, FT-DRIFT-001, FT-NAV-001,
               FT-UX-001, FT-UAT-001

---

## Component Tree

```
App
├── WorkspaceSelector          — FT-WS-001/002 (project discovery, recency list)
│   ├── ProjectList            — name, path, delta badge, gate badge, last event time
│   └── FilesystemBrowser      — traverse dirs to locate .genesis/genesis.yml
│
└── ProjectDashboard           — loaded project root
    ├── TrustBar               — FT-TRUST-001/002 (last gaps time, source_mode, stale count)
    ├── DriftBanner            — FT-DRIFT-001–003 (config mismatch, install churn)
    ├── EngineStateBar         — FT-CTL-005/007, FT-UX-005 (RUNNING / NEXT / BLOCKED)
    │
    ├── GraphTopologyView      — FT-SPEC-001/006 (React Flow: assets + edges)
    │   └── EdgeDetailPanel    — FT-SPEC-003/004 (evaluators, F_D/F_P/F_H, criteria)
    │
    ├── ConvergencePanel       — FT-STATE-001–005
    │   └── EvaluatorResult    — verbatim stdout/stderr for F_D failures
    │
    ├── GateQueue              — FT-GATE-001–008 (INTENT Q5)
    │   ├── GateCard           — criteria, approve/reject buttons, proxy-log link
    │   └── ProxyDecisionCard  — FT-GATE-005/006 (override proxy decisions)
    │
    ├── ControlSurface         — FT-CTL-001–004
    │   ├── StartPanel         — flag selector (--auto, --human-proxy, --edge, --feature)
    │   ├── ProcessOutput      — SSE stream, retained until next run
    │   └── FpDispatchViewer   — in-flight dispatches, result evidence
    │
    ├── EventStream            — FT-EVT-001–007
    │   ├── EventList          — chronological, new-since-watermark highlighted
    │   ├── EventDetail        — full payload modal/panel
    │   └── WatermarkControl   — "mark all seen" action, unread badge
    │
    ├── FeaturePanel           — FT-FEAT-001–005
    │   ├── CoverageBar        — covered/uncovered REQ keys
    │   └── FeatureDetail      — full YAML, linked events, evaluator results
    │
    └── NavHandles             — FT-NAV-001–005 (shared, used by all panels)
        └── NavLink            — clickable REQ key / edge / event / feature / evaluator
```

---

## Key Component Interfaces

### WorkspaceSelector
```typescript
interface WorkspaceSelectorProps {
  onSelect: (workspace: WorkspacePath) => void;
  recent: WorkspacePath[];           // from localStorage, max 10
  scanRoot?: string;                 // configurable root for filesystem scan
}
```

### ProjectDashboard
```typescript
interface ProjectDashboardProps {
  workspacePath: string;
  domain: DomainModel;               // sourced via FT-WS-001 acquisition paths
  refreshIntervalMs: number;         // configurable, default 10000
}
```

### EngineStateBar
```typescript
type EngineState =
  | { status: 'running'; edge: string }
  | { status: 'next'; action: NextAction }
  | { status: 'blocked'; edge: string; blockingEvaluators: string[] };

interface EngineStateBarProps {
  state: EngineState;
}
```

### GateCard
```typescript
interface GateCardProps {
  gate: PendingGate;                 // derived from fh_gate_pending event
  onApprove: (reason?: string) => void;
  onReject: (reason: string) => void;  // reason required
}

interface PendingGate {
  edge: string;
  feature: string | null;
  criteria: string[];
  eventTime: string;
  state: 'pending' | 'approved' | 'rejected' | 'superseded';  // FT-GATE-007
}
```

### EventList
```typescript
interface EventListProps {
  events: WorkspaceEvent[];
  watermarkSeq: number;              // events with seq > watermark are "new"
  onMarkSeen: () => void;
  filter?: { type?: string; edge?: string; since?: string; until?: string };
}
```

### TrustBar
```typescript
interface TrustBarProps {
  lastGapsTime: Date | null;
  lastEventTime: Date | null;
  sourceMode: 'fd_describe' | 'fp_synthesized';
  staleAssessmentCount: number;      // fp_assessments with mismatched spec_hash
}
```

### DriftBanner
```typescript
interface DriftBannerProps {
  configDrift: ConfigDrift | null;   // genesis.yml vs declared build root mismatch
  installChurn: InstallChurn | null; // >2 genesis_installed events
  layoutInconsistencies: string[];   // missing dirs after convergence events
}
```

---

## Data Flow

All workspace data flows through the Express API (ADR-001). The frontend has no
direct filesystem access.

Polling loop (managed in `ProjectDashboard`):
1. Every N ms: fetch `/api/workspace/:id/gaps` → update ConvergencePanel, EngineStateBar
2. Every N ms: fetch `/api/workspace/:id/events?since={lastSeq}` → append to EventList
3. On project load: fetch `/api/workspace/:id/domain` → domain model (cached)
4. On project load: fetch `/api/workspace/:id/features` → FeaturePanel

Process output (ControlSurface):
- POST `/api/workspace/:id/control/start` to spawn
- SSE `/api/workspace/:id/control/start/stream` → ProcessOutput component

---

## Navigation Handle Pattern

`NavLink` wraps any technical identifier (REQ-*, edge name, event ID, feature ID,
evaluator name) in a clickable element that opens the corresponding detail panel.
Implemented as a context-aware link — no URL routing; panel state managed in
`ProjectDashboard` via a `focusedEntity` state:

```typescript
type FocusedEntity =
  | { type: 'req'; key: string }
  | { type: 'edge'; name: string }
  | { type: 'event'; seq: number }
  | { type: 'feature'; id: string }
  | { type: 'evaluator'; name: string; edge: string };
```

---

## Provenance Display (FT-WS-002)

When `domain.source_mode === 'fp_synthesized'`, `TrustBar` renders an amber banner:
"Domain model synthesised from kernel source — not zero-interpretation". The graph
and all panels remain fully functional; only the trust signal changes.

---

## Ready-to-Ship Gate (FT-DRIFT-004)

`ProjectDashboard` derives `isReadyToShip`:
```
isReadyToShip = gapReport.total_delta === 0
  && driftBanner.configDrift === null
  && driftBanner.layoutInconsistencies.length === 0
  && trustBar.staleAssessmentCount === 0
```
CONVERGED status only shown when all four conditions are true.
