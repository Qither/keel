# keel documentation

This is the entry point to keel's design documents. It gives a reading order for each kind of reader,
an index of the documents, and the single-home table: every concept is explained in exactly one
document, and every other document links to that home instead of restating it. The root every document
derives from is [00-mandate.md](00-mandate.md), the owner's statement: when any document disagrees with it,
the document is wrong.

All documents describe the M0 design. keel ships no executable in M0; commands such as `keel run` are the
designed interface, specified in [12-cli-api-mcp.md](12-cli-api-mcp.md).

## Reading order

### Owner (Board member)

1. [00-mandate.md](00-mandate.md): your own statement, verbatim and translated, the ids R1–R5, D1–D7,
   P1–P4 used everywhere else, and the refresh discipline you will be asked to take part in.
2. [00a-owner-guide.md](00a-owner-guide.md): setup, the five daily commands, how often each track needs
   your confirmation, what to read at each checkpoint, and where to look when work is blocked.
3. [17-open-decisions.md](17-open-decisions.md): the adopted-by-recommendation list you confirm for the M0
   exit, and the decisions that are still open.
4. [00-vision.md](00-vision.md): positioning and the glossary are enough at first.
5. [01-org-model.md](01-org-model.md): what the Board, the Steward and each seat may and may not do.
6. [03-lifecycle.md](03-lifecycle.md): tracks, phases and the state machines.
7. [11-verification.md](11-verification.md), sections 2, 5 and 6: evidence and `not_run`, declared
   independence and conformance status, and findings authority, which is what the land checkpoint asks you
   to judge.
8. [14-trust-security.md](14-trust-security.md): what keel prevents, what it only detects, and what an
   approval record proves.
9. [10-providers.md](10-providers.md): how to wire your own model endpoints without keel ever seeing a value.

### Implementer of keel

Read [00-mandate.md](00-mandate.md) first, then in numeric order: [00](00-vision.md),
[01](01-org-model.md), [02](02-alignment.md), [03](03-lifecycle.md), [04](04-trace-and-state.md),
[05](05-vcs.md), [06](06-parallelism.md), [07](07-architecture-intelligence.md), [08](08-dashboard.md),
[09](09-runtimes.md), [10](10-providers.md), [11](11-verification.md), [12](12-cli-api-mcp.md),
[13](13-artifacts-schemas.md), [14](14-trust-security.md), [15](15-roadmap.md),
[16](16-sources-credits.md), [17](17-open-decisions.md), then the ADRs in [adr/](adr/). Keep
[13-artifacts-schemas.md](13-artifacts-schemas.md) open as the map from artifact to schema, template and
example, and `reference-projects.yaml` as the reference registry (P4).

### Adding a runtime or a provider family

[09-runtimes.md](09-runtimes.md), [10-providers.md](10-providers.md), the "ACK and submit channels" section
of [02-alignment.md](02-alignment.md), the reserved-operation tables in [05-vcs.md](05-vcs.md), and the
exposure profile in [14-trust-security.md](14-trust-security.md).

## Document index

| Document | Scope |
| --- | --- |
| [00-mandate.md](00-mandate.md) | The owner's statement, binding requirement ids, precedence and amendment rules, refresh discipline (P4) |
| [00-vision.md](00-vision.md) | Positioning and non-goals, how the design meets the mandate, principles KP-01 to KP-16, glossary, end-to-end example |
| [00a-owner-guide.md](00a-owner-guide.md) | One-page guide for the Board |
| [01-org-model.md](01-org-model.md) | Board, Steward modules, the five seat contracts, ownership, escalation, staffing per track |
| [02-alignment.md](02-alignment.md) | Alignment chain L0 to L11, brief compiler, ACK and submit channels, approvals, amendments, rulings |
| [03-lifecycle.md](03-lifecycle.md) | Tracks and the ratchet, phases 0 to 6, patch track and policy path, state machines, liveness, budgets |
| [04-trace-and-state.md](04-trace-and-state.md) | Three planes, hash-chained ledger, id table, trailers, trace check, RTM, projections, redaction |
| [05-vcs.md](05-vcs.md) | Vcs interface, branch naming, worktrees, Steward commits, land cases, reserved operations, jj |
| [06-parallelism.md](06-parallelism.md) | Waves, claims and leases, Windows process model, collisions, integration queue |
| [07-architecture-intelligence.md](07-architecture-intelligence.md) | Declared model, IndexProvider, search, drift, impact, element pages, change feed |
| [08-dashboard.md](08-dashboard.md) | Read-only dashboard: TanStack, headless over native markup, pre-rendered |
| [09-runtimes.md](09-runtimes.md) | Canonical sources and generated surfaces, descriptors, spawn contract, rungs A to D, conformance |
| [10-providers.md](10-providers.md) | Names-only provider configuration, exposure rule, protocols, doctor output, loopback fakes |
| [11-verification.md](11-verification.md) | Gate catalogue, evidence and re-execution, test independence, lenses, findings authority, fix loop |
| [12-cli-api-mcp.md](12-cli-api-mcp.md) | 16 verbs, JSON envelope, exit codes, `keel api`, MCP tools, `keel hook` |
| [13-artifacts-schemas.md](13-artifacts-schemas.md) | Target-project and package layouts, artifact to schema map, manifest, validate coverage |
| [14-trust-security.md](14-trust-security.md) | Threat model, what approval records prove, exposure profile and known limits, untrusted data |
| [15-roadmap.md](15-roadmap.md) | Milestones M0 to M8 with exit criteria, risks, measures |
| [16-sources-credits.md](16-sources-credits.md) | Construct to source map, licences, D2 provenance audit, ELv2 shape audit |
| [17-open-decisions.md](17-open-decisions.md) | Decisions resolved by the owner, those adopted by recommendation, and the ones still open |
| [adr/](adr/) | keel's own ADRs, ADR-0001 to ADR-0009 |

## Single-home table

Each row names a concept and the one document that owns it. When a concept changes, change its home and
check the documents that link to it.

| Concept | Home |
| --- | --- |
| The owner's statement, verbatim, and the binding statements of R1–R5, D1–D7, P1–P4 | [00-mandate.md](00-mandate.md) |
| Precedence between the statement, principles, home documents, ADRs and data files; amendment rules | [00-mandate.md](00-mandate.md) |
| Refresh discipline (P4): when it runs, the registry, the procedure, what the owner is asked, guardrails | [00-mandate.md](00-mandate.md) |
| Positioning, pitch and non-goals | [00-vision.md](00-vision.md) |
| Requirement mapping: how the design meets R1–R5, D1–D7, P1–P4 | [00-vision.md](00-vision.md) |
| Principles KP-01 to KP-16 and their sources | [00-vision.md](00-vision.md) |
| Glossary (one-line definition of every term and id prefix) | [00-vision.md](00-vision.md) |
| End-to-end example from a goal to a line of code | [00-vision.md](00-vision.md) |
| The owner's daily commands and walkthrough | [00a-owner-guide.md](00a-owner-guide.md) |
| What to read at each checkpoint | [00a-owner-guide.md](00a-owner-guide.md) |
| Where to look when work is blocked | [00a-owner-guide.md](00a-owner-guide.md) |
| Organization as data; route resolution at dispatch | [01-org-model.md](01-org-model.md) |
| Board identity and powers; checkpoint stages (contract, plan, land, receipt) | [01-org-model.md](01-org-model.md) |
| Board rulings (`--rule answer`, `budget`, `track`, `override`, `dismiss`, `degraded`, `unverified`, `abandon`) | [01-org-model.md](01-org-model.md) |
| Steward modules (compiler, dispatcher, runner, integrator, cartographer, auditor) | [01-org-model.md](01-org-model.md) |
| Seat contracts, execution classes, per-seat ACK id sets, default tiers | [01-org-model.md](01-org-model.md) (data: `org/seats/*.yaml`) |
| Single-writer ownership of artifacts and fields | [01-org-model.md](01-org-model.md) |
| Escalation path, ask routing, the four stop classes, BLOCKED remedy ladder | [01-org-model.md](01-org-model.md) |
| Staffing per track and seat counts; why keel uses no personas | [01-org-model.md](01-org-model.md) |
| Alignment chain L0 to L11 and the precedence order | [02-alignment.md](02-alignment.md) |
| Brief compiler, normalization and hashing, delivery channels, prompt provenance (PG) | [02-alignment.md](02-alignment.md) |
| ACK mechanism and submit channels per runtime and mode | [02-alignment.md](02-alignment.md) |
| Submit-time recompilation and stale propagation (`derived_from`) | [02-alignment.md](02-alignment.md) |
| Approval flow (show, confirm, re-hash, record), the approval record, what each kind binds, the gate checks, invalidation; request records; seat-proof verbs | [02-alignment.md](02-alignment.md) |
| Amendments | [02-alignment.md](02-alignment.md) |
| Decision boundaries and seat rulings | [02-alignment.md](02-alignment.md) |
| Which alignment mechanisms are Steward-side and hold at every rung | [02-alignment.md](02-alignment.md) |
| Tracks, track signals, the upward-only ratchet and its no-index fallback | [03-lifecycle.md](03-lifecycle.md) |
| Phases 0 to 6 | [03-lifecycle.md](03-lifecycle.md) |
| Patch track and policy path | [03-lifecycle.md](03-lifecycle.md) |
| Proposal and task state machines; blocked reasons | [03-lifecycle.md](03-lifecycle.md) |
| Standing policies and their limits; receipt acknowledgement | [03-lifecycle.md](03-lifecycle.md) |
| Liveness invariant and quiescence | [03-lifecycle.md](03-lifecycle.md) |
| Budgets and budget rulings | [03-lifecycle.md](03-lifecycle.md) |
| Three planes (declared, VCS-embedded, control plane) | [04-trace-and-state.md](04-trace-and-state.md) |
| Hash-chained ledger, event envelope, single-writer lock | [04-trace-and-state.md](04-trace-and-state.md) |
| Id scheme table (patterns live only in `schemas/common.schema.json`) | [04-trace-and-state.md](04-trace-and-state.md) |
| Steward commits, commit trailers, governance commits | [04-trace-and-state.md](04-trace-and-state.md) |
| Trace check range and epoch (`trace.since`); RTM; trace drift classes | [04-trace-and-state.md](04-trace-and-state.md) |
| Archive projections and the projection gate; redaction and the field whitelist | [04-trace-and-state.md](04-trace-and-state.md) |
| Vcs interface, backend selection, git floor | [05-vcs.md](05-vcs.md) |
| Branch naming, sparse worktrees, Steward commit mechanics, land cases | [05-vcs.md](05-vcs.md) |
| Reserved operations: ref snapshots, `ls-remote`, env hardening, shims, prevent-vs-detect per runtime | [05-vcs.md](05-vcs.md) |
| jj backend and the git/jj parity table | [05-vcs.md](05-vcs.md) |
| Waves, claims and leases, cancellation, collision prediction, integration queue | [06-parallelism.md](06-parallelism.md) |
| Declared architecture model, IndexProvider port, search, drift, unknown policy, impact, element pages, change feed | [07-architecture-intelligence.md](07-architecture-intelligence.md) |
| Dashboard technology rules (TanStack on React, headless over native markup, pre-rendered and hydrated, bundled at package build, budgets), views, layout and serve boundary | [08-dashboard.md](08-dashboard.md) |
| Canonical sources, generated surfaces (`keel sync`), handbook budget | [09-runtimes.md](09-runtimes.md) |
| Runtime descriptors, verification status, Windows spawn contract, prompt channels | [09-runtimes.md](09-runtimes.md) |
| Permissions, trust and deny-read rules per runtime; rungs A to D and what each prevents or only detects | [09-runtimes.md](09-runtimes.md) |
| GLM-family and Gemini-family hosting; the verify-by-probe list | [09-runtimes.md](09-runtimes.md) |
| Conformance checks (plumbing and behaviour scenarios) | [09-runtimes.md](09-runtimes.md) |
| Provider invariant, `routing.yaml`, declared families, compatibility, in-memory injection | [10-providers.md](10-providers.md) |
| Exposure rule for code-executing seats; protocols; `doctor` provider output; loopback fakes | [10-providers.md](10-providers.md) |
| Gate catalogue (five phase gates and their named checks) | [11-verification.md](11-verification.md) |
| Source-state binding, evidence, land re-execution | [11-verification.md](11-verification.md) |
| Test independence and red-before/green-after proof | [11-verification.md](11-verification.md) |
| Review lenses and lens sets; declared independence; conformance status as a gate input | [11-verification.md](11-verification.md) (lens sets: `org/seats/reviewer.yaml`) |
| Findings authority, triage records, fix loop, negative controls, keel's own tests | [11-verification.md](11-verification.md) |
| CLI verbs and modes, JSON envelope, exit codes, `keel api`, MCP tools, `keel hook` | [12-cli-api-mcp.md](12-cli-api-mcp.md) |
| Target-project layout, package layout, artifact to schema map, draft markers, migrations, manifest | [13-artifacts-schemas.md](13-artifacts-schemas.md) |
| Threat model, what approval records prove and do not prove, exposure profile and known limits, untrusted data, branch protection | [14-trust-security.md](14-trust-security.md) |
| Milestones and exit criteria, risks, measures | [15-roadmap.md](15-roadmap.md) |
| Credits, licences, D2 provenance audit, ELv2 shape audit, deliberately unadopted ideas | [16-sources-credits.md](16-sources-credits.md) |
| Resolved, adopted and open decisions | [17-open-decisions.md](17-open-decisions.md) |

Canonical data tables are files, not documents. Documents explain them; the files hold the values:

| Table | File |
| --- | --- |
| Id patterns and shared enums | `schemas/common.schema.json` |
| Reserved actions | `org/reserved-actions.yaml` |
| Checkpoint stages and what each asks the Board to read | `org/checkpoints.yaml` |
| Seat contracts | `org/seats/*.yaml` |
| Lens sets | `org/seats/reviewer.yaml` |
| Canonical hook events and blockability | `runtimes/hook-events.yaml` |
| Caps and thresholds, each with a reason | `config/keel.defaults.yaml` |
| Conformance scenarios | `conformance/scenarios.yaml` |
| Reference projects and the scouting record | `docs/reference-projects.yaml` |

## Conventions used in these docs

- **verify by probe** marks a runtime, CLI or jj fact that has not been confirmed on the target version. In
  YAML the same status is `verification_status: unverified | documented | probed | verified`. The list of
  open probes lives in [09-runtimes.md](09-runtimes.md).
- **Placeholders only.** Examples use `https://provider.example.invalid` (anthropic-messages) or
  `https://provider.example.invalid/v1` (OpenAI protocols), `<set-in-your-own-environment>` and fake keys that
  start with `sk-fake-keel-`. No document names a real provider host or a real key.
- **Ids** follow the patterns in `schemas/common.schema.json`, for example `P-7F3K9Q`, `R-notes-4QX7B`,
  `G-03`, `BR-9e4c1a7b2d05`. The id table is in [04-trace-and-state.md](04-trace-and-state.md).
- **Terminology** is fixed: Board, Steward, seat (product, architect, planner, engineer, reviewer), track
  (spike, patch, feature, system), tier (frontier, standard, fast), brief, ACK, work order, lens, receipt,
  rung A to D, exposure profile, declared family. The glossary in [00-vision.md](00-vision.md) defines each.
- **Terms that must not appear** in this repository are listed once, in the D2 term list in
  `scripts/validate.mjs`, and are not repeated in documentation.
- **Bilingual.** Every document `<name>.md` is English and canonical; `<name>.zh-CN.md` is its Simplified
  Chinese mirror with an identical sequence of heading levels. The glossary fixes the Chinese rendering of
  each term.
