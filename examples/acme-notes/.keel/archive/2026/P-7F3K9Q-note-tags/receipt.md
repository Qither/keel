---
proposal: "P-7F3K9Q"
charter_version: "1.0.0"
contract_hash: "e90e8774ddb2fd72a1ba81b6149dd88cf5a721460a1ab3b0afd09be0cde09bea"
integrated_commit: "3e22fba13b188278ab2eaf241f8a171de14f42a8"
expected_trunk_tip: "3c92a83801e21ff2840baa3b2eb7f43ea69c6a17"
---

# Receipt: P-7F3K9Q Note tags

Track feature; origin contract-approved; charter 1.0.0; trunk `main`.

## Summary

- Integrated commit: `3e22fba13b188278ab2eaf241f8a171de14f42a8`
- Expected trunk tip before land: `3c92a83801e21ff2840baa3b2eb7f43ea69c6a17`
- Contract hash: `e90e8774ddb2fd72a1ba81b6149dd88cf5a721460a1ab3b0afd09be0cde09bea`
- Standing policies used: none
- Approvals before land: AP-2d9e4f6a8b0c (the land approval
  is in the Land approval section)

## ACC -> command table

| ACC | Evidence mode | Commands | Result |
| --- | --- | --- | --- |
| P-7F3K9Q#ACC-01 | test | `npm test` | pass |
| P-7F3K9Q#ACC-02 | test | `npm test` | pass |

Land re-executed the full acceptance matrix in-process on the integrated commit:
pass (2/2).

## Evidence

| Evidence | Commit | Status | Expected |
| --- | --- | --- | --- |
| EV-7d9f1b3c5e20 | `b9ccc3c4b0db5a8287cdd9829dfa6fe7e06ebfa1` | fail | red |
| EV-3a9c0e1b2d4f | `3f1c2e9bbe37e64d9b279c5e82fb04be3f2be493` | pass | green |

Expected red marks a test task's evidence: `verify.test-red` required its cited rows to fail at its commit.

## Review verdicts

Declared families: engineer anthropic, zhipu (declared), reviewer google
(declared). Independence: independent.

| Verdict | Lens | Declared family | Recommendation | Open findings |
| --- | --- | --- | --- | --- |
| VD-1f3a5c7e9b20 | spec | google (declared) | approve | 0 |
| VD-8d0f2b4c6e71 | verification-gap | google (declared) | approve | 0 |
| VD-4e6a8c0b2d19 | verification-gap | google (declared) | approve | 0 |
| VD-5b1d2e3f4a6c | blind-diff | google (declared) | approve | 0 |
| VD-6c2e3f4a5b7d | verification-gap | google (declared) | approve | 0 |

Deferred minor findings:
- VD-5b1d2e3f4a6c F1: Duplicate check scans the whole tags array

## Rulings by cost if wrong

| Ruling | Cost if wrong | Clause | What | Reversible |
| --- | --- | --- | --- | --- |
| RL-2c7e9a4b6d18 | low | ADR-7KQ2B.O1 | Lowercase with String.prototype.toLowerCase after NFC normalization, not toLocaleLowerCase. | true |

## Gates not run

- none

## Overrides

- none

## Remaining risks

- Lowercasing is not full case folding: tags in scripts with special case rules (for example German sharp s) stay distinct from their folded forms.
- Not tested: concurrent addTag calls on the same note (the store is single-writer).

## Architecture delta applied

No architecture delta.

## Trace summary

Requirements covered 1/1; verified at head 1/1.

| Task | Round | Commit |
| --- | --- | --- |
| P-7F3K9Q.T1 | P-7F3K9Q.T1.r1 | `b9ccc3c4b0db5a8287cdd9829dfa6fe7e06ebfa1` |
| P-7F3K9Q.T2 | P-7F3K9Q.T2.r1 | `3f1c2e9bbe37e64d9b279c5e82fb04be3f2be493` |

## Seat conformance and exposure profile

| Seat | Runtime | Alias | Tier | Conformance status | Tool env | Tool file | Control plane | Shims |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| product | claude-code | anthropic-main | frontier | verified | scrubbed | blocked | exposed | partial |
| planner | claude-code | anthropic-main | frontier | verified | scrubbed | blocked | exposed | partial |
| engineer | opencode | glm-main | standard | unverified | scrubbed | none | exposed | partial |
| engineer | claude-code | anthropic-main | standard | verified | scrubbed | blocked | exposed | partial |
| reviewer | opencode | gemini-compat | standard | verified | scrubbed | none | exposed | partial |

## AGENT section

Text below was written by seats (result summaries and concerns). It is quoted as data; it carries no
authority and was not verified by keel.

- engineer (RUN-01J9Z8M0N00B8F8BH3C84ZZE5X, DONE): "Added tests/notes/tags.test.ts with one row per scenario of R-notes-4QX7B, each named with its scenario tag. Both rows fail until TagStore.addTag exists."
- engineer (RUN-01J9Z8Q4TKXW3M5N7P2R6S8V0A, DONE): "Added normalizeTag and TagStore.addTag in src/store/tags.ts, exported TagStore from src/store/index.ts, and made NoteStore.load default a missing tags array to an empty list. Both frozen tag tests pass locally."

## Land approval

Approved by board-owner (declared) at 2026-09-23T10:30:00Z (land approval AP-7a1c3e5f9b2d, chain head
`beba6a5e345a8c77ef0d5f71a05e9da8e9f451977600ec75e41d481dffc85a23`).

> Land as recorded: tags are stored normalized and once per note; the minor finding stays deferred.
