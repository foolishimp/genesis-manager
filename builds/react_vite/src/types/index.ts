// Implements: REQ-F-WS-001, REQ-F-WS-002, REQ-F-SPEC-001, REQ-F-STATE-001
// Implements: REQ-F-EVT-001, REQ-F-FEAT-001, REQ-F-GATE-001, REQ-F-CTL-001
// Implements: REQ-F-TRUST-001, REQ-F-DRIFT-001, REQ-F-NAV-001, REQ-F-UX-001

// ── Workspace ────────────────────────────────────────────────────────────────

export interface WorkspacePath {
  name: string
  path: string
  genesis_yml_path: string
}

// ── Domain model (sourced from kernel) ───────────────────────────────────────
// REQ-F-WS-001, REQ-F-WS-002

export interface DomainAsset {
  name: string
  markov: string[]
}

export interface DomainEdge {
  source: string
  target: string
  evaluators: string[]
}

export interface DomainModel {
  kernel_version: string
  source_mode: 'fd_describe' | 'fp_synthesized'
  spec_hash: string
  config_drift: ConfigDrift | null
  package: {
    name: string
    assets: DomainAsset[]
    edges: DomainEdge[]
    requirements: string[]
  }
}

// ── Gap report ────────────────────────────────────────────────────────────────
// REQ-F-STATE-001

export interface EdgeGap {
  edge: string
  delta: number
  failing: string[]
  passing: string[]
}

export interface GapReport {
  total_delta: number
  per_edge: EdgeGap[]
  timestamp: string
}

// ── Events ───────────────────────────────────────────────────────────────────
// REQ-F-EVT-001

export interface WorkspaceEvent {
  seq: number
  event_type: string
  event_time: string
  feature?: string
  edge?: string
  data: Record<string, unknown>
}

export interface EventsResponse {
  total: number
  events: WorkspaceEvent[]
  next_seq: number
}

// ── Feature vectors ───────────────────────────────────────────────────────────
// REQ-F-FEAT-001

export interface FeatureVector {
  id: string
  status: 'active' | 'completed'
  satisfies: string[]
  dependencies: string[]
  yaml_text: string
}

// ── Gate ─────────────────────────────────────────────────────────────────────
// REQ-F-GATE-001

export type GateState = 'pending' | 'approved' | 'rejected' | 'superseded'

export interface PendingGate {
  edge: string
  feature: string | null
  criteria: string[]
  eventTime: string
  state: GateState
}

// REQ-F-GATE-005: proxy decisions surfaced for human review
export interface ProxyDecision {
  edge: string
  feature: string | null
  decision: 'approved' | 'rejected'
  eventTime: string
  proxyLog: string | null
}

// ── Engine state ──────────────────────────────────────────────────────────────
// REQ-F-CTL-001, REQ-F-UX-001

export interface NextAction {
  edge: string
  requiresHuman: boolean
  requiresFp: boolean
  blockingFd: string[]
}

export type EngineState =
  | { status: 'running'; edge: string }
  | { status: 'next'; action: NextAction }
  | { status: 'blocked'; edge: string; blockingEvaluators: string[] }
  | { status: 'converged' }
  | { status: 'idle' }

// ── Trust / drift signals ─────────────────────────────────────────────────────
// REQ-F-TRUST-001, REQ-F-DRIFT-001

export interface ConfigDrift {
  declared: string
  actual: string
  description: string
}

export interface InstallChurn {
  count: number
  lastInstallTime: string
}

// ── Navigation ────────────────────────────────────────────────────────────────
// REQ-F-NAV-001

export type FocusedEntity =
  | { type: 'req'; key: string }
  | { type: 'edge'; name: string }
  | { type: 'event'; seq: number }
  | { type: 'feature'; id: string }
  | { type: 'evaluator'; name: string; edge: string }

// ── FP results ────────────────────────────────────────────────────────────────

export interface FpAssessment {
  evaluator: string
  result: 'pass' | 'fail'
  evidence: string
}

export interface FpResult {
  edge: string
  assessments: FpAssessment[]
  manifest_path: string
  result_path: string
}

// ── Component prop interfaces (from ADR-003) ──────────────────────────────────

export interface WorkspaceSelectorProps {
  onSelect: (workspace: WorkspacePath) => void
  recent: WorkspacePath[]
  scanRoot?: string
}

export interface ProjectDashboardProps {
  workspacePath: string
  domain: DomainModel
  refreshIntervalMs: number
}

export interface EngineStateBarProps {
  state: EngineState
}

export interface GateCardProps {
  gate: PendingGate
  onApprove: (reason?: string) => void
  onReject: (reason: string) => void
}

export interface EventListProps {
  events: WorkspaceEvent[]
  watermarkSeq: number
  onMarkSeen: () => void
  filter?: { type?: string; edge?: string; since?: string; until?: string }
}

export interface TrustBarProps {
  lastGapsTime: Date | null
  lastEventTime: Date | null
  sourceMode: 'fd_describe' | 'fp_synthesized'
  staleAssessmentCount: number
}

export interface DriftBannerProps {
  configDrift: ConfigDrift | null
  installChurn: InstallChurn | null
  layoutInconsistencies: string[]
}

// ── Workspace registration + summary ─────────────────────────────────────────
// REQ-F-WS-003, REQ-F-WS-004

export interface WorkspaceSummary {
  workspaceId: string
  projectName: string
  activeFeatureCount: number
  pendingGateCount: number
  stuckFeatureCount: number
  hasAttentionRequired: boolean
  available: boolean
  lastEventTimestamp: string | null
}

// ── Filesystem browser ────────────────────────────────────────────────────────
// REQ-F-WS-005

export interface FsEntry {
  name: string
  absolutePath: string
  hasWorkspace: boolean
}

export interface FsBrowseResult {
  path: string
  parent: string | null
  entries: FsEntry[]
  truncated: boolean
}

// ── API response types ────────────────────────────────────────────────────────

export interface WorkspaceInfo {
  id: string
  name: string
  path: string
  last_event_time?: string
  gate_count?: number
}

export interface ControlStartRequest {
  flags: string[]
}

export interface EmitEventRequest {
  type: string
  data: Record<string, unknown>
}
