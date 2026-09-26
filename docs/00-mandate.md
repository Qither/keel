# Owner's mandate: the core design document

This document is the root of keel's design. It records the owner's statement of what keel is to be and
restates it as the binding requirements (R1 to R5), decisions (D1 to D7) and standing preferences (P1 to
P5) that every other document derives from. It also owns the refresh discipline (P4): how keel's design is
re-examined against its reference projects at every refactor review, and the design iteration discipline
(P5): how a defect found in keel's own design is filed, walked, decided and closed.

Precedence is simple. The owner's statement outranks everything else in this repository. When another
document, a schema, a template or a data file disagrees with it, that file is wrong and is corrected; this
document changes only when the owner changes the statement, and it always reads as the current mandate: the
history of the statement is the git history of this file. [00-vision.md](00-vision.md) shows how the
design meets each requirement, and the home of every mechanism is in the single-home table of
[README.md](README.md).

## 1. The owner's statement

1. A brand-new, independently designed workflow that borrows from existing workflows: OpenSpec, codegraph,
   edikt, keel (the unrelated dcsg/keel, credited as keel-other), oh-my-claudecode, oh-my-codex, old-coder,
   rtk, OpenHands, BMAD-METHOD, superpowers, and other well-designed workflows, absorbing their design
   strengths. Kiro is not open source, so only its public documentation is consulted. keel is not a
   successor to the owner's earlier workflow designs; their names are the D2 term list.
2. Architecture visualization that fuses the approaches of Sourcegraph and arch-viewer.
3. Usable across models: Claude, Codex, Gemini, Qwen, Kimi, GLM and OpenCode must all work.
4. Version control: git is primary; jj is only an optional enhancement for parallel versions and
   traceability.
5. Design documents: bilingual, Chinese and English.
6. Human approval: a human approves after viewing the specific change. The approval record binds the
   explicit approval subject, the artifact hashes, the approver and the approval time. When the content of
   an approved subject changes, the earlier approval becomes invalid, and the change must be viewed and
   approved again. An AI seat's completion claim, review conclusion or self-generated approval text cannot
   stand in for the user's approval. SSH signatures are not used, and keel introduces no key management,
   no list of approved signer public keys, no ssh-agent enumeration, no hardware key type checks, no
   per-use presence verification and no separate identity authentication system. What this protects is
   the human's decision right in the collaboration process and the consistency between what was approved
   and what is executed; it does not require cryptographic anti-forgery guarantees against a malicious
   program running under the same operating-system account.
7. Technology stack: a TypeScript/Node CLI plus Markdown; where there is a frontend display, TanStack must
   be used.
8. keel runs a company of AI employees in roles, whose consistency with the work goals is guaranteed by
   mechanism, not by persuasion.
9. M0 delivers a design document set and a repository skeleton only.
10. Licence: MIT, "Copyright (c) 2026 Qither".
11. Provider endpoints, keys and model names belong to the user; keel never reads a provider value or a
    credential file.
12. Borrow ideas, never dependencies or text.

Standing instruction: at every refactor review, pull the latest version of each framework named above to a
local clone, analyse what they added, and check and correct the current workflow design as if it were being
designed for the first time. At every refactor, also search GitHub for new, well-designed workflow designs
that could be merged into the current workflow; prompt the owner to pull them locally for analysis, and
merge them into the current workflow. Translate the above into the core design document.

Standing instruction (design iteration): for the design problems that a review of keel finds, design the
core workflow's design iteration steps and append them to this core design document; do not set out to
solve the problems first, but complete the iteration steps, and then solve those design problems by
relying on the iteration steps.


## 2. Binding requirements

Each row restates one clause of the statement as a requirement keel must meet, under a stable id. The ids
are used throughout the repository; the text in this table is the authoritative form. How the design meets
each row is in [00-vision.md](00-vision.md).

| Id | Kind | Statement | From |
| --- | --- | --- | --- |
| R1 | Requirement | keel is a fresh, independent workflow design that borrows the best ideas of OpenSpec, codegraph, edikt, keel-other (dcsg/keel), oh-my-claudecode, oh-my-codex, old-coder, rtk, OpenHands, BMAD-METHOD, superpowers and other well-designed workflows. Kiro is consulted through its public documentation only. | Clause 1 |
| R2 | Requirement | Architecture visualization fuses approaches of the kind Sourcegraph and arch-viewer take. | Clause 2 |
| R3 | Requirement | keel works across Claude, Codex, Gemini, Qwen, Kimi, GLM and OpenCode. | Clause 3 |
| R4 | Requirement | git is the primary version control tool and is sufficient on its own; jj is only an optional enhancement for parallel versions and traceability. | Clause 4 |
| R5 | Requirement | keel runs a company of AI employees in roles whose consistency with the work goals is guaranteed by mechanism, not by persuasion. | Clause 8 |
| D1 | Decision | M0 delivers a design document set and a repository skeleton only; `scripts/validate.mjs` is the single declared tooling exception. | Clause 9 |
| D2 | Decision | The design is fresh and independent: every construct maps to a permitted, credited source, and the D2 term list in `scripts/validate.mjs` names what must never appear. | Clause 1 |
| D3 | Decision | TypeScript on Node >= 22.13: a CLI with Markdown, YAML and JSON Schema artifacts, native on Windows, with no tmux, WSL, Docker, bash or python in the core. | Clause 7 |
| D4 | Decision | git first; jj optional behind the Vcs interface. | Clause 4 |
| D5 | Decision | Human-facing documents are bilingual: English canonical `<name>.md` with a Simplified Chinese mirror `<name>.zh-CN.md`; identifiers, file names, schemas, YAML, templates, skills and prompts are English only. | Clause 5 |
| D6 | Decision | Human approval is explicit confirmation. At every node that needs a human decision, keel shows the specific subject and its change, and the user approves it explicitly after viewing it. The approval record binds the approval subject, the content hash of every approved artifact, the approver and the approval time; any change to approved content invalidates the earlier approval. AI seat output cannot produce a user approval. The mechanism depends on no SSH, key or hardware identity verification. | Clause 6 |
| D7 | Decision | MIT licence, "Copyright (c) 2026 Qither". | Clause 10 |
| P1 | Standing preference | Provider endpoints, keys and model names belong to the user; keel stores environment variable names only and never reads a provider value or credential file. | Clause 11 |
| P2 | Standing preference | Every frontend display keel ships is built with TanStack. The libraries are headless, so the markup stays native HTML elements with hand-written CSS; no UI kit, CDN or web font. | Clause 7 |
| P3 | Standing preference | Borrow ideas, never dependencies or text. | Clause 12 |
| P4 | Standing preference | Refresh discipline: at every refactor review the reference projects are pulled to their latest version, their additions are analysed, and keel is re-checked and corrected against them as a first-time design; GitHub is searched for new, well-designed workflows; the owner is prompted to pull candidates locally; adopted ideas are merged. Section 4 is the procedure. | Standing instruction |
| P5 | Standing preference | Design iteration discipline: a defect found in keel's own documents, schemas, templates or tables is filed, classified, walked, routed and closed by the procedure of section 5 before it is fixed; a conflict with the statement is put to the owner and never reconciled by rewording a lower document; no rule is introduced, tightened or loosened without its walk; open issues gate milestone exits. Section 5 is the procedure. | Standing instruction (design iteration) |

## 3. Precedence and amendment

Precedence, from highest to lowest:

1. the owner's statement in section 1; its clauses outrank their restatement in section 2, and the
   section 2 row is the authoritative form for every other file;
2. the principles KP-01 to KP-16 in [00-vision.md](00-vision.md);
3. the home document of each mechanism (the single-home table in [README.md](README.md));
4. keel's own ADRs; a decision adopted by recommendation is reversible by rewriting its ADR;
5. schemas, data tables, templates, examples and type-only code, which implement the documents.

A higher level wins, and the lower level is corrected. The rules for change:

- Only the owner amends the statement: in conversation with the maintainers, in an issue, or in a commit
  the owner authors. The statement is rewritten in place so that this document always reads as the current
  mandate; the history of what changed, and when, is the git history of this file.
- An amendment lands in the same commit as every file it affects: the table in section 2, the requirement
  mapping in [00-vision.md](00-vision.md), the home documents, the ADR that records the decision,
  [17-open-decisions.md](17-open-decisions.md) and [16-sources-credits.md](16-sources-credits.md). No
  document keeps a change log, a "revised from" note or a superseded version of itself; `git log` and
  `git diff` are the record. `npm run check` must pass in that commit.
- When a clause is ambiguous, the reading that keeps every other clause true is preferred, and the question
  is put to the owner through [17-open-decisions.md](17-open-decisions.md) rather than resolved silently.
  When a lower document cannot be read so that a clause stays true, that is a design issue of class
  `mandate-conflict`, and section 5 files it and routes it to the owner.


## 4. Refresh discipline (P4)

The owner's standing instruction, as a procedure. Its purpose is that keel keeps borrowing the best of its
references as they evolve, and that the design is judged afresh each time rather than defended.

### 4.1 When a refresh review runs

- At the exit review of every milestone from M1a to M8 ([15-roadmap.md](15-roadmap.md) lists it among the
  exit criteria).
- Whenever the owner asks for a design review or a refactor of keel.
- Before a new reference project is adopted.
- Not on ordinary changes (a schema fix, a translation, a probe result); those cite the last review.

### 4.2 The reference registry

`docs/reference-projects.yaml` is the canonical registry, validated by
`schemas/reference-registry.schema.json`. It holds one entry per reference project: upstream, licence and
licence class, whether the owner named it, where its local clone sits relative to this repository, and the
review history (date, HEAD, branch when it is not the upstream default, version, scope, outcome). It also
holds the scouting record: the standing GitHub queries, the last run, and every candidate with its status.
The construct map in [16-sources-credits.md](16-sources-credits.md) says what keel took; the registry says
what was examined and when. Local clones sit next to the keel checkout; keel never commits them, and
`scripts/validate.mjs` never opens them.

### 4.3 Procedure

1. **Pull.** For every registry entry with a local clone, fetch and fast-forward the branch recorded for the
   entry (the upstream default branch when none is recorded), and record the new HEAD, date and version. A
   clone that is missing, or whose licence file changed, is reported before anything else is read. An
   owner-named entry that has an upstream but no local clone (arch-viewer, Sourcegraph) is put to the owner
   in step 5 with a request to pull it at the next review; once cloned, its licence file is read and its
   `licence_class` recorded. For a reference consumed as npm packages (TanStack, and React with it), record
   the latest published version and the version pinned in `package-lock.json`, read the changelog between
   them, and treat a major-version move as a design element for step 3; the first such review is the M5
   exit, with the lockfile version and `head: null`. The licence file of each such package is read and its
   `licence_class` recorded when the package is first added to `package.json`, before that first review,
   so no package is bundled while the guardrail of section 4.5 still classes it as unverified.
2. **Diff.** Read what changed since the last reviewed HEAD: release notes, changed documentation, new
   commands, schemas, hooks and workflows. Note each new design element in one line with a pointer into the
   clone.
3. **Re-derive.** Treat keel as a first-time design. For each principle KP-01 to KP-16 and each construct
   row in [16-sources-credits.md](16-sources-credits.md), ask whether the new evidence confirms it, refines
   it or contradicts it. A contradiction is a correction: a home-document change, plus a superseding ADR when
   a recorded decision flips. It is never patched around. A contradiction that is internal to keel's own
   documents, rather than between keel and a reference, is filed as a design issue under section 5 and
   corrected through that procedure.
4. **Scout.** Search GitHub for workflows and agent-orchestration designs published or substantially changed
   since the last review, using the registry's standing queries. A candidate qualifies when it is open
   source or has public documentation, has a licence keel may learn from, shows evidence of real use, and
   offers a mechanism keel lacks or does worse. Record every candidate with upstream, licence, what keel
   might take and why.
5. **Prompt the owner.** Present the candidates in the form of section 4.4 and stop. The owner pulls the
   candidates to local clones, or approves the pull. Nothing is adopted from a candidate before that.
6. **Merge.** For each adopted idea: a construct row in [16-sources-credits.md](16-sources-credits.md) with
   its permitted source, the change to the affected home document, a registry entry, and a superseding ADR
   when a recorded decision changes. P3 and D2 apply throughout: ideas, never text or code; no forbidden
   term; ELv2 and non-OSS sources contribute ideas only.
7. **Record.** Append the review to each entry's history and to the scouting record, then run
   `npm run check`.

### 4.4 What the owner is asked

One message with one table: candidate, upstream, licence, what it does in one line, what keel might take,
and the question whether to pull it to a clone next to the keel checkout for analysis. The same message
lists, for the existing references, each HEAD move and the design elements found in it. The owner answers
per candidate: pull, decline (recorded in the registry with the reason), or defer.

### 4.5 Guardrails

- Licence classes decide the use: open source contributes ideas that keel re-implements; source-available
  licences such as ELv2 contribute ideas only and get a shape audit; proprietary products contribute
  through public documentation only; an unverified licence is treated as proprietary until its licence file
  has been read and the class recorded, at a refresh review or, for an npm package, when it is first added
  to `package.json` (step 1 of section 4.3).
- A refresh review never extends the D2 term list on its own; new forbidden names come from the owner.
- P1 holds during a review: examining a reference never involves reading the owner's provider or credential
  files, even when the reference project keeps them in a well-known place.
- A refresh review never changes the statement in section 1.


## 5. Design iteration discipline (P5)

The owner's second standing instruction, as a procedure. Section 4 looks outward and re-derives keel against
its references; this section looks inward. It drives every defect found in keel's own documents, schemas,
templates and tables to a decision and one closing commit, and it stops a defect of the same shape from
being written again. The shapes it exists for are four: a rule whose consumers were not re-walked when the
rule changed; one term carrying two meanings; a chain of steps that cannot complete or a wait that cannot
be released, which prose alone never shows; and a clause of section 1 reconciled by rewording a lower
document instead of being put to the owner.

### 5.1 When a design iteration runs

- Whenever anyone (the owner, a maintainer, an agent working on keel, an external review) finds two
  statements that cannot both hold, a step that needs an artifact a later step produces, a wait that only
  the waited-for step can end, a term with two meanings, a field that nothing reads, or a path that asks
  the Board for more confirmations than the mandate needs. The finding is filed (step 1 of section 5.3)
  before anything is fixed.
- Before a commit introduces, tightens or loosens a rule in a home document, a schema, a template or an
  `org/` table. A rule is a precondition ("only when", "requires", "needs"), a wait, lock or refusal
  ("waits for", "until", "no exception", "refuses"), a place ("is written", "committed", "projected" or
  "checked" in or from somewhere), a cardinality ("exactly one", "at most", "every", "never"), a measure
  defined by a formula, or a required field or enum value of a schema. The commit carries the walk of
  step 3 for that rule. This is the light mode: the only part of the procedure that a rule change may run
  on its own, and it never skips the walk.
- When step 3 of a refresh review (section 4.3, Re-derive) finds a contradiction that is internal to keel's
  documents: it is filed here, not patched there.
- At the exit review of every milestone from M0, before the refresh review: `exit_review` in the register
  is set to the milestone, and the `issues` check becomes the exit gate (section 5.2).
- When the `issues` check of `scripts/validate.mjs` fails for a design reason rather than a typo.
- Whenever the owner asks for a design review or a refactor, or reports a defect.
- Not on a translation, a typo, example data or a probe result; those change no rule and cite nothing.

### 5.2 The design-issue register

`docs/design-issues.yaml` is the canonical register, validated by `schemas/design-issues.schema.json`
through the `examples` check and cross-checked by the `issues` check of `scripts/validate.mjs`. It holds
four things, all current state and never narrative:

- `issues[]`: one entry per finding, `DI-nn`, with its title, a one-paragraph statement in keel's own
  terms, the anchors where the conflicting text stands (a file and a heading, or a file and a JSON pointer;
  never a line number), who found it, its class, status and root cause, the walk of step 3, the terms of
  step 4, the options and the recommendation, the decision, the milestone it blocks and its closure
  evidence. Classes, in precedence order: `mandate-conflict` (a clause of section 1, a row of section 2 or
  a KP against a lower level), `cycle` (a step needs an artifact a later step produces, a wait that only
  the waited-for step can end, or a place the consumer's machine cannot reach), `term-collision` (one term
  with two meanings, or two terms for one thing), `gap` (a state the design leaves undefined, a field
  nothing reads, or a producer too weak for the claim that leans on it) and `cost` (ceremony that asks
  more than the mandate needs). Statuses: `open`, `analysed`, `proposed`, `decided`, `closed`; `deferred`
  only by the owner and to a named milestone; `dismissed` with a reason. Closed entries are never deleted.
- `order`: the standing order map of the design, not a per-issue note. `steps[]` are verbs, gates and phase
  steps with their `after` edges and the machine they run in (`runs_in`: local, supervisor, seat or clone);
  `artifacts[]` name the step that produces each one, the steps that require it and where it lives
  (`where`: the working tree, the git common dir, `refs/keel`, the proposal branch, a trunk commit or the
  archive commit); `locks[]` name who holds each one, who waits for it and which step releases it. Every
  entry is anchored to the heading that states it. The `issues` check walks the map: a cycle, or an
  artifact required by a step whose machine cannot reach where it lives (a clone reaches trunk and archive
  commits only; a seat reaches its worktree and the proposal branch only), is an error unless the entry is
  tagged with an open issue; a tag on a closed or dismissed issue is an error, so a closed issue cannot
  keep tolerating its edge.
- `matrix`: the walkthrough matrix, track × actor × sequence. The actors are standing: the Board at a
  terminal, the Board while a wave is in flight, the supervising Steward, a second Steward process while
  the supervisor lock is held, a seat, a runtime hook, a fresh CI clone, a crashed supervisor, a second
  machine and the dashboard. The sequences are the happy chain of each track and the interrupts: hold,
  abandon, override, amendment, crash and resume, a second land, a CI check at the trunk tip.
- `walkthroughs[]`: the append-only history of walks, oldest first, each naming its trigger, the cells
  walked and the issues it filed or re-walked.

Filling the order map and walking every cell of the matrix once is the first run of this procedure, the
baseline walk; the M0 exit criteria in [15-roadmap.md](15-roadmap.md) require it. While `exit_review` is
set, the `issues` check fails on every issue that blocks that milestone or an earlier one and is not closed,
deferred or dismissed, and on every open issue that has no class yet.

### 5.3 Procedure

1. **File.** One register entry per finding, status `open`: the title, the statement, the anchors, who
   found it and the root-cause guess. A compound finding is split, so a cycle and an unreachable place are
   two entries. The text that section 3 ranks lower is left exactly as it is: nothing is reworded to make
   a finding disappear, and no document gains a note about it.
2. **Classify.** Exactly one class, by the precedence of section 5.2. An entry with an anchor in section 1
   or 2 of this document, or in a KP, is `mandate-conflict` by construction, never by judgment. `blocks`
   is the earliest milestone whose scope builds a producer or a consumer of the rule, or at which the
   owner confirms an adopted-by-recommendation row that the fix would change; never merely the milestone
   that first exercises the rule.
3. **Walk.** For every rule the entry names, and in the light mode for every rule the commit changes, four
   facts are written into the register, never only into a commit message:
   - producers: for each precondition the rule states, the step that produces it, whether that step comes
     before or after the consumer in the sequence, and whether what it produces is sufficient for the
     property the rule leans on (complete against depth-bounded, proven against heuristic or advisory,
     fresh against cached); a producer that comes later or is insufficient is a `cycle` or a `gap`;
   - consumers: derived from the canonical tables (the verb-and-mode table of
     [12-cli-api-mcp.md](12-cli-api-mcp.md), the gate catalogue of [11-verification.md](11-verification.md),
     the documents that link to the rule's home), never from a text search alone; for a rule about a lock,
     a wait or a refusal, one row per verb mode with what it waits for and what releases it, plus the fixed
     row "the holder crashes or never releases"; a row whose release is the very outcome the mode exists to
     cause is a deadlock;
   - places and actors: where each artifact lives and which actor on which machine runs each consumer;
     "after X, Y", "X is committed in Y" and "X is checked from Y" are order edges as much as "before" and
     "requires" are; a place the actor cannot reach is a `cycle`;
   - readers and tallies: every required field, enum value and formula-defined measure lists at least one
     reader (a verb, gate, record, view or measure); none is a `gap`; two names for one formula, or a name
     that claims more than its formula, is a `term-collision`; for a rule about Board checkpoints or work
     orders, the confirmations and work orders are counted per track, route (per-change contract or policy
     path) and topology (shared or solo trunk) and compared with every cardinality sentence and with the
     confirmations measure of [15-roadmap.md](15-roadmap.md).
   The steps, artifacts and locks the walk names go into the order map, and the `issues` check runs. A
   commit whose walk turns an edge red does not land unless the same commit files the issue.
4. **Audit terms.** For every noun the rule leans on (the subject of "proves", "guarantees" or "ensures";
   the condition after "only when" or "once"), the home definition is quoted beside the claim, with what
   the claim demands and what the definition provides. A bounded definition under an unbounded claim is a
   `term-collision` or a `gap`. One term, one meaning, one glossary row, one home: the second meaning gets
   its own English identifier and its own row in the glossary of [00-vision.md](00-vision.md), and an
   issue is never closed by a rename while any kept use demands more than the definition provides.
5. **Route.** The owner decides when the class is `mandate-conflict`, when a fix would flip a decision in
   the "Resolved by the owner" table of [17-open-decisions.md](17-open-decisions.md), when it would change
   what a field of a Board-approved artifact (the charter, the goals or the routing) means, or when it
   would change an adopted-by-recommendation row. Everything else is decided by the maintainers by
   adopting the recorded recommendation, with a superseding ADR when a recorded decision flips. The light
   mode is not available when a consumer of the changed rule is a clause of section 1 or a row of
   section 2: the change does not land, the issue is filed and routed first, and a lower sentence that
   adds a qualifier the clause lacks ("only", "in memory", "never persists") is evidence of the conflict,
   never a verdict that the clause holds.
6. **Prompt the owner.** One message in the form of section 5.4, then stop for every owner-routed issue.
   Mandate conflicts are listed first and on their own when present, and nothing downstream of one is
   edited until it is answered.
7. **Correct.** In order: by class, then by the earliest `blocks`; a lower class on a mechanism that still
   has a higher-class issue open waits. One commit per issue, or per group of issues that share a rule:
   the home document and its mirror, every consumer on the walk marked changed or unchanged with a reason,
   the glossary rows, the schemas, templates, examples and type-only code that implement it, the ADR, the
   entry in [17-open-decisions.md](17-open-decisions.md), and [15-roadmap.md](15-roadmap.md) when a scope
   or an exit criterion changes; sections 1 and 2 only from the owner's own words. A cycle is red before
   green: it is reproduced in the order map, tagged with its issue, before it is removed. Every sentence
   that introduces a wait names what releases it; every sentence that introduces a precondition names what
   produces it and where it lives.
8. **Close.** Status `closed` with the evidence: the validate checks that prove the closure in M0 and, from
   M1a, the negative control in `test/` that fails when the defect returns (required for a `cycle`); the
   cells walked become the entry's regression cells. An issue closes only in the commit that changes every
   consumer on its walk.
9. **Record.** The walk is appended to `walkthroughs[]` and `npm run check` runs. Every later iteration
   and every milestone exit walks the regression cells first; a regression reopens the issue rather than
   filing a new one.

Issues are worked in class order: `mandate-conflict` first, because the answer may change every lower fix;
then `cycle`, because the design cannot run as written; then `term-collision`, because a collision hides
other defects; then `gap`; then `cost`. A `cycle` is never deferred by a maintainer, and a
`mandate-conflict` is never fixed by one.

### 5.4 What the owner is asked

One message per iteration with one table: the issue id and class, the statements that cannot both hold,
each quoted with its home document and heading, the options, the recommendation and what the issue blocks.
The owner answers per issue: an option, deferral to a named milestone, the clause restated in the owner's
own words (section 1 is then rewritten in place from those words, under section 3), or dismissal with a
reason. When a mandate conflict is present it is listed first and on its own.

### 5.5 Guardrails

- An iteration never changes the statement in section 1 on its own. A conflict with the statement is
  answered only by the owner, a lower document is never reworded to make the conflict disappear, and a
  mandate consumer is never judged by the author of the change.
- Documents state the current design: no home document names an issue, a fix or what it replaced. The
  register holds the state and git holds the diff.
- One term, one meaning, one glossary row, one home; the fixed vocabulary of the blueprint is never renamed
  silently.
- Anchors are headings and pointers, never line numbers; an anchor that stops resolving fails the check and
  is repaired, not deleted.
- `scripts/validate.mjs` stays the single tooling exception and free of product logic: the `issues` check
  proves presence, single-home, acyclicity and reachability, never behaviour; behaviour is proven by
  negative controls from M1a.
- An iteration is not a refresh review: it pulls no reference and adopts no idea. When a defect shows that
  a reference does something better, the candidate goes into the scouting record of section 4.
- P1 and D2 hold: no provider value is read to reproduce an issue, and the D2 term list is not extended.
- The light mode never skips the walk, and the walk is a register entry, never a commit-message note.

