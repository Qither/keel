---
proposal: "{{proposal_id}}"
charter_version: "{{charter_version}}"
---

<!--
answer.md: the result of a spike, written by the product seat in a read-only scratch worktree.
A spike lands nothing and has no checkpoints; the answer is recorded with the proposal and may seed a
new proposal. keel fills proposal_id, title, charter_version and question at `keel new`; replace every
other {{token}}. Cite evidence as file:line or as a command with its output digest.
-->

# Spike answer: {{title}}

## Question

{{question}}

## Short answer

{{short_answer}}

## Evidence

- `{{path}}:{{line}}`: {{what_it_shows}}

## Options considered

| Option | Cost | Risk | Notes |
| --- | --- | --- | --- |
| {{option}} | {{cost}} | {{risk}} | {{notes}} |

## Recommendation

{{recommendation}}

## Confidence and unknowns

Confidence: {{confidence}}

- Unknown: {{unknown}}

## Suggested next step

Suggested track for a follow-up proposal: {{suggested_track}}. {{next_step}}
