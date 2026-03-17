// Implements: REQ-F-WS-003, REQ-F-WS-004, REQ-F-UX-001

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getWorkspaceSummaries } from '../api/client'
import type { WorkspaceSummary } from '../types'

interface ProjectState {
  // ─── Persisted (localStorage) ──────────────────────────────────────────────
  registeredPaths: string[]
  activeProjectId: string | null

  // ─── Runtime (re-derived on each session) ──────────────────────────────────
  workspaceSummaries: Record<string, WorkspaceSummary>
  lastRefreshed: Date | null
  pollingError: string | null
  isRefreshing: boolean
}

interface ProjectActions {
  addWorkspace: (path: string) => Promise<void>
  removeWorkspace: (id: string) => void
  setActiveProject: (id: string) => void
  refreshAll: () => Promise<void>
}

export type ProjectStore = ProjectState & ProjectActions

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      registeredPaths: [],
      activeProjectId: null,
      workspaceSummaries: {},
      lastRefreshed: null,
      pollingError: null,
      isRefreshing: false,

      addWorkspace: async (path: string) => {
        const { registeredPaths } = get()
        if (registeredPaths.includes(path)) return
        const newPaths = [...registeredPaths, path]
        set({ registeredPaths: newPaths })
        // Immediately fetch the summary for this new workspace
        const summaries = await getWorkspaceSummaries([path])
        if (summaries[0]) {
          set((state) => ({
            workspaceSummaries: { ...state.workspaceSummaries, [path]: summaries[0]! },
          }))
        }
      },

      removeWorkspace: (id: string) => {
        set((state) => {
          const { [id]: _removed, ...rest } = state.workspaceSummaries
          return {
            registeredPaths: state.registeredPaths.filter((p) => p !== id),
            workspaceSummaries: rest,
            activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
          }
        })
      },

      setActiveProject: (id: string) => {
        set({ activeProjectId: id })
      },

      refreshAll: async () => {
        const { isRefreshing, registeredPaths } = get()
        if (isRefreshing || registeredPaths.length === 0) {
          set({ lastRefreshed: new Date(), pollingError: null })
          return
        }
        set({ isRefreshing: true })
        try {
          const summaries = await getWorkspaceSummaries(registeredPaths)
          const summaryMap: Record<string, WorkspaceSummary> = {}
          for (const s of summaries) {
            summaryMap[s.workspaceId] = s
          }
          set({ workspaceSummaries: summaryMap, lastRefreshed: new Date(), pollingError: null, isRefreshing: false })
        } catch (err) {
          set({
            pollingError: err instanceof Error ? err.message : 'Refresh failed',
            isRefreshing: false,
          })
        }
      },
    }),
    {
      name: 'gm:project-store',
      // Only persist user preferences — runtime state re-derived on load
      partialize: (state) => ({
        registeredPaths: state.registeredPaths,
        activeProjectId: state.activeProjectId,
      }),
    },
  ),
)

// Selector: sorted workspace list — attention-required first, then most recent
export function selectSortedWorkspaces(summaries: Record<string, WorkspaceSummary>): WorkspaceSummary[] {
  return Object.values(summaries).sort((a, b) => {
    const aAttn = a.hasAttentionRequired ? 1 : 0
    const bAttn = b.hasAttentionRequired ? 1 : 0
    if (bAttn !== aAttn) return bAttn - aAttn
    const aTs = a.lastEventTimestamp ?? ''
    const bTs = b.lastEventTimestamp ?? ''
    return bTs.localeCompare(aTs)
  })
}
