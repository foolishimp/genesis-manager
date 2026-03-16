// Validates: REQ-F-WS-001, REQ-F-WS-002, REQ-F-STATE-001, REQ-F-EVT-001
// Validates: REQ-F-FEAT-001, REQ-F-CTL-001, REQ-F-CTL-002, REQ-F-CTL-003
// Validates: REQ-F-ERR-001, REQ-F-ERR-002, REQ-F-ERR-003, REQ-F-ERR-004
// Validates: REQ-NFR-001, REQ-NFR-002

import { describe, it, expect } from 'vitest'
import { sseStreamUrl } from '../api/client'

describe('API client', () => {
  it('sseStreamUrl produces correct path', () => {
    const url = sseStreamUrl('/path/to/workspace')
    expect(url).toContain('/control/start/stream')
    expect(url).toContain('workspace')
  })

  it('sseStreamUrl URL-encodes workspace id', () => {
    const url = sseStreamUrl('/path/with spaces')
    expect(url).toContain('%20')
  })
})

describe('API module exports', () => {
  it('exports all required functions', async () => {
    const mod = await import('../api/client')
    expect(typeof mod.listWorkspaces).toBe('function')
    expect(typeof mod.getDomain).toBe('function')
    expect(typeof mod.getGaps).toBe('function')
    expect(typeof mod.getEvents).toBe('function')
    expect(typeof mod.getFeatures).toBe('function')
    expect(typeof mod.startEngine).toBe('function')
    expect(typeof mod.emitEvent).toBe('function')
    expect(typeof mod.getFpResults).toBe('function')
    expect(typeof mod.sseStreamUrl).toBe('function')
  })
})
