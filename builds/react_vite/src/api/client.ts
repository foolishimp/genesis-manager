// Implements: REQ-F-WS-001, REQ-F-STATE-001, REQ-F-EVT-001, REQ-F-FEAT-001
// Implements: REQ-F-CTL-001, REQ-F-GATE-003, REQ-F-ERR-004

import type {
  WorkspaceInfo,
  WorkspaceSummary,
  FsBrowseResult,
  DomainModel,
  GapReport,
  EventsResponse,
  FeatureVector,
  FpResult,
  ControlStartRequest,
  EmitEventRequest,
} from '../types'

const BASE = '/api'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

// ── Workspace discovery ───────────────────────────────────────────────────────
// REQ-F-WS-001

export function listWorkspaces(root?: string): Promise<WorkspaceInfo[]> {
  const q = root ? `?root=${encodeURIComponent(root)}` : ''
  return get(`/workspaces${q}`)
}

// ── Workspace registration + summaries ────────────────────────────────────────
// REQ-F-WS-003, REQ-F-WS-004

export function getWorkspaceSummaries(paths: string[]): Promise<WorkspaceSummary[]> {
  return post('/workspaces/summaries', { paths })
}

// ── Filesystem browser ────────────────────────────────────────────────────────
// REQ-F-WS-005

export function browsePath(path?: string): Promise<FsBrowseResult> {
  const q = path ? `?path=${encodeURIComponent(path)}` : ''
  return get(`/fs/browse${q}`)
}

// ── Domain model ──────────────────────────────────────────────────────────────
// REQ-F-WS-001, REQ-F-WS-002

export function getDomain(id: string): Promise<DomainModel> {
  return get(`/workspace/${encodeURIComponent(id)}/domain`)
}

// ── Gap state ─────────────────────────────────────────────────────────────────
// REQ-F-STATE-001

export function getGaps(id: string): Promise<GapReport> {
  return get(`/workspace/${encodeURIComponent(id)}/gaps`)
}

// ── Event stream ──────────────────────────────────────────────────────────────
// REQ-F-EVT-001, REQ-F-EVT-002

export function getEvents(
  id: string,
  since = 0,
  type?: string,
  limit = 200,
): Promise<EventsResponse> {
  const params = new URLSearchParams({ since: String(since), limit: String(limit) })
  if (type) params.set('type', type)
  return get(`/workspace/${encodeURIComponent(id)}/events?${params}`)
}

// ── Feature vectors ───────────────────────────────────────────────────────────
// REQ-F-FEAT-001

export function getFeatures(id: string): Promise<FeatureVector[]> {
  return get(`/workspace/${encodeURIComponent(id)}/features`)
}

// ── Control ───────────────────────────────────────────────────────────────────
// REQ-F-CTL-001, REQ-F-CTL-002

export function startEngine(id: string, req: ControlStartRequest): Promise<{ pid: number }> {
  return post(`/workspace/${encodeURIComponent(id)}/control/start`, req)
}

export function emitEvent(id: string, req: EmitEventRequest): Promise<{ ok: boolean }> {
  return post(`/workspace/${encodeURIComponent(id)}/control/emit`, req)
}

// ── FP results ────────────────────────────────────────────────────────────────

export function getFpResults(id: string): Promise<FpResult[]> {
  return get(`/workspace/${encodeURIComponent(id)}/fp-results`)
}

// ── SSE stream URL (for ControlSurface EventSource) ──────────────────────────
// REQ-F-CTL-003

export function sseStreamUrl(id: string): string {
  return `${BASE}/workspace/${encodeURIComponent(id)}/control/start/stream`
}
