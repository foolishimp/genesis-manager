// Implements: REQ-F-WS-001, REQ-F-WS-002, REQ-F-UX-001, REQ-F-NAV-001

import { useEffect } from 'react'
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { useProjectStore } from './stores/projectStore'
import { ProjectListPage } from './features/project-nav/ProjectListPage'
import { WorkspaceRoute } from './components/WorkspaceRoute'

// RootLayout — sets up global 30-second polling of workspace summaries
function RootLayout() {
  const refreshAll = useProjectStore((s) => s.refreshAll)

  useEffect(() => {
    void refreshAll()
    const id = setInterval(() => void refreshAll(), 30_000)
    return () => clearInterval(id)
  }, [refreshAll])

  return <Outlet />
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <ProjectListPage /> },
      { path: '/project/:workspaceId', element: <WorkspaceRoute /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
