# Sources, credits and licences

keel borrows ideas, not dependencies or text (P3, KP-15). This document owns three records: the map from
every borrowed construct to a permitted source, the licence of every reference project, and the two audits
the M0 exit requires, the D2 provenance audit and the ELv2 shape audit. Principles cite their sources inline
in [00-vision.md](00-vision.md); this document is the complete list. The reference registry
[reference-projects.yaml](reference-projects.yaml) records what was examined and when (P4); this document
records what was taken.

A source is permitted when it is one of:

- an open-source project, used for ideas that keel re-implements in its own words and code;
- an ELv2 or otherwise non-OSS project, used for ideas only: no text, code, schemas, prompts, templates or
  file layouts;
- the public documentation of a tool, used to describe how keel drives that tool;
- a published standard or file format (AGENTS.md, Agent Skills, C4, EARS, SCIP);
- keel's own design process: the competing blueprint proposals, the research surveys and the review passes;
- the owner's decisions D1–D7 and standing preferences P1–P5, as stated in [00-mandate.md](00-mandate.md).

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
| Consent bound to a version | The explicit confirmation of a shown content version, with an optional note, in approval records | old-coder | Idea |
| Evidence bound to source state, failing closed | `sourceStateBinding` (commit, tree, match fields) | old-coder | Idea |
| Fail-closed gauntlet with negative controls | A negative control for every check | old-coder | Idea |
| Blind verifier | blind-diff lens | old-coder | Idea |
| Honest "layers not run" | `not_run` status; gates not run listed in receipts | old-coder | Idea |
| Event-sourced run log | Hash-chained ledger | OpenHands | Idea |
| Scripted-model end-to-end tests | Fake runtimes replaying recorded streams; loopback fake providers | OpenHands | Idea |
| HUMAN/AGENT receipt split | AGENT section plus the rendered Land approval section in `receipt.md` | OpenHands | Idea |
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
| Approval binds the presented artifact | Artifact hashes in approval records; the re-hash after confirmation | superpowers | Idea |
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
| Headless routing, query cache, table and virtualized lists for the dashboard | Dashboard frontend on the React adapter ([ADR-0009](adr/ADR-0009-tanstack-frontend.md)) | TanStack Router, Query, Table and Virtual; React | Libraries (MIT), bundled at package build; development dependencies, never runtime dependencies |
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
| Provider path set, exposure rule, approved requests, red/green proof, plain-git reserved-op detection, non-nesting branch names, projection gate | [14-trust-security.md](14-trust-security.md), [05-vcs.md](05-vcs.md) | Compliance, facts and coherence review passes; the alignment judge | Original |
| Explicit-confirmation approvals: show the change, confirm, re-hash, record with hashes, declared approver and local time; invalidate on any change to bound content; only `keel approve` records | [02-alignment.md](02-alignment.md), [ADR-0005](adr/ADR-0005-explicit-confirmation-approvals.md) | Owner decision D6 | Decision |
| Names-only provider configuration; TanStack dashboard; git first | [ADR-0006](adr/ADR-0006-provider-values-by-reference.md), [ADR-0008](adr/ADR-0008-read-only-dashboard.md), [ADR-0009](adr/ADR-0009-tanstack-frontend.md), [ADR-0001](adr/ADR-0001-git-primary-jj-optional.md) | Owner decisions P1, P2, D4 | Decision |
| Design iteration discipline: the design-issue register with classes and statuses, the rule walk (producers, consumers, places, readers and tallies), the standing order map with cycle and reachability checks, the walkthrough matrix, the blocks gate at milestone exits | [00-mandate.md](00-mandate.md) section 5, `docs/design-issues.yaml`, the `issues` check | Owner standing instruction P5; keel's own adversarial review passes | Decision |

## External projects

The licence table is a historical assessment snapshot: clone licence observations date to 2026-09-25,
and review rows retain their recorded revisions and dates. It is not a current upstream or licence claim.
Lab maintains the shared source observations; Keel owns the licence evidence used in its product decisions
and can verify a pinned public source directly without Lab access. Sources marked unverified remain
ideas-only public-documentation sources until revision-specific licence evidence is assessed. TanStack and
React package licences are read before first inclusion in M5.
[reference-projects.yaml](reference-projects.yaml) preserves Keel's review and adoption record; local clone
hints are not evidence or update instructions. New P4 reviews record source revision, licence evidence and
date, relevant-source coverage, justified exclusions and gaps. The table below summarizes the historical
assessment, not the contents of today's shared workspace.

| Project | Upstream | Assessed source snapshot: version, HEAD | Licence | Verified from | How keel uses it |
| --- | --- | --- | --- | --- | --- |
| OpenSpec | https://github.com/Fission-AI/OpenSpec | `@fission-ai/openspec` 1.12.0, `e062b95` | MIT | Local `LICENSE` | Ideas; no CLI dependency |
| codegraph | https://github.com/colbymchenry/codegraph | `@colbymchenry/codegraph` 1.6.0, `ba3c21e` | MIT | Local `LICENSE` | Ideas; optional external backend, not vendored |
| edikt | https://github.com/diktahq/edikt | `5844fbb` | Elastic License 2.0 | Local `LICENSE` | Ideas only |
| keel-other (dcsg/keel) | https://github.com/dcsg/keel | `54a48d5` | Elastic License 2.0 | Local `LICENSE` | One idea; counter-example |
| oh-my-claudecode | https://github.com/Yeachan-Heo/oh-my-claudecode | `oh-my-claude-sisyphus` 5.3.0, `4820f5641` | MIT | Local `LICENSE` | Ideas |
| oh-my-codex | https://github.com/Yeachan-Heo/oh-my-codex | `oh-my-codex` 0.21.4, `304fb3b4` | MIT | Local `LICENSE` | Ideas |
| old-coder | https://github.com/AmazingAng/old-coder | `a0eb529` | MIT | Local `LICENSE` | Ideas |
| rtk | https://github.com/rtk-ai/rtk | `rtk` 0.49.0, `feac25d` (branch `develop`) | Apache-2.0 | Local `LICENSE` | Ideas; first-pass review below, no construct adopted yet |
| OpenHands | https://github.com/OpenHands/OpenHands | `f7fb0c4b2` | MIT | Local root `LICENSE` | Ideas |
| BMAD-METHOD | https://github.com/bmad-code-org/BMAD-METHOD | `1b59caa7` | MIT, with a trademark notice for the BMad names | Local `LICENSE` | Ideas |
| superpowers | https://github.com/obra/superpowers | `superpowers` 6.4.1, `5bf4e78` | MIT | Local `LICENSE` | Ideas |
| Paperclip | https://github.com/paperclipai/paperclip | `efce9356b` | MIT | Local `LICENSE` | Ideas |
| TanStack | https://github.com/TanStack | No local clone; npm packages from M5 | MIT | Not verified until M5 (read from each package's `LICENSE` then) | Frontend stack (P2, [ADR-0009](adr/ADR-0009-tanstack-frontend.md)); development dependencies, bundled |
| React | https://github.com/facebook/react | No local clone; npm packages from M5 | MIT | Not verified until M5 (read from each package's `LICENSE` then) | Adapter the TanStack libraries run on ([ADR-0009](adr/ADR-0009-tanstack-frontend.md)); development dependency, bundled |
| Sourcegraph | https://github.com/sourcegraph (organisation) | No local clone | Not verified; parts are not open source | n/a | Ideas only, public docs |
| axumquant/arch-viewer | https://github.com/axumquant/arch-viewer | No local clone | Not verified | n/a | Ideas; counter-examples |
| dependency-cruiser, ArchUnit, import-linter, LikeC4, Structurizr | n/a | No local clone | Not verified | n/a | Ideas |
| SCIP | n/a | No local clone | Not verified | n/a | Index format; optional import of the user's own index |
| jj (Jujutsu), CodeAlive jj-agentic-workflow | n/a | No local clone | Not verified | n/a | Ideas; jj is an optional external tool (M7) |
| MetaGPT, ChatDev, CrewAI, Gas Town + Beads, GitHub Spec Kit, Agent OS, claude-flow / ruflo | n/a | No local clone | Not verified | n/a | Ideas and negative lessons |
| Kiro | n/a | No local clone | Proprietary product | n/a | Public docs only |
| Claude Code, Codex CLI, Gemini CLI, Qwen Code, Kimi Code, opencode | n/a | Installed binaries where noted in `runtimes/*.yaml` | Not verified | n/a | Public docs; invoked as external programs the user installs |
| git | n/a | System installation | Not verified | n/a | External tool invoked by keel (OpenSSH is used only as git's transport, never by keel itself) |

The short hashes are the clone HEADs on 2026-09-25, recorded so that a later reader can see what was
examined.

## rtk first-pass review

rtk (rtk-ai/rtk) is a single Rust binary that sits between a coding agent and the shell: a pre-tool hook
rewrites a command such as `git status` to `rtk git status`, rtk runs the real command and returns a
condensed output (failures only, grouped lint results, tree listings), tracks bytes before and after in a
local SQLite store, and prints gain reports. It is not a workflow; it is an output-budget layer plus an
installer for eighteen agent integrations, and its value for keel lies in its measurement discipline, its
condensation contract, its hook decision function and its Windows hook hygiene.

Reviewed on 2026-09-25 at HEAD `feac25d` on branch `develop`, version 0.49.0 (`Cargo.toml`; the CHANGELOG
entry is dated 2026-09-11), licence Apache-2.0 read from the local `LICENSE`. Evidence paths are relative to
the clone. rtk handles no provider credentials of its own; the review opened no `.env*`, credential or
settings file, and the clone's `.rtk/` and `.claude/` directories were listed by name only (P1). rtk's own
stores keep full command strings for 90 days and raw command output for 30 days under the user's data
directory, which keel's typed-field whitelist would reject; any idea below that involves storing output is
read with that constraint.

| Idea | Evidence in the clone | keel construct or gap | Classification | Why |
| --- | --- | --- | --- | --- |
| Never-worse guard: a condensed rendering is emitted only if it is not larger than the raw one under the same estimator, and detail the caller asked for by flag (`--nocapture`, `ls -la`) is never condensed | `src/core/guard.rs` (module doc, `never_worse`); `tests/guard_integration_test.rs`; `CONTRIBUTING.md` sections on correctness versus savings and on transparency | Brief budgets ([02-alignment.md](02-alignment.md)), review-packet and fix-loop excerpts ([11-verification.md](11-verification.md) section 7), evidence output digests. keel has a maximum-size rule but no "condensing never inflates" invariant and no "requested verbosity wins" rule for runner output shown to seats | candidate | One function and one negative control make every excerpt provably no worse than the raw bytes for the same budget, and the flag rule stops the Steward from hiding output an acceptance command declared it needs (KP-04) |
| Truncation only with a runnable, content-addressed recall path: every capped output names a recall command keyed by a hash of command and content; storage is byte-faithful with FIFO, per-entry and retention caps; a hint promises only what the store can return; a truncated run stores a null exit code, never a fake 0 | `src/core/README.md` (output recovery, truncation caps); `src/core/tee.rs`; `src/core/retriever.rs` (`content_hash`, `RetrieverConfig`); `CHANGELOG.md` 0.49.0 recall entries | Evidence records carry an output digest ([11-verification.md](11-verification.md) section 2) but no retrievable body; reviewer packets and fix rounds have no defined way to pull the full log behind an excerpt. Gap: a digest-keyed evidence output store behind an existing verb or `keel api context`, within the KP-14 surface budget, treated as a cache and never as land input (KP-06) | candidate | It turns a byte budget into a contract the seat can act on instead of guessing or re-running. Two keel constraints apply: stored bodies pass the typed-field whitelist and provider error bodies are never persisted ([14-trust-security.md](14-trust-security.md) T11), and retention is stated with its denominator in doctor output |
| Honest measurement framing: every reduction figure is labelled as a share of shell output bytes, never of the bill; token counts are declared `bytes / 4` estimates; the derived USD field says it comes from a fixed constant, not a measurement; the disclaimer sits on the table itself | `README.md` (how savings work); `docs/guide/resources/savings-explained.md` (the savings chain, how to read the gain table); `docs/TELEMETRY.md` (economics and quality rows) | KP-12 honest views and the DashboardModel ([08-dashboard.md](08-dashboard.md)), budgets at 80% and 100% ([03-lifecycle.md](03-lifecycle.md)), receipts. keel fixes denominators but has no rule that every numeric measure names its unit and its provenance, and never presents a ratio's denominator as cost | candidate | keel will show turn, tool-call and cost figures from runtimes that report differently; a `measure_provenance` tag (reported, estimated or derived) next to every aggregate plus an on-table unit note is a small schema change with a large honesty payoff |
| Coverage measured from a joined decision log, not inferred: each hook invocation writes a decision row (timestamp, session, tool-call id, decision, rewritten command, version); a defined predicate is the numerator; a low per-session coverage is read as "the hook was not active for a subagent" | `src/core/tracking.rs` (`HookOutcome`, `is_covered`, `hook_decisions` table); `CHANGELOG.md` 0.48.0 discover entry; `docs/guide/analytics/discover.md`; `src/discover/provider.rs` (`tool_use_id`) | Hook journal with denominators (KP-10; [12-cli-api-mcp.md](12-cli-api-mcp.md) section 6). Refinement: key each journal row by the runtime's tool-call id and join it to the tool events keel ingests from its own parsed stream, so coverage is journaled outcomes over tool events seen | candidate | A denominator from a second, independent source is stronger than a hook counting itself, and it is the only way to detect a hook that silently did not load at rung B or C. Only where the runtime exposes a tool-call id in both the hook payload and the stream: Claude Code does, the others are verify by probe |
| One decision function with a load-bearing gate order: deny wins first; command and process substitution, file-target redirects and heredocs are refused as unattestable rather than downgraded; a rewrite is auto-allowed only on an explicit allow and "no rule matched" never auto-allows; every segment of a compound command must pass; the permission segmenter is the most conservative of three; tests inject rules instead of reading the machine | `src/hooks/decision.rs` (module doc, `decide_with_params`); `src/hooks/permissions.rs` (`check_command_with_rules`); `src/discover/README.md` (shared lexer toolkit); `tests/hook_decision_protocol_test.rs` (`Sandbox`) | Reserved-action guard in `keel hook` (`org/reserved-actions.yaml`; [09-runtimes.md](09-runtimes.md) section 5 notes Bash patterns are weak). Gap: patterns with no stated evaluation order, no per-segment rule for compound commands and no `unattestable` journal outcome | candidate | Best-effort prevention (KP-16) should not fall to `git status && git push` or `$(git push)`; the gate order, an `unattestable` outcome that warns and journals, and the rule-injection test style give keel one conformance scenario per bypass shape, while detection by ref snapshot and `ls-remote` stays the guarantee |
| Pattern normalization before matching: strip env-var prefixes and `env`, normalize path-qualified binaries, strip git global options (`-C`, `--git-dir=`), peel described process wrappers such as `timeout 300`, drop the match when an undescribed wrapper option could swallow the next word, and classify flags with one grammar per tool and subcommand | `src/discover/README.md` (per-segment rewriting, env prefix handling, process wrapper handling); `src/core/README.md` (argument tokenizer); `CHANGELOG.md` 0.49.0 wrapper-peeling entry | Reserved-action `patterns` and the dispatch refusal of bypass flags in argv ([09-runtimes.md](09-runtimes.md)). Today `git push` is a prefix shape that `env X=1 git push`, `/usr/bin/git -C . push` or `rtk git push` would not match | candidate | The guard, the generated deny rules and the ingest parser should all match the peeled, normalized command, so `submit.reserved-op` detection does not depend on the seat's spelling; add the conformance scenario "a reserved operation wrapped by a rewriting hook or `timeout` is still detected" |
| Hook integrity hash and trust-before-load for repository-committed configuration: a SHA-256 sidecar with five explicit states (Verified, Tampered, NoBaseline, NotInstalled, OrphanedHash) and the honest note that a read-only bit is not a security boundary; a project-local filter file is skipped, not loaded with a warning, until its hash is recorded, and any change re-requires review | `src/hooks/integrity.rs` (module doc, `store_hash`); `src/hooks/trust.rs` (`check_trust_with_content`); `src/hooks/README.md` (integrity verification) | Generated surfaces with ownership markers and `.keel/generated.lock.json` (KP-14); handbook overlays and runtime templates that shape what a seat reads but are not Board-signed ([14-trust-security.md](14-trust-security.md) T10) | candidate | On a fresh clone the signed approvals cover briefs and plans, but an unsigned committed overlay or skill file can be edited by anyone with push access to a fork; recording its hash in the lock and refusing, not warning, to compile a brief from a drifted file until `keel sync` re-blesses it is a detection guarantee with a typed state list (KP-16) |
| Layered, budgeted always-loaded instruction text: each higher awareness level is byte-for-byte the lower one plus a tail; line-budget tests guard bloat; agents without a hook always receive the activation text; an explicit list of what is left out of every level on purpose; never instruct the model to avoid, skip or doubt a command | `AWARENESS_CONFIG.md` (principles, hook agents versus rules-only agents, deliberate omissions, tests); `hooks/rtk-awareness.md` and its `-high` and `-full` siblings; `docs/guide/getting-started/configuration.md` | Handbook budget ([09-runtimes.md](09-runtimes.md): managed AGENTS.md block <= 8 KiB with a provenance line, pitfalls only with an incident id, trigger-only skill descriptions), rungs A to D pull-versus-push of the brief | candidate | Make the managed block's level a function of the rung (hook-bearing runtimes get only how to read keel output and where the brief is; rung C and D runtimes get the activation text that says to pull `keel brief`), test that each higher level is a prefix extension of the lower, and keep a "deliberately left out" list in the template. The anti-rule matches keel's stance that distrust is structural (re-execution), not prompted |
| Cap calibration from usage denominators: per-filter counters of elisions versus recalls name an over-recalled filter so its cap can be raised; caps are named classes bound once per filter; a configured cap of 0 means summary only, still with the recall hint; caps are never refused | `docs/TELEMETRY.md` (quality row `recall_stats`); `CHANGELOG.md` 0.49.0 over-recalled-filter entry; `src/core/truncate.rs`; `src/core/README.md` (truncation caps) | Brief byte budgets per runtime profile ([02-alignment.md](02-alignment.md)), packet and fix-loop excerpt sizes ([11-verification.md](11-verification.md)), doctor denominators. keel has no feedback loop from how often a reviewer pulled the full log back to the budget | candidate | M0 budgets are guesses; journaling shown and pulled counts per packet section gives M3 a denominator to tune them from, in the KP-12 style, and named cap classes bound once per renderer keep the numbers in one place (KP-14) |
| Spoofed-framing negative controls: fixtures whose stdout carries a forged inner summary (a nested "100% tests passed" inside a failing test's output, a nested start line) and the parser must still take the real final summary and exit code | `tests/fixtures/ctest_spoofed_framing_raw.txt`; `src/cmds/system/ctest_cmd.rs` tests `rejects_spoofed_framing_and_uses_the_final_summary` and `parallel_start_cluster_rejects_wrong_name_spoof` | `submit.fake-completion`, the negative-control minimum set ([11-verification.md](11-verification.md) section 8), JUnit-row parsing in the Steward runner | candidate | keel binds evidence to exit codes and JUnit rows rather than to text, but a seeded fixture with a forged pass summary pins that the runner never reads a status from free text, and doubles as a prompt-injection test for the seat-facing excerpt |
| Windows-native hook hygiene: the hook is a binary subcommand with no bash or jq; a UTF-8 BOM on hook stdin (seen on Windows hosts) is stripped before parsing; stdin is capped at 1 MiB; protocol JSON is written through one writer because stray stdout silently disables the hook; a Windows-only regression test proves a quoted argument reaches an MSYS child intact; hook payload line endings are pinned in CI | `README.md` (Windows section); `src/hooks/hook_cmd.rs` (`STDIN_CAP`, `read_stdin_limited`, BOM handling); `CHANGELOG.md` 0.47.0 BOM entries and 0.49.0 line-ending entry; `tests/windows_child_quoting_test.rs`; `docs/guide/getting-started/supported-agents.md` | `keel hook <event> --runtime <id>` ([12-cli-api-mcp.md](12-cli-api-mcp.md) section 6), D3 native Windows, the [ADR-0002](adr/ADR-0002-node-windows-native.md) spawn contract, conformance scenarios in `test/README.md` | candidate | Exactly the failure modes a Node hook entry point meets on Windows 11, each a one-line rule plus a test: strip a leading BOM, cap stdin, write protocol output through a single function, keep diagnostics on stderr, add a windows-latest quoting test. Per-runtime specifics remain verify by probe; the pattern does not |
| Fail-open exit contract enumerated per error path, with admitted gaps listed in the open: missing binary, bad JSON, rewrite failure, old version and hook crash all exit 0 so the command runs unmodified; no rewrite means no output (or `{}` where the host demands JSON); a known violation is written down under a gaps heading | `hooks/README.md` (exit code contract, gaps to be fixed, graceful degradation); `src/hooks/README.md`; `hooks/claude/rtk-rewrite.sh` (every branch exits 0) | KP-10 (hooks fail open and journal), `runtimes/hook-events.yaml` outcomes, [12-cli-api-mcp.md](12-cli-api-mcp.md) section 6. keel states the principle but does not enumerate the error paths and the journal code each must produce | candidate | An enumerated table (binary missing, payload unparsable, journal write failed, unknown event, runtime protocol mismatch, each with its exit code, stdout content and journal outcome) turns KP-10 into conformance scenarios, and a known-gaps list in the hook doc is the KP-16 habit applied to keel's own hooks |
| Thin per-agent delegates over one registry, and hook tests that spawn the real binary in a sandbox with `HOME`, `CLAUDE_CONFIG_DIR` and `XDG_*` pinned so the developer's own agent settings can never change a test's answer | `hooks/README.md` (scope: no filtering logic duplicated per agent); `tests/hook_decision_protocol_test.rs` (`Sandbox`); `tests/hook_warning_scope_test.rs` (`isolating_env`) | Per-runtime shims and snippets generated from manifests (KP-14), the `test/README.md` conformance harness, the never-read rule (AGENTS.md house rules) | candidate | keel's shims are already thin; the transferable part is the test rule that every hook and dispatch test runs the real CLI with `HOME`, `APPDATA`, `CLAUDE_CONFIG_DIR`, `CODEX_HOME`, `KIMI_CODE_HOME` and `XDG_*` pointed at a temporary directory, which is hermeticity and a P1 hygiene guarantee at once, worth stating in `test/README.md` |
| Prompt-cache reasoning: condensed output is written once into the transcript and never changes afterwards, so the stable prefix the cache matches on is preserved; smaller tool results also make cache writes and reads cheaper (rtk quotes provider multipliers and offers an economics view that reads the user's usage files) | `README.md` (how it works); `docs/guide/resources/troubleshooting.md` (prompt-cache question); `src/analytics/README.md` | Deterministic hashed briefs (KP-01; [02-alignment.md](02-alignment.md), where the header with `computed_at` sits outside the hashed body), brief re-injection after compaction, hook `inject` outcomes | candidate | Anything keel injects per turn must be byte-identical across turns unless the brief changed, with volatile fields (`computed_at`, an unchanged `head_commit`) kept out of injected text, or keel breaks the prefix it wants cached. The pricing multipliers are provider-specific and unverified and are never hard-coded (P1, KP-12); reading usage files is excluded by the never-read rule |
| Correction-pair mining: scan a session chronologically for fail-then-succeed pairs of the same base command, classify the error (unknown flag, wrong path, missing argument), score confidence, deduplicate into rules with occurrence counts, then auto-write a rules file the agent loads | `src/learn/README.md` (detection algorithm, purpose) | Handbook pitfalls admitted only with an incident id ([09-runtimes.md](09-runtimes.md)); keel's per-run parsed tool-event stream at ingest | candidate | The detector half fits: ingest already sees every tool event of a run, so a fail-then-succeed pair can become a candidate pitfall carrying the run id as its incident id, offered to the Board. The auto-write half is an unsigned handbook change, so keel only proposes |
| A rewriting, auto-allowing hook: rtk's integrity module exists because its hook bypasses the host's permission prompts; the Codex integration documents that the host does not unwrap the rtk binary, so wrapped mutating commands such as `git push` lose their safety signal; the Trae integration deliberately omits the permission decision and leaves approval to the host | `src/hooks/integrity.rs` (module doc, SA-2025-RTK-001 F-01); `hooks/codex/README.md`; `hooks/README.md` (JSON formats by agent, exit code contract) | KP-10 (hooks warn, gates decide), `runtimes/hook-events.yaml` outcomes (allow, block, inject, error), [14-trust-security.md](14-trust-security.md) T12. keel never emits `updatedInput` or `permissionDecision: allow`; the docs should say so explicitly and name why | negative lesson | Rewriting tool input turns hook trust into a security boundary that then needs hash sidecars, tamper states and per-host protocol quirks, and still weakens the host's own rules on the rewritten command. Coexistence hazard for the exposure profile: rtk reads project and user settings, not keel's per-run settings file, so a seat's `git push` rewritten to `rtk git push` escapes the per-run deny rule `Bash(git push*)`; keel's detection still catches it, prevention must not be claimed on such a machine, doctor can note `rtk` on PATH as a hint, and whether Claude Code hands a later hook the original or the updated input is verify by probe |
| `rtk init -g` edits user-global and shared agent configuration in place: Claude Code `settings.json` hooks, `RTK.md`, `GEMINI.md`, Codex `hooks.json` plus a line in AGENTS.md, opencode plugin, Factory, Trae, Vibe and Hermes config files, with `.bak` backups, Ask/Auto/Skip patch modes, an `--auto-patch` flag for CI, legacy migration and self-heal code | `src/hooks/README.md` (installation modes, patch-mode behaviour, atomicity and safety); `src/hooks/init.rs` (`patch_settings_json_command`, `backup_and_atomic_write`, `migrate_old_hook_script`); `src/hooks/hook_cmd.rs` (`heal_legacy_copilot_configs`) | [09-runtimes.md](09-runtimes.md) (keel never reads, writes or hashes shared or user-global runtime settings; `keel sync` prints snippets), [14-trust-security.md](14-trust-security.md) runtime config layers row, `org/reserved-actions.yaml` (no row today for editing agent configuration) | negative lesson | rtk shows the full cost of owning the user's agent configs: thousands of lines of per-agent patch, migrate, back-up and heal code, protocol drift per host, and a hook that then needs its own integrity checks. keel's snippet-first stance stays; rtk's Skip mode (print manual instructions and succeed) is keel's default. Consequence: a candidate reserved-action row `change-agent-config` (patterns such as `rtk init`, `claude config`, `claude mcp add`, `codex mcp`, `gemini extensions` and writes under the runtimes' settings paths; detected from tool events, prevented best effort; whether write paths are expressible in each runtime's deny syntax is verify by probe) |
| Reading the user's transcripts, agent settings and environment: discover, session, learn and cc-economics read Claude Code JSONL transcripts under the resolved Claude directory; the hook and rewrite paths read user and project `settings.json` and `.local` variants (and Cursor, Gemini, Droid settings) for permission rules; `rtk env` prints environment values truncated at 100 characters (no masking found in the file head; verify) | `src/discover/provider.rs` (`ClaudeProvider::projects_dir`); `src/hooks/permissions.rs` (`load_permission_rules`, `get_settings_paths`); `src/cmds/system/env_cmd.rs` | The never-read rule (AGENTS.md house rules; KP-13), `submit.provider-path-events` ([09-runtimes.md](09-runtimes.md) rung table), the exposure profile (KP-16) | negative lesson | All three are things keel must not do itself, and the third is a detection gap keel can close: an environment dump (`env`, `printenv`, `set`, `Get-ChildItem Env:`, `rtk env`) run by a seat puts values into the transcript, so ingest should flag these command shapes as exposure events next to provider-path reads, stated as detected, not prevented |
| Telemetry: disabled by default with explicit opt-in at init, a salted device hash, names-only command reporting, an erasure command, and an endpoint and token injected at compile time so the code is dead when unset; `DISCLAIMER.md` nevertheless says metrics are collected by default, contradicting `README.md` and `docs/TELEMETRY.md` | `docs/TELEMETRY.md` (how it works, data handling, for contributors); `src/core/telemetry.rs`; `DISCLAIMER.md` | keel ships no telemetry ([14-trust-security.md](14-trust-security.md) T15 treats adapters that send telemetry as a threat); the single-home documentation rule ([README.md](README.md)) | not applicable | keel makes no network calls of its own, so there is nothing to adopt. The drift between two rtk documents is a reminder of why keel's single-home table and validators exist |

Nothing from rtk is adopted until the owner decides under P4 ([00-mandate.md](00-mandate.md) section 4.4).
Adopting a candidate adds a construct row to the map above with rtk as its permitted source, changes the
affected home document, and appends a review entry to [reference-projects.yaml](reference-projects.yaml).
The negative lessons already appear in the "Deliberately not adopted" table below. One housekeeping note
from the review: rtk's README still shows an older version string in its installation check, a stale
documentation example that does not affect the licence or the HEAD recorded here.

## Licence notes

- **keel itself** is MIT licensed, "Copyright (c) 2026 Qither" (D7), in the root `LICENSE`.
- **MIT sources.** keel re-implements ideas in its own words and code. No source text or code from any
  reference project is copied in M0, so no third-party notice is owed. If a later milestone copies code
  from an MIT project, the project's copyright and permission notice must travel with the copy and the copy
  must be recorded in this document.
- **Apache-2.0 sources** (rtk). Ideas only in M0; no code is copied. If a later milestone copies code from
  rtk, the Apache-2.0 notice requirements apply and the copy must be recorded in this document.
- **Bundled frontend libraries** (TanStack, React, from M5). MIT; bundled into the dashboard file at package
  build, so their copyright and permission notices travel with the bundle. The dependency table below is
  extended when they are added ([ADR-0009](adr/ADR-0009-tanstack-frontend.md)).
- **Elastic License 2.0 sources** (edikt, keel-other). Ideas only. No text, code, schemas, prompts,
  templates or file layouts are copied. The shape audit below records the comparison.
- **Non-OSS and proprietary sources** (Sourcegraph's non-open parts, Kiro). Public documentation only;
  ideas only.
- **Trademarks.** BMAD-METHOD is named only to credit it. keel uses no BMad mark in its own names.
- **External programs.** The runtime CLIs, codegraph, SCIP indexers, jj and git are installed by the user
  and invoked as separate processes. keel vendors and redistributes none of them, and none is a
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
| 2026-09-25 | `docs/00-mandate`, `ADR-0009`, `docs/reference-projects.yaml` | `node scripts/validate.mjs --only audit` | Clean: `audit: 250/250 files clean` (no D2 term, key-shape or provider-host hits) |
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
| Overrides | Expiring overrides | Approved `keel approve --rule override --until …` | Idea only |
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
| A Claude-only enforcement loop | keel-other | keel must hold its guarantees on every supported runtime |
| Auto-approved, model-drafted acceptance | Kiro Quick Spec | Standing policies never approve model-drafted acceptance |
| The OpenSpec CLI as a dependency | OpenSpec | P3: ideas, not dependencies |
| Role subagents | Agent OS (which removed them) | Seats record the assumption they encode instead |
| Running `codegraph init` or `install`, or running it with telemetry on | codegraph | Those edit agent configs; keel uses index and query commands only |
| A sealed reader for provider value files | An early keel draft | Replaced by the names-only invariant ([ADR-0006](adr/ADR-0006-provider-values-by-reference.md)) |
| Seats committing through a hook; a loopback submit endpoint | Design alternatives | Steward commits and per-mode submit channels ([ADR-0004](adr/ADR-0004-steward-commits-and-submit-channels.md)) |
| SSH or GPG signatures with signer lists, agent checks and hardware keys; an optional signature mode | Design alternatives | Ruled out by the owner (D6): they defend against a same-account threat keel is not asked to defend against, at the cost of the daily path. Approvals are explicit confirmations ([ADR-0005](adr/ADR-0005-explicit-confirmation-approvals.md)) |
| jj as the primary backend; jj secondary workspaces for agents | jj | [ADR-0001](adr/ADR-0001-git-primary-jj-optional.md) |
| Codex `.codex/agents` files for builder seats; the removed chat wire API | Codex CLI | They define spawnable subagents only; Codex routes use openai-responses |
| Permission-bypass flags (`--dangerously-*`, yolo modes, Kimi Code `-p` treated as safe, `--dangerously-bypass-hook-trust`) | Runtime CLIs | Never generated |
| Automatic conflict resolution (`-X ours/theirs`) | git | Conflicts become tasks |
| Requirement identity by header text; modifications without base hashes | Specification-driven tools | Ids plus `rev_hash` |
| Symlinked skills or configs on Windows | Several tools | keel writes copies |
| UI kits, CSS frameworks and CDN-loaded assets in the dashboard | Common dashboard stacks | P2: TanStack headless libraries only, bundled inline, over native markup ([ADR-0009](adr/ADR-0009-tanstack-frontend.md)) |
| A hook that rewrites tool input or grants permission (`updatedInput`, `permissionDecision: allow`) | rtk | Hooks warn and journal; gates decide (KP-10). A rewriting hook is a command-injection vector and hides the rewritten command from the host's own rules; see the rtk first-pass review |
| Patching user-global or shared agent configuration in place (installers with backups, migrations and self-heal code) | rtk `init -g` | `keel sync` prints snippets and never writes shared or user-global runtime settings ([09-runtimes.md](09-runtimes.md)) |
| Reading the user's agent transcripts, agent settings or environment values for analytics or rules | rtk `discover`, `session`, `learn`, `cc-economics`, `env`; rtk's hook permission loading | The never-read rule (AGENTS.md house rules, KP-13); keel diagnoses from doctor output and its own parsed stream |
| Always-loaded context bloat and silent truncation | Large instruction files; Codex's 32 KiB chain cap | Handbook budgets checked at sync |
| Coercive prompt tone tuned to one model | Single-vendor prompt packs | Prompts are checked by behaviour conformance across families |
| Stored display state | Dashboards that cache badges | State is computed from ledger events |
