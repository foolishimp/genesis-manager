// Validates: REQ-F-CTL-005, REQ-F-CTL-007, REQ-F-UX-005

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EngineStateBar } from '../components/EngineStateBar'

describe('EngineStateBar', () => {
  it('shows idle state', () => {
    render(<EngineStateBar state={{ status: 'idle' }} />)
    expect(screen.getByText(/idle/)).toBeTruthy()
  })

  it('shows converged state', () => {
    render(<EngineStateBar state={{ status: 'converged' }} />)
    expect(screen.getByText(/CONVERGED/)).toBeTruthy()
  })

  it('shows running state with edge', () => {
    render(<EngineStateBar state={{ status: 'running', edge: 'design→code' }} />)
    expect(screen.getByText(/RUNNING/)).toBeTruthy()
    expect(screen.getByText(/design→code/)).toBeTruthy()
  })

  it('shows blocked state with evaluators', () => {
    render(
      <EngineStateBar
        state={{ status: 'blocked', edge: 'code↔unit_tests', blockingEvaluators: ['tests_pass'] }}
      />,
    )
    expect(screen.getByText(/BLOCKED/)).toBeTruthy()
    expect(screen.getByText(/tests_pass/)).toBeTruthy()
  })

  it('shows next state with action', () => {
    render(
      <EngineStateBar
        state={{
          status: 'next',
          action: {
            edge: 'design→code',
            requiresHuman: false,
            requiresFp: true,
            blockingFd: [],
          },
        }}
      />,
    )
    expect(screen.getByText(/NEXT/)).toBeTruthy()
    expect(screen.getByText(/F_P dispatch/)).toBeTruthy()
  })
})
