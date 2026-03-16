// Implements: REQ-F-STATE-001, REQ-F-STATE-002, REQ-F-STATE-003, REQ-F-STATE-004
// Implements: REQ-F-STATE-005

import type { GapReport, FocusedEntity } from '../types'
import { EdgeLink } from './NavHandles'

interface ConvergencePanelProps {
  gapReport: GapReport | null
  onFocus: (entity: FocusedEntity) => void
}

interface EvaluatorResultProps {
  name: string
  edge: string
  passing: boolean
  onFocus: (entity: FocusedEntity) => void
}

function EvaluatorResult({ name, edge, passing, onFocus }: EvaluatorResultProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${
        passing ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      <EvaluatorLink name={name} edge={edge} onFocus={onFocus} />
    </span>
  )
}

function EvaluatorLink({
  name,
  edge,
  onFocus,
}: {
  name: string
  edge: string
  onFocus: (entity: FocusedEntity) => void
}) {
  return (
    <button
      className="bg-transparent border-0 p-0 cursor-pointer underline font-inherit text-inherit"
      onClick={() => onFocus({ type: 'evaluator', name, edge })}
    >
      {name}
    </button>
  )
}

export function ConvergencePanel({ gapReport, onFocus }: ConvergencePanelProps) {
  if (!gapReport) {
    return (
      <div className="p-4 text-gray-500 text-sm">Loading convergence state…</div>
    )
  }

  const allConverged = gapReport.total_delta === 0

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-3">
        <span
          className={`text-sm font-medium px-2 py-1 rounded ${
            allConverged ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {allConverged ? 'CONVERGED' : `Δ ${gapReport.total_delta}`}
        </span>
        <span className="text-xs text-gray-500">{gapReport.timestamp}</span>
      </div>

      <div className="space-y-2">
        {gapReport.per_edge.map((eg) => (
          <div key={eg.edge} className="border rounded p-2 text-sm">
            <div className="flex items-center gap-2 mb-1">
              <EdgeLink edgeName={eg.edge} onFocus={onFocus} />
              <span
                className={`text-xs font-mono ${eg.delta === 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                Δ{eg.delta}
              </span>
            </div>
            {eg.failing.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {eg.failing.map((f) => (
                  <EvaluatorResult
                    key={f}
                    name={f}
                    edge={eg.edge}
                    passing={false}
                    onFocus={onFocus}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
