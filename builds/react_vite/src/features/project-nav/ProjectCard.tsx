// Implements: REQ-F-WS-003, REQ-F-WS-004

import type { WorkspaceSummary } from '../../types'

interface ProjectCardProps {
  summary: WorkspaceSummary
  isActive: boolean
  onSelect: (id: string) => void
}

export function ProjectCard({ summary, isActive, onSelect }: ProjectCardProps) {
  const { workspaceId, projectName, activeFeatureCount, pendingGateCount, stuckFeatureCount, hasAttentionRequired, available } = summary

  const borderClass = isActive
    ? 'border-blue-500 shadow-lg shadow-blue-900/30'
    : hasAttentionRequired
    ? 'border-orange-500/60'
    : 'border-gray-800 hover:border-gray-700'

  return (
    <button
      onClick={() => onSelect(workspaceId)}
      className={`w-full text-left p-4 rounded-lg border-2 transition-colors bg-gray-900 ${borderClass} ${!available ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-100 truncate">{projectName}</p>
          <p className="text-xs text-gray-500 font-mono truncate">{workspaceId}</p>
        </div>

        {hasAttentionRequired && available && (
          <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-900/40 text-orange-400">
            Needs attention
          </span>
        )}
        {!available && (
          <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-500">
            Unavailable
          </span>
        )}
      </div>

      {available && (
        <div className="mt-3 flex gap-4 text-xs text-gray-500">
          <span>
            <span className="font-medium text-gray-300">{activeFeatureCount}</span> active features
          </span>
          {pendingGateCount > 0 && (
            <span className="font-medium text-orange-400">
              {pendingGateCount} pending gate{pendingGateCount !== 1 ? 's' : ''}
            </span>
          )}
          {stuckFeatureCount > 0 && (
            <span className="font-medium text-amber-400">{stuckFeatureCount} stuck</span>
          )}
        </div>
      )}
    </button>
  )
}
