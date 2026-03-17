// Implements: REQ-F-CTL-005, REQ-F-CTL-007, REQ-F-UX-005

import type { EngineStateBarProps } from '../types'

export function EngineStateBar({ state }: EngineStateBarProps) {
  if (state.status === 'idle') {
    return <div className="px-4 py-2 bg-gray-950 text-gray-500 text-sm border-b border-gray-800">Engine idle</div>
  }
  if (state.status === 'converged') {
    return (
      <div className="px-4 py-2 bg-green-900/40 text-green-300 font-medium text-sm border-b border-green-900/60">
        ✓ CONVERGED
      </div>
    )
  }
  if (state.status === 'running') {
    return (
      <div className="px-4 py-2 bg-blue-900/40 text-blue-300 text-sm border-b border-blue-900/60">
        <span className="font-medium">RUNNING</span> — {state.edge}
      </div>
    )
  }
  if (state.status === 'blocked') {
    return (
      <div className="px-4 py-2 bg-red-900/40 text-red-300 text-sm border-b border-red-900/60">
        <span className="font-medium">BLOCKED</span> — {state.edge}
        {' '}({state.blockingEvaluators.join(', ')})
      </div>
    )
  }
  // status === 'next'
  return (
    <div className="px-4 py-2 bg-amber-900/40 text-amber-300 text-sm border-b border-amber-900/60">
      <span className="font-medium">NEXT</span> — {state.action.edge}
      {state.action.requiresHuman && ' [human gate]'}
      {state.action.requiresFp && ' [F_P dispatch]'}
    </div>
  )
}
