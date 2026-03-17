// Implements: REQ-F-NAV-001, REQ-F-UX-001

import { Link, useLocation } from 'react-router-dom'

interface WorkspaceSidebarProps {
  workspaceId: string
  projectName: string
}

export function WorkspaceSidebar({ workspaceId, projectName }: WorkspaceSidebarProps) {
  const { pathname } = useLocation()
  const base = '/project/' + workspaceId

  const isOverview = pathname === base || pathname === base + '/'
  const initials = projectName.slice(0, 2).toUpperCase()

  return (
    <aside className="flex-shrink-0 w-16 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-3 gap-1">
      {/* Home — back to project list */}
      <Link
        to="/"
        title="All projects"
        className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors mb-2"
      >
        <span className="text-base leading-none">⌂</span>
        <span className="leading-none">Home</span>
      </Link>

      <div className="w-8 h-px bg-gray-800 mb-1" />

      {/* Project badge */}
      <Link
        to={base}
        title={`${projectName} — Overview`}
        className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold mb-1 transition-colors ${
          isOverview
            ? 'bg-blue-600 text-white ring-2 ring-blue-400/40'
            : 'bg-blue-900/50 text-blue-400 hover:bg-blue-900/80'
        }`}
      >
        {initials}
      </Link>
      <span className="text-[10px] text-gray-600 leading-none max-w-[56px] truncate text-center mb-2">
        {projectName}
      </span>
    </aside>
  )
}
