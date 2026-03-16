// Implements: REQ-F-EVT-001, REQ-F-EVT-002, REQ-F-EVT-003, REQ-F-EVT-004

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

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

// REQ-F-EVT-001: read events.jsonl; paginate for large files (> 1000 lines)
export function readEvents(
  workspacePath: string,
  since = 0,
  typeFilter?: string,
  limit = 200,
): EventsResponse {
  const path = join(workspacePath, '.ai-workspace', 'events', 'events.jsonl')
  if (!existsSync(path)) {
    return { total: 0, events: [], next_seq: 0 }
  }

  const lines = readFileSync(path, 'utf8')
    .split('\n')
    .filter((l) => l.trim())

  const all: WorkspaceEvent[] = lines.map((line, idx) => {
    try {
      const raw = JSON.parse(line) as Record<string, unknown>
      return {
        seq: idx,
        event_type: (raw.event_type as string) ?? '',
        event_time: (raw.event_time as string) ?? '',
        feature: raw.feature as string | undefined,
        edge: raw.edge as string | undefined,
        data: raw as Record<string, unknown>,
      }
    } catch {
      return { seq: idx, event_type: 'parse_error', event_time: '', data: { raw: line } }
    }
  })

  const filtered = all.filter((e) => {
    if (e.seq <= since) return false
    if (typeFilter && !e.event_type.includes(typeFilter)) return false
    return true
  })

  return {
    total: all.length,
    events: filtered.slice(0, limit),
    next_seq: all.length,
  }
}

// REQ-F-EVT-003: read fp_results
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

export function readFpResults(workspacePath: string): FpResult[] {
  const resultsDir = join(workspacePath, '.ai-workspace', 'fp_results')
  const manifestsDir = join(workspacePath, '.ai-workspace', 'fp_manifests')
  if (!existsSync(resultsDir)) return []

  const { readdirSync, readFileSync: rf } = require('fs') as typeof import('fs')
  const results: FpResult[] = []

  for (const f of (readdirSync(resultsDir) as string[]).filter((n: string) => n.endsWith('.json'))) {
    try {
      const resultPath = join(resultsDir, f)
      const raw = JSON.parse(rf(resultPath, 'utf8')) as { edge: string; assessments: FpAssessment[] }
      const manifestPath = join(manifestsDir, f)
      results.push({ ...raw, result_path: resultPath, manifest_path: manifestPath })
    } catch {
      // skip malformed
    }
  }
  return results
}
