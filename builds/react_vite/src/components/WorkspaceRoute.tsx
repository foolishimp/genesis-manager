// Implements: REQ-F-WS-001, REQ-F-WS-002, REQ-F-NAV-001

import { useState, useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { getDomain } from '../api/client'
import { WorkspaceSidebar } from './WorkspaceSidebar'
import { ProjectDashboard } from './ProjectDashboard'
import type { DomainModel } from '../types'

const DEFAULT_REFRESH_MS = 10_000

function stubDomain(name: string): DomainModel {
  return {
    kernel_version: 'unknown',
    source_mode: 'fp_synthesized',
    spec_hash: '0'.repeat(16),
    config_drift: null,
    package: { name, assets: [], edges: [], requirements: [] },
  }
}

export function WorkspaceRoute() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const path = workspaceId ? decodeURIComponent(workspaceId) : null
  const [domain, setDomain] = useState<DomainModel | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!path) return
    getDomain(path)
      .then(setDomain)
      .catch(() => setDomain(stubDomain(path.split('/').pop() ?? path)))
      .finally(() => setLoading(false))
  }, [path])

  if (!path) return <Navigate to="/" replace />

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading workspace…
      </div>
    )
  }

  const projectName = path.split('/').pop() ?? path

  return (
    <div className="flex min-h-screen">
      <WorkspaceSidebar workspaceId={workspaceId!} projectName={projectName} />
      <div className="flex-1 min-w-0">
        <ProjectDashboard
          workspacePath={path}
          domain={domain!}
          refreshIntervalMs={DEFAULT_REFRESH_MS}
        />
      </div>
    </div>
  )
}
