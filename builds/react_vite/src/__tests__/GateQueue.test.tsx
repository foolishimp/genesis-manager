// Validates: REQ-F-GATE-001, REQ-F-GATE-002, REQ-F-GATE-003, REQ-F-GATE-004
// Validates: REQ-F-GATE-007, REQ-F-GATE-008

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GateQueue } from '../components/GateQueue'
import type { PendingGate } from '../types'

const noop = vi.fn()

const pendingGate: PendingGate = {
  edge: 'design→code',
  feature: 'FT-CTL-001',
  criteria: ['Human approves design before any code is written'],
  eventTime: '2026-03-17T10:00:00Z',
  state: 'pending',
}

describe('GateQueue', () => {
  it('shows empty state when no gates', () => {
    render(
      <GateQueue
        gates={[]}
        workspaceId="/workspace"
        onFocus={noop}
        onGateDecision={vi.fn().mockResolvedValue(undefined)}
      />,
    )
    expect(screen.getByText(/No pending gates/)).toBeTruthy()
  })

  it('renders pending gate with criteria', () => {
    render(
      <GateQueue
        gates={[pendingGate]}
        workspaceId="/workspace"
        onFocus={noop}
        onGateDecision={vi.fn().mockResolvedValue(undefined)}
      />,
    )
    expect(screen.getByText(/design→code/)).toBeTruthy()
    expect(screen.getByText(/Human approves design/)).toBeTruthy()
  })

  it('shows approve button for pending gate', () => {
    render(
      <GateQueue
        gates={[pendingGate]}
        workspaceId="/workspace"
        onFocus={noop}
        onGateDecision={vi.fn().mockResolvedValue(undefined)}
      />,
    )
    expect(screen.getAllByText('Approve').length).toBeGreaterThan(0)
  })

  it('calls onGateDecision with approved=true on approve', () => {
    const onDecision = vi.fn().mockResolvedValue(undefined)
    render(
      <GateQueue
        gates={[pendingGate]}
        workspaceId="/workspace"
        onFocus={noop}
        onGateDecision={onDecision}
      />,
    )
    fireEvent.click(screen.getAllByText('Approve')[0]!)
    expect(onDecision).toHaveBeenCalledWith(pendingGate, true, undefined)
  })

  it('shows rejection form when reject clicked', () => {
    render(
      <GateQueue
        gates={[pendingGate]}
        workspaceId="/workspace"
        onFocus={noop}
        onGateDecision={vi.fn().mockResolvedValue(undefined)}
      />,
    )
    fireEvent.click(screen.getByText('Reject'))
    expect(screen.getByPlaceholderText(/Rejection reason/)).toBeTruthy()
  })
})
