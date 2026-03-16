// Implements: REQ-F-WS-001, REQ-F-WS-002, REQ-F-STATE-001, REQ-F-FEAT-001

import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, basename } from 'path'
import { execSync } from 'child_process'

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

// REQ-F-WS-001: try gen describe (F_D path); fall back to reading spec (F_P path)
export function getDomain(workspacePath: string): DomainModel {
  try {
    const out = execSync(
      `PYTHONPATH=.genesis python -m genesis describe --workspace "${workspacePath}"`,
      { cwd: workspacePath, timeout: 10_000 },
    )
    return JSON.parse(out.toString()) as DomainModel
  } catch {
    // F_P path: read genesis.yml for minimal info
    return synthesiseFallback(workspacePath)
  }
}

function synthesiseFallback(workspacePath: string): DomainModel {
  const name = basename(workspacePath)
  // Try to read kernel version from genesis.yml
  let kernelVersion = 'unknown'
  try {
    const yml = readFileSync(join(workspacePath, '.genesis', 'genesis.yml'), 'utf8')
    const match = /version:\s*(.+)/.exec(yml)
    if (match?.[1]) kernelVersion = match[1].trim()
  } catch {
    // ignore
  }
  return {
    kernel_version: kernelVersion,
    source_mode: 'fp_synthesized',
    package: { name, assets: [], edges: [], requirements: [] },
  }
}

export interface GapReport {
  total_delta: number
  per_edge: Array<{ edge: string; delta: number; failing: string[]; passing: string[] }>
  timestamp: string
}

// REQ-F-STATE-001
export function getGaps(workspacePath: string): GapReport {
  const out = execSync(
    `PYTHONPATH=.genesis python -m genesis gaps --workspace "${workspacePath}"`,
    { cwd: workspacePath, timeout: 30_000 },
  )
  return JSON.parse(out.toString()) as GapReport
}

export interface FeatureVector {
  id: string
  status: 'active' | 'completed'
  satisfies: string[]
  dependencies: string[]
  yaml_text: string
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
