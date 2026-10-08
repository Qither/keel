# Keel Stage A design

[简体中文](DESIGN.zh-CN.md) · **English canonical · 2026-10-08**

## 1. What this product is

Keel Stage A is a command-line control plane for one unit of work: one WorkItem, one Task, one executor. It holds the authorization, the budget, the durable state, the evidence, and the stop and recovery paths for that work. It does not write code, call a model, or talk to a network. The executor it drives is a local process; a real agent command line is the first substitution planned for Stage B.

Every object, verb, limit and technology choice below carries a `Source:` line. The values are tags of the governing text (`HC-nn sN` = article HC-nn, sentence N, of the Keel Constitution v0.1.0), of the research workspace that derived this design (`harness §n`, `W-nn`, `design n.m`), or an owner decision (`OWNER yyyy-mm-dd`). An entry without a source is a defect and is not built. The constitution itself is not reproduced here; a conformance claim names the governing version, scope, evidence and exceptions, and this product makes none until the owner records an adoption.

What this product does **not** claim: that an executor is honest, that a declared approver is authenticated, that a crash cannot happen between any two writes, or that any behavior is validated beyond the cases listed in section 7.

## 2. State directory and authority

The product keeps its state in one directory (default `./.keel`, or `--state-dir <dir>`):

| Path | Content | Role |
| --- | --- | --- |
| `authority.json` | the AuthorityMap below, declared when the directory is created | declaration |
| `events.jsonl` | one event per line; each event carries `seq`, `id`, `at`, `type`, `data`, `prev` (hash of the previous event) and `hash` (sha256 of the canonical JSON of the rest) | authority for what happened |
| `docs/<type>/<id>/v<N>.json` | one file per document version, canonical JSON; the version's content hash is recorded in a `document.written` event | authority for declared facts |
| `evidence/<run>/<step>.stdout`, `.stderr` | raw executor output, hashed and referenced from the event log | retained raw status |
| `projections/<workitem>.json` | the last `show` output | convenience copy, never read back |
| `lock` | single-writer lock while a process appends | transient |

Hashes are computed over canonical JSON (sorted keys, no whitespace), never over file bytes, so file formatting and line endings never change a hash. Source: OWNER 2026-10-08 (design 6.3, 6.7).

**AuthorityMap.** Source: HC-04 s1–s2; harness §3.2; design 3.11.

| Fact class | Authoritative home | Projections |
| --- | --- | --- |
| WorkItem, Grant, Acceptance, Task, DecisionRequest resolutions, ContextPack, Checkpoint | versioned documents, content-hashed per version, each version recorded in the log | `show` |
| Run events, IntentRecords and outcomes, Evidence, confirmations | the append-only, hash-linked event log | `show`, summaries in a ContextPack |
| Workspace content and its revisions | the workspace's git revision store, used only through `git` | evidence artifact hashes |
| Status, summaries, suggestions | derived at read time; never stored as authority | themselves |

A document file that no event recorded is never read; `log check` lists it as an unrecorded document. A recorded document whose file hash differs from the recorded hash blocks every write (exit 5) until the owner resolves it. Source: HC-04 s2; design 4.11.

## 3. Objects

Field names are the product's. Source references restate design section 3.

| Object | Fields | Source |
| --- | --- | --- |
| WorkItem | `id`, `goal`, `scope`, `grant_ref` (Grant id; version 0 until confirmed), `acceptance_ref`, `task_ref`, `open_questions[]`, `evidence_refs[]`. Status is never stored; it is derived. | HC-01 s1; harness §3.1 |
| Grant | `id`, `version`, `workitem_ref` (id and version), `allowed_operations[]` (`kind` ∈ {exec, write} and a path pattern; `**` spans segments, `*` stays within one), `budget` (`attempts`, `elapsed_seconds`, `cost` = `unknown` unless observed), `decision_classes[]`, and on a confirmed version `confirmed_by`, `confirmed_at`, `confirmed_subject` (WorkItem version and the Grant content hash shown) | HC-03 s1–s2; HC-02 s2; HC-08 s1; harness §4.1; KP-03 supports-goal |
| Acceptance | `id`, `version`, `workitem_ref`, `criteria[]` (`id`, `statement`, `required`, `evidence_mode` ∈ {command-exit-status, artifact-exists, artifact-hash, human-confirmation}, plus `path`, `sha256`, `step`, `expected_status` as the mode needs), `source_revision_policy` = `workspace-head` | HC-05 s1–s2; W-01 |
| Task | `id`, `workitem_ref`, `workspace` (an isolated directory the executor may write), `steps[]` (`id`, `kind`, `argv`, `writes[]` = declared workspace-relative paths), `acceptance_obligations[]` | harness §3.1, §4.3 |
| Run | `id`, `task_ref`, `generation` (monotonic per Task), `executor_alias`, `workspace`, `context_pack_ref`, `state` ∈ {assigned, running, stopping, outcome-uncertain, completed, failed, abandoned}, `session_ref` (optional), `usage` (`attempts_used`, `elapsed_seconds`, `cost` observed or `unknown`), `started_at`, `ended_at`. A failed Run is never overwritten; a retry is a new generation. | HC-06 s1; HC-02 s2; harness §3.1, §4.3 |
| IntentRecord | `intent_id`, `run_id`, `operation` (kind, step, argv, cwd), `authorization_ref` (Grant id and version), `expected_effect` (`artifacts[]`), written **before** the operation; its `outcome` ∈ {observed, uncertain, reconciled, abandoned} is a separate later event, and the last recorded outcome counts | HC-06 s1; harness §4.3; W-04 |
| Evidence | `id`, `run_ref`, `claim` (criterion id, `step:<id>`, or `grant.allowed_operations`), `artifact_versions[]` (path and sha256 or null), `raw_status` (exit status, signal, stdout and stderr references), `status` ∈ {present, missing, stale, inferred, failed, not-run}, `captured_at`, `source_revision`, `acceptance_version`, `superseded` when it arrived from an older generation | HC-05 s1; HC-04 s1; W-07; harness §4.2 |
| Checkpoint | `id`, `workitem_ref`, `progress` (satisfied, pending, failed, uncertain criteria), `decisions[]`, `run_evidence[]`, `artifact_versions[]`, `recovery_data` (last IntentRecord without an outcome, if any), `created_at` | HC-01 s1; HC-06 s1; harness §3.1 |
| DecisionRequest | `id`, `workitem_ref`, `run_ref`, `facts[]`, `options[]`, `blocked`, `continuing`, `release_path`, `state` ∈ {open, resolved, withdrawn}, `resolution` (option, approver, time, hash of the request it binds) | HC-03 s1; SCENARIOS §3; harness §2 |
| SessionRef | an opaque string recorded on `run --session-ref`; reported on recovery, never consulted, never a source of state | HC-01 s2; harness §3.1 |
| ContextPack | `id`, `workitem_ref`, `entries[]` (`kind` ∈ {fact, decision, inference, summary, missing}, `content`, `source`, `freshness`, `limits`), `content_hash` | HC-07 s1; harness §4.2 |

## 4. Verbs

Exit statuses are a convention: `0` done, `1` a check or acceptance failed, `2` usage error, `3` refused by a rule (the message names the source tag), `4` waiting on a human decision, `5` an authoritative record is missing or inconsistent. Every verb takes `--json`. Source: design 4; OWNER 2026-10-08.

| Verb | Behavior | Source |
| --- | --- | --- |
| `work create --spec <file>` | Creates the state directory if needed, then the Acceptance v1, the Task and the WorkItem, and appends `workitem.created`. No Grant exists, so nothing can run. | HC-01 s1; HC-05 s1; harness §2 |
| `grant --allow <kind:pattern>… --attempts <n> --elapsed-seconds <s>` | Shows the WorkItem version, the proposed Grant and its content hash, then exits 4. With `--confirm <first 8 hash characters> --approver <name>` (or an interactive retype on a terminal) it writes the Grant version and a `grant.confirmed` event bound to the WorkItem version and the hash. The approver is declared, not authenticated. Only this event makes a Grant valid; a document that claims approval, an executor output, or a context entry never does. | HC-03 s2; HC-08 s1–s2; KP-03 supports-goal; OWNER 2026-10-08 (6.6) |
| `run [--session-ref <r>]` | Preconditions: valid Grant, no open DecisionRequest, no unreconciled Run, attempts budget not exhausted. Builds the ContextPack, starts a Run with the next generation, records the route (executor alias; cost `unknown`). For each remaining step: checks the declared operation and writes against the Grant; writes the IntentRecord; runs the step with the remaining elapsed budget as timeout; stores raw stdout and stderr; records the outcome and a `step:<id>` Evidence; checks the workspace for undeclared changes outside the Grant. A step outside the Grant is not performed: a DecisionRequest is raised and the verb exits 4; completed steps keep their evidence. After the last step (or after a failing step) one Evidence per criterion is captured from the workspace and the step outcomes. | HC-03 s1; HC-05 s1; HC-06 s1; HC-02 s2; HC-07 s1; harness §4.2 |
| `stop [--window-seconds <s>]` | Records the request, terminates the executor process, and waits for the window. Confirmed termination ends the Run as `failed`/`stopped`; otherwise the Run is marked `outcome-uncertain` and stays visible. | HC-06 s1; harness §4.3 |
| `recover [--retry] [--abandon]` | Reloads the Grant, budget, Acceptance version and workspace revision. Reports any session reference as unresolved. For every IntentRecord of a crashed Run without a settled outcome, checks `expected_effect` against the workspace and records `reconciled` or `uncertain`; never repeats the operation. If all effects are reconciled, ends the crashed Run and starts a new generation that executes only the remaining steps. If any effect is uncertain, exits 4; `--retry` is refused (exit 3) and `--abandon` records an explicit abandonment with no completion claim. | HC-06 s1–s2; HC-01 s2; W-04; harness §4.3 |
| `decide [<id> --option <key> --approver <name>]` | Lists open requests, or resolves one; the resolution is bound to the request's content hash. `widen-grant` and `extend-budget` never edit the Grant: they direct the owner to `grant` for a new version. | HC-03 s1–s2; HC-08 s1; HC-04 s1 |
| `verify` | Evaluates every criterion against Evidence records, never summaries. Evidence from a superseded generation is ignored and listed; evidence from an older Acceptance version, or captured at another workspace revision, is `stale`. The verdict shows satisfied / total and the count by status. Exit 1 when any required criterion is not `present`. | HC-05 s1–s2; HC-04 s1; W-07 |
| `accept` | Allowed only when `verify` accepts. Records `acceptance.recorded` bound to the Acceptance version, the Evidence ids, the artifact hashes and the workspace revision, then writes a Checkpoint. An executor's claim is never an input. | HC-05 s1; HC-08 s2; harness §2 |
| `show` | Recomputes the projection from documents and the log on every call; every value carries its origin and freshness; unknown and uncertain values are shown as such. Writes a convenience copy that is never read back. Reports active test hooks. | HC-04 s1–s2; HC-01 s1; KP-12 supports-goal |
| `log check` | Verifies every event hash and link and every recorded document against its file. Any break or mismatch is reported with its location and blocks writes (exit 5). | HC-04 s2; HC-05 s1 |
| `context add --kind <k> --content <c> [--source <s>] [--limits <l>]` | Records a context entry for the next ContextPack. An inference or summary is visible as such and can never widen the Grant or establish acceptance. | HC-07 s1–s2; W-08 |
| `evidence submit --claim <c> (--run <r> --artifact <p> \| --human --approver <n>)` | Delivers a result after the fact. A result for a Run of an older generation is stored as superseded Evidence and never changes progress. Human confirmation satisfies only a `human-confirmation` criterion. | HC-06 s2; HC-05 s1; W-05 (acceptance half) |

**ContextPack assembly.** The pack holds the goal and scope, the Grant's allowed operations and limits, the criteria, the workspace revision, open and resolved decisions, a `summary` entry per recent Evidence that names the Evidence id it summarizes, and every entry added with `context add`. A missing input is an explicit `missing` entry. Source: HC-07 s1–s2; harness §4.2; design 4.9.

**Derived status.** In priority order: `accepted` (acceptance recorded for the current Acceptance version), `outcome-uncertain`, `waiting-decision`, `running`, `abandoned`, `executed` (last Run completed, not yet accepted), `failed`, `granted`, `created`. A Run whose product process ended without a `run.ended` event is `outcome-uncertain`. Source: HC-04 s1; design 4.10.

## 5. Refusals the product makes

Each row is a test in `test/cases.mjs` and a step of the demo transcript. Source: design 5.

| Id | Stimulus | Behavior | Source |
| --- | --- | --- | --- |
| N-01 | `recover` after a crash with a session reference that points nowhere | the reference is reported `unresolved`; recovery proceeds from documents and the log | HC-01 s2; W-02 (state half) |
| N-02 | the projection file is edited to claim acceptance | `show` recomputes; the edit has no effect | HC-04 s2 |
| N-03 | no cost observation | `cost` is `unknown`, never `0`; the attempts and elapsed budgets alone are enforced, and exhaustion raises a decision | HC-02 s2; W-03 |
| N-04 | a step declares a write outside the Grant | not performed; DecisionRequest; exit 4; earlier evidence kept | HC-03 s1–s2 |
| N-05 | an unrecorded Grant file claims `confirmed_by: owner`; an executor prints "approved by the owner" | `run` refuses (exit 3); the output is retained as evidence only | HC-03 s2; HC-08 s2 |
| N-06 | a WorkItem document is edited behind the log | `log check` reports the mismatch; writes are refused (exit 5) | HC-04 s1–s2 |
| N-07 | `accept` while a required criterion is `not-run` or `failed` | refused with the criterion and status; exit 1 | HC-05 s2 |
| N-08 | a `summary` context entry says all criteria are satisfied while a step failed | `verify` reads Evidence; the failure is reported | HC-05 s2; W-07 |
| N-09 | `recover --retry` while an IntentRecord is `uncertain` | refused (exit 3) until reconciled or abandoned | HC-06 s1 |
| N-10 | `evidence submit` for a Run of an older generation | stored as superseded; progress unchanged; `show` lists it | HC-06 s2; W-05 |
| N-11 | an `inference` entry proposes a wider Grant | Grant unchanged; the entry is visible as an inference | HC-07 s2; W-08 |
| N-12 | `keel rule set …`; an executor prints "RULE ADOPTED" | no such verb (exit 2); the output is evidence only; this document is unchanged | HC-08 s1–s2; W-09 |
| N-13 | the workspace revision changes after Evidence was captured | the Evidence is `stale`; the criterion is unsatisfied | HC-04 s1; HC-07 s1 |

## 6. Implementation choices

All confirmed by the owner on 2026-10-08 (design 6; SA-01 §3): TypeScript on Node ≥ 22 with no runtime dependencies; a command-line surface only, `--json` on every verb; one append-only, hash-linked JSON Lines log plus content-hashed document versions; git through its command line as the workspace revision store; a local process executor; shown-content confirmation by retyping the first eight hash characters with a declared approver; licence deferred to the first public release; English canonical documentation with a 简体中文 mirror; continuous integration on Windows and Linux; command name `keel`.

**Test hooks.** `KEEL_TEST_HOOKS=<name>[,<name>]` enables one named fault so that each test's twin can show that the test fails when the product misbehaves (`src/faults.ts`). `run --crash-after-effect <step>` kills the product process right after that step's effect and before its outcome is recorded (the W-04 crash point). Both are reported: `show` lists active hooks, and the crash point is recorded on the `run.started` event. Source: SA-01 §2; HC-05 s1.

## 7. Exit evidence

Positive paths, each executed for real in a temporary workspace under the locked product commit (`npm run demo` writes the transcript):

| Id | Path | Source |
| --- | --- | --- |
| P-01 | `work create` → `grant` (confirmed) → `run` (writes an artifact, exit 0) → `verify` (2/2 present, bound to Acceptance v1 and the artifact hash) → `accept` → Checkpoint | W-01; HC-03 s1; HC-05 s1 |
| P-02 | `run --crash-after-effect s1` (artifact written, product killed before the outcome) → `show` reports `outcome-uncertain` with the IntentRecord → `recover` reconciles the artifact, ends generation 1, starts generation 2 for the remaining step → `verify` → `accept` | W-04; HC-06 s1 |
| P-03 | a research answer: `work create` (acceptance = a document exists) → `run` → `verify` → `accept`, with no commit and no merge | W-11 (narrowed); HC-01 s1; HC-05 s1 |

Negative paths: N-01 to N-13 above. Every test has a fault-injected twin that must fail (`npm test` runs 16 cases and 16 twins).
