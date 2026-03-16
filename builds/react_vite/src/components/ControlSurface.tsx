// Implements: REQ-F-CTL-001, REQ-F-CTL-002, REQ-F-CTL-003, REQ-F-CTL-004
// Implements: REQ-F-CTL-006, REQ-F-CTL-007

import { useState, useEffect, useRef } from 'react'
import { startEngine, sseStreamUrl } from '../api/client'

interface ControlSurfaceProps {
  workspaceId: string
  onEngineStarted: () => void
}

type RunFlag = '--auto' | '--auto --human-proxy' | '--edge' | '--feature'

const FLAG_OPTIONS: { label: string; flags: string[] }[] = [
  { label: 'Auto', flags: ['--auto'] },
  { label: 'Auto + Human Proxy', flags: ['--auto', '--human-proxy'] },
]

interface FpDispatch {
  edge: string
  evaluator: string
  timestamp: string
}

export function ControlSurface({ workspaceId, onEngineStarted }: ControlSurfaceProps) {
  const [selectedFlag, setSelectedFlag] = useState<RunFlag>('--auto')
  const [edgeOverride, setEdgeOverride] = useState('')
  const [featureOverride, setFeatureOverride] = useState('')
  const [running, setRunning] = useState(false)
  const [output, setOutput] = useState<string[]>([])
  const [fpDispatches, setFpDispatches] = useState<FpDispatch[]>([])
  const esRef = useRef<EventSource | null>(null)
  const outputRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  useEffect(() => {
    return () => {
      esRef.current?.close()
    }
  }, [])

  async function handleStart() {
    const flags: string[] = []
    if (selectedFlag === '--auto') flags.push('--auto')
    if (selectedFlag === '--auto --human-proxy') flags.push('--auto', '--human-proxy')
    if (selectedFlag === '--edge' && edgeOverride) flags.push('--edge', edgeOverride)
    if (selectedFlag === '--feature' && featureOverride) flags.push('--feature', featureOverride)

    setRunning(true)
    setOutput([])

    // Subscribe to SSE before starting
    const es = new EventSource(sseStreamUrl(workspaceId))
    esRef.current = es

    es.addEventListener('output', (e: MessageEvent) => {
      setOutput((prev) => [...prev, e.data as string])
    })

    es.addEventListener('fp_dispatch', (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data as string) as FpDispatch
        setFpDispatches((prev) => [...prev, d])
      } catch {
        // ignore parse errors
      }
    })

    es.addEventListener('done', (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data as string) as { exitCode: number }
        setOutput((prev) => [...prev, `\n[exit ${d.exitCode}]`])
      } catch {
        setOutput((prev) => [...prev, '\n[done]'])
      }
      setRunning(false)
      es.close()
      onEngineStarted()
    })

    es.onerror = () => {
      setRunning(false)
      es.close()
    }

    try {
      await startEngine(workspaceId, { flags })
    } catch (err) {
      setOutput((prev) => [...prev, `Error: ${String(err)}`])
      setRunning(false)
      es.close()
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-sm font-medium text-gray-700">Control Surface</div>

      {/* Flag selector — REQ-F-CTL-001 */}
      <div className="flex flex-wrap gap-2">
        {FLAG_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            className={`px-3 py-1.5 text-sm rounded border ${
              selectedFlag === opt.flags.join(' ')
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setSelectedFlag(opt.flags.join(' ') as RunFlag)}
            disabled={running}
          >
            {opt.label}
          </button>
        ))}
        <button
          className={`px-3 py-1.5 text-sm rounded border ${
            selectedFlag === '--edge'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
          onClick={() => setSelectedFlag('--edge')}
          disabled={running}
        >
          Edge
        </button>
        <button
          className={`px-3 py-1.5 text-sm rounded border ${
            selectedFlag === '--feature'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
          onClick={() => setSelectedFlag('--feature')}
          disabled={running}
        >
          Feature
        </button>
      </div>

      {selectedFlag === '--edge' && (
        <input
          className="border rounded px-2 py-1 text-sm w-full"
          placeholder="e.g. design→code"
          value={edgeOverride}
          onChange={(e) => setEdgeOverride(e.target.value)}
        />
      )}
      {selectedFlag === '--feature' && (
        <input
          className="border rounded px-2 py-1 text-sm w-full"
          placeholder="e.g. REQ-F-CTL-001"
          value={featureOverride}
          onChange={(e) => setFeatureOverride(e.target.value)}
        />
      )}

      <button
        className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
        disabled={running}
        onClick={handleStart}
      >
        {running ? 'Running…' : 'Start'}
      </button>

      {/* Process output — REQ-F-CTL-003 (SSE stream) */}
      {output.length > 0 && (
        <div
          ref={outputRef}
          className="bg-gray-900 text-green-400 font-mono text-xs p-3 rounded h-48 overflow-y-auto whitespace-pre-wrap"
        >
          {output.join('\n')}
        </div>
      )}

      {/* FP dispatch viewer — REQ-F-CTL-004 */}
      {fpDispatches.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-600">F_P Dispatches</div>
          {fpDispatches.map((d, i) => (
            <div key={i} className="text-xs text-gray-700 font-mono">
              {d.timestamp} {d.edge} — {d.evaluator}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
