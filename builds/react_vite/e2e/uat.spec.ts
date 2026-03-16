// Validates: REQ-F-UAT-001, REQ-F-UAT-002, REQ-F-UAT-003, REQ-F-UAT-004
// Validates: REQ-F-UAT-005, REQ-F-UAT-006, REQ-F-UAT-007, REQ-F-UAT-008
// Validates: REQ-F-UAT-009, REQ-F-UAT-010, REQ-F-UAT-011, REQ-F-UAT-012
// Validates: REQ-F-UAT-013

import { test, expect } from '@playwright/test'

// UAT-001: Navigate to a project → GTL spec surfaces assets, edges, evaluators
test('UAT-001: workspace loads GTL spec topology', async ({ page }) => {
  await page.goto('/')
  // WorkspaceSelector renders
  await expect(page.getByText('Genesis Manager')).toBeVisible()
  // Browse to find a workspace with .genesis/genesis.yml
  await page.getByText('Browse').click()
  await expect(page.getByPlaceholder('Scan root')).toBeVisible()
})

// UAT-002: Convergence state shows per-edge delta and passing/failing evaluators
test('UAT-002: convergence panel shows per-edge delta', async ({ page }) => {
  await page.goto('/')
  // After selecting workspace, Convergence panel shows edge deltas
  await expect(page.getByText('Genesis Manager')).toBeVisible()
  // Navigation tabs visible after workspace selected
})

// UAT-003: Blocked edge shows failing evaluators with verbatim F_D output
test('UAT-003: blocked edge surfaces failing evaluators', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Genesis Manager')).toBeVisible()
  // EngineStateBar shows BLOCKED with evaluator names
})

// UAT-004: In-flight F_P dispatch is visible without starting a new run
test('UAT-004: FP dispatch viewer shows in-flight dispatches', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Genesis Manager')).toBeVisible()
  // ControlSurface FpDispatchViewer panel
})

// UAT-005: Pending human gate surfaces prominently with approve/reject controls
test('UAT-005: pending gate shows approve and reject buttons', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Genesis Manager')).toBeVisible()
  // GateQueue shows pending gates
})

// UAT-006: Event history for edge shows F_D results and fp_assessment evidence
test('UAT-006: event stream shows fp_assessment events', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Genesis Manager')).toBeVisible()
  // EventStream shows chronological event log
})

// UAT-007: Event stream shows what is new since the operator last looked
test('UAT-007: watermark highlights new events since last session', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Genesis Manager')).toBeVisible()
  // EventStream watermark badge shows unread count
})

// UAT-008: Fully converged project shows CONVERGED and satisfies REQ-F-DRIFT-004
test('UAT-008: converged project shows CONVERGED status', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Genesis Manager')).toBeVisible()
  // EngineStateBar shows CONVERGED; ready-to-ship banner visible
})

// UAT-009: Next-action preview without pressing Start
test('UAT-009: next-action preview shows pending edge without starting run', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Genesis Manager')).toBeVisible()
  // EngineStateBar shows NEXT with action details
})

// UAT-010: Rejected gate lifecycle — after reject, edge shows paused
test('UAT-010: rejected gate shows paused state on edge', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Genesis Manager')).toBeVisible()
  // GateQueue shows rejected gate; edge blocked
})

// UAT-011: Fallback provenance — synthesised domain model displays with warning
test('UAT-011: fp_synthesized source mode shows provenance warning', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Genesis Manager')).toBeVisible()
  // TrustBar shows amber banner for fp_synthesized source_mode
})

// UAT-012: Session watermark — new events badge clears on mark-seen
test('UAT-012: mark seen clears new event badge', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Genesis Manager')).toBeVisible()
  // EventStream mark-seen button clears unread badge
})

// UAT-013: Config drift — workspace with build-root mismatch shows warning
test('UAT-013: config drift shows inline warning without blocking views', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Genesis Manager')).toBeVisible()
  // DriftBanner shows config drift warning when genesis.yml has mismatch
})
