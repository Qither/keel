# Sources, credits and licences

keel borrows ideas, not dependencies or text (P3, KP-15). This document owns three records: the map from
every borrowed construct to a permitted source, the licence of every reference project, and the two audits
the M0 exit requires, the D2 provenance audit and the ELv2 shape audit. Principles cite their sources inline
in [00-vision.md](00-vision.md); this document is the complete list.

A source is permitted when it is one of:

- an open-source project, used for ideas that keel re-implements in its own words and code;
- an ELv2 or otherwise non-OSS project, used for ideas only: no text, code, schemas, prompts, templates or
  file layouts;
- the public documentation of a tool, used to describe how keel drives that tool;
- a published standard or file format (OpenSSH `allowed_signers`, AGENTS.md, Agent Skills, C4, EARS, SCIP);
- keel's own design process: the competing blueprint proposals, the research surveys and the review passes;
- the owner's decisions D1–D7 and standing preferences P1–P3.

## Construct → permitted source map

Every idea listed in the blueprint's credits has a row. "Where in keel" names the artifact or mechanism;
its home document is in the single-home table of [README.md](README.md).

### Reference projects with a local clone

| keel construct | Where in keel | Taken from | Use |
| --- | --- | --- | --- |
| Requirement deltas keyed by id with a base fingerprint (`rev_hash`) | `spec.delta.yaml`, `schemas/spec-delta.schema.json` | OpenSpec delta specs | Idea, re-implemented |
| Per-seat compiled brief | `keel brief`, `templates/prompts/brief.md.tmpl` | OpenSpec runtime-compiled instruction envelope | Idea |
| One JSON contract per agent operation | `schemas/ack`, `result`, `verdict`, `api-envelope` schemas; `keel api` | OpenSpec one-JSON agent contract | Idea |
| Generated surfaces with ownership markers and a lock | `keel sync`, `.keel/generated.lock.json` | OpenSpec adapter registry with generatedBy markers | Idea |
| Serial spine for hot files | Wave scheduler | OpenSpec serial-spine parallelism | Idea |
| Cross-family review | Reviewer seat with a declared family | OpenSpec cross-model review | Idea |
| Rulings recorded inside decision boundaries | `keel api rule`, RL records | OpenSpec "decided autonomously" | Idea |
| Edge provenance and confidence | `provenance` enum on every architecture edge | codegraph | Idea |
| Impact analysis | `keel arch impact`, IM records | codegraph | Idea |
| Freshness stamps | Brief freshness, `index_commit` vs head | codegraph freshness banners | Idea |
| Success-shaped guidance on a mismatch | ACK retry guidance | codegraph | Idea |
| Set-difference rebuild check | `keel audit --rebuild` over `trace.db` | codegraph set-diff rebuilds | Idea |
| Loopback Host and Origin checks | `keel dashboard serve` | codegraph | Idea |
| A/B runs against a floor model | Prompt and skill eval evidence, behaviour conformance | codegraph | Idea |
| Reserved-action table | `org/reserved-actions.yaml` | codegraph `AGENTS.md`: indexing stays the user's decision, never the agent's (the idea that some actions belong to the human alone) | Idea |
| Code graph backend | IndexProvider `codegraph` backend under stated constraints | codegraph | Optional external adapter, not vendored |
| Deterministic core that calls no model | The Steward | edikt | Idea only (ELv2) |
| Obligations parsed without a model | ADR `## Obligations`, `schemas/decision.schema.json` | edikt deterministic governance compilation | Idea only (ELv2); shape audited below |
| Journaled fail-open hooks | `keel hook`, hook journal denominators | edikt | Idea only (ELv2) |
| Falsifiable check commands | INV and obligation `check` commands | edikt | Idea only (ELv2) |
| Expiring overrides | `keel approve --rule override --until …` | edikt | Idea only (ELv2) |
| Brief digest re-injected after context compaction | Canonical post-compaction event in `runtimes/hook-events.yaml` | keel-other (dcsg/keel) | Idea only (ELv2); different mechanism, audited below |
| Amendment records for changed acceptance | AM records, amendment ledger | oh-my-claudecode criterion amend/supersede ledger | Idea |
| Decision trailers | `Keel-*` commit trailers, `Keel-Ruling` | oh-my-claudecode | Idea |
| Receipt with a remaining-risk register | `templates/proposal/receipt.md` | oh-my-claudecode | Idea |
| CAS claim with a token | `refs/keel/claims/<P.Tn>` create-only lock | oh-my-claudecode claim token | Idea |
| Verdict-file contract for reviewers on any runtime | `schemas/verdict.schema.json`, submit channels | oh-my-claudecode | Idea |
| Prompt digests | `PG-<sha12>`, `Keel-Prompt` trailer | oh-my-claudecode prompt single-source digests | Idea |
| ACK readback | ACK id-set diff | oh-my-codex | Idea |
| Non-goals and decision boundaries as typed fields | Frozen intent block; may-decide and must-ask lists | oh-my-codex | Idea |
| Per-event hook capability matrix with a fallback ladder | `runtimes/hook-events.yaml`; rungs A–D | oh-my-codex | Idea |
| Capabilities lockfile | Descriptor `verification_status`; `.keel/generated.lock.json` | oh-my-codex | Idea |
| Dual review lanes | Declared engineer/reviewer family pair | oh-my-codex | Idea |
| Quotable consent bound to a version | Signed quote in approval envelopes | old-coder | Idea |
| Evidence bound to source state, failing closed | `sourceStateBinding` (commit, tree, match fields) | old-coder | Idea |
| Fail-closed gauntlet with negative controls | A negative control for every check | old-coder | Idea |
| Blind verifier | blind-diff lens | old-coder | Idea |
| Honest "layers not run" | `not_run` status; gates not run listed in receipts | old-coder | Idea |
| Event-sourced run log | Hash-chained ledger | OpenHands | Idea |
| Scripted-model end-to-end tests | Fake runtimes replaying recorded streams; loopback fake providers | OpenHands | Idea |
| HUMAN/AGENT receipt split | AGENT section plus the rendered signed quote in `receipt.md` | OpenHands | Idea |
| ACP as a later driver | Kimi Code ACP driver candidate (M6) | OpenHands | Idea |
| Intent frozen after approval | `keel:frozen` block, `contract_hash` | BMAD-METHOD | Idea |
| Intent alignment auditor | intent-alignment lens | BMAD-METHOD Intent Alignment Auditor | Idea |
| Intent-gap routing | `intent_gap` returns the proposal to framing | BMAD-METHOD | Idea |
| Covers maps | Work order `covers` | BMAD-METHOD | Idea |
| Single-writer ownership | One writer per artifact and field | BMAD-METHOD | Idea |
| Parallel lenses with triage and a loop cap of 5 | Lens sets, TR records, fix-round cap | BMAD-METHOD | Idea |
| Matrix test audit and verification-gap lens | verification-gap lens | BMAD-METHOD | Idea |
| Readiness PASS/CONCERNS/FAIL | Plan gate `ready` check | BMAD-METHOD | Idea |
| Session-sized specs | Brief budgets | BMAD-METHOD | Idea |
| Content-addressed render snapshots | `PG-<sha12>` | BMAD-METHOD | Idea |
| Ticket DAG | Work order `after` edges | BMAD-METHOD | Idea |
| Layered config | `.keel/config.yaml` plus `.keel/local.yaml` | BMAD-METHOD | Idea |
| Migrations as data | Versioned ledger schema with data migrations | BMAD-METHOD | Idea |
| Managed AGENTS.md block | AGENTS.md pointer block | BMAD-METHOD | Idea |
| Web bundles | Rung D paste flow | BMAD-METHOD | Idea |
| Persona A/B evidence (issue #2675) | Seat contracts instead of personas | BMAD-METHOD | Evidence for a design choice |
| Ceremony ratchet | Upward-only track ratchet | superpowers | Idea |
| Approval binds the presented artifact | Artifact hashes in approval envelopes | superpowers | Idea |
| Global constraints, interfaces, review focus | Work order fields | superpowers | Idea |
| Rulings with cost-if-wrong; stop classes | `keel api rule`; the four stop classes | superpowers | Idea |
| Status enum and BLOCKED remedy ladder | `resultStatus`; remedy ladder | superpowers | Idea |
| Tier per seat | Tier frontier, standard, fast | superpowers | Idea |
| One reviewer, two verdicts; anti-coaching | Verdict `spec_verdict` plus `recommendation`; controller tripwire | superpowers | Idea |
| Bounded fix loop | Fix rounds 1–5 | superpowers | Idea |
| Task-done discipline | Done means evidence keel re-executed | superpowers | Idea |
| Green-baseline isolation | Green baseline evidence before a build | superpowers | Idea |
| Provenance-only cleanup | Close removes only keel-provenance worktrees and refs | superpowers | Idea |
| Conformance with no-guidance controls | Behaviour conformance scenarios | superpowers | Idea |
| Trigger-only skill descriptions | Skill description lint | superpowers | Idea |
| Citation-or-discard | Audit lens citations; pitfalls need an incident id | superpowers | Idea |
| Pruning review layers | Review layers pruned without measured yield | superpowers | Idea |
| Windows lessons | Spawn contract; copies instead of symlinks | superpowers | Idea |
| Goal ancestry | The brief's why-chain | Paperclip | Idea |
| Atomic checkout where a conflict is final | A lost CAS claim exits 4 and is never retried | Paperclip | Idea |
| Budgets that warn at 80% and stop at 100% | Budget events, `--rule budget` | Paperclip | Idea |
| Liveness invariant | Liveness invariant and orphan audit | Paperclip | Idea |
| Quiescence watchdog | Quiescence audit (M8) | Paperclip | Idea |
| Never silently switch engines | `policy.no_silent_fallback` | Paperclip | Idea |

### Other projects and standards

| keel construct | Where in keel | Taken from | Use |
| --- | --- | --- | --- |
| Per-commit index state machine | IndexProvider `status(commit)` | Sourcegraph | Idea only, public docs |
| Nearest indexed ancestor plus diff overlay | Index answers at head | Sourcegraph | Idea only, public docs |
| Code-intel API shape: definitions, references, search | IndexProvider methods | Sourcegraph | Idea only, public docs |
| Desired-state plans | `keel arch plan`, campaign plans | Sourcegraph | Idea only, public docs |
| Series over time | Architecture series points | Sourcegraph Code Insights | Idea only, public docs |
| Ownership as data | Element owner labels | Sourcegraph | Idea only, public docs |
| Self-contained HTML/SVG architecture view with click-through and a change feed | Dashboard architecture view, element dialog, change feed | axumquant/arch-viewer | Idea; its fabricated edges and 0–100 score are counter-examples |
| Executable boundary rules with frozen baselines | `.keel/arch/rules.yaml`, `baseline.json` | dependency-cruiser, ArchUnit, import-linter | Idea |
| C4 hierarchy; Mermaid and `.c4` exports | `.keel/arch/model.yaml` element kinds; exports | LikeC4, Structurizr | Idea |
| Symbol ids from a standard index format | IndexProvider `scip` backend | SCIP | Format standard; optional import |
| Stable change ids recorded next to keel ids | jj change id alongside `Keel-Round` | jj | Optional adapter (M7) |
| Op log and evolog | Extra reserved-op detection source; audit export | jj | Optional adapter (M7) |
| First-class conflicts | Conflicts become resolution tasks | jj | Idea |
| Megamerge preview | Integration preview | jj | Idea |
| Per-revision command runs | `jj run` in the jj backend; detached worktrees in git | jj | Optional adapter (M7) |
| Policy revsets | jj backend policy checks | jj | Optional adapter (M7) |
| Integrator as the sole trunk writer | The Steward alone lands | jj-agentic-workflow (CodeAlive) | Idea |
| Serialized workspace creation | Worktrees created serially under a lock | jj-agentic-workflow (CodeAlive) | Idea |
| Hazard list | M7 hazard suite | jj-agentic-workflow (CodeAlive) | Idea |
| Roles as typed subscribers to artifact kinds | Seat contract inputs and outputs | MetaGPT | Idea |
| Mandatory open-questions field | Intent "Open questions"; frame gate check | MetaGPT | Idea |
| Bounded paired review loop with a terminal verdict | Fix loop; `recommendation` enum | ChatDev | Idea |
| Hash ids | Crockford base32 and content-addressed ids | Gas Town + Beads | Idea |
| A priming command | `keel brief` as the pull channel | Gas Town + Beads | Idea |
| Persistent identity with ephemeral sessions | Seat contracts persist; runs are ephemeral | Gas Town + Beads | Idea |
| Merge queue that verifies the merged batch and bisects red | Integration queue, preview bisect, land re-execution | Gas Town Refinery | Idea |
| Versioned constitution stamped on artifacts | `charter_version` | GitHub Spec Kit | Idea |
| Converge and analyze passes | Frame and plan gate consistency checks | GitHub Spec Kit | Idea |
| Disjoint-file parallel markers | Pairwise disjoint write_sets in a wave | GitHub Spec Kit | Idea |
| Standards index with scoped injection | Brief slices selected by `applies_to` | Agent OS | Idea |
| Removal of role subagents | Seats record the assumption they encode | Agent OS | Idea |
| Pointer-only canonical instruction file | AGENTS.md pointer block; `CLAUDE.md` bridge | AGENTS.md standard | Standard |
| Portable procedure unit | `skills/keel-*/SKILL.md` | Agent Skills | Standard |
| `ssh-keygen -Y sign/verify`, `allowed_signers`, FIDO2 `-sk` keys | Board approvals ([ADR-0005](adr/ADR-0005-signed-board-approvals.md)) | OpenSSH, git | Standard tool |
| LLM-manager delegation is unreliable | No model routes work (KP-04) | CrewAI; the MAST multi-agent failure study | Negative lesson |
| Mock tools and fake success | Selftest, re-execution, fake-completion scan | claude-flow / ruflo | Negative lesson |
| No `shell:true` on Windows spawns | Spawn contract | Node.js advisory CVE-2024-27980 | Security advisory |

### Public documentation only

| keel construct | Where in keel | Taken from | Use |
| --- | --- | --- | --- |
| Instruction files, skill directories, agent formats, hook events, headless and schema flags, exit codes, trust models, permission mechanisms, provider protocols | `runtimes/*.yaml` with `verification_status` per fact | Claude Code, Codex CLI, Gemini CLI, Qwen Code, Kimi Code, opencode and Z.ai documentation | Public docs; facts not yet probed are marked "verify by probe" |
| EARS requirement statements | `spec.yaml` requirement statements | Kiro (public docs) | Public docs |
| Requirements, design and tasks triad | Intent and spec delta, arch delta, plan and work orders | Kiro (public docs) | Public docs |
| Steering inclusion modes | Obligation scoping by `applies_to` | Kiro (public docs) | Public docs |
| AGENTS.md always included | Pointer block kept small and always loaded | Kiro (public docs) | Public docs |
| Dependency-graph waves | Waves from `after` edges | Kiro (public docs) | Public docs |
| Quick Spec | Standing policies never auto-approve model-drafted acceptance | Kiro (public docs) | Negative lesson |
| Memory as untrusted data | Untrusted-data rules in [14-trust-security.md](14-trust-security.md) | OpenHands (public docs; not in the local clone, which holds the agent-canvas frontend) | Public docs |

### keel's own design process

| keel construct | Where in keel | Taken from | Use |
| --- | --- | --- | --- |
| Pluggable IndexProvider with codegraph as default and SCIP optional; derived data gitignored, declared data committed | [ADR-0007](adr/ADR-0007-declared-vs-derived-architecture.md) | Architecture visualization survey (a synthesis of Sourcegraph and arch-viewer) | Original synthesis |
| ACK id-set diff; rung D; handbook budgets; Codex on openai-responses only | [02-alignment.md](02-alignment.md), [09-runtimes.md](09-runtimes.md) | Blueprint proposal A | Original |
| Env-name-only providers; liveness (after Paperclip); `derived_from` staleness; track records; temporary-index snapshots; hook-events table; ajv | [10-providers.md](10-providers.md), [03-lifecycle.md](03-lifecycle.md), [05-vcs.md](05-vcs.md) | Blueprint proposal B | Original |
| Control plane in the git common dir; RTM; amendments; degraded independence; CAS claims; Windows spawn contract; prompt hash; milestone order | [ADR-0003](adr/ADR-0003-control-plane-in-git-common-dir.md), [04-trace-and-state.md](04-trace-and-state.md), [15-roadmap.md](15-roadmap.md) | Blueprint proposal C | Original |
| Provider path set, exposure rule, agent-key refusal, signed requests, red/green proof, plain-git reserved-op detection, non-nesting branch names, projection gate | [14-trust-security.md](14-trust-security.md), [05-vcs.md](05-vcs.md) | Compliance, facts and coherence review passes; the alignment judge | Original |
| Names-only provider configuration; native HTML dashboard; git first | [ADR-0006](adr/ADR-0006-provider-values-by-reference.md), [ADR-0008](adr/ADR-0008-read-only-dashboard.md), [ADR-0001](adr/ADR-0001-git-primary-jj-optional.md) | Owner decisions P1, P2, D4 | Decision |

## External projects

Licences were read from the `LICENSE` file of each local reference clone on 2026-09-25. Projects without
a local clone are not licence-verified in M0; keel treats them as ideas-only sources regardless of their
licence.

| Project | Upstream | Local clone: version, HEAD | Licence | Verified from | How keel uses it |
| --- | --- | --- | --- | --- | --- |
| OpenSpec | https://github.com/Fission-AI/OpenSpec | `@fission-ai/openspec` 1.12.0, `e062b95` | MIT | Local `LICENSE` | Ideas; no CLI dependency |
| codegraph | https://github.com/colbymchenry/codegraph | `@colbymchenry/codegraph` 1.6.0, `ba3c21e` | MIT | Local `LICENSE` | Ideas; optional external backend, not vendored |
| edikt | https://github.com/diktahq/edikt | `5844fbb` | Elastic License 2.0 | Local `LICENSE` | Ideas only |
| keel-other (dcsg/keel) | https://github.com/dcsg/keel | `54a48d5` | Elastic License 2.0 | Local `LICENSE` | One idea; counter-example |
| oh-my-claudecode | https://github.com/Yeachan-Heo/oh-my-claudecode | `oh-my-claude-sisyphus` 5.3.0, `4820f5641` | MIT | Local `LICENSE` | Ideas |
| oh-my-codex | https://github.com/Yeachan-Heo/oh-my-codex | `oh-my-codex` 0.21.4, `304fb3b4` | MIT | Local `LICENSE` | Ideas |
| old-coder | https://github.com/AmazingAng/old-coder | `a0eb529` | MIT | Local `LICENSE` | Ideas |
| OpenHands | https://github.com/OpenHands/OpenHands | `f7fb0c4b2` | MIT | Local root `LICENSE` | Ideas |
| BMAD-METHOD | https://github.com/bmad-code-org/BMAD-METHOD | `1b59caa7` | MIT, with a trademark notice for the BMad names | Local `LICENSE` | Ideas |
| superpowers | https://github.com/obra/superpowers | `superpowers` 6.4.1, `5bf4e78` | MIT | Local `LICENSE` | Ideas |
| Paperclip | https://github.com/paperclipai/paperclip | `efce9356b` | MIT | Local `LICENSE` | Ideas |
| Sourcegraph | n/a | No local clone | Not verified; parts are not open source | n/a | Ideas only, public docs |
| axumquant/arch-viewer | n/a | No local clone | Not verified | n/a | Ideas; counter-examples |
| dependency-cruiser, ArchUnit, import-linter, LikeC4, Structurizr | n/a | No local clone | Not verified | n/a | Ideas |
| SCIP | n/a | No local clone | Not verified | n/a | Index format; optional import of the user's own index |
| jj (Jujutsu), CodeAlive jj-agentic-workflow | n/a | No local clone | Not verified | n/a | Ideas; jj is an optional external tool (M7) |
| MetaGPT, ChatDev, CrewAI, Gas Town + Beads, GitHub Spec Kit, Agent OS, claude-flow / ruflo | n/a | No local clone | Not verified | n/a | Ideas and negative lessons |
| Kiro | n/a | No local clone | Proprietary product | n/a | Public docs only |
| Claude Code, Codex CLI, Gemini CLI, Qwen Code, Kimi Code, opencode | n/a | Installed binaries where noted in `runtimes/*.yaml` | Not verified | n/a | Public docs; invoked as external programs the user installs |
| OpenSSH, git | n/a | System installation | Not verified | n/a | External tools invoked by keel |

The short hashes are the clone HEADs on 2026-09-25, recorded so that a later reader can see what was
examined.

## Licence notes

- **keel itself** is MIT licensed, "Copyright (c) 2026 Qither" (D7), in the root `LICENSE`.
- **MIT sources.** keel re-implements ideas in its own words and code. No source text or code from any
  reference project is copied in M0, so no third-party notice is owed. If a later milestone copies code
  from an MIT project, the project's copyright and permission notice must travel with the copy and the copy
  must be recorded in this document.
- **Elastic License 2.0 sources** (edikt, keel-other). Ideas only. No text, code, schemas, prompts,
  templates or file layouts are copied. The shape audit below records the comparison.
- **Non-OSS and proprietary sources** (Sourcegraph's non-open parts, Kiro). Public documentation only;
  ideas only.
- **Trademarks.** BMAD-METHOD is named only to credit it. keel uses no BMad mark in its own names.
- **External programs.** The runtime CLIs, codegraph, SCIP indexers, jj, OpenSSH and git are installed by
  the user and invoked as separate processes. keel vendors and redistributes none of them, and none is a
  package dependency.
- **Provider plan terms** belong to the user. doctor reminds the user to check them and asserts none.

Package dependencies in M0 are development-only and serve `scripts/validate.mjs` and the typecheck. Their
licences were read from each package's `package.json` in `node_modules` on 2026-09-25. From M1, `yaml` and
`ajv` (with its `ajv-formats` companion) become runtime dependencies
([ADR-0002](adr/ADR-0002-node-windows-native.md)).

| Package | Version | Licence |
| --- | --- | --- |
| typescript | 6.0.3 | Apache-2.0 |
| @types/node | 22.20.4 | MIT |
| ajv | 8.20.0 | MIT |
| ajv-formats | 3.0.1 | MIT |
| yaml | 2.9.1 | ISC |

## D2 provenance audit and ELv2 shape audit record

### D2 provenance audit

D2 requires a fresh, independent design. A construct may enter keel only through a permitted source listed
at the top of this document. The names that must never appear are the D2 term list in
`scripts/validate.mjs`; that file is the only place they are written.

Method:

1. **Construct map.** Every idea credited in the blueprint has a row in the construct map above, naming a
   permitted source. A construct whose lineage cannot be traced to a permitted source is removed or
   re-derived.
2. **Mechanical check.** `node scripts/validate.mjs --only audit` scans every repository file and path, except
   `scripts/validate.mjs` and `package-lock.json`, for the D2 term list, and fails on any hit; multi-word
   terms match case-insensitively with any separator or none (spaced, hyphenated and camel-case spellings
   alike). It is part of `npm run validate` and `npm run check`; CI runs `npm run validate` on pushes to
   `main` and on every pull request, on windows-latest and ubuntu-latest with Node 22.13 and 24.
3. **Wording.** Seat qualification is called conformance status, with the values verified, failed and
   unverified.

Constructs without a permitted source were removed. The IndexProvider port and the source-state binding
were designed from the sources credited above (the architecture visualization survey, Sourcegraph,
old-coder and the Gas Town Refinery idea).

Record:

| Date | Scope | Check | Result |
| --- | --- | --- | --- |
| 2026-09-25 | Blueprint credits | Every credited idea has a row in the construct map | Complete |
| 2026-09-25 | `docs/14`–`docs/17`, `docs/adr/ADR-0001` … `ADR-0008` | `node scripts/validate.mjs --only audit` | No D2 term hits in these files |
| Every CI run | Whole repository | `npm run validate` (includes the audit check) | Must pass; a failing run blocks the M0 exit |

### ELv2 shape audit

The audit compares the shape of keel constructs credited to ELv2 projects with the originals, to show that
only ideas crossed over. It was requested when a review found that an early draft named keel's ADR rule
section after the ELv2 original.

| Aspect | ELv2 project | keel | Verdict |
| --- | --- | --- | --- |
| Where ADR rules live | edikt keeps rule metadata for each ADR in a separate YAML sidecar next to the prose, written by a model-driven extractor and merged by a compile step into governance rule files | Obligations live in the ADR body under `## Obligations`, written by the architect or product seat and parsed deterministically; there is no extraction step and no sidecar | Different shape |
| Section heading | edikt's compiled governance uses a "Directives" heading | `## Obligations`; the early draft heading was renamed in revision r2 | Resolved |
| Entry fields | edikt entries carry rule text with verification, intent, fixture, enforcement and source-excerpt metadata | `id` (`ADR-<5>.O<n>`), `level` (must, must_not, should), `text`, `applies_to` globs, optional `check` | Overlap is the generic idea that a rule has a path scope and a check command, also found in ArchUnit, import-linter and dependency-cruiser. Acceptable |
| Schema | edikt ships a versioned sidecar JSON Schema | `schemas/decision.schema.json`, written from scratch on keel's common `$defs` | No copy |
| Invariant ids | edikt's own repository governance uses `INV-` prefixed ids | Charter invariants `INV-nn`, Board-serialized must/must_not obligations with `applies_to` and an optional check | Generic abbreviation; nothing else shared. Acceptable |
| Hooks | Journaled fail-open hooks | One `keel hook` entry point journaling typed outcomes for doctor denominators | Idea only |
| Overrides | Expiring overrides | Signed `keel approve --rule override --until …` | Idea only |
| Post-compaction re-injection | keel-other re-injects its plan state from a Claude Code PostCompact hook | The brief digest is re-injected through runtime-specific events (Claude Code `SessionStart` with matcher `compact`, Gemini CLI `BeforeAgent` additional context, Qwen Code `PostCompact`; verify by probe), and a conformance scenario asserts that it reappears | Idea only; different mechanism |
| Managed block markers | keel-other marks its managed `CLAUDE.md` block with `keel:start` and `keel:end` | keel's managed AGENTS.md block uses `keel:managed:start` and `keel:managed:end` markers (checked in `templates/runtime/AGENTS.block.md.tmpl` on 2026-09-25), from BMAD-METHOD's managed block and OpenSpec's generatedBy markers. The shared word is the product name, which is an open decision | keel templates must not use the `keel:start`/`keel:end` pair |
| Runtime scope | keel-other's enforcement loop is Claude-only | Multi-runtime, with Steward-side guarantees at every rung | Counter-example |

Result on 2026-09-25: no text, code, schema, prompt or template was copied from an ELv2 project; one
heading was renamed in revision r2; the marker rule above applies to keel's templates. Verdict: pass.

## Deliberately not adopted

| Not adopted | Seen in | Why |
| --- | --- | --- |
| Persona role-play as the organizing abstraction | Many multi-agent frameworks; BMAD-METHOD's persona A/B evidence | Seats are contracts with typed outputs; personas showed no measured yield |
| A model acting as manager for routing, claims, transitions or "done" | CrewAI, the MAST study | Unreliable; control is code (KP-04) |
| Mock tools and fake success | claude-flow / ruflo | Completion must be re-executed evidence |
| Fabricated architecture edges and a 0–100 health score | axumquant/arch-viewer | Every edge carries provenance; there is no scalar score |
| A Claude-only enforcement loop | keel-other | keel must hold its guarantees on six stacks |
| Auto-approved, model-drafted acceptance | Kiro Quick Spec | Standing policies never approve model-drafted acceptance |
| The OpenSpec CLI as a dependency | OpenSpec | P3: ideas, not dependencies |
| Role subagents | Agent OS (which removed them) | Seats record the assumption they encode instead |
| Running `codegraph init` or `install`, or running it with telemetry on | codegraph | Those edit agent configs; keel uses index and query commands only |
| A sealed reader for provider value files | An early keel draft | Replaced by the names-only invariant ([ADR-0006](adr/ADR-0006-provider-values-by-reference.md)) |
| Seats committing through a hook; a loopback submit endpoint | Design alternatives | Steward commits and per-mode submit channels ([ADR-0004](adr/ADR-0004-steward-commits-and-submit-channels.md)) |
| GPG signatures; TTY-only approvals | Design alternatives | ssh signatures that fail closed on agent-held keys ([ADR-0005](adr/ADR-0005-signed-board-approvals.md)) |
| jj as the primary backend; jj secondary workspaces for agents | jj | [ADR-0001](adr/ADR-0001-git-primary-jj-optional.md) |
| Codex `.codex/agents` files for builder seats; the removed chat wire API | Codex CLI | They define spawnable subagents only; Codex routes use openai-responses |
| Permission-bypass flags (`--dangerously-*`, yolo modes, Kimi Code `-p` treated as safe, `--dangerously-bypass-hook-trust`) | Runtime CLIs | Never generated |
| Automatic conflict resolution (`-X ours/theirs`) | git | Conflicts become tasks |
| Requirement identity by header text; modifications without base hashes | Specification-driven tools | Ids plus `rev_hash` |
| Symlinked skills or configs on Windows | Several tools | keel writes copies |
| Frontend frameworks or widget libraries in the dashboard | Common dashboard stacks | P2 ([ADR-0008](adr/ADR-0008-read-only-dashboard.md)) |
| Always-loaded context bloat and silent truncation | Large instruction files; Codex's 32 KiB chain cap | Handbook budgets checked at sync |
| Coercive prompt tone tuned to one model | Single-vendor prompt packs | Prompts are checked by behaviour conformance across families |
| Stored display state | Dashboards that cache badges | State is computed from ledger events |
