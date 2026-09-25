---
id: ADR-7KQ2B
title: "Tag storage and access path"
status: accepted
# Accepted directly with `keel approve --doc` (approval AP-6b8d0f2e4a7c in the ledger sample) before any
# tag work started, so no proposal introduced it. P-7F3K9Q implements tags under it: obligation
# ADR-7KQ2B.O1 applies to its build task's write set and joins that task's ACK id set.
proposal: null
charter_version: "1.0.0"
governs:
  - el:notes.store
  - el:notes.web
  - R-notes-4QX7B
supersedes: []
superseded_by: null
date: "2026-09-10"
---

# ADR-7KQ2B: Tag storage and access path

## Context

Notes are stored as one JSON document per note by `el:notes.store`. The product plans tags (goal G-03).
Tags typed by people vary in letter case, surrounding spaces and Unicode form, and the web layer has
reached into storage directly in the past, which bypassed the validation in `el:notes.core`.

## Decision

Tags live inside the note record as an optional `tags` array of normalized strings, unique per note, in
the order they were added. Only `TagStore` in `src/store/tags.ts` reads or writes that array, and only
`el:notes.core` calls `TagStore`. A note record without a `tags` array is a note without tags.

## Obligations

Each obligation is delivered to every task whose write set intersects `Applies to`. `must` and `must_not`
ids join that task's ACK id set; checks run in the verify gate, and cheap ones also at submit.

| Id | Level | Text | Applies to | Check |
| --- | --- | --- | --- | --- |
| ADR-7KQ2B.O1 | must | Normalize every tag (trim, then NFC, then lowercase) before it is stored or compared. | `src/store/**` | `node scripts/check-tag-normalization.mjs` |
| ADR-7KQ2B.O2 | must_not | Read or write the tags array or `TagStore` from the web layer; go through `el:notes.core`. | `src/web/**` | none |

## Rejected options

Each rejected option compiles into a `must_not` obligation for the same scope.

- A separate tags table: it needs a migration and a join on every note read, for no query we need yet.
- Storing tags as typed: "Work", "work " and "WORK" would become three tags.

## Consequences

Tag reads cost nothing extra because they come with the note. Renaming a tag across all notes needs a scan,
which is acceptable until tag management becomes a goal. The architecture rule AR-3M8QD, in force since
adoption, already forbids el:notes.web from reaching el:notes.store; ADR-7KQ2B.O2 states the same boundary
for tags so that it reaches every brief whose write set touches `src/web/**`.

## Citations

- `src/store/notes.ts:31` (tree-sitter): `NoteStore.save` writes the whole note record as one JSON document.
- `src/core/notes.ts:12` (tree-sitter): `NoteService` is the only caller of `NoteStore` today.
