// Implements: REQ-F-TRUST-001, REQ-F-TRUST-002, REQ-F-WS-002

import type { TrustBarProps } from '../types'

function fmt(d: Date | null): string {
  return d ? d.toLocaleTimeString() : 'never'
}

export function TrustBar({
  lastGapsTime,
  lastEventTime,
  sourceMode,
  staleAssessmentCount,
}: TrustBarProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-gray-900 border-b border-gray-800 text-sm">
      {sourceMode === 'fp_synthesized' && (
        <span className="px-2 py-1 bg-amber-900/40 text-amber-300 rounded font-medium">
          Domain model synthesised from kernel source — not zero-interpretation
        </span>
      )}
      <span className="text-gray-400">gaps: {fmt(lastGapsTime)}</span>
      <span className="text-gray-400">event: {fmt(lastEventTime)}</span>
      {staleAssessmentCount > 0 && (
        <span className="px-2 py-1 bg-red-900/40 text-red-300 rounded">
          {staleAssessmentCount} stale
        </span>
      )}
    </div>
  )
}
