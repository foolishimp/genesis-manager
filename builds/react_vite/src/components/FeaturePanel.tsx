// Implements: REQ-F-FEAT-001, REQ-F-FEAT-002, REQ-F-FEAT-003, REQ-F-FEAT-004
// Implements: REQ-F-FEAT-005

import { useState } from 'react'
import type { FeatureVector, FocusedEntity } from '../types'
import { ReqKeyLink } from './NavHandles'

interface CoverageBarProps {
  satisfies: string[]
  totalReqs: number
}

function CoverageBar({ satisfies, totalReqs }: CoverageBarProps) {
  const pct = totalReqs > 0 ? Math.round((satisfies.length / totalReqs) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-600">
        <span>{satisfies.length}/{totalReqs} REQ keys covered</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded h-1.5">
        <div
          className={`h-1.5 rounded ${pct === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

interface FeatureDetailProps {
  feature: FeatureVector
  onFocus: (entity: FocusedEntity) => void
  onClose: () => void
}

function FeatureDetail({ feature, onFocus, onClose }: FeatureDetailProps) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-10">
      <div className="bg-white rounded shadow-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div className="font-mono font-medium">{feature.id}</div>
          <button className="text-gray-400 hover:text-gray-700" onClick={onClose}>✕</button>
        </div>
        <div className="space-y-3">
          <div>
            <div className="text-xs font-medium text-gray-600 mb-1">Satisfies</div>
            <div className="flex flex-wrap gap-1">
              {feature.satisfies.map((k) => (
                <ReqKeyLink key={k} reqKey={k} onFocus={onFocus} />
              ))}
            </div>
          </div>
          {feature.dependencies.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1">Dependencies</div>
              <div className="flex flex-wrap gap-1">
                {feature.dependencies.map((d) => (
                  <span key={d} className="text-xs font-mono text-gray-600">{d}</span>
                ))}
              </div>
            </div>
          )}
          <div>
            <div className="text-xs font-medium text-gray-600 mb-1">YAML</div>
            <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">{feature.yaml_text}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}

interface FeaturePanelProps {
  features: FeatureVector[]
  onFocus: (entity: FocusedEntity) => void
}

export function FeaturePanel({ features, onFocus }: FeaturePanelProps) {
  const [selected, setSelected] = useState<FeatureVector | null>(null)

  const allReqKeys = Array.from(new Set(features.flatMap((f) => f.satisfies)))

  return (
    <div className="p-4 space-y-4">
      <div className="text-sm font-medium text-gray-700">
        Features ({features.length})
      </div>

      {/* Coverage bar — REQ-F-FEAT-003 */}
      <CoverageBar satisfies={allReqKeys} totalReqs={allReqKeys.length} />

      <div className="space-y-2">
        {features.map((f) => (
          <div
            key={f.id}
            className="border rounded p-3 cursor-pointer hover:bg-gray-50 space-y-1"
            onClick={() => setSelected(f)}
          >
            <div className="flex items-center justify-between">
              <FeatureLink featureId={f.id} onFocus={onFocus} />
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  f.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {f.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {f.satisfies.slice(0, 5).map((k) => (
                <span key={k} className="text-xs font-mono text-gray-500">{k}</span>
              ))}
              {f.satisfies.length > 5 && (
                <span className="text-xs text-gray-400">+{f.satisfies.length - 5} more</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <FeatureDetail
          feature={selected}
          onFocus={onFocus}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

function FeatureLink({
  featureId,
  onFocus,
}: {
  featureId: string
  onFocus: (entity: FocusedEntity) => void
}) {
  return (
    <button
      className="text-blue-600 hover:underline bg-transparent border-0 p-0 cursor-pointer font-mono text-sm"
      onClick={(e) => {
        e.stopPropagation()
        onFocus({ type: 'feature', id: featureId })
      }}
    >
      {featureId}
    </button>
  )
}
