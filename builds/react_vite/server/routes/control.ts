// Implements: REQ-F-CTL-001, REQ-F-CTL-002, REQ-F-CTL-003, REQ-F-CTL-004
// Implements: REQ-F-CTL-006, REQ-F-GATE-003, REQ-F-GATE-004

import { Router } from 'express'
import { spawn } from 'child_process'
import { execSync } from 'child_process'

export const controlRouter = Router({ mergeParams: true })

// Track running processes per workspace — REQ-F-CTL-002 (reject 409 if running)
const running = new Map<string, ReturnType<typeof spawn>>()

// SSE output buffer per workspace — REQ-F-CTL-003
const outputBuffers = new Map<string, string[]>()
const sseClients = new Map<string, Set<import('express').Response>>()

// POST /api/workspace/:id/control/start
// REQ-F-CTL-001: spawn genesis start with flags
controlRouter.post('/start', (req, res) => {
  const workspacePath = decodeURIComponent(req.params.id)
  const { flags } = req.body as { flags: string[] }

  if (running.has(workspacePath)) {
    res.status(409).json({ error: 'process already running' })
    return
  }

  const args = ['-m', 'genesis', 'start', ...flags, '--workspace', workspacePath]
  const proc = spawn('python', args, {
    cwd: workspacePath,
    env: { ...process.env, PYTHONPATH: '.genesis' },
  })

  running.set(workspacePath, proc)
  outputBuffers.set(workspacePath, [])

  function broadcast(type: string, data: string) {
    const clients = sseClients.get(workspacePath)
    if (clients) {
      for (const client of clients) {
        client.write(`event: ${type}\ndata: ${data}\n\n`)
      }
    }
    if (type === 'output') {
      outputBuffers.get(workspacePath)?.push(data)
    }
  }

  proc.stdout.on('data', (chunk: Buffer) => {
    broadcast('output', chunk.toString())
  })

  proc.stderr.on('data', (chunk: Buffer) => {
    broadcast('output', chunk.toString())
  })

  proc.on('close', (exitCode) => {
    broadcast('done', JSON.stringify({ exitCode }))
    running.delete(workspacePath)
    // Close all SSE clients
    sseClients.get(workspacePath)?.forEach((c) => c.end())
    sseClients.delete(workspacePath)
  })

  res.json({ pid: proc.pid ?? 0 })
})

// GET /api/workspace/:id/control/start/stream (SSE)
// REQ-F-CTL-003: stream process output
controlRouter.get('/start/stream', (req, res) => {
  const workspacePath = decodeURIComponent(req.params.id)

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  // Send buffered output to catch up late subscribers
  const buffer = outputBuffers.get(workspacePath) ?? []
  for (const line of buffer) {
    res.write(`event: output\ndata: ${line}\n\n`)
  }

  // If process already done, send done event
  if (!running.has(workspacePath) && buffer.length > 0) {
    res.write(`event: done\ndata: ${JSON.stringify({ exitCode: 0 })}\n\n`)
    res.end()
    return
  }

  // Register as SSE client
  if (!sseClients.has(workspacePath)) {
    sseClients.set(workspacePath, new Set())
  }
  sseClients.get(workspacePath)!.add(res)

  req.on('close', () => {
    sseClients.get(workspacePath)?.delete(res)
  })
})

// POST /api/workspace/:id/control/emit
// REQ-F-CTL-006: emit event via genesis emit-event
// REQ-F-GATE-003, REQ-F-GATE-004: gate approve/reject
const VALID_TYPES = new Set([
  'fp_assessment', 'review_approved', 'review_rejected',
  'bug_fixed', 'intent_raised', 'genesis_installed',
])

controlRouter.post('/emit', (req, res) => {
  const workspacePath = decodeURIComponent(req.params.id)
  const { type, data } = req.body as { type: string; data: Record<string, unknown> }

  if (!VALID_TYPES.has(type)) {
    res.status(400).json({ error: `unknown event type: ${type}` })
    return
  }

  if (type === 'fp_assessment' && !data.spec_hash) {
    res.status(400).json({ error: 'fp_assessment requires spec_hash' })
    return
  }

  if (type === 'review_rejected' && !data.reason) {
    res.status(400).json({ error: 'review_rejected requires reason' })
    return
  }

  try {
    execSync(
      `PYTHONPATH=.genesis python -m genesis emit-event --type ${type} --data '${JSON.stringify(data)}'`,
      { cwd: workspacePath },
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})
