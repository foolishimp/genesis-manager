// Validates: REQ-F-WS-001, REQ-F-WS-003, REQ-F-WS-004, REQ-F-WS-013, REQ-F-WS-014

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkspaceSelector } from '../components/WorkspaceSelector'

describe('WorkspaceSelector', () => {
  it('renders title', () => {
    render(<WorkspaceSelector onSelect={vi.fn()} recent={[]} />)
    expect(screen.getByText('Genesis Manager')).toBeTruthy()
  })

  it('shows Recent and Browse tabs', () => {
    render(<WorkspaceSelector onSelect={vi.fn()} recent={[]} />)
    expect(screen.getByText('Recent')).toBeTruthy()
    expect(screen.getByText('Browse')).toBeTruthy()
  })

  it('shows empty recent message when no recent workspaces', () => {
    render(<WorkspaceSelector onSelect={vi.fn()} recent={[]} />)
    expect(screen.getByText(/No recent workspaces/)).toBeTruthy()
  })

  it('switches to Browse tab', () => {
    render(<WorkspaceSelector onSelect={vi.fn()} recent={[]} />)
    fireEvent.click(screen.getByText('Browse'))
    expect(screen.getByPlaceholderText(/Scan root/)).toBeTruthy()
  })
})
