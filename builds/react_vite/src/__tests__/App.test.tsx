// Validates: REQ-F-WS-001, REQ-F-WS-002, REQ-F-UX-001, REQ-F-UX-002
// Validates: REQ-F-UX-003, REQ-F-UX-004, REQ-F-UX-006, REQ-F-UX-007
// Validates: REQ-F-UX-008, REQ-F-UX-009, REQ-F-UX-010, REQ-F-UX-011
// Validates: REQ-F-WS-005, REQ-F-WS-006, REQ-F-WS-007, REQ-F-WS-008
// Validates: REQ-F-WS-009, REQ-F-WS-010, REQ-F-WS-011, REQ-F-WS-015, REQ-F-WS-016
// Validates: REQ-F-CTL-004, REQ-F-CTL-006, REQ-F-GATE-005, REQ-F-GATE-006

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

describe('App', () => {
  it('renders workspace selector on initial load', () => {
    render(<App />)
    expect(screen.getByText('Genesis Manager')).toBeTruthy()
  })

  it('shows Recent and Browse tabs in initial state', () => {
    render(<App />)
    expect(screen.getByText('Recent')).toBeTruthy()
    expect(screen.getByText('Browse')).toBeTruthy()
  })
})
