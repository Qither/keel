# Adoption record

[简体中文](ADOPTION.zh-CN.md) · **English canonical**

This file is the product's only conformance claim. A conformance claim names the governing version, scope, evidence and exceptions; an exception is not proof of compliance. Nothing outside the scope below is claimed.

## Keel Constitution v0.1.0, scope Stage A

| Item | Value |
| --- | --- |
| Governing text | Keel Constitution v0.1.0 (governance repository commit `dbac82c`, tag `v0.1.0`) |
| Decision | "adopt in the product", taken by the owner on 2026-10-09 in their own words (`按草稿採用`), recorded in the research workspace's topic SA-01 §4 |
| Design adopted | the Stage A derived design (sha256 `3a3f96d8475a467035a6bd0cba670387b4c0dda398ed6724ae15380da08820b8`), owner decision "adopt the design" of 2026-10-09 (`採用`); restated in [DESIGN.md](DESIGN.md) |
| Product version | commit `0c1c70e` and its descendants on `main` until this record changes |
| Evidence | 16 cohort cases and 16 fault-injected twins (`npm test`), the demo transcript (`npm run demo`), CI run 37811239709 on ubuntu-latest and windows-latest; the trial record is held in the research workspace |
| Independent review | the owner in person, 2026-10-09, no objections |

### Scope by article

| Article | In scope | Exception |
| --- | --- | --- |
| HC-01 State continuity | WorkItem documents, Checkpoint, derived handoff states, SessionRef reported and never consulted | — |
| HC-02 Replaceable execution resources | cost stays `unknown` unless observed; no credential in product state | s1 (substitution) deferred to Stage B |
| HC-03 Autonomy within authorization | Grant, grant check before and after every step, DecisionRequest, no second approval inside the grant | — |
| HC-04 Single authoritative source | AuthorityMap, content-hashed documents, hash-linked log, `log check` refusing writes, projections never read back | — |
| HC-05 Evidence bounds completion | versioned Acceptance, Evidence with raw status before summaries, `verify` and `accept` | — |
| HC-06 Recoverable execution | IntentRecord before effects, `stop`, `recover` by reconciliation, generations, superseded results kept as evidence only | fencing of a still-running stale worker deferred to Stage C |
| HC-07 Traceable context | ContextPack with kinds, sources, freshness and limits; inferences never widen a grant | code and architecture context deferred to Stage C |
| HC-08 Controlled evolution | no verb changes a rule; the design changes only through owner decisions recorded in version history | — |

### Migration, rollback, rights

- Migration: none; the product started from an empty tree.
- Rollback: revert `main` to `f522130` (the empty tree) or to any earlier commit; this file is removed with it.
- Who may merge or tag: the owner. The author agent may commit to `main` at the owner's instruction and never creates tags.
- Release: not decided; the repository stays private and the licence is chosen at the first public release.

Later stages extend this record only through a new owner decision; until then their mechanisms, even when present in the code, are candidates under validation and are not claimed.
