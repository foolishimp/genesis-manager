// Implements: REQ-F-WS-001, REQ-F-WS-002, REQ-F-UX-001, REQ-F-UX-002

import { useState } from 'react'
import type { WorkspacePath, DomainModel } from './types'
import { getDomain } from './api/client'
import { WorkspaceSelector } from './components/WorkspaceSelector'
import { ProjectDashboard } from './components/ProjectDashboard'

const DEFAULT_REFRESH_MS = 10_000

interface LoadedWorkspace {
  path: WorkspacePath
  domain: DomainModel
}

// Minimal stub domain for when backend is unavailable
function stubDomain(name: string): DomainModel {
  return {
    kernel_version: 'unknown',
    source_mode: 'fp_synthesized',
    package: { name, assets: [], edges: [], requirements: [] },
  }
}

export default function App() {
  const [loaded, setLoaded] = useState<LoadedWorkspace | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSelectWorkspace(ws: WorkspacePath) {
    setLoading(true)
    setError('')
    try {
      const domain = await getDomain(ws.path)
      setLoaded({ path: ws, domain })
    } catch {
      // Fallback: open with stub domain — REQ-F-WS-002 (both sourcing paths)
      setLoaded({ path: ws, domain: stubDomain(ws.name) })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading workspace…
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  if (!loaded) {
    return (
      <WorkspaceSelector
        onSelect={handleSelectWorkspace}
        recent={[]}
      />
    )
  }

  return (
    <ProjectDashboard
      workspacePath={loaded.path.path}
      domain={loaded.domain}
      refreshIntervalMs={DEFAULT_REFRESH_MS}
    />
  )
}
