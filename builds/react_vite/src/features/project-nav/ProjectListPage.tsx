// Implements: REQ-F-WS-001, REQ-F-WS-003, REQ-F-WS-004

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore, selectSortedWorkspaces } from '../../stores/projectStore'
import { ProjectCard } from './ProjectCard'
import { WorkspaceConfigDrawer } from './WorkspaceConfigDrawer'

export function ProjectListPage() {
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const workspaceSummaries = useProjectStore((s) => s.workspaceSummaries)
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const setActiveProject = useProjectStore((s) => s.setActiveProject)
  const lastRefreshed = useProjectStore((s) => s.lastRefreshed)
  const pollingError = useProjectStore((s) => s.pollingError)
  const isRefreshing = useProjectStore((s) => s.isRefreshing)

  const sorted = selectSortedWorkspaces(workspaceSummaries)

  const handleSelect = (id: string) => {
    setActiveProject(id)
    navigate('/project/' + encodeURIComponent(id))
  }

  const freshnessLabel = (() => {
    if (pollingError) return <span className="text-xs text-red-400">Refresh error</span>
    if (isRefreshing) return <span className="text-xs text-gray-500">Refreshing…</span>
    if (!lastRefreshed) return null
    const ageMs = Date.now() - lastRefreshed.getTime()
    if (ageMs > 60_000) return <span className="text-xs text-amber-400">Stale</span>
    return <span className="text-xs text-green-500">Updated {Math.round(ageMs / 1000)}s ago</span>
  })()

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-100">Genesis Manager</h1>
          <p className="text-xs text-gray-500">Local workspace dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          {freshnessLabel}
          <button
            onClick={() => setDrawerOpen(true)}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-500"
          >
            + Add workspace
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        {sorted.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-2">No workspaces registered</p>
            <p className="text-gray-600 text-sm mb-6">Add a Genesis workspace to get started.</p>
            <button
              onClick={() => setDrawerOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
            >
              Add workspace
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {sorted.length} workspace{sorted.length !== 1 ? 's' : ''}
            </p>
            {sorted.map((summary) => (
              <ProjectCard
                key={summary.workspaceId}
                summary={summary}
                isActive={summary.workspaceId === activeProjectId}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </main>

      <WorkspaceConfigDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
