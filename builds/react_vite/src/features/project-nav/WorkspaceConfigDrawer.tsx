// Implements: REQ-F-WS-003, REQ-F-WS-004, REQ-F-WS-005

import { useState } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import { FolderBrowser } from './FolderBrowser'

interface WorkspaceConfigDrawerProps {
  open: boolean
  onClose: () => void
}

type InputMode = 'browse' | 'manual'

export function WorkspaceConfigDrawer({ open, onClose }: WorkspaceConfigDrawerProps) {
  const [pathInput, setPathInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [inputMode, setInputMode] = useState<InputMode>('browse')

  const workspaceSummaries = useProjectStore((s) => s.workspaceSummaries)
  const addWorkspace = useProjectStore((s) => s.addWorkspace)
  const removeWorkspace = useProjectStore((s) => s.removeWorkspace)

  const handleAdd = async () => {
    const path = pathInput.trim()
    if (!path) return
    setAdding(true)
    setAddError(null)
    try {
      await addWorkspace(path)
      setPathInput('')
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add workspace')
    } finally {
      setAdding(false)
    }
  }

  const handleSelectWorkspace = async (absolutePath: string) => {
    setAdding(true)
    setAddError(null)
    try {
      await addWorkspace(absolutePath)
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add workspace')
    } finally {
      setAdding(false)
    }
  }

  const workspaceList = Object.values(workspaceSummaries)

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-gray-900 border-l border-gray-800 shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-base font-semibold text-gray-100">Manage Workspaces</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200 text-xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Add workspace */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Add workspace</label>

            <div className="flex gap-1 mb-3">
              {(['browse', 'manual'] as InputMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setInputMode(mode)}
                  className={`text-xs px-3 py-1 rounded transition-colors ${
                    inputMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-700 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {mode === 'browse' ? 'Browse' : 'Manual path'}
                </button>
              ))}
            </div>

            {inputMode === 'browse' ? (
              <FolderBrowser onSelectWorkspace={(p) => void handleSelectWorkspace(p)} />
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pathInput}
                  onChange={(e) => setPathInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void handleAdd() }}
                  placeholder="/path/to/project"
                  className="flex-1 border border-gray-700 rounded px-2 py-1.5 text-sm font-mono bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => void handleAdd()}
                  disabled={adding || !pathInput.trim()}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {adding ? 'Adding…' : 'Add'}
                </button>
              </div>
            )}

            {addError && <p className="mt-1 text-xs text-red-400">{addError}</p>}
            {adding && <p className="mt-1 text-xs text-gray-500">Adding workspace…</p>}
          </div>

          {/* Registered workspaces list */}
          <div>
            <h3 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Registered ({workspaceList.length})
            </h3>
            {workspaceList.length === 0 ? (
              <p className="text-sm text-gray-600 italic">No workspaces registered yet.</p>
            ) : (
              <ul className="divide-y divide-gray-800">
                {workspaceList.map((ws) => (
                  <li key={ws.workspaceId} className="flex items-center justify-between py-2 gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{ws.projectName}</p>
                      <p className="text-xs text-gray-600 font-mono truncate">{ws.workspaceId}</p>
                      {!ws.available && <p className="text-xs text-red-400">Unavailable</p>}
                    </div>
                    <button
                      onClick={() => removeWorkspace(ws.workspaceId)}
                      className="flex-shrink-0 text-xs text-red-400 hover:text-red-300 border border-red-900 rounded px-2 py-0.5"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
