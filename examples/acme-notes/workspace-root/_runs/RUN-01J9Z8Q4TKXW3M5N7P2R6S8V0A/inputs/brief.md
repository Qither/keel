<!-- Example rendering of templates/prompts/brief.md.tmpl for P-7F3K9Q.T2 (engineer, claude-code, outbox channel). The BR id and the section hashes are illustrative until the M1a golden test fixes the normalization; the byte count is that of the body below. -->
# keel brief BR-9e4c1a7b2d05

<!-- keel:brief:header -->
- Seat: engineer
- Subject: P-7F3K9Q.T2
- Runtime: claude-code; submit channel: outbox
- Track: feature; tier: standard
- Charter version: 1.0.0
- Contract hash: `e90e8774ddb2fd72a1ba81b6149dd88cf5a721460a1ab3b0afd09be0cde09bea`
- Freshness: computed 2026-09-22T09:00:04Z at head `2bdb45a16a391385f43f15d156b93184934a4a58`
- Index commit: `2bdb45a16a391385f43f15d156b93184934a4a58`
- Body: 8037 of 24576 bytes
- Section input hashes:
  - why-chain (context): `3ce17207aa02136be923ec4b9a321463e9abb3ab2b1df3c01caecb0a98a18c63`
  - requirements (contract): `47340ae614011c7f0ddfc265cc50728358a9f78b0d76bdda0a1db767686698ed`
  - frozen-intent (contract): `6e0d661ccc68eb696a585d263883a9fab56094d05092713eea35aa4f837a756a`
  - work-order (contract): `8b18a6b2bfc0428e42913eda214d4f18dc4ddfe8058ddd8e4a8989033ab673db`
  - obligations (contract): `f23472f782deda04ca68bd97b2a754eb3cb9a55ee6f2113a08e5d6b234021a44`
  - element-brief (context): `0ce8a0014f1182b6821e31cb65e219caf21359168bc58b03ab7ccb548bf3c535`
  - impact (context): `91d2a12a871f8fc813aeefcdfcd425555ae571c1e13b75aeb74ec0d076d4a59e`
  - write-set (contract): `06df1031cc8469dca3c8c01cb8f82bf6938a690ecc66e782bcb74216443eed01`
  - gates (context): `271e90f4d43d5af0f2bd56b0baee256f0f9518015d01924d319ccc0a952ab3e8`
  - precedence (context): `4cb092acf137c4aa535c4940f47bba54f7bb951924fe12b249007577ab0aa5ef`
  - decision-boundaries (context): `eb2f3ee9d9474c3fce3e1447b0ccfc50c4d8d10674a5714bd3a4b48104a119df`
  - stop-classes (context): `9623973e196da83afa703af3f6893d275d5b55c0e1e289aade6fe4b062a8db04`
  - submit (context): `1954bec360bc1025f155c40080ee9c2d6f95f8583e284cf0088b5bac25bde8d8`
  - output-contract (contract): `967da0e6f5affe4e1427a1860d00563ee663f168eaf5f3f28675e0ef35179528`

<!-- keel:brief:body:start -->
## Why this work exists

Charter: Acme Notes keeps each user's notes private, quick to find and easy to organize.

Goal G-03: Users can organize notes with tags.
- Success signal: Tags are stored once per note regardless of how they were typed, and at least 30% of active users tag a note within 30 days of the release.
- Non-goal: Shared or team-wide tag vocabularies.
- Non-goal: Tag hierarchies.

## Requirements (verbatim)

- R-notes-4QX7B (rev `670b9888c1aaa5efb5f48341e1308305590bbaefce18794e1b862b9e6d4fe54d`): When a user adds a tag to a note, the notes service shall store the tag trimmed, NFC-normalized and lowercased, at most once per note.
  - S1: Given a note without tags; when the user adds the tag " Work "; then the note lists exactly one tag, "work".
  - S2: Given a note tagged "work"; when the user adds the tag "WORK"; then the note still lists exactly one tag, "work".

## Frozen intent (verbatim)

~~~~text
## Problem

Users cannot group related notes. R-notes-4QX7B only says that a user can label a note, nothing realizes
it, and a label typed as "Work", "work " and "WORK" would become three different labels.

## Outcome and signal

A user can add tags to a note. Each tag is stored once per note, trimmed, NFC-normalized and lowercased,
and notes saved before this change still load.

Signal: both scenarios of R-notes-4QX7B pass in the runner's acceptance matrix at land.

## Non-goals

- Showing or editing tags in the HTTP API or the web UI (a later proposal under G-03).
- Renaming, merging or deleting tags.
- Shared tag vocabularies across users.

## Decision boundaries

### May decide

- Names and layout of internal helpers inside `src/store/`.
- How the normalization is implemented, within ADR-7KQ2B.O1.

### Must ask

- Any limit on the number or the length of tags.
- Any change to the stored note record beyond the optional `tags` array.

## Acceptance

| ACC | Statement | Covers | Evidence |
| --- | --- | --- | --- |
| ACC-01 | Adding a tag stores it trimmed, NFC-normalized and lowercased. | R-notes-4QX7B#S1 | test |
| ACC-02 | Adding a tag the note already has, in any letter case, leaves exactly one copy. | R-notes-4QX7B#S2 | test |

## Always

- Keep notes saved before this change loadable: a note without a `tags` array loads with no tags.

## Never

- Never write tag values to logs or telemetry.

## Scope

### Allowed

- `src/store/**`
- `tests/notes/**`

### Protected

- `migrations/**`
- `src/web/**`

## Open questions

None.

## Failure model

Not required on this track.
~~~~

## Work order P-7F3K9Q.T2: Normalize and store note tags

- Kind: build
- Covers: P-7F3K9Q#ACC-01, P-7F3K9Q#ACC-02, R-notes-4QX7B#S1, R-notes-4QX7B#S2
- After: P-7F3K9Q.T1
- Consumes tag acceptance tests from P-7F3K9Q.T1
- Produces TagStore.addTag: addTag(noteId: string, tag: string): Promise<string[]> resolves to the note's tags after the add.

Acceptance (ACC -> command). The Steward's runner executes these commands; your own runs produce no
evidence.

| ACC | Evidence mode | Commands | Rows that must pass |
| --- | --- | --- | --- |
| P-7F3K9Q#ACC-01 | test | `npm test` | R-notes-4QX7B#S1 |
| P-7F3K9Q#ACC-02 | test | `npm test` | R-notes-4QX7B#S2 |

Global constraints (verbatim):
- Keep notes saved before this change loadable: a note without a `tags` array loads with no tags.
- Never write tag values to logs or telemetry.
- ADR-7KQ2B.O1 (must): Normalize every tag (trim, then NFC, then lowercase) before it is stored or compared.

Review focus:
- Normalization order: trim, then NFC, then a locale-independent lowercase.
- Notes saved before this change, without a tags array, still load.
- No tag value reaches a log call.

Task notes: tests/notes/tags.test.ts is frozen. If a frozen test looks wrong, ask with the clause P-7F3K9Q#ACC-01 or P-7F3K9Q#ACC-02 instead of editing it.

## Obligations in scope

- ADR-7KQ2B.O1 (must): Normalize every tag (trim, then NFC, then lowercase) before it is stored or compared. Applies to: `src/store/**`. Check: `node scripts/check-tag-normalization.mjs`.

## Element brief

el:notes.store "Note storage" (container in el:notes; owner storage; tags layer:store, stakes:high).
Stores note records, including their tags, as JSON documents. Paths: `src/store/**`.

- Used by: el:notes.core (declared relation `uses`). el:notes.web must not reach it (AR-3M8QD, error).
- Layers: web, core, store; dependencies point down only (AR-5T1WN, error).
- Decisions: ADR-7KQ2B "Tag storage and access path" (accepted): tags live inside the note record as an
  optional `tags` array; only `TagStore` in `src/store/tags.ts` reads or writes it, and only
  el:notes.core calls `TagStore`.
- Key symbols at head: `NoteStore.save` and `NoteStore.load` in `src/store/notes.ts`; `src/store/tags.ts`
  does not exist yet.

## Impact

Predicted impact IM-5e0b7c9d1f23 (codegraph index at the head above): el:notes.store is written;
el:notes.core is reached through its calls to `NoteStore`. One declared boundary is crossed (el:notes.core
to el:notes.store). No public-api element and no protected path is touched.

## Write set and forbidden paths

- May write: `src/store/**`
- May change symbol: `src/store/tags.ts#TagStore.addTag`
- May change symbol: `src/store/tags.ts#normalizeTag`
- May change symbol: `src/store/notes.ts#NoteStore.load`
- Frozen test (do not touch): `tests/notes/tags.test.ts`
- Forbidden: `.keel/**`
- Forbidden: `migrations/**`
- Forbidden: `src/web/**`

## Gates your output must pass

- submit: brief, ack, result, freshness, scope, frozen-paths, fake-completion, ratchet, reserved-op, provider-path-events, subagent-events, obligations-cheap, commands
- verify: evidence, commands, obligations, arch, review (quick lens set: blind-diff and verification-gap, on a declared family different from yours)

## Precedence

Board ruling > invariant (INV) > accepted ADR obligation > frozen intent (ACC, non-goals, scope) >
requirement > plan > task notes > model preference.

## Decision boundaries

May decide (record a ruling for each decision):
- Names and layout of internal helpers inside `src/store/`.
- How the normalization is implemented, within ADR-7KQ2B.O1.
- Names and layout of internal helpers inside a task's write set.
- Wording of test descriptions and fixture data.

Must ask:
- Any limit on the number or the length of tags.
- Any change to the stored note record beyond the optional `tags` array.
- Any new runtime dependency.
- Any change to data a user can see or export.

Asks route by clause: requirements and scenarios to product; architecture and obligations to the
architect; plan steps and interfaces to the planner; ACC, scope, non-goals, INV and goals to the Board.

## Stop classes

These always become an ask to the Board and are never settled by a ruling:
- irreversible_or_destructive: an operation that cannot be undone or destroys data
- security_sensitive: credentials, permissions, secrets, authentication or trust
- side_effect_outside_workspace: any effect outside your worktree and run directory
- every_path_a_guess: every way forward rests on a guess

## How to ACK, ask, rule and submit

Write to the run outbox through keel api, one JSON payload each: `keel api ack --input - --json`,
`keel api ask --input - --json`, `keel api rule --input - --json`, `keel api submit --input - --json`.
`keel api context --input - --json` returns any brief section again.

## Output contract

ACK first, before any edit. Your ACK id set must equal exactly:
- P-7F3K9Q#ACC-01
- P-7F3K9Q#ACC-02
- R-notes-4QX7B
- ADR-7KQ2B.O1

The ACK (schema `schemas/ack.schema.json`) also carries this brief's id as `brief_hash`, the subject, the
seat, the objective in your own words, the non-goals, a write set that is a subset of the one above,
your planned steps, your assumptions and your questions. A mismatch returns guidance once; a second
mismatch blocks the subject.

Then submit one result in the shape of `schemas/result.schema.json`, echoing this brief's id. Every field is
required; use null for an absent value.
<!-- keel:brief:body:end -->
