// Implements: REQ-F-GATE-001, REQ-F-GATE-002, REQ-F-GATE-003, REQ-F-GATE-004
// Implements: REQ-F-GATE-005, REQ-F-GATE-006, REQ-F-GATE-007, REQ-F-GATE-008

import { useState } from 'react'
import type { PendingGate, ProxyDecision, GateCardProps, FocusedEntity } from '../types'

function GateCard({ gate, onApprove, onReject }: GateCardProps) {
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)

  if (gate.state !== 'pending') {
    return (
      <div className="border border-gray-800 rounded p-3 opacity-50 text-sm">
        <span className="font-mono">{gate.edge}</span>
        <span className="ml-2 text-xs text-gray-500">[{gate.state}]</span>
      </div>
    )
  }

  return (
    <div className="border border-gray-700 rounded p-4 bg-gray-900 shadow-sm space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-sm font-medium text-gray-100">{gate.edge}</div>
          {gate.feature && <div className="text-xs text-gray-500">{gate.feature}</div>}
          <div className="text-xs text-gray-500">{gate.eventTime}</div>
        </div>
        <span className="px-2 py-1 bg-amber-900/40 text-amber-300 text-xs rounded">PENDING</span>
      </div>

      <div className="space-y-1">
        <div className="text-xs font-medium text-gray-400">Criteria:</div>
        <ul className="list-disc list-inside text-sm space-y-1 text-gray-300">
          {gate.criteria.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>

      {!showReject ? (
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 bg-green-700 text-white text-sm rounded hover:bg-green-600"
            onClick={() => onApprove()}
          >
            Approve
          </button>
          <button
            className="px-3 py-1.5 bg-red-900/40 text-red-300 text-sm rounded border border-red-900/60 hover:bg-red-900/60"
            onClick={() => setShowReject(true)}
          >
            Reject
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded p-2 text-sm placeholder-gray-500"
            placeholder="Rejection reason (required)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 bg-red-700 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50"
              disabled={!rejectReason.trim()}
              onClick={() => onReject(rejectReason)}
            >
              Confirm Reject
            </button>
            <button
              className="px-3 py-1.5 text-gray-400 text-sm rounded hover:bg-gray-800 hover:text-gray-200"
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

// REQ-F-GATE-005, REQ-F-GATE-006: display proxy decisions and allow human override
interface ProxyDecisionCardProps {
  decision: ProxyDecision
  onOverride: (approved: boolean, reason?: string) => void
}

function ProxyDecisionCard({ decision, onOverride }: ProxyDecisionCardProps) {
  const [showOverride, setShowOverride] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')

  return (
    <div className="border border-blue-900/40 rounded p-3 bg-blue-950/20 space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-sm text-gray-200">{decision.edge}</div>
          {decision.feature && <div className="text-xs text-gray-500">{decision.feature}</div>}
          <div className="text-xs text-gray-500">{decision.eventTime}</div>
        </div>
        <span
          className={`px-2 py-1 text-xs rounded ${
            decision.decision === 'approved'
              ? 'bg-green-900/40 text-green-300'
              : 'bg-red-900/40 text-red-300'
          }`}
        >
          proxy-{decision.decision}
        </span>
      </div>
      {decision.proxyLog && (
        <div className="text-xs text-gray-500 font-mono truncate" title={decision.proxyLog}>
          {decision.proxyLog}
        </div>
      )}
      {!showOverride ? (
        <button
          className="text-xs text-blue-400 hover:text-blue-300 underline"
          onClick={() => setShowOverride(true)}
        >
          Override proxy decision
        </button>
      ) : (
        <div className="space-y-2">
          <div className="text-xs text-gray-400">Override this proxy decision:</div>
          <textarea
            className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded p-2 text-xs placeholder-gray-500"
            placeholder="Reason for override (optional for approve, required for reject)"
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2">
            <button
              className="px-2 py-1 bg-green-700 text-white text-xs rounded hover:bg-green-600"
              onClick={() => onOverride(true, overrideReason || undefined)}
            >
              Approve
            </button>
            <button
              className="px-2 py-1 bg-red-900/40 text-red-300 text-xs rounded border border-red-900/60 disabled:opacity-50"
              disabled={!overrideReason.trim()}
              onClick={() => onOverride(false, overrideReason)}
            >
              Reject
            </button>
            <button
              className="px-2 py-1 text-gray-400 text-xs rounded hover:bg-gray-800"
              onClick={() => setShowOverride(false)}
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
  proxyDecisions: ProxyDecision[]
  workspaceId: string
  onFocus: (entity: FocusedEntity) => void
  onGateDecision: (gate: PendingGate, approved: boolean, reason?: string) => Promise<void>
  onProxyOverride?: (decision: ProxyDecision, approved: boolean, reason?: string) => Promise<void>
}

export function GateQueue({
  gates,
  proxyDecisions,
  workspaceId: _workspaceId,
  onFocus: _onFocus,
  onGateDecision,
  onProxyOverride,
}: GateQueueProps) {
  const pending = gates.filter((g) => g.state === 'pending')

  return (
    <div className="p-4 space-y-4">
      <div className="text-sm font-medium text-gray-300">
        Gate Queue ({pending.length} pending)
      </div>
      {gates.length === 0 && proxyDecisions.length === 0 ? (
        <div className="text-sm text-gray-500">No pending gates</div>
      ) : (
        <>
          {gates.map((gate, i) => (
            <GateCard
              key={`${gate.edge}-${i}`}
              gate={gate}
              onApprove={(reason) => onGateDecision(gate, true, reason)}
              onReject={(reason) => onGateDecision(gate, false, reason)}
            />
          ))}
          {proxyDecisions.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-blue-400 uppercase tracking-wide">
                Proxy Decisions ({proxyDecisions.length})
              </div>
              {proxyDecisions.map((pd, i) => (
                <ProxyDecisionCard
                  key={`proxy-${pd.edge}-${i}`}
                  decision={pd}
                  onOverride={(approved, reason) =>
                    onProxyOverride
                      ? onProxyOverride(pd, approved, reason)
                      : Promise.resolve()
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
