// Validates: REQ-F-EVT-001, REQ-F-EVT-002, REQ-F-EVT-004, REQ-F-EVT-005
// Validates: REQ-F-EVT-006, REQ-F-EVT-007

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EventStream } from '../components/EventStream'
import type { WorkspaceEvent } from '../types'

const events: WorkspaceEvent[] = [
  {
    seq: 1,
    event_type: 'fp_assessment',
    event_time: '2026-03-17T10:00:00Z',
    edge: 'design→code',
    data: { evaluator: 'code_complete', result: 'pass' },
  },
  {
    seq: 2,
    event_type: 'review_approved',
    event_time: '2026-03-17T10:01:00Z',
    data: { actor: 'human-proxy' },
  },
]

describe('EventStream', () => {
  it('shows events in list', () => {
    render(
      <EventStream
        events={events}
        watermarkSeq={0}
        onMarkSeen={vi.fn()}
        onFocus={vi.fn()}
      />,
    )
    expect(screen.getByText('fp_assessment')).toBeTruthy()
    expect(screen.getByText('review_approved')).toBeTruthy()
  })

  it('shows unread badge for events above watermark', () => {
    render(
      <EventStream
        events={events}
        watermarkSeq={0}
        onMarkSeen={vi.fn()}
        onFocus={vi.fn()}
      />,
    )
    // badge shows unread count (2 events)
    expect(screen.getAllByText('2').length).toBeGreaterThan(0)
  })

  it('shows no unread when all marked seen', () => {
    render(
      <EventStream
        events={events}
        watermarkSeq={2}
        onMarkSeen={vi.fn()}
        onFocus={vi.fn()}
      />,
    )
    // mark all seen button should be disabled (unread = 0)
    const btn = screen.getByText('Mark all seen')
    expect(btn.hasAttribute('disabled')).toBe(true)
  })

  it('calls onMarkSeen when button clicked', () => {
    const onMarkSeen = vi.fn()
    render(
      <EventStream
        events={events}
        watermarkSeq={0}
        onMarkSeen={onMarkSeen}
        onFocus={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByText('Mark all seen'))
    expect(onMarkSeen).toHaveBeenCalled()
  })

  it('filters events by type', () => {
    render(
      <EventStream
        events={events}
        watermarkSeq={0}
        onMarkSeen={vi.fn()}
        onFocus={vi.fn()}
      />,
    )
    const input = screen.getByPlaceholderText(/Filter by event type/)
    fireEvent.change(input, { target: { value: 'fp_assessment' } })
    expect(screen.getByText('fp_assessment')).toBeTruthy()
    expect(screen.queryByText('review_approved')).toBeNull()
  })
})
