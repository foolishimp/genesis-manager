// Implements: REQ-F-WS-001, REQ-F-WS-003, REQ-F-WS-004, REQ-F-WS-005, REQ-F-WS-009, REQ-F-WS-010

import { Router } from 'express'
import { scanWorkspaces, getDomain, getGaps, getFeatures, getWorkspaceSummary, browseDirectory } from '../readers/WorkspaceReader'
import { readEvents, readFpResults } from '../readers/EventLogReader'
import { homedir } from 'os'

export const workspacesRouter = Router()

// GET /api/workspaces?root={path}
// REQ-F-WS-003: discover workspaces by scanning filesystem
workspacesRouter.get('/', (req, res) => {
  const root = (req.query.root as string) || homedir()
  try {
    const ws = scanWorkspaces(root)
    res.json(ws)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// POST /api/workspaces/summaries
// REQ-F-WS-004: batch workspace summaries for registered paths
workspacesRouter.post('/summaries', (req, res) => {
  const { paths } = req.body as { paths: string[] }
  if (!Array.isArray(paths)) {
    res.status(400).json({ error: 'paths must be an array' })
    return
  }
  const summaries = paths.map(getWorkspaceSummary)
  res.json(summaries)
})

// GET /api/fs/browse?path={dir}
// REQ-F-WS-005: filesystem browser for workspace discovery
workspacesRouter.get('/browse', (req, res) => {
  const targetPath = req.query.path as string | undefined
  try {
    const result = browseDirectory(targetPath)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// GET /api/workspace/:id/domain
// REQ-F-WS-001, REQ-F-WS-002: source domain model via gen describe or F_P fallback
workspacesRouter.get('/:id/domain', (req, res) => {
  const workspacePath = decodeURIComponent(req.params.id)
  try {
    const domain = getDomain(workspacePath)
    res.json(domain)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// GET /api/workspace/:id/gaps
// REQ-F-STATE-001
workspacesRouter.get('/:id/gaps', (req, res) => {
  const workspacePath = decodeURIComponent(req.params.id)
  try {
    const gaps = getGaps(workspacePath)
    res.json(gaps)
  } catch (err) {
    res.status(500).json({ error: true, message: String(err) })
  }
})

// GET /api/workspace/:id/events?since={seq}&type={t}&limit={n}
// REQ-F-EVT-001, REQ-F-EVT-002
workspacesRouter.get('/:id/events', (req, res) => {
  const workspacePath = decodeURIComponent(req.params.id)
  const since = parseInt((req.query.since as string) ?? '0', 10)
  const type = req.query.type as string | undefined
  const limit = parseInt((req.query.limit as string) ?? '200', 10)
  try {
    const events = readEvents(workspacePath, since, type, limit)
    res.json(events)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// GET /api/workspace/:id/features
// REQ-F-FEAT-001
workspacesRouter.get('/:id/features', (req, res) => {
  const workspacePath = decodeURIComponent(req.params.id)
  try {
    const features = getFeatures(workspacePath)
    res.json(features)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// GET /api/workspace/:id/fp-results
workspacesRouter.get('/:id/fp-results', (req, res) => {
  const workspacePath = decodeURIComponent(req.params.id)
  try {
    const results = readFpResults(workspacePath)
    res.json(results)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})
