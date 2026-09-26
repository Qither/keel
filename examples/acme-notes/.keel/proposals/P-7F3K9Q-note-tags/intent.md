---
proposal: "P-7F3K9Q"
title: "Note tags"
charter_version: "1.0.0"
---

<!--
examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/intent.md (schemas/intent.schema.json), written by
the product seat and approved by the Board at confirmation 1 (`keel approve P-7F3K9Q --stage contract`, approval
AP-2d9e4f6a8b0c; the record is shown in .keel/approvals/example.contract.json). The approval binds the
contract_hash, which covers the frozen block below, the spec.delta.yaml blob and the rev_hash of
R-notes-4QX7B; any byte change inside the markers voids it.
-->

# Intent: Note tags

<!-- keel:frozen:start -->

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

<!-- keel:frozen:end -->
