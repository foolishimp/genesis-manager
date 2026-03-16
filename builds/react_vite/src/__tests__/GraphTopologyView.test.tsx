// Validates: REQ-F-SPEC-001, REQ-F-SPEC-002, REQ-F-SPEC-003, REQ-F-SPEC-004
// Validates: REQ-F-SPEC-005, REQ-F-SPEC-006

import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { GraphTopologyView } from '../components/GraphTopologyView'
import type { DomainModel, EdgeGap } from '../types'

const domain: DomainModel = {
  kernel_version: '0.1.5',
  source_mode: 'fd_describe',
  package: {
    name: 'test',
    assets: [
      { name: 'requirements', markov: [] },
      { name: 'design', markov: [] },
      { name: 'code', markov: [] },
    ],
    edges: [
      { source: 'requirements', target: 'design', evaluators: ['design_fp', 'design_fh'] },
      { source: 'design', target: 'code', evaluators: ['build_ok', 'impl_tags', 'code_fp'] },
    ],
    requirements: ['REQ-F-WS-001'],
  },
}

const gapsByEdge = new Map<string, EdgeGap>([
  ['requirements→design', { edge: 'requirements→design', delta: 0, failing: [], passing: ['design_fh'] }],
  ['design→code', { edge: 'design→code', delta: 1, failing: ['code_fp'], passing: ['build_ok'] }],
])

describe('GraphTopologyView', () => {
  it('renders SVG with assets as nodes', () => {
    const { container } = render(
      <GraphTopologyView domain={domain} gapsByEdge={gapsByEdge} onFocus={vi.fn()} />,
    )
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
  })

  it('renders all asset names', () => {
    const { getByText } = render(
      <GraphTopologyView domain={domain} gapsByEdge={gapsByEdge} onFocus={vi.fn()} />,
    )
    expect(getByText('requirements')).toBeTruthy()
    expect(getByText('design')).toBeTruthy()
    expect(getByText('code')).toBeTruthy()
  })

  it('calls onFocus when edge label clicked', () => {
    const onFocus = vi.fn()
    const { container } = render(
      <GraphTopologyView domain={domain} gapsByEdge={gapsByEdge} onFocus={onFocus} />,
    )
    // Find edge delta text (Δ1 or Δ0)
    const texts = container.querySelectorAll('text')
    const deltaText = Array.from(texts).find((t) => t.textContent?.startsWith('Δ'))
    if (deltaText) {
      deltaText.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      expect(onFocus).toHaveBeenCalled()
    }
  })

  it('renders empty graph with no assets', () => {
    const emptyDomain: DomainModel = {
      ...domain,
      package: { ...domain.package, assets: [], edges: [] },
    }
    const { container } = render(
      <GraphTopologyView domain={emptyDomain} gapsByEdge={new Map()} onFocus={vi.fn()} />,
    )
    expect(container.querySelector('svg')).not.toBeNull()
  })
})
