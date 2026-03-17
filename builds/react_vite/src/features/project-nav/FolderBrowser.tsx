// Implements: REQ-F-WS-005

import { useState, useEffect, useCallback } from 'react'
import { browsePath } from '../../api/client'
import type { FsEntry } from '../../types'

interface FolderBrowserProps {
  onSelectWorkspace: (absolutePath: string) => void
  initialPath?: string
}

export function FolderBrowser({ onSelectWorkspace, initialPath }: FolderBrowserProps) {
  const [currentPath, setCurrentPath] = useState('')
  const [parent, setParent] = useState<string | null>(null)
  const [entries, setEntries] = useState<FsEntry[]>([])
  const [truncated, setTruncated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const navigate = useCallback(async (targetPath?: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await browsePath(targetPath)
      setCurrentPath(result.path)
      setParent(result.parent)
      setEntries(result.entries)
      setTruncated(result.truncated ?? false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to browse')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void navigate(initialPath)
  }, [initialPath, navigate])

  const breadcrumbSegments = currentPath.split('/').filter(Boolean)

  return (
    <div className="flex flex-col gap-2 text-sm">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs font-mono flex-wrap min-h-[1.5rem]">
        <button
          onClick={() => void navigate('/')}
          className="hover:underline text-gray-500 hover:text-gray-200"
        >
          /
        </button>
        {breadcrumbSegments.map((seg, i) => {
          const segPath = '/' + breadcrumbSegments.slice(0, i + 1).join('/')
          return (
            <span key={segPath} className="flex items-center gap-1">
              <span className="text-gray-700">/</span>
              <button
                onClick={() => void navigate(segPath)}
                className="hover:underline text-gray-500 hover:text-gray-200"
              >
                {seg}
              </button>
            </span>
          )
        })}
        {parent && (
          <button
            onClick={() => void navigate(parent)}
            className="ml-auto text-xs text-gray-500 hover:text-gray-200 border border-gray-700 rounded px-1.5 py-0.5"
          >
            ↑ Up
          </button>
        )}
      </div>

      {loading && <p className="text-gray-600 italic text-xs">Loading…</p>}
      {error && <p className="text-red-400 text-xs">{error}</p>}
      {!loading && !error && (
        <ul className="divide-y divide-gray-800 max-h-64 overflow-y-auto rounded border border-gray-800">
          {entries.length === 0 && (
            <li className="px-3 py-2 text-xs text-gray-600 italic">No subdirectories found</li>
          )}
          {entries.map((entry) => (
            <li key={entry.absolutePath} className="flex items-center justify-between px-3 py-2 hover:bg-gray-800">
              <button
                onClick={() => void navigate(entry.absolutePath)}
                className="flex items-center gap-2 min-w-0 text-left flex-1"
              >
                <span>{entry.hasWorkspace ? '🟢' : '📁'}</span>
                <span className="truncate text-gray-300">{entry.name}</span>
                {entry.hasWorkspace && (
                  <span className="text-xs text-blue-400 font-medium shrink-0 ml-1">Genesis</span>
                )}
              </button>
              {entry.hasWorkspace && (
                <button
                  onClick={() => onSelectWorkspace(entry.absolutePath)}
                  className="shrink-0 ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-500"
                >
                  Add
                </button>
              )}
            </li>
          ))}
          {truncated && (
            <li className="px-3 py-2 text-xs text-gray-600 italic">
              ⚠ 500 entries shown — navigate into a subfolder to see more
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
