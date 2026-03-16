// Implements: REQ-F-GATE-001, REQ-F-GATE-002, REQ-F-GATE-003, REQ-F-GATE-004
// Implements: REQ-F-GATE-005, REQ-F-GATE-006, REQ-F-GATE-007, REQ-F-GATE-008

import { useState } from 'react'
import type { PendingGate, GateCardProps, FocusedEntity } from '../types'

function GateCard({ gate, onApprove, onReject }: GateCardProps) {
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)

  if (gate.state !== 'pending') {
    return (
      <div className="border rounded p-3 opacity-50 text-sm">
        <span className="font-mono">{gate.edge}</span>
        <span className="ml-2 text-xs">[{gate.state}]</span>
      </div>
    )
  }

  return (
    <div className="border rounded p-4 bg-white shadow-sm space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-sm font-medium">{gate.edge}</div>
          {gate.feature && <div className="text-xs text-gray-500">{gate.feature}</div>}
          <div className="text-xs text-gray-400">{gate.eventTime}</div>
        </div>
        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">PENDING</span>
      </div>

      <div className="space-y-1">
        <div className="text-xs font-medium text-gray-600">Criteria:</div>
        <ul className="list-disc list-inside text-sm space-y-1">
          {gate.criteria.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>

      {!showReject ? (
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            onClick={() => onApprove()}
          >
            Approve
          </button>
          <button
            className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200"
            onClick={() => setShowReject(true)}
          >
            Reject
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            className="w-full border rounded p-2 text-sm"
            placeholder="Rejection reason (required)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
              disabled={!rejectReason.trim()}
              onClick={() => onReject(rejectReason)}
            >
              Confirm Reject
            </button>
            <button
              className="px-3 py-1.5 text-gray-600 text-sm rounded hover:bg-gray-100"
              onClick={() => setShowReject(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface GateQueueProps {
  gates: PendingGate[]
  workspaceId: string
  onFocus: (entity: FocusedEntity) => void
  onGateDecision: (gate: PendingGate, approved: boolean, reason?: string) => Promise<void>
}

export function GateQueue({ gates, workspaceId: _workspaceId, onFocus: _onFocus, onGateDecision }: GateQueueProps) {
  const pending = gates.filter((g) => g.state === 'pending')

  return (
    <div className="p-4 space-y-3">
      <div className="text-sm font-medium text-gray-700">
        Gate Queue ({pending.length} pending)
      </div>
      {gates.length === 0 ? (
        <div className="text-sm text-gray-500">No pending gates</div>
      ) : (
        gates.map((gate, i) => (
          <GateCard
            key={`${gate.edge}-${i}`}
            gate={gate}
            onApprove={(reason) => onGateDecision(gate, true, reason)}
            onReject={(reason) => onGateDecision(gate, false, reason)}
          />
        ))
      )}
    </div>
  )
}
