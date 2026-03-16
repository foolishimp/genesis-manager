// Validates: REQ-F-FEAT-001, REQ-F-FEAT-002, REQ-F-FEAT-003, REQ-F-FEAT-004
// Validates: REQ-F-FEAT-005

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FeaturePanel } from '../components/FeaturePanel'
import type { FeatureVector } from '../types'

const noop = vi.fn()

const features: FeatureVector[] = [
  {
    id: 'FT-WS-001',
    status: 'active',
    satisfies: ['REQ-F-WS-001', 'REQ-F-WS-002', 'REQ-F-WS-003'],
    dependencies: [],
    yaml_text: 'id: FT-WS-001\nstatus: active\n',
  },
  {
    id: 'FT-CTL-001',
    status: 'completed',
    satisfies: ['REQ-F-CTL-001', 'REQ-F-CTL-002'],
    dependencies: ['FT-WS-001'],
    yaml_text: 'id: FT-CTL-001\nstatus: completed\n',
  },
]

describe('FeaturePanel', () => {
  it('renders feature count', () => {
    render(<FeaturePanel features={features} onFocus={noop} />)
    expect(screen.getByText(/Features \(2\)/)).toBeTruthy()
  })

  it('shows feature IDs', () => {
    render(<FeaturePanel features={features} onFocus={noop} />)
    expect(screen.getByText('FT-WS-001')).toBeTruthy()
    expect(screen.getByText('FT-CTL-001')).toBeTruthy()
  })

  it('shows status badges', () => {
    render(<FeaturePanel features={features} onFocus={noop} />)
    expect(screen.getByText('active')).toBeTruthy()
    expect(screen.getByText('completed')).toBeTruthy()
  })

  it('shows coverage bar', () => {
    render(<FeaturePanel features={features} onFocus={noop} />)
    expect(screen.getByText(/REQ keys covered/)).toBeTruthy()
  })

  it('renders empty state gracefully', () => {
    render(<FeaturePanel features={[]} onFocus={noop} />)
    expect(screen.getByText(/Features \(0\)/)).toBeTruthy()
  })
})
