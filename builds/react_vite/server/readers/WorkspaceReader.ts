// Implements: REQ-F-WS-001, REQ-F-WS-002, REQ-F-WS-003, REQ-F-WS-004, REQ-F-WS-005
// Implements: REQ-F-STATE-001, REQ-F-FEAT-001

import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, basename, dirname } from 'path'
import { execSync } from 'child_process'
import { homedir } from 'os'

export interface WorkspaceInfo {
  id: string
  name: string
  path: string
}

export function scanWorkspaces(root: string): WorkspaceInfo[] {
  const results: WorkspaceInfo[] = []
  function walk(dir: string, depth: number) {
    if (depth > 5) return
    try {
      const entries = readdirSync(dir, { withFileTypes: true })
      for (const e of entries) {
        if (!e.isDirectory()) continue
        if (e.name.startsWith('.') || e.name === 'node_modules') continue
        const full = join(dir, e.name)
        if (existsSync(join(full, '.genesis', 'genesis.yml'))) {
          results.push({ id: full, name: e.name, path: full })
        } else {
          walk(full, depth + 1)
        }
      }
    } catch {
      // skip unreadable dirs
    }
  }
  walk(root, 0)
  return results
}

export interface DomainModel {
  kernel_version: string
  source_mode: 'fd_describe' | 'fp_synthesized'
  package: {
    name: string
    assets: Array<{ name: string; markov: string[] }>
    edges: Array<{ source: string; target: string; evaluators: string[] }>
    requirements: string[]
  }
}

// REQ-F-WS-001: synthesise domain model from genesis.yml + gaps output
// gen describe does not exist in this engine version — synthesise directly
export function getDomain(workspacePath: string): DomainModel {
  let kernelVersion = 'unknown'
  let packageName = basename(workspacePath)

  try {
    const yml = readFileSync(join(workspacePath, '.genesis', 'genesis.yml'), 'utf8')
    const verMatch = /version:\s*(.+)/.exec(yml)
    if (verMatch?.[1]) kernelVersion = verMatch[1].trim()
    // Extract package name: "package: gtl_spec.packages.FOO:package" → "FOO"
    const pkgMatch = /package:\s+[\w.]+\.(\w+):\w+/.exec(yml)
    if (pkgMatch?.[1]) packageName = pkgMatch[1]
  } catch { /* ignore */ }

  // Use gaps to get edge topology
  let edges: DomainModel['package']['edges'] = []
  try {
    const raw = execSync(
      `PYTHONPATH=.genesis python -m genesis gaps --workspace "${workspacePath}"`,
      { cwd: workspacePath, timeout: 30_000 },
    )
    const parsed = JSON.parse(raw.toString()) as { gaps?: Array<{ edge: string; failing: string[] }> }
    if (parsed.gaps) {
      edges = parsed.gaps.map((g) => {
        const parts = g.edge.split('→')
        return { source: parts[0] ?? g.edge, target: parts[1] ?? g.edge, evaluators: g.failing }
      })
    }
  } catch { /* leave edges empty */ }

  return {
    kernel_version: kernelVersion,
    source_mode: 'fp_synthesized',
    package: { name: packageName, assets: [], edges, requirements: [] },
  }
}

export interface GapReport {
  total_delta: number
  per_edge: Array<{ edge: string; delta: number; failing: string[]; passing: string[] }>
  timestamp: string
}

// REQ-F-STATE-001
// Engine emits "gaps" array — normalise to "per_edge" for the client
export function getGaps(workspacePath: string): GapReport {
  const out = execSync(
    `PYTHONPATH=.genesis python -m genesis gaps --workspace "${workspacePath}"`,
    { cwd: workspacePath, timeout: 30_000 },
  )
  const raw = JSON.parse(out.toString()) as {
    total_delta: number
    gaps?: Array<{ edge: string; delta: number; failing: string[]; passing: string[] }>
    per_edge?: Array<{ edge: string; delta: number; failing: string[]; passing: string[] }>
  }
  return {
    total_delta: raw.total_delta,
    per_edge: raw.gaps ?? raw.per_edge ?? [],
    timestamp: new Date().toISOString(),
  }
}

export interface FeatureVector {
  id: string
  status: 'active' | 'completed'
  satisfies: string[]
  dependencies: string[]
  yaml_text: string
}

// ── Workspace summary (for project list) ──────────────────────────────────────
// REQ-F-WS-003: compute WorkspaceSummary from filesystem — no subprocess

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

export function getWorkspaceSummary(workspacePath: string): WorkspaceSummary {
  const projectName = basename(workspacePath)
  const wsDir = join(workspacePath, '.ai-workspace')
  const eventsPath = join(wsDir, 'events', 'events.jsonl')
  const available = existsSync(wsDir) && existsSync(eventsPath)

  if (!available) {
    return { workspaceId: workspacePath, projectName, activeFeatureCount: 0, pendingGateCount: 0, stuckFeatureCount: 0, hasAttentionRequired: false, available: false, lastEventTimestamp: null }
  }

  // Count active features
  let activeFeatureCount = 0
  try {
    activeFeatureCount = readdirSync(join(wsDir, 'features', 'active')).filter((f) => f.endsWith('.yml')).length
  } catch { /* dir may not exist */ }

  // Scan events for pending gate count + last event timestamp
  let pendingGateCount = 0
  let lastEventTimestamp: string | null = null
  try {
    const lines = readFileSync(eventsPath, 'utf8').trim().split('\n').filter(Boolean)
    const gateResolved = new Map<string, boolean>()
    for (const line of lines) {
      try {
        const evt = JSON.parse(line) as { event_type: string; event_time: string; data?: { edge?: string; feature?: string } }
        lastEventTimestamp = evt.event_time
        const key = `${evt.data?.edge ?? ''}|${evt.data?.feature ?? ''}`
        if (evt.event_type === 'fh_gate_pending') {
          gateResolved.set(key, false)
        } else if (evt.event_type === 'review_approved' || evt.event_type === 'review_rejected') {
          gateResolved.set(key, true)
        }
      } catch { /* skip malformed lines */ }
    }
    pendingGateCount = [...gateResolved.values()].filter((v) => !v).length
  } catch { /* skip if events unreadable */ }

  return { workspaceId: workspacePath, projectName, activeFeatureCount, pendingGateCount, stuckFeatureCount: 0, hasAttentionRequired: pendingGateCount > 0, available: true, lastEventTimestamp }
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

export function browseDirectory(targetPath?: string): FsBrowseResult {
  const dir = targetPath ?? homedir()
  const MAX_ENTRIES = 500
  const raw = readdirSync(dir, { withFileTypes: true })
  const dirs = raw.filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules')
  const truncated = dirs.length > MAX_ENTRIES
  const entries: FsEntry[] = dirs.slice(0, MAX_ENTRIES).map((e) => {
    const absPath = join(dir, e.name)
    const hasWorkspace = existsSync(join(absPath, '.ai-workspace', 'events', 'events.jsonl'))
    return { name: e.name, absolutePath: absPath, hasWorkspace }
  })
  const parent = dir === '/' ? null : dirname(dir)
  return { path: dir, parent, entries, truncated }
}

// REQ-F-FEAT-001
export function getFeatures(workspacePath: string): FeatureVector[] {
  const results: FeatureVector[] = []
  for (const status of ['active', 'completed'] as const) {
    const dir = join(workspacePath, '.ai-workspace', 'features', status)
    if (!existsSync(dir)) continue
    for (const f of readdirSync(dir).filter((n) => n.endsWith('.yml'))) {
      try {
        const text = readFileSync(join(dir, f), 'utf8')
        const id = f.replace('.yml', '')
        const satisfies: string[] = []
        for (const m of text.matchAll(/- (REQ-[A-Z0-9-]+)/g)) {
          if (m[1]) satisfies.push(m[1])
        }
        const deps: string[] = []
        const depSection = /depends_on:\s*\n((?:\s*- .+\n)*)/m.exec(text)
        if (depSection) {
          for (const m of depSection[1].matchAll(/- (.+)/g)) {
            if (m[1]) deps.push(m[1].trim())
          }
        }
        results.push({ id, status, satisfies, dependencies: deps, yaml_text: text })
      } catch {
        // skip unreadable files
      }
    }
  }
  return results
}
