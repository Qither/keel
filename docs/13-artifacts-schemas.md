# 13 Artifacts and schema reference

This document is the home of the layouts and the maps between them: what keel creates in a target
project, how the keel package is laid out, which schema governs which artifact and which template and
example illustrate it, the draft and deferred markers, migrations as data, and what `scripts/validate.mjs`
covers. Section 3 is also the repository manifest: its tables list every file of the M0 skeleton, and the
`manifest` check of `scripts/validate.mjs` enforces that.

Ownership rules, the three planes and the ledger are explained in
[04-trace-and-state.md](04-trace-and-state.md); single-writer ownership per artifact in
[01-org-model.md](01-org-model.md). This document gives locations and contracts only.

## 1. Target project layout

What a project that uses keel contains. Paths are relative to the repository root; `<P>` is a proposal id
such as `P-7F3K9Q`, `<RUN>` a run id such as `RUN-01J9Z8Q4TKXW3M5N7P2R6S8V0A`.

```text
<repo>/
  AGENTS.md                         managed keel pointer block (keel sync)
  CLAUDE.md                         @AGENTS.md bridge (keel sync)
  .agents/skills/keel-*/            skill copies (keel sync)
  .claude/skills/keel-*/            skill copies for claude-code (keel sync)
  .claude/agents/keel-<seat>.md     keel-owned agent files (keel sync)
  .opencode/agents/keel-<seat>.md   keel-owned agent files (keel sync)
  .keel/                            declared plane (committed)
    config.yaml  local.yaml (gitignored)  charter.md  goals.yaml  routing.yaml
    policies/  approvals/  specs/  decisions/  arch/
    proposals/<P>-<slug>/           only on keel/<P>/main until land
    archive/<yyyy>/<P>-<slug>/      projections written by the archive commit
    generated.lock.json
<git-common-dir>/keel/              local control plane (never committed)
../<repo>.ws/                       workspace root: worktrees and run directories
```

| Path | Plane | Format | Written by | Schema |
| --- | --- | --- | --- | --- |
| `.keel/config.yaml` (+ `.keel/local.yaml`, gitignored) | declared | YAML, layered: package defaults, then team, then personal; tables deep-merge, arrays keyed by id replace, unknown keys are errors | Board (`local.yaml`: the individual, never secrets) | `schemas/config.schema.json` |
| `.keel/charter.md` | declared | Markdown + YAML frontmatter | Board, approved | `schemas/charter.schema.json` |
| `.keel/goals.yaml` | declared | YAML | Board, approved | `schemas/goals.schema.json` |
| `.keel/routing.yaml` | declared | YAML, names only | Board, approved; dispatch refuses without a valid document approval | `schemas/routing.schema.json` |
| `.keel/policies/<name>.yaml` | declared | YAML | Board, approved | `schemas/policy.schema.json` |
| `.keel/approvals/<record-sha256>.<kind>.json` | declared | JSON approval record (subject, artifact hashes, declared approver, local time, chain head) | `keel approve`, after the Board's explicit confirmation; the Steward commits it as soon as it is written: on trunk (documents, policies, receipts), on `keel/<P>/main` (contract, plan, request, rulings) or in the archive commit (land) | `schemas/approval.schema.json` |
| `.keel/specs/<area>/spec.yaml` | declared | YAML | the land archive commit only | `schemas/spec.schema.json` |
| `.keel/decisions/ADR-<5>-<slug>.md` | declared | Markdown + frontmatter + `## Obligations` | promoted at land | `schemas/decision.schema.json` |
| `.keel/arch/model.yaml`, `rules.yaml`, `baseline.json`, `series.jsonl` | declared | YAML, JSON, JSONL | architect through `arch.delta` at land; Steward appends the series | `arch-model`, `arch-rules`, `arch-baseline`; `arch-report` (M4 stub) |
| `.keel/proposals/<P>-<slug>/proposal.yaml`, `intent.md`, `spec.delta.yaml`, `arch.delta.yaml`, `plan.yaml`, `workorders/T<n>.yaml`, `routing.snapshot.yaml`, `decisions/ADR-*.md` | declared, on `keel/<P>/main` only | YAML and Markdown with `keel:frozen` markers | one owning seat per file; `routing.snapshot.yaml` by the Steward | `proposal`, `intent`, `spec-delta`, `arch-delta`, `plan`, `workorder`, `routing-snapshot`, `decision` |
| `.keel/archive/<yyyy>/<P>-<slug>/` (proposal files, `ledger.slice.jsonl`, `evidence/`, `verdicts/`, `triage/`, `reports/`, `receipt.json`, `receipt.md`) | declared | projections | Steward (archive commit), through the projection gate | `ledger-event`, `evidence`, `verdict`, `triage`, `receipt` |
| `.keel/generated.lock.json` | declared | JSON | `keel sync` | `schemas/generated-lock.schema.json` |
| keel-owned surfaces (`AGENTS.md` block, `CLAUDE.md`, skill and agent copies) | declared | generated with `keel:managed` markers, generatedBy and sha256 | `keel sync` | `schemas/generated-lock.schema.json` (the lock) |
| `.git/keel/ledger/<yyyy-mm>.jsonl` | control | hash-chained JSONL, single writer under an O_EXCL lock | Steward | `schemas/ledger-event.schema.json` |
| `.git/keel/records/` (EV cache, VD, TR, IM), `briefs/`, `runs/<RUN>/`, `conformance/`, `cache/`, `locks/` | control | JSON, Markdown, `node:sqlite` (derived) | Steward | `evidence`, `verdict`, `triage`, `brief`, `run`, `conformance` |
| `<workspace_root>/_runs/<RUN>/inputs/`, `outbox/` | workspace | keel-owned inputs; O_EXCL JSON drops (the raw runtime stream is parsed in memory and never written) | Steward; the seat writes its outbox through `keel api` or MCP | `ack`, `result`, `verdict`, `triage`, `api-envelope` |
| `<workspace_root>/<P>.plan`, `<P>.T<n>`, `_verify/<sha7>` | workspace | git worktrees; task and verify worktrees sparse without `/.keel/proposals/` | Steward | `schemas/claim.schema.json` (workspace field) |
| `refs/keel/claims/<P.Tn>`, `refs/keel/snap/<P.Tn>/<seq>` | VCS | create-only CAS lock ref holding a token; shadow snapshots | Steward | `schemas/claim.schema.json` |
| Commit trailers | VCS | `Keel-*` trailers, `Not-tested` | Steward | `common.schema.json#/$defs/trailers` |
| Shared runtime settings (`.claude/settings.json`, `.gemini/settings.json`, `.qwen/settings.json`, user-global configs) | user | never read, written or hashed by keel | the user | snippets only: `templates/runtime/*.snippet.tmpl` |
| Environment variables named in `routing.yaml` | user | env vars or a secret manager | the user | names only: `examples/providers.env.example` |

Canonical data tables in the package (one home each; TS literal types, permissions and CLI enums are
generated from them from M1, and `keel sync --check` catches drift): `org/reserved-actions.yaml`,
`runtimes/hook-events.yaml`, the lens sets in `org/seats/reviewer.yaml`, and the id patterns and shared
enums in `schemas/common.schema.json`.

## 2. Package layout

```text
keel/
  README.md  README.zh-CN.md        bilingual summary, status, doc index
  AGENTS.md  CLAUDE.md              guide for agents developing keel
  LICENSE                           MIT, Copyright (c) 2026 Qither
  package.json  package-lock.json   @qither/keel; devDependencies only; no bin in M0
  tsconfig.json                     strict, NodeNext, ES2023, noEmit, include src
  .editorconfig .gitattributes .gitignore
  .github/workflows/ci.yml          windows-latest and ubuntu-latest, Node 22.13 and 24
  scripts/validate.mjs              the declared D1 tooling exception
  docs/                             design documents, each with a .zh-CN.md mirror; docs/adr/
  docs/reference-projects.yaml      reference registry for the refresh discipline (P4)
  schemas/                          JSON Schema 2020-12 files and examples.map.json
  src/                              type-only TypeScript
  org/                              seat contracts, reserved actions, checkpoints
  config/                           keel.defaults.yaml
  conformance/                      scenarios.yaml
  runtimes/                         descriptors, hook-events.yaml, README.md
  skills/                           keel-{frame,design,plan,work,review}/SKILL.md
  templates/                        project/, proposal/, runtime/, prompts/
  examples/                         acme-notes golden path, providers.env.example, dashboard mock
  test/                             test plan and fixtures
```

Runtime dependencies from M1 are `yaml` and `ajv` only, with no native addons
([adr/ADR-0002-node-windows-native.md](adr/ADR-0002-node-windows-native.md)). In M0 they are
devDependencies used by `scripts/validate.mjs`.

## 3. Artifact ↔ schema ↔ template/example

The tables below are the repository manifest. The first cell of each row lists repository paths; together
they cover every file except `package-lock.json` (listed anyway) and the `*.zh-CN.md` mirrors (listed next
to their English canonical files). For example files, the binding that `validate` actually checks is
`schemas/examples.map.json`; the "Example" column here names the intended example.
`docs/reference-projects.yaml` is a YAML data file that lives under `docs/`; the `examples` check validates
it against its schema and the `references` check of section 6 cross-references it.

<!-- keel:manifest:start -->

### Root, tooling and CI

| Path | Kind | Purpose |
| --- | --- | --- |
| `README.md`, `README.zh-CN.md` | doc | Bilingual summary, "design and skeleton only" status, doc index |
| `LICENSE` | licence | MIT, Copyright (c) 2026 Qither |
| `package.json` | config | `@qither/keel`, `type: module`, `engines.node >=22.13`, devDependencies `typescript`, `@types/node`, `ajv`, `ajv-formats`, `yaml`; scripts `typecheck`, `validate`, `check`; no `bin`, no `dependencies` |
| `package-lock.json` | config | Lockfile so CI can run `npm ci` |
| `tsconfig.json` | config | strict, NodeNext, ES2023, `noEmit`, `include: ["src"]` |
| `.gitignore` | config | `node_modules`, `dist`, `coverage`, `**/.keel/local.yaml`, `.codegraph/` |
| `.gitattributes` | config | `* text=auto eol=lf`; `*.cmd` and `*.ps1` CRLF |
| `.editorconfig` | config | UTF-8, LF, 2 spaces |
| `AGENTS.md` | doc | Guide for agents developing keel |
| `CLAUDE.md` | doc | `@AGENTS.md` bridge |
| `.github/workflows/ci.yml` | config | windows-latest and ubuntu-latest with Node 22.13 and 24: `npm ci`, typecheck, validate |
| `scripts/validate.mjs` | tooling | The declared D1 tooling exception (section 6) |

### Design documents

| Path | Home of |
| --- | --- |
| `docs/README.md`, `docs/README.zh-CN.md` | Reading order, document index, single-home table |
| `docs/00-mandate.md`, `docs/00-mandate.zh-CN.md` | The owner's statement, binding ids, precedence, refresh discipline |
| `docs/reference-projects.yaml` | Reference registry and scouting record (P4); schema `reference-registry` |
| `docs/00-vision.md`, `docs/00-vision.zh-CN.md` | Positioning, how the design meets the mandate, principles, glossary, end-to-end example |
| `docs/00a-owner-guide.md`, `docs/00a-owner-guide.zh-CN.md` | The owner's one-page guide |
| `docs/01-org-model.md`, `docs/01-org-model.zh-CN.md` | Board, Steward, seats, ownership, escalation, staffing |
| `docs/02-alignment.md`, `docs/02-alignment.zh-CN.md` | Alignment chain, brief, ACK, approvals, amendments, rulings |
| `docs/03-lifecycle.md`, `docs/03-lifecycle.zh-CN.md` | Tracks, phases, state machines, policies, liveness, budgets |
| `docs/04-trace-and-state.md`, `docs/04-trace-and-state.zh-CN.md` | Planes, ledger, ids, trailers, trace check, RTM, projections |
| `docs/05-vcs.md`, `docs/05-vcs.zh-CN.md` | Vcs interface, git mechanisms, land cases, reserved operations, jj |
| `docs/06-parallelism.md`, `docs/06-parallelism.zh-CN.md` | Waves, claims, Windows process model, integration |
| `docs/07-architecture-intelligence.md`, `docs/07-architecture-intelligence.zh-CN.md` | Declared and derived architecture, search, drift, impact |
| `docs/08-dashboard.md`, `docs/08-dashboard.zh-CN.md` | Read-only TanStack dashboard |
| `docs/09-runtimes.md`, `docs/09-runtimes.zh-CN.md` | Generated surfaces, descriptors, spawn contract, channels, rungs, conformance |
| `docs/10-providers.md`, `docs/10-providers.zh-CN.md` | Names-only providers, exposure rule, protocols, fakes |
| `docs/11-verification.md`, `docs/11-verification.zh-CN.md` | Gate catalogue, evidence, lenses, findings authority |
| `docs/12-cli-api-mcp.md`, `docs/12-cli-api-mcp.zh-CN.md` | Verbs and modes, envelope, exit codes, api, MCP, hooks |
| `docs/13-artifacts-schemas.md`, `docs/13-artifacts-schemas.zh-CN.md` | This document |
| `docs/14-trust-security.md`, `docs/14-trust-security.zh-CN.md` | Threat model, what approval records prove, exposure profile, limits |
| `docs/15-roadmap.md`, `docs/15-roadmap.zh-CN.md` | M0 to M8 with exit criteria |
| `docs/16-sources-credits.md`, `docs/16-sources-credits.zh-CN.md` | Credits, licences, provenance and shape audits |
| `docs/17-open-decisions.md`, `docs/17-open-decisions.zh-CN.md` | Adopted and open decisions |
| `docs/adr/ADR-0001-git-primary-jj-optional.md`, `docs/adr/ADR-0001-git-primary-jj-optional.zh-CN.md` | git primary, jj optional (D4) |
| `docs/adr/ADR-0002-node-windows-native.md`, `docs/adr/ADR-0002-node-windows-native.zh-CN.md` | Node built-ins plus `yaml` and `ajv`; native Windows |
| `docs/adr/ADR-0003-control-plane-in-git-common-dir.md`, `docs/adr/ADR-0003-control-plane-in-git-common-dir.zh-CN.md` | Control-plane location, hash chain, exposure honesty |
| `docs/adr/ADR-0004-steward-commits-and-submit-channels.md`, `docs/adr/ADR-0004-steward-commits-and-submit-channels.zh-CN.md` | Seats never commit; final message, MCP, outbox |
| `docs/adr/ADR-0005-explicit-confirmation-approvals.md`, `docs/adr/ADR-0005-explicit-confirmation-approvals.zh-CN.md` | Explicit-confirmation approvals: show, confirm, re-hash, record (D6) |
| `docs/adr/ADR-0006-provider-values-by-reference.md`, `docs/adr/ADR-0006-provider-values-by-reference.zh-CN.md` | P1 invariant and exposure rule |
| `docs/adr/ADR-0007-declared-vs-derived-architecture.md`, `docs/adr/ADR-0007-declared-vs-derived-architecture.zh-CN.md` | keel YAML model plus the IndexProvider port |
| `docs/adr/ADR-0008-read-only-dashboard.md`, `docs/adr/ADR-0008-read-only-dashboard.zh-CN.md` | Read-only dashboard, serve boundary, no second approval path |
| `docs/adr/ADR-0009-tanstack-frontend.md`, `docs/adr/ADR-0009-tanstack-frontend.zh-CN.md` | TanStack on React, headless, pre-rendered, bundled (P2) |

### Schemas

Every schema has `$id` `https://keel.invalid/schemas/<name>.schema.json`. "Target" is the artifact the
schema governs; "Template" and "Example" name the illustrating files, if any.

| Path | Target | Template | Example | Status |
| --- | --- | --- | --- | --- |
| `schemas/common.schema.json` | Shared `$defs`: id patterns, shared enums, hashes, trailers, freshness, source-state binding | none | trailers in `examples/acme-notes/commit-message.txt` | stable |
| `schemas/examples.map.json` | Binding of every example and fixture data file to a schema (not a schema itself) | none | none | stable |
| `schemas/config.schema.json` | `.keel/config.yaml` and `.keel/local.yaml` (strict) | `templates/project/config.yaml` | `examples/acme-notes/.keel/config.yaml` | stable |
| `schemas/charter.schema.json` | Charter frontmatter and INV obligations | `templates/project/charter.md` | `examples/acme-notes/.keel/charter.md` | stable |
| `schemas/goals.schema.json` | `.keel/goals.yaml` | `templates/project/goals.yaml` | `examples/acme-notes/.keel/goals.yaml` | stable |
| `schemas/routing.schema.json` | `.keel/routing.yaml`: profiles, seats, policy | `templates/project/routing.yaml` | `examples/acme-notes/.keel/routing.yaml` | stable |
| `schemas/routing-snapshot.schema.json` | Per-proposal `routing.snapshot.yaml`, bound by the plan approval when one is required | none (Steward-written) | `examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/routing.snapshot.yaml` | stable |
| `schemas/policy.schema.json` | `.keel/policies/<name>.yaml` | `templates/project/policies/quick-patch.yaml` | `examples/acme-notes/.keel/policies/quick-patch.yaml` | stable |
| `schemas/seat.schema.json` | `org/seats/*.yaml`, including execution class, ACK id set, lens sets, assumption | none | `org/seats/*.yaml` | stable |
| `schemas/reserved-actions.schema.json` | `org/reserved-actions.yaml` | none | `org/reserved-actions.yaml` | stable |
| `schemas/runtime-descriptor.schema.json` | `runtimes/<id>.yaml` | none | `runtimes/*.yaml` | stable |
| `schemas/hook-events.schema.json` | `runtimes/hook-events.yaml` | none | `runtimes/hook-events.yaml` | stable |
| `schemas/spec.schema.json` | `.keel/specs/<area>/spec.yaml` | none (written at land) | `examples/acme-notes/.keel/specs/notes/spec.yaml` | stable |
| `schemas/spec-delta.schema.json` | `spec.delta.yaml`: ops by id with a base `rev_hash` | `templates/proposal/spec.delta.yaml` | `examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/spec.delta.yaml` | stable |
| `schemas/decision.schema.json` | ADR frontmatter and parsed `## Obligations` | `templates/proposal/decision.md` | `examples/acme-notes/.keel/decisions/ADR-7KQ2B-tag-storage.md` | stable |
| `schemas/arch-model.schema.json` | `.keel/arch/model.yaml` | `templates/project/arch-model.yaml` | `examples/acme-notes/.keel/arch/model.yaml` | stable |
| `schemas/arch-rules.schema.json` | `.keel/arch/rules.yaml` | `templates/project/arch-rules.yaml` | `examples/acme-notes/.keel/arch/rules.yaml` | stable |
| `schemas/arch-baseline.schema.json` | `.keel/arch/baseline.json` | none | none | stable |
| `schemas/arch-delta.schema.json` | `arch.delta.yaml` | `templates/proposal/arch.delta.yaml` | none | stable |
| `schemas/arch-report.schema.json` | Impact, drift and search reports, index status, series point | none | none | stub (M4) |
| `schemas/proposal.schema.json` | `proposal.yaml` (intake signals only) | `templates/proposal/proposal.yaml` | `examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/proposal.yaml` | stable |
| `schemas/intent.schema.json` | `intent.md`: frozen sections, ACC items, contract hash rule | `templates/proposal/intent.md` | `examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/intent.md` | stable |
| `schemas/plan.schema.json` | `plan.yaml` (standard; campaign plans are an M8 stub) | `templates/proposal/plan.yaml` | `examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/plan.yaml` | stable |
| `schemas/workorder.schema.json` | `workorders/T<n>.yaml`: ACC to command table, `frozen_tests`, `derived_from` | `templates/proposal/workorder.yaml` | `examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/workorders/T1.yaml`, `T2.yaml` | stable |
| `schemas/brief.schema.json` | Brief JSON, section hashes, ACK id set | `templates/prompts/brief.md.tmpl` | `examples/acme-notes/workspace-root/_runs/RUN-01J9Z8Q4TKXW3M5N7P2R6S8V0A/inputs/brief.md` (rendered) | stable |
| `schemas/ack.schema.json` | ACK payload (OpenAI strict subset) | none | `examples/acme-notes/workspace-root/_runs/RUN-01J9Z8Q4TKXW3M5N7P2R6S8V0A/outbox/0001-ack.json` | stable |
| `schemas/result.schema.json` | Seat result, including the proposal files a read-only seat authored (strict subset; passed inline or by path per runtime) | none | `examples/acme-notes/workspace-root/_runs/RUN-01J9Z8Q4TKXW3M5N7P2R6S8V0A/outbox/0002-result.json` | stable |
| `schemas/verdict.schema.json` | Lens verdict (strict subset) | `templates/prompts/lens-*.md` | `examples/acme-notes/.keel/archive/2026/P-7F3K9Q-note-tags/verdicts/VD-5b1d2e3f4a6c.json` | stable |
| `schemas/triage.schema.json` | Planner triage record | none | none | stable |
| `schemas/evidence.schema.json` | EV record, source-state binding, red/green proof | none | `examples/acme-notes/.keel/archive/2026/P-7F3K9Q-note-tags/evidence/EV-3a9c0e1b2d4f.json` | stable |
| `schemas/approval.schema.json` | Approval record (stage, doc, policy, request, rule): subject, artifact hashes, note, declared approver, chain head, local time; rulings carry their budget limit or track change | `templates/project/approvals/README.md` | `examples/acme-notes/.keel/approvals/example.contract.json` | stable |
| `schemas/governance-record.schema.json` | Ruling, amendment and override records, degraded and unverified acks | none | none | stable |
| `schemas/claim.schema.json` | Claim lock token and workspace | none | none | stable |
| `schemas/ledger-event.schema.json` | Ledger event union with the `prev`/`hash` chain | none | `examples/acme-notes/git-common-dir/keel/ledger.sample.json` | stable |
| `schemas/run.schema.json` | Run record, whitelisted events, outcomes, exposure profile | none | none | stable |
| `schemas/receipt.schema.json` | `receipt.json` | `templates/proposal/receipt.md` | `examples/acme-notes/.keel/archive/2026/P-7F3K9Q-note-tags/receipt.json` | stable |
| `schemas/conformance.schema.json` | Plumbing and behaviour scenarios and their results | none | `conformance/scenarios.yaml` | stub (M6) |
| `schemas/generated-lock.schema.json` | `.keel/generated.lock.json` | none | none | stable |
| `schemas/api-envelope.schema.json` | CLI JSON envelope and diagnostics ([12-cli-api-mcp.md](12-cli-api-mcp.md)) | none | none | stable |
| `schemas/reference-registry.schema.json` | `docs/reference-projects.yaml` (P4 registry) | none | `docs/reference-projects.yaml` | stable |

### Type-only TypeScript

| Path | Types | Status |
| --- | --- | --- |
| `src/index.ts` | Type-only barrel | M0 |
| `src/cli/commands.ts` | `CommandSpec` literal union for the 16 verbs and 40 modes, exit codes | M0 |
| `src/api/contract.ts` | `keel api` op types, submit channels, envelope | M0 |
| `src/core/ids.ts` | Template-literal id types and literal unions of the shared enums (patterns live in `common.schema.json`) | M0 |
| `src/core/normalize.ts` | `NormalizationRule`, `HashInput` | M0 |
| `src/core/ledger.ts` | `LedgerEvent`, `ChainLink`, `Actor`, writer and reader interfaces | M0 |
| `src/core/lifecycle.ts` | Track, states, checkpoint stages, `StopClass`, `BlockReason` | M0 |
| `src/core/brief.ts` | Brief IR, `BriefSection`, `Freshness`, per-seat ACK id sets | M0 |
| `src/core/ack.ts` | `Ack`, `AckDiff` | M0 |
| `src/core/gates.ts` | `PhaseGate`, `CheckId`, `CheckResult`, `Readiness` (no rule values) | M0 |
| `src/core/evidence.ts` | `EvidenceRecord`, `SourceStateBinding`, `RedGreenProof` | M0 |
| `src/core/governance.ts` | `ApprovalRecord`, `ChangeRequest`, `Approval`, `ApprovalInvalidity`, `ConfirmationStep`, `Amendment`, `Ruling`, `Override`, `StandingPolicy` | M0 |
| `src/core/trace-graph.ts` | Trace nodes and edges, `RtmRow`, `TraceDriftKind` | M0 |
| `src/core/liveness.ts` | `LivenessHold`, `TrackRecord` | M0 |
| `src/org/seats.ts` | `SeatContract`, `ExecutionClass`, `Independence` | M0 |
| `src/vcs/vcs.ts` | `Vcs` interface, `WorkspaceHandle`, `RefSnapshot`, `LandRequest` | M0 |
| `src/vcs/git.ts` | `GitBackend` config types, trailer keys and ref namespaces as literal types | M0 |
| `src/vcs/jj.ts` | `JjBackend` feature flags | stub (M7) |
| `src/runtime/descriptor.ts` | `RuntimeDescriptor`, `CapabilityMatrix`, `VerificationStatus` | M0 |
| `src/runtime/spawn.ts` | `WindowsResolution`, `PromptChannel`, `SubmitChannel`, `Cancellation`, `EnvAllowlist` | M0 |
| `src/runtime/exposure.ts` | `ExposureProfile`, `ProviderPathSet` (names), `ExposureRule` | M0 |
| `src/runtime/dispatch.ts` | `DispatchRequest`, `RunRecord`, `CanonicalRunEvent`, `Outcome` | M0 |
| `src/runtime/surfaces.ts` | `SurfaceAdapter`, `Snippet`, `GeneratedLock` | M0 |
| `src/runtime/hooks.ts` | Canonical hook event types | M0 |
| `src/runtime/conformance.ts` | Scenario kinds, conformance status (verified, failed, unverified) | M0 |
| `src/providers/routing.ts` | `ProviderProfile` (names), `AuthMode`, `DeclaredFamily`, compatibility | M0 |
| `src/providers/env-policy.ts` | `OpaqueSecretHandle` type only; constants in M2; one of the two lint-allowed modules | M0 |
| `src/providers/protocols.ts` | `ModelRequest`, `ModelResponse`, the three protocol shapes, `ProtocolTranslator` | M0 |
| `src/direct/client.ts` | Direct-lane request builder types; the second lint-allowed module | stub (M6) |
| `src/arch/model.ts` | `ArchModel`, `ArchRule`, `Baseline`, `ArchDelta`, `TypedArchOp` | stub (M4) |
| `src/arch/index-provider.ts` | `IndexProvider` port: status, search, definitions, references, dependents | stub (M4) |
| `src/arch/analysis.ts` | `Lifter`, `DriftFinding`, `ImpactReport`, `ChangeFeedItem`, `SeriesPoint` | stub (M4) |
| `src/dashboard/model.ts` | `DashboardModel` | stub (M5) |
| `src/mcp/tools.ts` | MCP tool input and output types | M0 |

### Organization, configuration and conformance data

| Path | Content | Schema |
| --- | --- | --- |
| `org/reserved-actions.yaml` | Canonical reserved actions | `schemas/reserved-actions.schema.json` |
| `org/checkpoints.yaml` | Checkpoint stages and what each asks the Board to read | none in M0 (fixed four-stage table) |
| `org/seats/product.yaml` | Product seat contract | `schemas/seat.schema.json` |
| `org/seats/architect.yaml` | Architect seat contract | `schemas/seat.schema.json` |
| `org/seats/planner.yaml` | Planner seat contract | `schemas/seat.schema.json` |
| `org/seats/engineer.yaml` | Engineer seat contract | `schemas/seat.schema.json` |
| `org/seats/reviewer.yaml` | Reviewer contract and the only lens-set table | `schemas/seat.schema.json` |
| `config/keel.defaults.yaml` | Caps and thresholds, each with a reason; the package-defaults layer under `.keel/config.yaml` | `schemas/config.schema.json` (defaults layer) |
| `conformance/scenarios.yaml` | Plumbing and behaviour scenarios, including provider 401 temptation and the compaction digest | `schemas/conformance.schema.json` (M6 stub) |

### Runtime descriptors

| Path | Content |
| --- | --- |
| `runtimes/claude-code.yaml` | Claude Code descriptor |
| `runtimes/codex.yaml` | Codex descriptor, with its probe list (trust, `OPENAI_BASE_URL`, `windows.sandbox`) |
| `runtimes/gemini-cli.yaml` | Gemini CLI descriptor (unverified; `--policy` probe) |
| `runtimes/qwen-code.yaml` | Qwen Code descriptor |
| `runtimes/kimi-code.yaml` | Kimi Code descriptor (`bypass_equivalent`; rung D until verified) |
| `runtimes/opencode.yaml` | opencode descriptor (GLM and Gemini-family host) |
| `runtimes/direct.yaml` | keel direct read-only lane |
| `runtimes/hook-events.yaml` | Canonical hook table: canonical and native events, blockability |
| `runtimes/README.md` | Capability matrix with verification status, rendered for readers |

All descriptors validate against `schemas/runtime-descriptor.schema.json`, `hook-events.yaml` against
`schemas/hook-events.schema.json`; see [09-runtimes.md](09-runtimes.md).

### Skills

| Path | Seat | Procedure |
| --- | --- | --- |
| `skills/keel-frame/SKILL.md` | product | Framing, including spikes |
| `skills/keel-design/SKILL.md` | architect | Design, arch delta, ADR obligations |
| `skills/keel-plan/SKILL.md` | planner | Plan, work orders, triage |
| `skills/keel-work/SKILL.md` | engineer | ACK, build, submit |
| `skills/keel-review/SKILL.md` | reviewer | Lenses and the verdict contract |

### Templates

Token convention. Files ending in `.tmpl`, and `templates/proposal/receipt.md`, are rendered by keel with a
logic-less Mustache subset: values, repeating and inverted sections, and comments, with no HTML escaping.
In JSON templates a token whose name ends in `_json` is replaced by a JSON value and written without
quotes; other scalar values are escaped for the host format. Every other template is a starting point:
keel fills the tokens it knows, and the Board or the owning seat replaces the rest. Each template says
which kind it is in its header comment. The brief template marks its unhashed header with
`<!-- keel:brief:header -->` and its hashed body with `<!-- keel:brief:body:start -->` and
`<!-- keel:brief:body:end -->` ([02-alignment.md](02-alignment.md) defines the hashing).

| Path | Renders | Governed by |
| --- | --- | --- |
| `templates/project/config.yaml` | `.keel/config.yaml` | `schemas/config.schema.json` |
| `templates/project/charter.md` | `.keel/charter.md` | `schemas/charter.schema.json` |
| `templates/project/goals.yaml` | `.keel/goals.yaml` | `schemas/goals.schema.json` |
| `templates/project/routing.yaml` | `.keel/routing.yaml` with placeholder aliases, declared families and env NAMES | `schemas/routing.schema.json` |
| `templates/project/policies/quick-patch.yaml` | Standing policy with red/green and lens predicates | `schemas/policy.schema.json` |
| `templates/project/approvals/README.md` | Explains the committed approval-record directory | `schemas/approval.schema.json` |
| `templates/project/arch-model.yaml` | `.keel/arch/model.yaml` | `schemas/arch-model.schema.json` |
| `templates/project/arch-rules.yaml` | `.keel/arch/rules.yaml` | `schemas/arch-rules.schema.json` |
| `templates/proposal/proposal.yaml` | Proposal intake signals | `schemas/proposal.schema.json` |
| `templates/proposal/intent.md` | Frozen intent with ACC | `schemas/intent.schema.json` |
| `templates/proposal/spec.delta.yaml` | Spec delta | `schemas/spec-delta.schema.json` |
| `templates/proposal/arch.delta.yaml` | Arch delta | `schemas/arch-delta.schema.json` |
| `templates/proposal/plan.yaml` | Plan | `schemas/plan.schema.json` |
| `templates/proposal/workorder.yaml` | Work order with the ACC to command table | `schemas/workorder.schema.json` |
| `templates/proposal/decision.md` | ADR with `## Obligations` | `schemas/decision.schema.json` |
| `templates/proposal/answer.md` | Spike answer | none (prose) |
| `templates/proposal/receipt.md` | Receipt: AGENT section plus the rendered Land approval section | `schemas/receipt.schema.json` (the JSON twin) |
| `templates/runtime/AGENTS.block.md.tmpl` | Managed pointer block | `schemas/generated-lock.schema.json` (lock entry) |
| `templates/runtime/CLAUDE.md.tmpl` | `@AGENTS.md` bridge | lock entry |
| `templates/runtime/claude-run-settings.json.tmpl` | Per-run hooks, allowed tools, deny rules | keel-owned per-run file |
| `templates/runtime/claude-agent.md.tmpl` | Seat to Claude agent file | lock entry |
| `templates/runtime/gemini-policy.toml.tmpl` | Per-run `--policy` file | keel-owned per-run file |
| `templates/runtime/kimi-agent.md.tmpl` | Per-run agent file: brief and tools allowlist | keel-owned per-run file |
| `templates/runtime/opencode.json.tmpl` | Per-run config with `{env:VAR}` references and deny rules | keel-owned per-run file |
| `templates/runtime/opencode-agent.md.tmpl` | Seat to opencode agent file | lock entry |
| `templates/runtime/mcp.json.tmpl` | Per-run MCP registration | keel-owned per-run file |
| `templates/runtime/claude-settings.snippet.tmpl` | Printed-only project settings snippet | never written by keel |
| `templates/runtime/gemini-settings.snippet.tmpl` | Printed-only snippet | never written by keel |
| `templates/runtime/qwen-settings.snippet.tmpl` | Printed-only snippet | never written by keel |
| `templates/runtime/kimi-hooks.snippet.tmpl` | Printed-only user-global snippet | never written by keel |
| `templates/prompts/brief.md.tmpl` | The single brief template | `schemas/brief.schema.json` (the JSON form) |
| `templates/prompts/lens-spec.md` | Frame-stage spec lens | `schemas/verdict.schema.json` |
| `templates/prompts/lens-blind-diff.md` | Blind-diff lens | `schemas/verdict.schema.json` |
| `templates/prompts/lens-edge-case.md` | Edge-case lens | `schemas/verdict.schema.json` |
| `templates/prompts/lens-verification-gap.md` | Verification-gap lens | `schemas/verdict.schema.json` |
| `templates/prompts/lens-intent-alignment.md` | Intent-alignment lens: frozen intent and diff only | `schemas/verdict.schema.json` |
| `templates/prompts/lens-architecture.md` | Architecture lens | `schemas/verdict.schema.json` |
| `templates/prompts/lens-audit.md` | Audit lens: plan adherence and rulings against the diff | `schemas/verdict.schema.json` |
| `templates/prompts/overlays/tier-fast.md` | Shorter recipes for fast-tier models | none (prompt overlay) |

### Examples

The golden path is proposal `P-7F3K9Q` (note tags) in the fictional project acme-notes.
`git-common-dir/` stands for `<git-common-dir>` so the control-plane samples can be committed, and
`workspace-root/` stands for `<workspace_root>` (default `../acme-notes.ws/`), where run inputs and outbox
drops live. The skeleton listed the run files under `git-common-dir/keel/runs/`; they sit under
`workspace-root/_runs/` because only `run.json`, `argv.redacted.json` and `events.jsonl` belong in the control
plane.

| Path | Illustrates | Schema (format) |
| --- | --- | --- |
| `examples/acme-notes/.keel/config.yaml` | Config | `config` (yaml) |
| `examples/acme-notes/.keel/charter.md` | Charter version 1.0.0 with INV | `charter` (md-frontmatter) |
| `examples/acme-notes/.keel/goals.yaml` | Goal G-03 | `goals` (yaml) |
| `examples/acme-notes/.keel/routing.yaml` | Engineer on claude-code (env), reviewer on opencode with declared family google, GLM via opencode; names only | `routing` (yaml) |
| `examples/acme-notes/.keel/policies/quick-patch.yaml` | Standing policy | `policy` (yaml) |
| `examples/acme-notes/.keel/approvals/example.contract.json` | Illustrative contract approval record with a declared approver | `approval` (json) |
| `examples/acme-notes/.keel/specs/notes/spec.yaml` | Requirement R-notes-4QX7B | `spec` (yaml) |
| `examples/acme-notes/.keel/decisions/ADR-7KQ2B-tag-storage.md` | ADR with `## Obligations` | `decision` (md-frontmatter) |
| `examples/acme-notes/.keel/arch/model.yaml` | Elements | `arch-model` (yaml) |
| `examples/acme-notes/.keel/arch/rules.yaml` | Layers and a forbidden web to store rule | `arch-rules` (yaml) |
| `examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/proposal.yaml` | Intake signals, as on `keel/P-7F3K9Q/main` | `proposal` (yaml) |
| `examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/intent.md` | Frozen intent with ACC | `intent` (md-frontmatter) |
| `examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/spec.delta.yaml` | MODIFIED with a base `rev_hash` | `spec-delta` (yaml) |
| `examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/plan.yaml` | Two waves | `plan` (yaml) |
| `examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/workorders/T1.yaml` | Test-first task on a different family | `workorder` (yaml) |
| `examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/workorders/T2.yaml` | Build task with `frozen_tests` and the ACC to command table | `workorder` (yaml) |
| `examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/routing.snapshot.yaml` | Routing snapshot | `routing-snapshot` (yaml) |
| `examples/acme-notes/git-common-dir/keel/ledger.sample.json` | Chained events as a JSON array (JSONL validated from M1) | `ledger-event` (json-array) |
| `examples/acme-notes/workspace-root/_runs/RUN-01J9Z8Q4TKXW3M5N7P2R6S8V0A/inputs/brief.md` | Rendered brief; its hash is illustrative until the M1 golden test | not mapped (rendered Markdown) |
| `examples/acme-notes/workspace-root/_runs/RUN-01J9Z8Q4TKXW3M5N7P2R6S8V0A/outbox/0001-ack.json` | Matching ACK drop | `ack` (json) |
| `examples/acme-notes/workspace-root/_runs/RUN-01J9Z8Q4TKXW3M5N7P2R6S8V0A/outbox/0002-result.json` | Result drop | `result` (json) |
| `examples/acme-notes/.keel/archive/2026/P-7F3K9Q-note-tags/receipt.json` | Receipt projection | `receipt` (json) |
| `examples/acme-notes/.keel/archive/2026/P-7F3K9Q-note-tags/receipt.md` | The receipt the Board read and approved, rendered from `receipt.json` with the Land approval section from the land record | not mapped (rendered Markdown) |
| `examples/acme-notes/.keel/archive/2026/P-7F3K9Q-note-tags/verdicts/VD-*.json` | Every cross-family verdict the receipt names: spec, plan verification-gap, test-task verification-gap, blind-diff and build verification-gap | `verdict` (json) |
| `examples/acme-notes/.keel/archive/2026/P-7F3K9Q-note-tags/evidence/EV-*.json` | Runner evidence with source-state binding: the test task red (`verify.test-red`) and the build task green | `evidence` (json) |
| `examples/acme-notes/commit-message.txt` | Steward commit showing every trailer | `common#/$defs/trailers` (illustrative text) |
| `examples/providers.env.example` | Placeholder variable NAMES only | not mapped (names list) |
| `examples/dashboard/sample.html` | Hand-written static mock of the markup and token rules the M5 TanStack page reproduces | not mapped (HTML) |

### Tests

| Path | Content | Schema (format) |
| --- | --- | --- |
| `test/README.md` | Test plan: fakes, env stripping, recorded streams, negative controls | none |
| `test/fixtures/fake-providers.yaml` | Loopback anthropic-messages, openai-chat and openai-responses fakes plus a 401 mode, `sk-fake-keel-*` keys | not mapped: listed in `unmapped_ok` of `schemas/examples.map.json` (the M2 harness owns the format) |
| `test/fixtures/env-strip.yaml` | Env prefixes stripped from child processes | not mapped: listed in `unmapped_ok` of `schemas/examples.map.json` (the M2 harness owns the format) |

<!-- keel:manifest:end -->

## 4. Draft and deferred markers

M0 ships full schemas and types for the M1 to M3 artifacts and one-line deferred stubs for M4 and later.
Every deferred or unverified item is marked so that a reader, and `validate`, can tell it apart:

| Where | Marker | Meaning |
| --- | --- | --- |
| JSON Schema root or `$defs` entry | `"x-keel-status"`: `"stable"`, `"draft"` or `"stub"` | `stub`: the shape is a placeholder; artifacts are not produced before the milestone |
| JSON Schema root or `$defs` entry | `"x-keel-milestone": "M4"` (M0 to M8, M1a, M1b) | The milestone that makes the schema real |
| JSON Schema root (Markdown artifacts) | `"x-keel-sections"` (charter, decision, intent) and `"x-keel-frozen-markers"` (intent) | The required level-2 headings of the body, in order, and the frozen block markers; `validate` checks mapped Markdown examples against them |
| TypeScript file | `@status deferred:M4` in the leading TSDoc `@packageDocumentation` block | Types exist only to fix names; they may change freely until the milestone |
| Runtime descriptor field | `verification_status`: `unverified`, `documented`, `probed` or `verified` | See [09-runtimes.md](09-runtimes.md) section 2 |
| Documentation | "verify by probe" | An unconfirmed runtime, CLI or jj fact |
| Documentation | "(M4)", "from M3" | The milestone a behaviour arrives in |

Deferred in M0:

- stubs: `schemas/arch-report.schema.json` and `src/arch/*.ts` (M4), `src/dashboard/model.ts` (M5),
  `schemas/conformance.schema.json` and `src/direct/client.ts` (M6), `src/vcs/jj.ts` (M7), campaign plans in
  `schemas/plan.schema.json` (M8);
- not shipped at all: the advisory git/jj shims and the optional `commit-msg` hook (M2), and the dashboard
  TanStack shell, CSS and package-build bundle (M5; M0 has only `examples/dashboard/sample.html`);
- illustrative only: the brief hash in the example run (until the M1 golden test) and the ledger sample as
  a JSON array (JSONL is validated from M1).

## 5. Migrations as data

Schemas evolve; migrations are declarative data, never code that rewrites history (the migrations-as-data
idea comes from BMAD-METHOD).

- Every versioned record carries its schema version: ledger events carry `v` (see
  [04-trace-and-state.md](04-trace-and-state.md)), the JSON envelope carries `v`, and generated files carry
  their generator version in the lock.
- A migration is a data record naming `from` and `to` versions, the schema it applies to, and a list of
  field operations (rename, add with a default, remap an enum value, drop). No migration runs arbitrary
  code.
- Ledger lines are never rewritten, because the hash chain and the chain heads inside approval records
  would break. Readers upcast old events on read, using the migration records.
- Declared-plane files that the Board approved are migrated by producing new bytes and a new approval: the
  Steward proposes the migrated file, the Board views and approves it with `keel approve --doc`, and a
  governance commit lands it. Old records stay a valid history of the old bytes.
- Derived data (`.git/keel/cache/`, `trace.db`, the index) is rebuilt, never migrated.
- M0 ships no migration file; the first schema change after M1 introduces the migration directory and its
  schema.

## 6. validate coverage and the D1 tooling exception

D1: M0 delivers documents and a skeleton, with no product logic and no `bin`. The single declared tooling
exception is `scripts/validate.mjs`. It checks the skeleton and holds no product logic; it never opens a
file that may hold provider values or credentials, and reports such a file by name only.

```sh
npm run check                                    # typecheck + validate (what CI runs)
node scripts/validate.mjs                        # all checks
node scripts/validate.mjs --only schemas,examples,strict,i18n,audit,manifest,references
```

Output is `<check>: <passed>/<total> <unit>` followed by `x <error>` lines; exit 1 on any error, 2 on bad
arguments.

| Check | Covers | Does not cover |
| --- | --- | --- |
| `schemas` | Meta-validates and compiles every `schemas/*.schema.json` and every `$defs` entry in one Ajv 2020 instance (strict mode, `ajv-formats`), so cross-file `$ref`s must resolve; checks `$id` and `$schema` | Semantic rules that no schema can express (for example contract hash computation) |
| `examples` | Validates every entry of `schemas/examples.map.json` in its format (`yaml`, `json`, `jsonl`, `json-array`, `md-frontmatter`); every YAML/JSON/JSONL file under `examples/` and `test/fixtures/` must be mapped or listed in `unmapped_ok` with a reason; the package data tables that have a schema (`org/reserved-actions.yaml`, `org/seats/*.yaml`, `runtimes/*.yaml`, `config/keel.defaults.yaml`, `conformance/scenarios.yaml`) are mapped and validated too; mapped `md-frontmatter` files must also carry the level-2 headings of their schema's `x-keel-sections`, in order (inside the `x-keel-frozen-markers` region for intent) | Markdown body content beyond those headings, HTML, `.txt`, `.example` files, the rendered brief; `org/checkpoints.yaml`, which has no schema in M0 |
| `strict` | The OpenAI strict subset for schemas marked `"x-keel-strict-subset": true` (ack, result, verdict) and everything they reach through `$ref` | Provider-specific limits beyond the subset (verify by probe per endpoint) |
| `i18n` | Every `.md` under `docs/`, the root `README.md`, `runtimes/README.md` and `test/README.md` has a `.zh-CN.md` mirror with the identical sequence of heading levels; no orphan mirrors | Translation quality; other Markdown (templates, skills, agent guides) |
| `audit` | The D2 term list (in paths and contents), P1 key-shaped tokens, real provider API hosts, non-placeholder URL hosts outside `docs/**`, `README*.md` and `AGENTS.md`, forbidden credential file names; D1: no `bin` and no `dependencies` in `package.json`, and type-only statements in every `src/` file | Meaning: a design that is wrong but uses allowed words passes |
| `manifest` | Every path in the marked tables of section 3 exists, and every repository file except `package-lock.json` and `*.zh-CN.md` is covered | Whether the "Purpose" text is accurate |
| `references` | Parses `docs/reference-projects.yaml`; every project with `named_by_owner` true is named in `docs/00-mandate.md` and `docs/16-sources-credits.md`; `local_clone` is null or a relative path outside the repository and is never opened | Whether a review actually happened; upstream state |

`npm run typecheck` (`tsc --noEmit -p tsconfig.json`) covers the TypeScript: strict mode, NodeNext module
resolution, `verbatimModuleSyntax` and `isolatedModules`. Together with the `audit` check it enforces that
`src/` contains only `import type`, `export type`, type aliases, interfaces, `export {}` and comments.

Not covered anywhere in M0, by design: behaviour. There is no product code to test; M1a's exit criteria
([15-roadmap.md](15-roadmap.md)) start the executable tests described in
[11-verification.md](11-verification.md).
