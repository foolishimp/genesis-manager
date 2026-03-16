// Implements: REQ-F-WS-001, REQ-F-WS-003, REQ-F-WS-004, REQ-F-WS-005
// Implements: REQ-F-WS-006, REQ-F-WS-007, REQ-F-WS-008, REQ-F-WS-009
// Implements: REQ-F-WS-010, REQ-F-WS-011, REQ-F-WS-012, REQ-F-WS-013
// Implements: REQ-F-WS-014, REQ-F-WS-015, REQ-F-WS-016

import { useState, useEffect } from 'react'
import type { WorkspaceSelectorProps, WorkspacePath } from '../types'
import { listWorkspaces } from '../api/client'

interface FsBrowserProps {
  onSelect: (path: WorkspacePath) => void
}

function FsBrowser({ onSelect }: FsBrowserProps) {
  const [root, setRoot] = useState('')
  const [workspaces, setWorkspaces] = useState<WorkspacePath[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function scan() {
    setLoading(true)
    setError('')
    try {
      const ws = await listWorkspaces(root || undefined)
      setWorkspaces(
        ws.map((w) => ({ name: w.name, path: w.path, genesis_yml_path: w.path + '/.genesis/genesis.yml' })),
      )
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2 text-sm"
          placeholder="Scan root (default: home)"
          value={root}
          onChange={(e) => setRoot(e.target.value)}
        />
        <button
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          onClick={scan}
          disabled={loading}
        >
          {loading ? 'Scanning…' : 'Scan'}
        </button>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {workspaces.length > 0 && (
        <div className="space-y-1">
          {workspaces.map((ws) => (
            <button
              key={ws.path}
              className="w-full text-left px-3 py-2 border rounded hover:bg-blue-50 text-sm"
              onClick={() => onSelect(ws)}
            >
              <div className="font-medium">{ws.name}</div>
              <div className="text-xs text-gray-500 font-mono">{ws.path}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// localStorage keys — REQ-F-WS-013, REQ-F-WS-014
const RECENT_KEY = 'genesis_manager_recent_workspaces'
const MAX_RECENT = 10

function loadRecent(): WorkspacePath[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? (JSON.parse(raw) as WorkspacePath[]) : []
  } catch {
    return []
  }
}

function saveRecent(recent: WorkspacePath[]) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
}

export function WorkspaceSelector({ onSelect, recent: _recent, scanRoot }: WorkspaceSelectorProps) {
  const [recent, setRecent] = useState<WorkspacePath[]>([])
  const [tab, setTab] = useState<'recent' | 'browse'>('recent')

  useEffect(() => {
    setRecent(loadRecent())
  }, [])

  function handleSelect(ws: WorkspacePath) {
    const updated = [ws, ...recent.filter((r) => r.path !== ws.path)]
    saveRecent(updated)
    setRecent(updated)
    onSelect(ws)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-md w-full max-w-lg p-6 space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">Genesis Manager</h1>
        <p className="text-sm text-gray-600">Select a workspace to supervise</p>

        <div className="flex gap-2 border-b">
          <button
            className={`px-3 py-2 text-sm border-b-2 -mb-px ${
              tab === 'recent'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setTab('recent')}
          >
            Recent
          </button>
          <button
            className={`px-3 py-2 text-sm border-b-2 -mb-px ${
              tab === 'browse'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setTab('browse')}
          >
            Browse
          </button>
        </div>

        {tab === 'recent' && (
          <div className="space-y-1">
            {recent.length === 0 ? (
              <div className="text-sm text-gray-500 py-4 text-center">
                No recent workspaces. Use Browse to find one.
              </div>
            ) : (
              recent.map((ws) => (
                <button
                  key={ws.path}
                  className="w-full text-left px-3 py-2 border rounded hover:bg-blue-50 text-sm"
                  onClick={() => handleSelect(ws)}
                >
                  <div className="font-medium">{ws.name}</div>
                  <div className="text-xs text-gray-500 font-mono">{ws.path}</div>
                </button>
              ))
            )}
          </div>
        )}

        {tab === 'browse' && (
          <FsBrowser onSelect={handleSelect} />
        )}

        {/* scanRoot is passed through for use by FsBrowser if needed */}
        {scanRoot && tab === 'browse' && (
          <div className="text-xs text-gray-400">Configured scan root: {scanRoot}</div>
        )}
      </div>
    </div>
  )
}
