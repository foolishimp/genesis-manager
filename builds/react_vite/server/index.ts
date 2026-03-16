// Implements: REQ-F-WS-001, REQ-F-CTL-001, REQ-F-ERR-001, REQ-F-ERR-002
// Implements: REQ-F-ERR-003, REQ-F-ERR-004, REQ-NFR-001, REQ-NFR-002

import express from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import { workspacesRouter } from './routes/workspaces'
import { controlRouter } from './routes/control'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = parseInt(process.env['PORT'] ?? '3001', 10)

// ── Middleware ────────────────────────────────────────────────────────────────

// REQ-F-ERR-004: CORS for Vite dev server
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'],
    methods: ['GET', 'POST', 'DELETE'],
  }),
)

app.use(express.json())

// ── API routes ────────────────────────────────────────────────────────────────

// Workspace discovery + domain + gaps + events + features + fp-results
// Routes: /api/workspaces, /api/workspace/:id/*
app.use('/api/workspaces', workspacesRouter)
app.use('/api/workspace/:id', workspacesRouter)

// Control surface (start engine, emit events, SSE)
app.use('/api/workspace/:id/control', controlRouter)

// ── Static SPA serving (production) ──────────────────────────────────────────

const distPath = join(__dirname, '..', 'dist')
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (_req, res) => {
    res.sendFile(join(distPath, 'index.html'))
  })
}

// ── Global error handler ──────────────────────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: err.message })
})

app.listen(PORT, () => {
  console.log(`Genesis Manager API listening on http://localhost:${PORT}`)
})

export default app
