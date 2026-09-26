# Open decisions

This document tracks every design decision that was put to the owner, in three groups: decisions the owner
resolved, decisions adopted by recommendation, and decisions that are still open. An adopted decision is
reversible: changing it means rewriting its ADR or its home document, and this list; the history of the
change is the git history of those files. An open decision lists its options, the recommendation, and what it blocks.

keel's own design ADRs (`docs/adr/ADR-0001` … `ADR-0009`) are a separate sequence from the `ADR-<5>` ids
that keel mints for target projects.

## Resolved by the owner

The owner's statement is recorded in [00-mandate.md](00-mandate.md), which outranks this document and every
other file.

| Decision | Resolution | Recorded in |
| --- | --- | --- |
| Licence | MIT, "Copyright (c) 2026 Qither" (D7). Apache-2.0 was the alternative if a patent grant mattered. | `LICENSE`, [16-sources-credits.md](16-sources-credits.md) |
| Documentation language and Chinese script | Bilingual (D5): English canonical in `<name>.md`, Simplified Chinese mirror in `<name>.zh-CN.md` with an identical heading structure. Identifiers, file names, schemas, YAML, templates, skills and prompts are English only. | The i18n check in `scripts/validate.mjs` |
| Human approval mechanism | Explicit confirmation of a shown change, recorded with the subject, the artifact hashes, the declared approver and the local time; any change to approved content invalidates it; seat output cannot approve; no SSH, keys, signer lists, agent checks, hardware or identity system (D6). SSH and GPG signatures and an optional signature mode were declined. | [ADR-0005](adr/ADR-0005-explicit-confirmation-approvals.md), [02-alignment.md](02-alignment.md), [14-trust-security.md](14-trust-security.md) |
| Version control strategy | git is primary and fully sufficient; jj is an optional enhancement behind the Vcs interface (D4). | [ADR-0001](adr/ADR-0001-git-primary-jj-optional.md) |
| Provenance | keel is a fresh, independent design (D2). The forbidden names are the D2 term list in `scripts/validate.mjs`. | [16-sources-credits.md](16-sources-credits.md) |
| Stack | TypeScript on Node ≥ 22.13, native Windows, with no tmux, WSL, Docker, bash or python in the core design (D3). | [ADR-0002](adr/ADR-0002-node-windows-native.md) |
| Frontend stack | TanStack on React, headless over native markup, pre-rendered and bundled (P2). Native HTML with vanilla JavaScript and no library was declined. | [ADR-0009](adr/ADR-0009-tanstack-frontend.md), [08-dashboard.md](08-dashboard.md) |
| Reference set and model list | rtk joins the reference list, Kiro is public documentation only (R1); OpenCode joins the model list (R3); git primary, jj an optional enhancement (R4). | [00-mandate.md](00-mandate.md), [16-sources-credits.md](16-sources-credits.md) |
| Refresh discipline | P4: the procedure in 00-mandate.md section 4, the registry `docs/reference-projects.yaml`, a refresh review at every milestone exit. | [00-mandate.md](00-mandate.md), [15-roadmap.md](15-roadmap.md) |
| Core design document | The owner's statement is recorded verbatim with the ids R1–R5, D1–D7, P1–P4 and outranks every other file. | [00-mandate.md](00-mandate.md) |

The M0 scope rule (D1: design documents and skeleton only, `scripts/validate.mjs` as the single tooling
exception) and the standing preferences P1–P4 are stated in [00-mandate.md](00-mandate.md) and mapped in
[00-vision.md](00-vision.md).

## Adopted by recommendation (reversible, with ADR)

These follow from the blueprint's recommendations. The owner's confirmation of this list is part of the M0
exit criteria ([15-roadmap.md](15-roadmap.md)).

| # | Decision | Adopted option | Options not taken | Recorded in |
| --- | --- | --- | --- | --- |
| 1 | When plan approval is required on the feature track | Only when wave width is above 1 or routing deviates from the approved routing; always on the system track. A single-builder feature keeps two Board touches. | Only on system; always on feature | [01-org-model.md](01-org-model.md), [03-lifecycle.md](03-lifecycle.md) |
| 2 | Standing quick-patch policy predicates | At most 5 files and about 100 LOC; one element or unmapped paths; no protected globs, INV or obligations touched; a Board-approved request; red/green proof; the `policy` lens set. Revocable, listed in receipts, followed by a receipt acknowledgement. | Stricter (at most 2 files); no standing policies | [03-lifecycle.md](03-lifecycle.md), `templates/project/policies/quick-patch.yaml` |
| 3 | Patch-track land approval | Land approval on shared trunks; an approved land policy plus a receipt acknowledgement on solo repositories. | Always; never | [03-lifecycle.md](03-lifecycle.md) |
| 4 | Seat-to-control-plane channel | Per-mode submit channels: structured final message, MCP `keel_submit`, outbox. | A loopback endpoint | [ADR-0004](adr/ADR-0004-steward-commits-and-submit-channels.md) |
| 5 | Who commits seat work | The Steward. | Seats commit through a hook | [ADR-0004](adr/ADR-0004-steward-commits-and-submit-channels.md) |
| 6 | Kimi Code seat qualification | Rung D until an agent-file tools allowlist, static deny rules or the ACP driver is verified by probe, because `-p` is bypass-equivalent. | Allow `-p` builders | [09-runtimes.md](09-runtimes.md), `runtimes/kimi-code.yaml` |
| 7 | Default index backend | codegraph under the stated constraints, plus SCIP import. An index is never mandatory for gates other than the architecture check. | SCIP only; a built-in tree-sitter indexer | [ADR-0007](adr/ADR-0007-declared-vs-derived-architecture.md) |
| 8 | Recording concrete model names | Off by default: records hold alias, tier, declared family and revision. The optional in-memory same/different check persists nothing. | Also record runtime-reported model names | [ADR-0006](adr/ADR-0006-provider-values-by-reference.md) |
| 9 | Distribution on Windows | npm package first; evaluate a Node single executable application after M6. | Node SEA only; both | [ADR-0002](adr/ADR-0002-node-windows-native.md) |
| 10 | Location of the local control plane | `$(git rev-parse --git-common-dir)/keel`, hash-chained, with exposure reported honestly. | Committed state in the working tree; a database as the truth store | [ADR-0003](adr/ADR-0003-control-plane-in-git-common-dir.md) |
| 11 | Dashboard write capability | Read-only; Board actions appear only as copyable `keel approve …` commands. | Approval buttons in the dashboard | [ADR-0008](adr/ADR-0008-read-only-dashboard.md) |
| 12 | TanStack UI adapter | React (the most complete adapter coverage across Router, Query, Table and Virtual). | Solid, Vue or Svelte adapters | [ADR-0009](adr/ADR-0009-tanstack-frontend.md) |
| 13 | Dashboard rendering and packaging | Pre-render to static HTML at build and hydrate in the browser; libraries bundled at package build, never runtime dependencies. | A client-only single-page application; a runtime dependency on React | [ADR-0009](adr/ADR-0009-tanstack-frontend.md) |

## Truly open

### Package and CLI name

keel shares its name with dcsg/keel, an unrelated ELv2-licensed project (credited as keel-other in
[16-sources-credits.md](16-sources-credits.md)).

- Options: `@qither/keel` with the command `keel` and skills named `keel-*`; a rename; the command
  `keelctl`.
- Recommendation: `@qither/keel` with the command `keel`, plus a disambiguation note in the README.
  Revisit before the first publish.
- Current state: `package.json` uses `@qither/keel` as a working name, is `private`, and has no `bin`.
- Blocks: nothing in M0. The command name is needed when M1a adds `bin`, and the final name before the
  first publish.

### Code-executing seats without a scrubbed route

On native Windows a route may offer no env-only, scrubbed configuration with closed file exposure, so a seat
that runs shell or declared commands cannot be dispatched on it.

- Options: refuse with `blocked(runtime_unavailable)` and use tool-less or read-only seats on that route; an
  optional isolated seat OS account, a separate local user (verify by probe; M6); allow with a Board
  acknowledgement.
- Recommendation: refuse by default. Evaluate the isolated seat account in M6 as the way to reach
  `tool_file_exposure: blocked` and `control_plane_exposure: sandboxed`. The Board-acknowledgement option
  contradicts P1 and is listed only for completeness.
- Behaviour until decided: refuse ([10-providers.md](10-providers.md)). In M0 this refusal applies to every
  route: `scrubbed` needs the env-scrub capability probe, and none has passed yet.
- Blocks: the isolated-account item in M6.

### Codex wiring for custom endpoints

Codex speaks openai-responses only. Its custom-endpoint route through the built-in provider and
`OPENAI_BASE_URL` has not been shown to be honoured (verify by probe); a runtime profile holds `base_url` in
a file the seat could read.

- Options: an env-only built-in provider plus `OPENAI_BASE_URL`, after the probe; a runtime profile (the file
  holds `base_url`) for seats whose file exposure is blocked; the official endpoint through env only.
- Recommendation: env-only after the probe. Until then Codex serves custom endpoints only for seats with
  blocked file exposure, and the engineer role on custom endpoints falls to claude-code, qwen-code or
  opencode, each only once its env-scrub probe passes ([10-providers.md](10-providers.md) section 4). No
  probe has passed in M0, so no route qualifies for the engineer yet.
- Blocks: Codex as an engineer host on custom endpoints; the probe runs in M2.

### Multi-machine collaboration

The control plane lives in one clone's git common dir, and pushing is a reserved action.

- Options: v1 is single-machine, and other machines see committed approval records and archive projections; a
  ledger ref per machine; a shared server.
- Recommendation: single-machine for v1; revisit after M8.
- Blocks: nothing before M8. Server-side protections for a shared remote are recommended in
  [14-trust-security.md](14-trust-security.md).
