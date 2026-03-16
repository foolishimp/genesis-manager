"""
genesis_manager — builder supervision console for any abiogenesis-managed project.

This file IS the spec. The type system is the law.

  Asset.markov     → acceptance criteria for that asset type
  Job.evaluators   → convergence tests for that edge
  Edge.context     → constraint surface for that transition
  Worker           → who executes what

genesis_manager follows the standard SDLC bootstrap graph:

    intent → requirements → feature_decomp → design → code ↔ unit_tests → uat_tests

genesis_manager is a React/Vite + Express web application.
Build platform: react_vite (builds/react_vite/).
Tests run via Vitest (unit) and Playwright (e2e).
Tag convention in TypeScript: // Implements: REQ-* and // Validates: REQ-*

SCOPE: genesis_manager observes the ABIOGENESIS KERNEL — not gsdlc-specific.
It works over any project with a .genesis/genesis.yml.

DOMAIN MODEL SOURCING — two-path, kernel-referenced:

  The abiogenesis kernel (`.genesis/gtl/core.py`) IS the domain model.
  genesis_manager does not own or duplicate it. It sources it via:

  F_D path (preferred): `gen describe --workspace .`
    If the installed kernel exposes this command, genesis_manager calls it via
    subprocess and receives a JSON serialisation of the kernel type system +
    project Package. Deterministic, zero interpretation, always current.

  F_P path (fallback): agent comprehension of kernel source
    If `gen describe` is absent (kernel predates the command), an F_P actor
    reads `.genesis/gtl/core.py` and `gtl_spec/packages/<slug>.py` directly
    and synthesises the equivalent JSON model.

  Either path produces the same JSON contract consumed by the frontend.
  The kernel version (from core.py header comment) is used as a cache key —
  the model is re-sourced when the installed kernel version changes.

  This design means: when the abiogenesis kernel evolves (new fields on Edge,
  new evaluator categories, new Package capabilities), genesis_manager picks up
  the change on next load without code changes — the F_D path reflects the
  actual installed kernel, not genesis_manager's internal assumptions.

Prior art: ai_sdlc_method/projects/genesis_manager/imp_react_vite/
  — implementation exists; refactored here from the abiogenesis layer up.
"""
from gtl.core import (
    Package, Asset, Edge, Operator, Rule, Context, Evaluator, Job, Worker,
    F_D, F_P, F_H, consensus,
    OPERATIVE_ON_APPROVED, OPERATIVE_ON_APPROVED_NOT_SUPERSEDED,
)


# ── Contexts ──────────────────────────────────────────────────────────────────

bootloader = Context(
    name="bootloader",
    locator="workspace://gtl_spec/GENESIS_BOOTLOADER.md",
    digest="sha256:" + "0" * 64,
)

this_spec = Context(
    name="genesis_manager_spec",
    locator="workspace://gtl_spec/packages/genesis_manager.py",
    digest="sha256:" + "0" * 64,
)

intent_doc = Context(
    name="intent",
    locator="workspace://INTENT.md",
    digest="sha256:" + "0" * 64,
)

design_adrs = Context(
    name="design_adrs",
    locator="workspace://builds/react_vite/design/adrs/",
    digest="sha256:" + "0" * 64,
)

# References the abiogenesis kernel source at the sibling directory.
# Loaded by F_P actors building the observation layer so they align with the actual kernel types.
# Not enforced by the engine (cross-project locator); used as advisory reading context only.
abg_kernel = Context(
    name="abg_kernel",
    locator="workspace://../abiogenesis/builds/claude_code/code/",
    digest="sha256:" + "0" * 64,   # PENDING — recomputed on kernel update
)

# Prior art: substantial genesis_manager implementation exists at this path.
# F_P actors building frontend/backend should read this for UX patterns, component structure,
# and API shape before constructing from scratch.
prior_art = Context(
    name="prior_art",
    locator="workspace://../ai_sdlc_method/projects/genesis_manager/imp_react_vite/",
    digest="sha256:" + "0" * 64,
)


# ── Operators ─────────────────────────────────────────────────────────────────

claude_agent = Operator("claude_agent", F_P, "agent://claude/genesis")
human_gate   = Operator("human_gate",   F_H, "fh://single")

vitest_op = Operator(
    "vitest", F_D,
    "exec://npm --prefix builds/react_vite test -- --run 2>&1",
)

check_impl_op = Operator(
    "check_impl_ts", F_D,
    "exec://python3 -c \""
    "import pathlib,sys,json; "
    "src=pathlib.Path('builds/react_vite/src'); "
    "files=[f for f in src.rglob('*.ts') if '.test.' not in f.name and '.spec.' not in f.name] + "
    "[f for f in src.rglob('*.tsx') if '.test.' not in f.name and '.spec.' not in f.name] "
    "if src.exists() else []; "
    "untagged=[str(f) for f in files if '// Implements: REQ-' not in f.read_text(errors='ignore')]; "
    "r={'passes': not untagged, 'untagged_count': len(untagged), 'untagged': untagged}; "
    "print(json.dumps(r)); sys.exit(0 if r['passes'] else 1)\""
)

check_test_op = Operator(
    "check_test_ts", F_D,
    "exec://python3 -c \""
    "import pathlib,sys,json; "
    "src=pathlib.Path('builds/react_vite/src'); "
    "files=[f for f in src.rglob('*.test.ts')] + [f for f in src.rglob('*.test.tsx')] + "
    "[f for f in src.rglob('*.spec.ts')] + [f for f in src.rglob('*.spec.tsx')] "
    "if src.exists() else []; "
    "untagged=[str(f) for f in files if '// Validates: REQ-' not in f.read_text(errors='ignore')]; "
    "r={'passes': not untagged, 'untagged_count': len(untagged), 'untagged': untagged}; "
    "print(json.dumps(r)); sys.exit(0 if r['passes'] else 1)\""
)

check_build_op = Operator(
    "check_build", F_D,
    "exec://npm --prefix builds/react_vite run build 2>&1",
)


# ── Rules ─────────────────────────────────────────────────────────────────────

standard_gate = Rule(
    "standard_gate", approve=consensus(1, 1), dissent="recorded"
)


# ── Assets ────────────────────────────────────────────────────────────────────

intent = Asset(
    name="intent",
    id_format="INT-{SEQ}",
    markov=["problem_stated", "value_proposition_clear", "scope_bounded"],
)

requirements = Asset(
    name="requirements",
    id_format="REQ-{SEQ}",
    lineage=[intent],
    markov=["keys_testable", "intent_covered", "no_implementation_details"],
    operative=OPERATIVE_ON_APPROVED,
)

feature_decomp = Asset(
    name="feature_decomp",
    id_format="FD-{SEQ}",
    lineage=[requirements],
    markov=["all_req_keys_covered", "dependency_dag_acyclic", "mvp_boundary_defined"],
    operative=OPERATIVE_ON_APPROVED,
)

design = Asset(
    name="design",
    id_format="DES-{SEQ}",
    lineage=[feature_decomp],
    markov=["adrs_recorded", "tech_stack_decided", "interfaces_specified", "no_implementation_details"],
    operative=OPERATIVE_ON_APPROVED_NOT_SUPERSEDED,
)

code = Asset(
    name="code",
    id_format="CODE-{SEQ}",
    lineage=[design],
    markov=["implements_tags_present", "build_exits_zero", "no_v2_features"],
)

unit_tests = Asset(
    name="unit_tests",
    id_format="TEST-{SEQ}",
    lineage=[code],
    markov=["all_pass", "validates_tags_present"],
)

uat_tests = Asset(
    name="uat_tests",
    id_format="UAT-{SEQ}",
    lineage=[unit_tests],
    markov=["e2e_scenarios_pass", "accepted_by_human"],
)


# ── Edges ─────────────────────────────────────────────────────────────────────

e_intent_req = Edge(
    name="intent→requirements",
    source=intent, target=requirements,
    using=[claude_agent, human_gate], rule=standard_gate,
    context=[bootloader, this_spec],
)

e_req_feat = Edge(
    name="requirements→feature_decomp",
    source=requirements, target=feature_decomp,
    using=[claude_agent, human_gate], rule=standard_gate,
    context=[bootloader, this_spec, intent_doc],
)

e_feat_design = Edge(
    name="feature_decomp→design",
    source=feature_decomp, target=design,
    using=[claude_agent, human_gate], rule=standard_gate,
    context=[bootloader, this_spec, intent_doc],
)

e_design_code = Edge(
    name="design→code",
    source=design, target=code,
    using=[claude_agent, check_impl_op, check_build_op],
    context=[bootloader, this_spec, design_adrs, abg_kernel, prior_art],
)

e_tdd = Edge(
    name="code↔unit_tests",
    source=[code, unit_tests], target=unit_tests,
    co_evolve=True,
    using=[claude_agent, vitest_op, check_impl_op, check_test_op, check_build_op],
    context=[bootloader, this_spec, design_adrs, abg_kernel, prior_art],
)

e_unit_uat = Edge(
    name="unit_tests→uat_tests",
    source=unit_tests, target=uat_tests,
    using=[claude_agent, human_gate], rule=standard_gate,
    context=[bootloader, this_spec, design_adrs],
)


# ── Evaluators ────────────────────────────────────────────────────────────────

# intent→requirements
eval_intent_fh = Evaluator(
    "intent_approved", F_H,
    "Human confirms: problem stated, value proposition clear, scope bounded",
)

# requirements→feature_decomp
eval_req_coverage = Evaluator(
    "req_coverage", F_D,
    "Every REQ key in Package.requirements appears in ≥1 feature vector satisfies: field",
    command="python -m genesis check-req-coverage "
            "--package gtl_spec.packages.genesis_manager:package "
            "--features .ai-workspace/features/",
)
eval_decomp_fp = Evaluator(
    "decomp_complete", F_P,
    "Construct feature vectors covering all REQ-* keys in the package — write one .yml per feature to "
    ".ai-workspace/features/active/ with a satisfies: list. "
    "Group related keys into cohesive features. "
    "Every REQ-* key must appear in at least one feature's satisfies: list before this evaluator passes.",
)
eval_decomp_fh = Evaluator(
    "decomp_approved", F_H,
    "Human approves: feature set complete, dependency order correct, MVP boundary clear",
)

# feature_decomp→design
eval_design_fp = Evaluator(
    "design_coherent", F_P,
    "Agent: ADRs cover all features, tech stack decided (React/Vite/Express), "
    "interfaces specified (API contracts, data schemas), no implementation details in spec",
)
eval_design_fh = Evaluator(
    "design_approved", F_H,
    "Human approves design before any code is written",
)

# design→code
eval_build_ok = Evaluator(
    "build_exits_zero", F_D,
    "npm run build exits 0 — Vite production build completes without error",
    command="npm --prefix builds/react_vite run build 2>&1",
)
eval_impl_tags = Evaluator(
    "impl_tags", F_D,
    "All TypeScript source files carry at least one // Implements: REQ-* tag",
    command=(
        "python3 -c \""
        "import pathlib,sys,json; "
        "src=pathlib.Path('builds/react_vite/src'); "
        "files=[f for f in src.rglob('*.ts') if '.test.' not in f.name and '.spec.' not in f.name] + "
        "[f for f in src.rglob('*.tsx') if '.test.' not in f.name and '.spec.' not in f.name] "
        "if src.exists() else []; "
        "untagged=[str(f) for f in files if '// Implements: REQ-' not in f.read_text(errors='ignore')]; "
        "r={'passes': not untagged, 'untagged_count': len(untagged), 'untagged': untagged}; "
        "print(json.dumps(r)); sys.exit(0 if r['passes'] else 1)\""
    ),
)
eval_code_fp = Evaluator(
    "code_complete", F_P,
    "Agent: code implements all features per design ADRs; React components render; "
    "Express server correctly reads abiogenesis workspace state; no V2 features",
)

# code↔unit_tests
eval_tests_pass = Evaluator(
    "tests_pass", F_D,
    "Vitest: zero failures (unit tests only, no e2e)",
    command="npm --prefix builds/react_vite test -- --run 2>&1",
)
eval_test_tags = Evaluator(
    "validates_tags", F_D,
    "All TypeScript test files carry at least one // Validates: REQ-* tag",
    command=(
        "python3 -c \""
        "import pathlib,sys,json; "
        "src=pathlib.Path('builds/react_vite/src'); "
        "files=[f for f in src.rglob('*.test.ts')] + [f for f in src.rglob('*.test.tsx')] + "
        "[f for f in src.rglob('*.spec.ts')] + [f for f in src.rglob('*.spec.tsx')] "
        "if src.exists() else []; "
        "untagged=[str(f) for f in files if '// Validates: REQ-' not in f.read_text(errors='ignore')]; "
        "r={'passes': not untagged, 'untagged_count': len(untagged), 'untagged': untagged}; "
        "print(json.dumps(r)); sys.exit(0 if r['passes'] else 1)\""
    ),
)
eval_coverage_fp = Evaluator(
    "coverage_complete", F_P,
    "Agent: Vitest suite covers all features; no REQ key without a corresponding test",
)

# unit_tests→uat_tests
eval_uat_report = Evaluator(
    "uat_e2e_report", F_D,
    "Playwright e2e report exists at .ai-workspace/uat/e2e_report.json with all_pass: true",
    command=(
        "python3 -c \""
        "import json,sys,pathlib; "
        "r=pathlib.Path('.ai-workspace/uat/e2e_report.json'); "
        "d=json.loads(r.read_text()) if r.exists() else {}; "
        "sys.exit(0 if d.get('all_pass') else 1)\""
    ),
)
eval_uat_fp = Evaluator(
    "uat_e2e_passed", F_P,
    "Run Playwright e2e tests covering REQ-F-UAT-001 through REQ-F-UAT-008 (the 8 INTENT questions). "
    "Write .ai-workspace/uat/e2e_report.json: "
    "{test_count, pass_count, fail_count, all_pass, timestamp, scenarios: [{id, question, passed, evidence}]}.",
)
eval_uat_fh = Evaluator(
    "uat_accepted", F_H,
    "Human confirms e2e_report all_pass=true for REQ-F-UAT-001 through REQ-F-UAT-013: "
    "Q1–Q8 INTENT questions each answered by a passing Playwright scenario; "
    "plus: next-action preview (UAT-009), rejected gate lifecycle (UAT-010), "
    "fallback provenance display (UAT-011), session watermark (UAT-012), "
    "config drift warning (UAT-013). "
    "No stale fp_assessments in trust panel. No active degraded-state warnings.",
)


# ── Jobs ──────────────────────────────────────────────────────────────────────

job_intent_req  = Job(e_intent_req,  [eval_intent_fh])
job_req_feat    = Job(e_req_feat,    [eval_decomp_fp, eval_decomp_fh])
job_feat_design = Job(e_feat_design, [eval_design_fp, eval_design_fh])
job_design_code = Job(e_design_code, [eval_build_ok, eval_impl_tags, eval_code_fp])
job_tdd         = Job(e_tdd,         [eval_tests_pass, eval_test_tags, eval_coverage_fp])
job_uat         = Job(e_unit_uat,    [eval_uat_report, eval_uat_fp, eval_uat_fh])


# ── Worker ────────────────────────────────────────────────────────────────────

worker = Worker(
    id="claude_code",
    can_execute=[job_intent_req, job_req_feat, job_feat_design,
                 job_design_code, job_tdd, job_uat],
)


# ── Package ───────────────────────────────────────────────────────────────────
# REQ keys state WHAT the product does, not HOW it is built.
# Technology choices (REST shape, SSE, localStorage, polling interval, JSON schemas)
# belong in design ADRs under builds/react_vite/design/adrs/, not here.
#
# Domain layers:
#   WORKSPACE  — project discovery and workspace loading (.genesis/genesis.yml)
#   SPEC       — GTL Package structure display (the project's graph topology)
#   STATE      — convergence state (gap report: delta per edge, evaluator results)
#   EVENTS     — abiogenesis event stream (events.jsonl)
#   FEATURES   — feature vectors (.ai-workspace/features/)
#   GATES      — human gate queue (fh_gate_pending events awaiting review_approved)
#   CONTROL    — trigger operations (gen-start, approve gates)
#   TRUST      — evidence currentness and observability trust surface
#   DRIFT      — workspace configuration consistency checking
#   NAV        — navigation handles (core product invariant: every ID is clickable)
#   UAT        — acceptance scenarios anchored to the 8 INTENT questions
#   UX         — liveness, attention signals, no genesis syntax required from user
#   ERROR      — degraded state handling
#   NFR        — measurable non-functional thresholds

package = Package(
    name="genesis_manager",
    assets=[intent, requirements, feature_decomp, design, code, unit_tests, uat_tests],
    edges=[e_intent_req, e_req_feat, e_feat_design, e_design_code, e_tdd, e_unit_uat],
    operators=[claude_agent, human_gate, vitest_op, check_impl_op, check_test_op, check_build_op],
    rules=[standard_gate],
    contexts=[bootloader, this_spec, intent_doc, design_adrs, abg_kernel, prior_art],
    requirements=[
        # ── WORKSPACE — project discovery and kernel-referenced domain model ──────
        "REQ-F-WS-001",   # Discover abiogenesis projects: find dirs with .genesis/genesis.yml
        "REQ-F-WS-002",   # Load project: parse .genesis/genesis.yml → Package ref, Worker ref, pythonpath
        "REQ-F-WS-003",   # Detect installed kernel version from .genesis/gtl/core.py
        "REQ-F-WS-004",   # Switch active project; persist last-used workspace path across sessions
        "REQ-F-WS-005",   # Filesystem browser: traverse dirs from a configurable root to locate genesis projects
        # Domain model sourcing — two-path, always references back to the kernel:
        "REQ-F-WS-006",   # F_D path: probe installed kernel for describe capability; if available, use it
        "REQ-F-WS-007",   # F_P path: if F_D path unavailable, synthesise domain model from kernel source files
        "REQ-F-WS-008",   # Cache domain model keyed on kernel version; invalidate on version change
        "REQ-F-WS-010",   # Project list: show name, path, convergence state, pending gate count, last event time
        "REQ-F-WS-011",   # Remember recently opened projects; restore last-active project on app start
        # Domain-model acquisition provenance:
        "REQ-F-WS-012",   # Capability probe: detect at load time whether installed kernel exposes describe;
        #                 #   re-probe when kernel version changes
        "REQ-F-WS-013",   # Provenance: every rendered domain model declares its acquisition mode
        #                 #   (zero-interpretation F_D vs synthesised F_P); surfaced in UI beside package name
        "REQ-F-WS-014",   # Parity: both acquisition paths produce the same normalised domain model shape;
        #                 #   UI components bind to the shape, not to the acquisition mode
        "REQ-F-WS-015",   # Degraded provenance: synthesised domain model is displayed with an explicit warning
        #                 #   that it is not zero-interpretation; graph remains usable
        "REQ-F-WS-016",   # V1 compatibility: both acquisition paths are in scope for V1;
        #                 #   no minimum abiogenesis kernel version required

        # ── SPEC — GTL Package structure (graph topology) ──────────────────────
        # This is the FIRST thing to surface — the project's constitutional graph.
        "REQ-F-SPEC-001", # Display Package: name, asset list, edge list, requirements count
        "REQ-F-SPEC-002", # Display Assets: name, id_format, markov conditions, operative rule
        "REQ-F-SPEC-003", # Display Edges: name, source→target, co_evolve, context refs
        "REQ-F-SPEC-004", # Display Evaluators per edge: name, category (F_D/F_P/F_H), description
        "REQ-F-SPEC-005", # Display Requirements registry: all REQ-* keys defined in Package
        "REQ-F-SPEC-006", # Render graph topology as visual diagram (nodes = assets, edges = transitions)

        # ── STATE — convergence state (gap report) ─────────────────────────────
        "REQ-F-STATE-001", # Run gen gaps: parse output → delta per edge
        "REQ-F-STATE-002", # Display per-edge convergence: delta, failing evaluators, passing evaluators
        "REQ-F-STATE-003", # Overall project status: total_delta, converged bool, jobs_considered
        "REQ-F-STATE-004", # Gap state refreshes automatically without user action; interval is configurable
        "REQ-F-STATE-005", # Surface F_D failures verbatim (returncode, stdout, stderr)

        # ── EVENTS — abiogenesis event stream ─────────────────────────────────
        "REQ-F-EVT-001",  # Read events.jsonl: parse all events chronologically
        "REQ-F-EVT-002",  # Display event stream: event_type, event_time, data fields
        "REQ-F-EVT-003",  # Filter events by type, edge, time range
        "REQ-F-EVT-004",  # Session watermark: durable per-project marker of which events the operator has seen;
        #                 #   persists across page reloads; operator controls when it advances
        "REQ-F-EVT-005",  # Event detail view: full data payload for any event
        "REQ-F-EVT-006",  # New-since-last-session highlight: events newer than the watermark are visually distinct;
        #                 #   unread count shown as a badge
        "REQ-F-EVT-007",  # Watermark advances on explicit operator action ("mark as seen");
        #                 #   never advances automatically mid-session

        # ── FEATURES — feature vectors ─────────────────────────────────────────
        "REQ-F-FEAT-001", # Read active feature vectors (.ai-workspace/features/active/*.yml)
        "REQ-F-FEAT-002", # Read completed feature vectors (.ai-workspace/features/completed/*.yml)
        "REQ-F-FEAT-003", # Display feature: id, title, status, satisfies (REQ keys), dependencies
        "REQ-F-FEAT-004", # REQ key coverage: which Package.requirements are covered vs uncovered
        "REQ-F-FEAT-005", # Feature detail: full YAML, linked events, evaluator results

        # ── GATES — human gate queue ───────────────────────────────────────────
        "REQ-F-GATE-001", # Surface pending gates requiring human action
        "REQ-F-GATE-002", # Display gate criteria verbatim (from fh_gate_pending.criteria)
        "REQ-F-GATE-003", # Approve gate: emit review_approved with actor=human
        "REQ-F-GATE-004", # Reject gate: emit review_rejected with actor=human; reason required
        "REQ-F-GATE-005", # Surface proxy-log decisions for human review:
        #                 #   show actor, decision, timestamp, link to proxy-log file
        "REQ-F-GATE-006", # Human can override a proxy-approved gate by approving or rejecting directly
        "REQ-F-GATE-007", # Gate state model: every gate is in exactly one state at any moment —
        #                 #   pending, approved, rejected, or superseded;
        #                 #   state is derived from the event stream, not stored separately
        "REQ-F-GATE-008", # Rejection effect: a rejected gate pauses the edge; the engine will not
        #                 #   dispatch F_P again until the operator explicitly re-iterates;
        #                 #   prior work is preserved, not cleared

        # ── CONTROL — trigger operations ───────────────────────────────────────
        "REQ-F-CTL-001",  # Trigger gen-start with flag selection: --auto, --auto --human-proxy,
        #                 #   --edge E, --feature F; exposed as UI controls
        "REQ-F-CTL-002",  # Trigger gen-iterate on a specific edge with optional feature selector
        "REQ-F-CTL-003",  # Show in-flight F_P dispatches: fp_dispatched events without matching fp_assessment
        "REQ-F-CTL-004",  # F_P result viewer: show manifest prompt, evaluator results, evidence text
        "REQ-F-CTL-005",  # Process status: show running/idle; prevent concurrent gen-start invocations;
        #                 #   live process output streams to UI while running
        "REQ-F-CTL-006",  # Read-only next-action: resolve the next job/edge the engine would select
        #                 #   from current gap state, without appending events or spawning a process
        "REQ-F-CTL-007",  # Next-action surface: shows edge name, whether it requires human input or F_P dispatch,
        #                 #   and which F_D evaluators are blocking; visible at all times without pressing Start

        # ── TRUST — evidence currentness and observability trust surface ────────
        "REQ-F-TRUST-001", # All displayed evidence carries a currentness marker:
        #                  #   current, stale (spec changed since assessment), superseded, or synthesised
        "REQ-F-TRUST-002", # Trust panel visible on every project view: shows when gap state was last computed,
        #                  #   when the last event was appended, how the domain model was acquired,
        #                  #   and whether any displayed assessments are stale
        "REQ-F-TRUST-003", # Stale assessment detection: compare each displayed fp_assessment's spec_hash
        #                  #   against the current package hash; mark stale if mismatched;
        #                  #   stale assessments are shown with a warning, not suppressed

        # ── DRIFT — workspace configuration consistency ─────────────────────────
        "REQ-F-DRIFT-001", # Config drift: detect mismatch between the build root declared in the spec
        #                  #   and the paths referenced in .genesis/genesis.yml; surface as a warning
        "REQ-F-DRIFT-002", # Layout integrity: distinguish missing-because-not-built from workspace-inconsistent;
        #                  #   a missing build directory before any code events is expected;
        #                  #   the same missing directory after edge_converged(design→code) is a drift warning
        "REQ-F-DRIFT-003", # Install churn: repeated genesis_installed events are summarised as a setup history
        #                  #   entry rather than listed as individual stream events
        "REQ-F-DRIFT-004", # Ready-to-ship requires total_delta == 0 AND no active drift warnings
        #                  #   AND no stale assessments; delta == 0 alone is insufficient

        # ── NAV — navigation handles (core product invariant) ──────────────────
        # Every visible technical identifier is a clickable address into canonical detail.
        "REQ-F-NAV-001",  # REQ-* key → feature vector(s) that satisfy it + code/test files that tag it
        "REQ-F-NAV-002",  # Edge name → evaluator list, gap state, event history for that edge
        "REQ-F-NAV-003",  # Event → full payload, linked feature, linked edge
        "REQ-F-NAV-004",  # Feature ID → feature detail, REQ coverage, linked events
        "REQ-F-NAV-005",  # Evaluator name → description, category, last F_D result or fp_assessment

        # ── UAT — acceptance scenarios anchored to the 8 INTENT questions ────────
        "REQ-F-UAT-001",  # Q1: navigate to a project → GTL spec surfaces assets, edges, evaluators
        "REQ-F-UAT-002",  # Q2: convergence state shows per-edge delta and passing/failing evaluators
        "REQ-F-UAT-003",  # Q3: blocked edge shows failing evaluators with verbatim F_D output
        "REQ-F-UAT-004",  # Q4: in-flight F_P dispatch is visible without starting a new run
        "REQ-F-UAT-005",  # Q5: pending human gate surfaces prominently with approve/reject controls
        "REQ-F-UAT-006",  # Q6: event history for an edge shows F_D results and fp_assessment evidence
        "REQ-F-UAT-007",  # Q7: event stream shows what is new since the operator last looked
        "REQ-F-UAT-008",  # Q8: fully converged project shows CONVERGED and satisfies REQ-F-DRIFT-004
        "REQ-F-UAT-009",  # Next-action preview: without pressing Start, UI shows which edge the engine
        #                 #   would select next and whether it requires human input or an F_P dispatch
        "REQ-F-UAT-010",  # Rejected gate lifecycle: after reject, edge shows paused; re-iterate required to proceed
        "REQ-F-UAT-011",  # Fallback provenance: synthesised domain model displays with provenance warning;
        #                 #   graph remains usable
        "REQ-F-UAT-012",  # Session watermark: events since last session shown as new; badge clears on mark-seen
        "REQ-F-UAT-013",  # Config drift: workspace with genesis.yml build-root mismatch shows drift warning
        #                 #   inline without blocking other views

        # ── UX ────────────────────────────────────────────────────────────────
        "REQ-F-UX-001",   # Gap state and events refresh automatically; last-updated time always visible;
        #                 #   refresh interval is configurable
        "REQ-F-UX-002",   # No genesis syntax: user never types PYTHONPATH=.genesis or any CLI commands
        "REQ-F-UX-003",   # Attention signal: pending human gates surface prominently
        "REQ-F-UX-004",   # Live process output: gen-start/gen-iterate output streams to the UI in real time;
        #                 #   retained until next invocation
        "REQ-F-UX-005",   # Three engine states are visually distinct at all times:
        #                 #   running (process active), next (idle, next action known), blocked (F_D failing)

        # ── ERROR — degraded state handling ───────────────────────────────────
        "REQ-F-ERR-001",  # Engine unavailable: if genesis engine not found, surface actionable inline error;
        #                 #   other views remain accessible
        "REQ-F-ERR-002",  # Workspace degraded: if genesis.yml missing or malformed, show parse error and path;
        #                 #   other projects remain accessible
        "REQ-F-ERR-003",  # Gap computation failure: display error output verbatim; mark displayed state as stale;
        #                 #   do not present previous passing state as current
        "REQ-F-ERR-004",  # Large event streams: paginate or incrementally load; UI remains responsive;
        #                 #   total event count always visible

        # ── NFR — non-functional ──────────────────────────────────────────────
        "REQ-NFR-001",    # events.jsonl read: UI loads and renders with files up to 50k events in < 3s
        "REQ-NFR-002",    # App startup: first project state visible within 3s on localhost
    ],
)


if __name__ == "__main__":
    import json
    print(json.dumps({
        "package": package.name,
        "assets": [a.name for a in package.assets],
        "edges": [e.name for e in package.edges],
        "req_count": len(package.requirements),
        "requirements": package.requirements,
    }, indent=2))
