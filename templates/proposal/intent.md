---
proposal: "{{proposal_id}}"
title: "{{title}}"
charter_version: "{{charter_version}}"
---

<!--
.keel/proposals/<P>-<slug>/intent.md (schemas/intent.schema.json), written by the product seat.
keel fills proposal_id, title and charter_version at `keel new`; replace every other {{token}} before
submitting. The goals this proposal serves are recorded in proposal.yaml, not repeated here.

Everything between the keel:frozen markers is the frozen block. contract_hash = sha256 of the normalized
frozen block + the spec.delta.yaml blob (+ the arch.delta.yaml blob on the system track) + the rev_hash of
every covered requirement. It is frozen at contract approval: after that, any byte change invalidates the
approval, and acceptance changes only through an amendment the Board re-signs.
Keep the headings, their order and the table columns exactly as they are; keel parses them
deterministically. The filling guide is at the end of this file, outside the frozen block.
-->

# Intent: {{title}}

<!-- keel:frozen:start -->

## Problem

{{problem}}

## Outcome and signal

{{outcome}}

Signal: {{outcome_signal}}

## Non-goals

- {{non_goal}}

## Decision boundaries

### May decide

- {{may_decide}}

### Must ask

- {{must_ask}}

## Acceptance

| ACC | Statement | Covers | Evidence |
| --- | --- | --- | --- |
| ACC-01 | {{acc_statement}} | {{requirement_or_scenario_refs}} | {{evidence_mode}} |

## Always

- {{always_rule}}

## Never

- {{never_rule}}

## Scope

### Allowed

- `{{allowed_glob}}`

### Protected

- `{{protected_glob}}`

## Open questions

None.

## Failure model

{{failure_model}}

<!-- keel:frozen:end -->

<!--
Filling guide (outside the frozen block, so not part of the contract):
- Acceptance: one table row per criterion, numbered from ACC-01. Covers holds R-<area>-<5> or
  R-<area>-<5>#S<n> ids separated by commas. Evidence is test, command, review, manual or unobservable;
  prefer test or command. unobservable needs a Board override with a reason and an expiry before land.
- Every requirement in spec.delta.yaml is covered by at least one ACC.
- Open questions must read "None." at submit; resolve each question with an ask first.
- Failure model: required on the system track (how the change can fail, how failure is detected, how it
  is contained and reversed). On other tracks write "Not required on this track."
- Stop classes (irreversible or destructive, security-sensitive, side effects outside the workspace,
  every path a guess) always go to the Board; never list them under "May decide".
-->
