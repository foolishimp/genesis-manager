// Validates: REQ-F-TRUST-001, REQ-F-TRUST-002, REQ-F-TRUST-003

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrustBar } from '../components/TrustBar'

describe('TrustBar', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <TrustBar
        lastGapsTime={null}
        lastEventTime={null}
        sourceMode="fd_describe"
        staleAssessmentCount={0}
      />,
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('shows amber banner when source_mode is fp_synthesized', () => {
    render(
      <TrustBar
        lastGapsTime={null}
        lastEventTime={null}
        sourceMode="fp_synthesized"
        staleAssessmentCount={0}
      />,
    )
    expect(screen.getByText(/Domain model synthesised/)).toBeTruthy()
  })

  it('shows stale count when staleAssessmentCount > 0', () => {
    render(
      <TrustBar
        lastGapsTime={null}
        lastEventTime={null}
        sourceMode="fd_describe"
        staleAssessmentCount={3}
      />,
    )
    expect(screen.getByText(/3 stale/)).toBeTruthy()
  })

  it('shows gap time when provided', () => {
    const d = new Date('2026-03-17T10:00:00Z')
    render(
      <TrustBar
        lastGapsTime={d}
        lastEventTime={null}
        sourceMode="fd_describe"
        staleAssessmentCount={0}
      />,
    )
    expect(screen.getByText(/gaps:/)).toBeTruthy()
  })
})
