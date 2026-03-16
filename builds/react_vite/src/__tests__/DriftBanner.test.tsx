// Validates: REQ-F-DRIFT-001, REQ-F-DRIFT-002, REQ-F-DRIFT-003, REQ-F-DRIFT-004

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DriftBanner } from '../components/DriftBanner'

describe('DriftBanner', () => {
  it('renders nothing when no drift', () => {
    const { container } = render(
      <DriftBanner configDrift={null} installChurn={null} layoutInconsistencies={[]} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows config drift message', () => {
    render(
      <DriftBanner
        configDrift={{ declared: 'builds/python', actual: 'builds/react_vite', description: 'mismatch' }}
        installChurn={null}
        layoutInconsistencies={[]}
      />,
    )
    expect(screen.getByText(/Config drift/)).toBeTruthy()
    expect(screen.getByText(/mismatch/)).toBeTruthy()
  })

  it('shows install churn message', () => {
    render(
      <DriftBanner
        configDrift={null}
        installChurn={{ count: 5, lastInstallTime: '2026-03-17T10:00:00Z' }}
        layoutInconsistencies={[]}
      />,
    )
    expect(screen.getByText(/Install churn/)).toBeTruthy()
    expect(screen.getByText(/5 installs/)).toBeTruthy()
  })

  it('shows layout inconsistencies', () => {
    render(
      <DriftBanner
        configDrift={null}
        installChurn={null}
        layoutInconsistencies={['missing: src/tests']}
      />,
    )
    expect(screen.getByText(/Layout inconsistencies/)).toBeTruthy()
  })
})
