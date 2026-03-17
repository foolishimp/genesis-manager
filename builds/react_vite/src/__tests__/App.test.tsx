// Validates: REQ-F-WS-001, REQ-F-WS-002, REQ-F-UX-001, REQ-F-UX-002
// Validates: REQ-F-WS-003, REQ-F-WS-004, REQ-F-NAV-001

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

// Suppress router future flag warnings in tests
vi.spyOn(console, 'warn').mockImplementation(() => undefined)

describe('App', () => {
  it('renders Genesis Manager header on initial load', async () => {
    render(<App />)
    // ProjectListPage shows the header
    expect(screen.getByText('Genesis Manager')).toBeTruthy()
  })

  it('shows Add workspace button on initial load', async () => {
    render(<App />)
    expect(screen.getByText('+ Add workspace')).toBeTruthy()
  })

  it('shows empty state when no workspaces registered', async () => {
    render(<App />)
    expect(screen.getByText(/No workspaces registered/)).toBeTruthy()
  })
})
