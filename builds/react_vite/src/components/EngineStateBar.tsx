// Implements: REQ-F-CTL-005, REQ-F-CTL-007, REQ-F-UX-005

import type { EngineStateBarProps } from '../types'

export function EngineStateBar({ state }: EngineStateBarProps) {
  if (state.status === 'idle') {
    return <div className="px-4 py-2 bg-gray-50 text-gray-500 text-sm">Engine idle</div>
  }
  if (state.status === 'converged') {
    return (
      <div className="px-4 py-2 bg-green-50 text-green-700 font-medium text-sm">
        ✓ CONVERGED
      </div>
    )
  }
  if (state.status === 'running') {
    return (
      <div className="px-4 py-2 bg-blue-50 text-blue-700 text-sm">
        <span className="font-medium">RUNNING</span> — {state.edge}
      </div>
    )
  }
  if (state.status === 'blocked') {
    return (
      <div className="px-4 py-2 bg-red-50 text-red-700 text-sm">
        <span className="font-medium">BLOCKED</span> — {state.edge}
        {' '}({state.blockingEvaluators.join(', ')})
      </div>
    )
  }
  // status === 'next'
  return (
    <div className="px-4 py-2 bg-yellow-50 text-yellow-800 text-sm">
      <span className="font-medium">NEXT</span> — {state.action.edge}
      {state.action.requiresHuman && ' [human gate]'}
      {state.action.requiresFp && ' [F_P dispatch]'}
    </div>
  )
}
