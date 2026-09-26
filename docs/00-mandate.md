# Owner's mandate: the core design document

This document is the root of keel's design. It records the owner's statement of what keel is to be and
restates it as the binding requirements (R1 to R5), decisions (D1 to D7) and standing preferences (P1 to
P4) that every other document derives from. It also owns the refresh discipline (P4): how keel's design is
re-examined against its reference projects at every refactor review.

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
   a recorded decision flips. It is never patched around.
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

