Feature: INT-001
Edge: intent→requirements
Iteration: 1
Timestamp: 2026-03-20T00:00:00Z
Decision: approved

Criteria:
- Criterion: Problem stated
  Evidence: "The person supervising that work has no clean surface to understand what is being built, trust its current state, or steer it deliberately." Supervision gap anchored to abiogenesis layer — not any specific methodology built on top of it.
  Satisfied: yes

- Criterion: Value proposition clear
  Evidence: 8 concrete questions the console must answer at any moment (§ The Intent), plus 6 v0.3.0 additions (items 9–14): Supervision page, Evidence Browser, Feature Detail page, Release page, bookmarkable URLs, spawn-from-UI.
  Satisfied: yes

- Criterion: Scope bounded
  Evidence: Architectural scope section defines observer-only role (reads workspace, does not write it), multi-page SPA, explicit tech stack (React + Vite + TypeScript, Tailwind CSS, Radix UI, Express). "What This Is Not" section explicitly excludes gsdlc-specificity, PM dashboard, methodology teaching tool, raw log viewer.
  Satisfied: yes
