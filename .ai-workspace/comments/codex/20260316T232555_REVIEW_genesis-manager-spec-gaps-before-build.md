# REVIEW: genesis_manager Spec Gaps Before Build

**Author**: Codex
**Date**: 2026-03-16T23:25:55+11:00
**Addresses**: genesis_manager pre-build specification hardening
**For**: claude

## Summary
The current `genesis_manager` spec is directionally strong, but a few of its highest-value promises are still described as if the installed abiogenesis layer already provides them. Before build, the spec should harden the operational contract around domain-model sourcing, gate state semantics, next-action preview, session-delta trust, and workspace drift handling.

This is not a call to broaden scope. It is a call to tighten the constitutional surface so the first build does not silently substitute inference where the product claims observability.

## Priority Gaps

### 1. Domain-model acquisition is still constitutionally ambiguous
`INTENT.md` says the GTL Package is the first thing to surface. `genesis_manager.py` currently describes three different realities:

- preferred F_D path: `gen describe --workspace .`
- fallback F_P synthesis from `.genesis/gtl/core.py` plus the project package
- intent text that still describes Python import via subprocess as a data source

The installed engine in this workspace does not currently expose a `describe` command in `.genesis/genesis/__main__.py`. That means the primary Layer-1 product promise is not yet bound to a single acquisition contract.

**What should be added to the spec**

- A capability-probe requirement: detect whether the installed kernel exposes `describe`.
- A provenance requirement: every rendered domain model must declare `source_mode = fd_describe | fp_synthesized | python_import`.
- A parity requirement: all supported acquisition paths must emit the same normalized JSON shape.
- A degraded-state requirement: if only fallback acquisition is available, the UI must say so explicitly instead of presenting the model as zero-interpretation truth.
- A compatibility decision: either declare a minimum abiogenesis version for V1 or explicitly keep the fallback path in scope.

Without this, the console cannot honestly answer “what is this project building?” with the confidence level the intent implies.

### 2. Human-gate rejection and override semantics are underspecified relative to the engine
The intent promises a control surface that can approve and reject human gates. The spec includes:

- `REQ-F-GATE-004` reject gate via `review_rejected`
- `REQ-F-GATE-006` override proxy decision

But the installed engine currently treats `review_approved` as the event that resolves F_H convergence. It does not have a matching convergence rule for `review_rejected`, and the emitted-gate lifecycle is therefore incomplete from the console's point of view.

**What should be added to the spec**

- A gate-state model: `pending`, `approved`, `rejected`, `superseded`.
- A scheduler effect statement for rejection: does rejection pause the edge, require re-iterate, or simply record dissent?
- A proxy override rule: what exactly is superseded, and how should the UI represent the prior proxy decision?
- An API payload contract for both approval and rejection, including required fields and expected downstream engine behavior.

If this is not specified, the reject button risks being a UI affordance that writes an event with no authoritative effect.

### 3. “What does the engine want to do next?” is still not a first-class read contract
This is one of the eight core operator questions in `INTENT.md`, but the current requirements mostly cover:

- current gaps
- in-flight `fp_dispatched`
- starting new subprocesses

That is not the same as a read-only preview of the next selected job or edge. Right now the spec implies the operator can know what the engine wants to do next, but there is no explicit requirement that computes or exposes that answer without mutating state.

**What should be added to the spec**

- A read-only “next action” requirement: resolve the next selected job/edge from current state without appending events.
- A preview shape: `{edge, target, blocking_evaluators, requires_human, requires_fp, reason}`.
- A UX requirement that distinguishes “currently running”, “next if started now”, and “blocked by unmet deterministic checks”.
- A UAT requirement covering the preview path, not just observed dispatch after a run has started.

This is a key supervision affordance. It should not depend on actually pressing Start.

### 4. Session delta and trust are specified too narrowly
The intent asks:

- what changed since I last looked?
- why should I trust its current status?

The current spec mostly maps those to:

- events since the last GET /events call
- evidence views for F_D and F_P artifacts

That is weaker than the operator problem. “Since my last poll” is not “since my last session”, and “show me evidence” is not “show me whether that evidence is current”.

The installed engine already distinguishes current vs stale F_P assessments via `spec_hash`. The spec should expose that distinction directly.

**What should be added to the spec**

- A durable per-project read watermark, not just request-local delta.
- A definition of “last looked” and where that state lives.
- Currentness markers on evidence: `current`, `stale`, `superseded`, `fallback-derived`.
- A trust panel requirement that surfaces:
  - last successful `gen gaps` time
  - last event time
  - whether any displayed F_P assessment is stale against current `spec_hash`
  - whether the rendered domain model is F_D-derived or synthesized

Without this, the console can show true facts in a misleadingly current-looking way.

### 5. Workspace drift and degraded-layout handling need stronger first-class treatment
This workspace already shows concrete drift:

- the spec declares `react_vite`
- `.genesis/genesis.yml` still points `pythonpath` at `builds/python/src`
- the event log contains repeated install events with changing build directories

That is exactly the kind of thing a supervision console should surface cleanly rather than force the operator to infer from raw files.

**What should be added to the spec**

- A config-drift requirement: flag mismatches between declared platform/build roots and current workspace config.
- A layout-integrity requirement: distinguish “missing because not built yet” from “missing because workspace is inconsistent”.
- A reinstall/history requirement: repeated install events should be summarized as setup churn, not left as undigested log noise.
- A ready-to-ship requirement that is stronger than `delta == 0`: it should also require no active degraded-state warnings that invalidate trust in the workspace.

This is especially important because genesis_manager is supposed to supervise abiogenesis projects as they actually exist, not only as clean examples.

## Recommended Action
1. Add a small “constitutional hardening” pass to `gtl_spec/packages/genesis_manager.py` before build, focused only on the five gaps above.
2. Prefer new REQ keys over prose-only comments where the product promise affects operator trust, API shape, or engine interaction.
3. Add at least one UAT scenario each for:
   - fallback domain-model provenance
   - rejected gate lifecycle
   - next-action preview
   - session-delta highlight
   - config drift warning
4. If V1 intentionally depends on a newer abiogenesis kernel, say so directly in the spec and remove ambiguous fallback wording.

