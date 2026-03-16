// Validates: REQ-F-NAV-001, REQ-F-NAV-002, REQ-F-NAV-003, REQ-F-NAV-004
// Validates: REQ-F-NAV-005

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NavLink, ReqKeyLink, EdgeLink, EventLink, FeatureLink, EvaluatorLink } from '../components/NavHandles'
import type { FocusedEntity } from '../types'

describe('NavHandles', () => {
  it('NavLink calls onFocus with entity on click', () => {
    const onFocus = vi.fn()
    const entity: FocusedEntity = { type: 'req', key: 'REQ-F-WS-001' }
    render(<NavLink entity={entity} onFocus={onFocus}>REQ-F-WS-001</NavLink>)
    fireEvent.click(screen.getByText('REQ-F-WS-001'))
    expect(onFocus).toHaveBeenCalledWith(entity)
  })

  it('ReqKeyLink renders req key', () => {
    const onFocus = vi.fn()
    render(<ReqKeyLink reqKey="REQ-F-STATE-001" onFocus={onFocus} />)
    expect(screen.getByText('REQ-F-STATE-001')).toBeTruthy()
  })

  it('EdgeLink renders edge name', () => {
    const onFocus = vi.fn()
    render(<EdgeLink edgeName="design→code" onFocus={onFocus} />)
    expect(screen.getByText('design→code')).toBeTruthy()
  })

  it('EventLink renders seq', () => {
    const onFocus = vi.fn()
    render(<EventLink seq={42} onFocus={onFocus} />)
    expect(screen.getByText('#42')).toBeTruthy()
  })

  it('FeatureLink calls onFocus with feature entity', () => {
    const onFocus = vi.fn()
    render(<FeatureLink featureId="FT-CTL-001" onFocus={onFocus} />)
    fireEvent.click(screen.getByText('FT-CTL-001'))
    expect(onFocus).toHaveBeenCalledWith({ type: 'feature', id: 'FT-CTL-001' })
  })

  it('EvaluatorLink calls onFocus with evaluator entity', () => {
    const onFocus = vi.fn()
    render(<EvaluatorLink name="code_complete" edge="design→code" onFocus={onFocus} />)
    fireEvent.click(screen.getByText('code_complete'))
    expect(onFocus).toHaveBeenCalledWith({
      type: 'evaluator',
      name: 'code_complete',
      edge: 'design→code',
    })
  })
})
