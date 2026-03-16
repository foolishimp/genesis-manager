// Implements: REQ-F-WS-001, REQ-F-STATE-001, REQ-F-EVT-001, REQ-F-FEAT-001
// Implements: REQ-F-GATE-001, REQ-F-CTL-001, REQ-F-TRUST-001, REQ-F-DRIFT-001
// Implements: REQ-F-SPEC-001, REQ-F-NAV-001, REQ-F-UX-001, REQ-F-UX-002
// Implements: REQ-F-UX-003, REQ-F-UX-004, REQ-F-DRIFT-004

import { useState, useEffect, useCallback } from 'react'
import type {
  ProjectDashboardProps,
  GapReport,
  WorkspaceEvent,
  FeatureVector,
  PendingGate,
  EngineState,
  FocusedEntity,
  ConfigDrift,
  InstallChurn,
} from '../types'
import { getGaps, getEvents, getFeatures, emitEvent } from '../api/client'
import { TrustBar } from './TrustBar'
import { DriftBanner } from './DriftBanner'
import { EngineStateBar } from './EngineStateBar'
import { GraphTopologyView } from './GraphTopologyView'
import { ConvergencePanel } from './ConvergencePanel'
import { GateQueue } from './GateQueue'
import { ControlSurface } from './ControlSurface'
import { EventStream } from './EventStream'
import { FeaturePanel } from './FeaturePanel'

// localStorage keys for watermark — REQ-F-EVT-006, REQ-F-EVT-007
function watermarkKey(workspacePath: string): string {
  return `genesis_watermark_${workspacePath}`
}

function loadWatermark(workspacePath: string): number {
  return parseInt(localStorage.getItem(watermarkKey(workspacePath)) ?? '0', 10)
}

function saveWatermark(workspacePath: string, seq: number) {
  localStorage.setItem(watermarkKey(workspacePath), String(seq))
}

type Panel = 'convergence' | 'graph' | 'gates' | 'control' | 'events' | 'features'

function deriveGates(events: WorkspaceEvent[]): PendingGate[] {
  const gates: Map<string, PendingGate> = new Map()
  for (const ev of events) {
    if (ev.event_type === 'fh_gate_pending') {
      const key = `${String(ev.edge ?? '')}-${String(ev.data.feature ?? '')}`
      gates.set(key, {
        edge: ev.edge ?? '',
        feature: (ev.data.feature as string) ?? null,
        criteria: (ev.data.criteria as string[]) ?? [],
        eventTime: ev.event_time,
        state: 'pending',
      })
    }
    if (ev.event_type === 'review_approved' || ev.event_type === 'review_rejected') {
      const key = `${String(ev.data.edge ?? '')}-${String(ev.data.feature ?? '')}`
      const existing = gates.get(key)
      if (existing) {
        existing.state = ev.event_type === 'review_approved' ? 'approved' : 'rejected'
      }
    }
  }
  return Array.from(gates.values())
}

function deriveEngineState(gapReport: GapReport | null): EngineState {
  if (!gapReport) return { status: 'idle' }
  if (gapReport.total_delta === 0) return { status: 'converged' }
  const blocked = gapReport.per_edge.find((e) => e.delta > 0)
  if (blocked) {
    return {
      status: 'blocked',
      edge: blocked.edge,
      blockingEvaluators: blocked.failing,
    }
  }
  return { status: 'idle' }
}

function detectDrift(events: WorkspaceEvent[]): {
  configDrift: ConfigDrift | null
  installChurn: InstallChurn | null
  layoutInconsistencies: string[]
} {
  const installs = events.filter((e) => e.event_type === 'genesis_installed')
  const installChurn: InstallChurn | null =
    installs.length > 2
      ? { count: installs.length, lastInstallTime: installs[installs.length - 1]?.event_time ?? '' }
      : null
  return { configDrift: null, installChurn, layoutInconsistencies: [] }
}

// isReadyToShip derivation — REQ-F-DRIFT-004
function computeReadyToShip(
  gapReport: GapReport | null,
  configDrift: ConfigDrift | null,
  layoutInconsistencies: string[],
  staleCount: number,
): boolean {
  return (
    (gapReport?.total_delta ?? 1) === 0 &&
    configDrift === null &&
    layoutInconsistencies.length === 0 &&
    staleCount === 0
  )
}

export function ProjectDashboard({ workspacePath, domain, refreshIntervalMs }: ProjectDashboardProps) {
  const [gapReport, setGapReport] = useState<GapReport | null>(null)
  const [events, setEvents] = useState<WorkspaceEvent[]>([])
  const [features, setFeatures] = useState<FeatureVector[]>([])
  const [lastSeq, setLastSeq] = useState(0)
  const [watermarkSeq, setWatermarkSeq] = useState(() => loadWatermark(workspacePath))
  const [focusedEntity, setFocusedEntity] = useState<FocusedEntity | null>(null)
  const [activePanel, setActivePanel] = useState<Panel>('convergence')
  const [lastGapsTime, setLastGapsTime] = useState<Date | null>(null)
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null)

  // Workspace ID derived from path
  const wsId = workspacePath

  const refreshGaps = useCallback(async () => {
    try {
      const report = await getGaps(wsId)
      setGapReport(report)
      setLastGapsTime(new Date())
    } catch {
      // surface errors via TrustBar stale signal
    }
  }, [wsId])

  const refreshEvents = useCallback(async () => {
    try {
      const resp = await getEvents(wsId, lastSeq)
      if (resp.events.length > 0) {
        setEvents((prev) => [...prev, ...resp.events])
        setLastSeq(resp.next_seq)
        setLastEventTime(new Date())
      }
    } catch {
      // non-fatal
    }
  }, [wsId, lastSeq])

  const refreshFeatures = useCallback(async () => {
    try {
      const fs = await getFeatures(wsId)
      setFeatures(fs)
    } catch {
      // non-fatal
    }
  }, [wsId])

  // Initial load
  useEffect(() => {
    void refreshGaps()
    void refreshEvents()
    void refreshFeatures()
  }, [refreshGaps, refreshEvents, refreshFeatures])

  // Polling loop — REQ-F-UX-003
  useEffect(() => {
    const interval = setInterval(() => {
      void refreshGaps()
      void refreshEvents()
    }, refreshIntervalMs)
    return () => clearInterval(interval)
  }, [refreshGaps, refreshEvents, refreshIntervalMs])

  const gates = deriveGates(events)
  const engineState = deriveEngineState(gapReport)
  const { configDrift, installChurn, layoutInconsistencies } = detectDrift(events)
  const staleAssessmentCount = 0 // TODO: derive from fp_assessments with mismatched spec_hash
  const isReadyToShip = computeReadyToShip(gapReport, configDrift, layoutInconsistencies, staleAssessmentCount)

  const gapsByEdge = new Map(
    (gapReport?.per_edge ?? []).map((eg) => [eg.edge, eg]),
  )

  async function handleGateDecision(gate: PendingGate, approved: boolean, reason?: string) {
    await emitEvent(wsId, {
      type: approved ? 'review_approved' : 'review_rejected',
      data: {
        edge: gate.edge,
        feature: gate.feature ?? null,
        actor: 'human',
        ...(reason ? { reason } : {}),
      },
    })
    await refreshEvents()
  }

  function handleMarkSeen() {
    const maxSeq = events.length > 0 ? Math.max(...events.map((e) => e.seq)) : 0
    setWatermarkSeq(maxSeq)
    saveWatermark(workspacePath, maxSeq)
  }

  const panels: { id: Panel; label: string; badge?: number }[] = [
    { id: 'convergence', label: 'Convergence', badge: gapReport?.total_delta },
    { id: 'graph', label: 'Graph' },
    { id: 'gates', label: 'Gates', badge: gates.filter((g) => g.state === 'pending').length },
    { id: 'control', label: 'Control' },
    { id: 'events', label: 'Events', badge: events.filter((e) => e.seq > watermarkSeq).length },
    { id: 'features', label: 'Features' },
  ]

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Trust bar — REQ-F-TRUST-001 */}
      <TrustBar
        lastGapsTime={lastGapsTime}
        lastEventTime={lastEventTime}
        sourceMode={domain.source_mode}
        staleAssessmentCount={staleAssessmentCount}
      />

      {/* Drift banner — REQ-F-DRIFT-001 */}
      <DriftBanner
        configDrift={configDrift}
        installChurn={installChurn}
        layoutInconsistencies={layoutInconsistencies}
      />

      {/* Engine state bar — REQ-F-CTL-005 */}
      <EngineStateBar state={engineState} />

      {/* Ready to ship indicator — REQ-F-DRIFT-004 */}
      {isReadyToShip && (
        <div className="px-4 py-2 bg-green-600 text-white text-sm font-medium text-center">
          ✓ Ready to Ship
        </div>
      )}

      {/* Nav header */}
      <div className="flex items-center gap-1 px-4 py-2 bg-white border-b">
        <span className="text-sm font-mono text-gray-700 mr-4 truncate max-w-xs">{workspacePath}</span>
        {panels.map((p) => (
          <button
            key={p.id}
            className={`px-3 py-1.5 text-sm rounded relative ${
              activePanel === p.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActivePanel(p.id)}
          >
            {p.label}
            {(p.badge ?? 0) > 0 && (
              <span className="absolute -top-1 -right-1 px-1 py-0.5 bg-red-500 text-white text-xs rounded-full leading-none">
                {p.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main panel */}
      <div className="flex-1 overflow-y-auto">
        {activePanel === 'convergence' && (
          <ConvergencePanel gapReport={gapReport} onFocus={setFocusedEntity} />
        )}
        {activePanel === 'graph' && (
          <div className="p-4">
            <GraphTopologyView
              domain={domain}
              gapsByEdge={gapsByEdge}
              onFocus={setFocusedEntity}
            />
          </div>
        )}
        {activePanel === 'gates' && (
          <GateQueue
            gates={gates}
            workspaceId={wsId}
            onFocus={setFocusedEntity}
            onGateDecision={handleGateDecision}
          />
        )}
        {activePanel === 'control' && (
          <ControlSurface
            workspaceId={wsId}
            onEngineStarted={() => {
              void refreshGaps()
              void refreshEvents()
            }}
          />
        )}
        {activePanel === 'events' && (
          <div className="h-full">
            <EventStream
              events={events}
              watermarkSeq={watermarkSeq}
              onMarkSeen={handleMarkSeen}
              onFocus={setFocusedEntity}
            />
          </div>
        )}
        {activePanel === 'features' && (
          <FeaturePanel features={features} onFocus={setFocusedEntity} />
        )}
      </div>

      {/* Entity detail overlay — REQ-F-NAV-001 */}
      {focusedEntity && (
        <div
          className="fixed bottom-4 right-4 bg-white border rounded shadow-lg p-4 max-w-sm z-20"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs font-medium text-gray-600">{focusedEntity.type}</div>
            <button className="text-gray-400 hover:text-gray-700" onClick={() => setFocusedEntity(null)}>✕</button>
          </div>
          <div className="font-mono text-sm">
            {'key' in focusedEntity && focusedEntity.key}
            {'name' in focusedEntity && focusedEntity.name}
            {'seq' in focusedEntity && `#${focusedEntity.seq}`}
            {'id' in focusedEntity && focusedEntity.id}
          </div>
        </div>
      )}
    </div>
  )
}
