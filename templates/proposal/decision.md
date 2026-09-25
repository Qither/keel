---
id: "ADR-{{adr_id}}"
title: "{{decision_title}}"
# proposed | accepted | superseded | rejected. A proposal ADR is accepted through the contract approval
# (system track) or `keel approve --doc`, then promoted to .keel/decisions/ by the land archive commit.
status: proposed
# Date of the last status change.
date: "{{date}}"
proposal: "{{proposal_id}}"
charter_version: "{{charter_version}}"
# Elements (el:...) and requirements (R-...) this decision governs.
governs:
  - "el:{{element}}"
supersedes: []
superseded_by: null
---

<!--
.keel/proposals/<P>-<slug>/decisions/ADR-<5>-<slug>.md (schemas/decision.schema.json), written by the
architect seat (or the product seat). ADR-<5> uses 5 Crockford base32 characters; this is the project's
decision sequence, separate from keel's own design ADRs.
keel parses the sections below deterministically, with no LLM extraction: keep the headings, their order
and the table columns exactly as they are. Drift in a cited anchor or in the body voids acceptance.
-->

# ADR-{{adr_id}}: {{decision_title}}

## Context

{{context}}

## Decision

{{decision}}

## Obligations

Each obligation is delivered to every task whose write set intersects `Applies to`. `must` and `must_not`
ids join that task's ACK id set; checks run in the verify gate, and cheap ones also at submit.

| Id | Level | Text | Applies to | Check |
| --- | --- | --- | --- | --- |
| ADR-{{adr_id}}.O1 | must | {{obligation_text}} | `{{applies_to_glob}}` | `{{check_command}}` |

Level is `must`, `must_not` or `should`. Applies to holds one or more backticked globs separated by commas.
Check holds one backticked command, split on single spaces with no quoting (wrap complex commands in a
project script), or the word none.

## Rejected options

Each rejected option compiles into a `must_not` obligation for the same scope.

- {{rejected_option}}: {{why_rejected}}

## Consequences

{{consequences}}

## Citations

- `{{path}}:{{line}}` ({{provenance}}): {{what_it_shows}}
