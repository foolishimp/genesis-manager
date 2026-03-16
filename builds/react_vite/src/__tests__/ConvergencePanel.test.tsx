// Validates: REQ-F-STATE-001, REQ-F-STATE-002, REQ-F-STATE-003, REQ-F-STATE-004
// Validates: REQ-F-STATE-005

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConvergencePanel } from '../components/ConvergencePanel'
import type { GapReport } from '../types'

const noop = vi.fn()

describe('ConvergencePanel', () => {
  it('shows loading when no gap report', () => {
    render(<ConvergencePanel gapReport={null} onFocus={noop} />)
    expect(screen.getByText(/Loading/)).toBeTruthy()
  })

  it('shows CONVERGED when delta is 0', () => {
    const report: GapReport = {
      total_delta: 0,
      per_edge: [],
      timestamp: '2026-03-17T10:00:00Z',
    }
    render(<ConvergencePanel gapReport={report} onFocus={noop} />)
    expect(screen.getByText(/CONVERGED/)).toBeTruthy()
  })

  it('shows delta when not converged', () => {
    const report: GapReport = {
      total_delta: 3,
      per_edge: [
        { edge: 'design→code', delta: 2, failing: ['code_complete'], passing: [] },
        { edge: 'code↔unit_tests', delta: 1, failing: ['tests_pass'], passing: [] },
      ],
      timestamp: '2026-03-17T10:00:00Z',
    }
    render(<ConvergencePanel gapReport={report} onFocus={noop} />)
    expect(screen.getByText(/Δ 3/)).toBeTruthy()
    expect(screen.getByText(/design→code/)).toBeTruthy()
    expect(screen.getByText(/code↔unit_tests/)).toBeTruthy()
  })
})
