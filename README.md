# keel

[简体中文](README.zh-CN.md) | [Documentation](docs/README.md) | Board owner? Start with
[docs/00a-owner-guide.md](docs/00a-owner-guide.md)

keel is a local-first TypeScript/Node CLI design for running a small, contract-bound company of AI coding
agents from different vendors on plain git. A human Board holds all authority. keel's core, called the
Steward, is deterministic and never calls a model. At most five LLM seats (product, architect, planner,
engineer, reviewer) produce typed artifacts, and nothing else.

For every landed line, keel is designed to answer:

- which goal and requirement it serves;
- which seat, runtime and declared model family produced it;
- from which byte-identical brief;
- proven by which evidence that keel re-executed itself;
- governed by which architecture element and rules;
- approved by which human, after viewing which content.

That answer has to hold on any of the supported runtimes (Claude Code, Codex, Gemini CLI, Qwen Code,
Kimi Code, opencode, plus GLM-family and Gemini-family models reached through a host runtime or keel's
direct lane), on plain git, and natively on Windows.

## Status: M0 design + skeleton

This repository is at milestone M0. It contains a design document set and a repository skeleton, and
nothing that runs as a product:

- design documents in `docs/`, with keel's own ADRs in `docs/adr/`;
- JSON Schemas for every artifact in `schemas/`;
- type-only TypeScript in `src/` (no values, no functions, no `bin`);
- seat contracts and canonical tables in `org/`, `config/` and `conformance/`;
- runtime descriptors with a verification status per fact in `runtimes/`;
- skills, templates and prompts in `skills/` and `templates/`;
- one golden example project in `examples/acme-notes/`, and test fixtures in `test/fixtures/`.

The single declared tooling exception is `scripts/validate.mjs`, which checks the skeleton itself. There
is no `keel` executable yet; the commands shown in the docs are the designed interface. The roadmap from
M1a to M8, with exit criteria, is in [docs/15-roadmap.md](docs/15-roadmap.md). The owner's statement that
every document derives from, with the ids R1–R5, D1–D7 and P1–P5, is
[docs/00-mandate.md](docs/00-mandate.md).

## What keel does, in one screen

- **Compiled intent.** Charter, goals, EARS requirements, ADR obligations and the frozen intent of a
  proposal compile into one hashed brief per seat and subject. See [docs/02-alignment.md](docs/02-alignment.md).
- **Checked understanding.** Every seat acknowledges (ACK) its brief before its first edit; keel diffs the
  ACK's id set against the brief, and the seat echoes the brief hash again at submit.
- **Explicitly confirmed authority.** A Board approval is a confirmation the Board gives after viewing the
  specific change; keel records it with the artifact hashes, the declared approver and the time, and any
  change to the approved content invalidates it. Seat output can never produce an approval, and no key,
  signer list or hardware is involved. See [docs/02-alignment.md](docs/02-alignment.md).
- **Re-executed evidence.** The Steward re-runs the full acceptance matrix on the integrated commit at land.
  Evidence files are a cache, and `not_run` is never `pass`. See
  [docs/11-verification.md](docs/11-verification.md).
- **Cross-family review.** A reviewer whose declared model family differs from the engineer's reviews the
  work, and its findings have authority.
- **Traceability.** Steward-made commits carry trailers, and a trace check refuses any commit in range
  that cannot be walked back to an approved requirement and goal. See
  [docs/04-trace-and-state.md](docs/04-trace-and-state.md).
- **Architecture intelligence.** A declared C4-style model is joined with a code graph rented through an
  IndexProvider port, giving search, impact, drift, ownership and a change feed. See
  [docs/07-architecture-intelligence.md](docs/07-architecture-intelligence.md).
- **git first.** git alone is sufficient; jj is an optional accelerator. See [docs/05-vcs.md](docs/05-vcs.md).
- **Provider values stay with you.** keel stores environment variable names only and never opens a file
  that holds provider values or runtime credentials. See [docs/10-providers.md](docs/10-providers.md).

What keel is not (an agent runtime, an LLM router, a sandbox, a hosted service, ...) is listed in
[docs/00-vision.md](docs/00-vision.md).

## Repository map

| Path | Contents |
| --- | --- |
| `docs/` | Design documents: the root is [docs/00-mandate.md](docs/00-mandate.md); start at [docs/README.md](docs/README.md) for the reading order and the single-home table; `docs/reference-projects.yaml` is the reference registry (P4); `docs/design-issues.yaml` is the design-issue register (P5) |
| `docs/adr/` | keel's own architecture decision records (ADR-0001 onwards) |
| `schemas/` | JSON Schemas (draft 2020-12); `common.schema.json` is the only home of id patterns and shared enums |
| `src/` | Type-only TypeScript mirroring the schemas and interfaces; no runtime code in M0 |
| `org/` | Seat contracts (`org/seats/*.yaml`), reserved actions, checkpoint stages |
| `config/` | Package defaults: caps and thresholds, each with a reason |
| `conformance/` | Plumbing and behaviour conformance scenarios |
| `runtimes/` | One descriptor per runtime, the canonical hook-event table, and a capability matrix |
| `skills/` | The five portable seat procedures (`keel-frame`, `keel-design`, `keel-plan`, `keel-work`, `keel-review`) |
| `templates/` | Project, proposal, runtime and prompt templates, including the review lenses |
| `examples/` | The golden example project `acme-notes`, a names-only provider env example, a static dashboard mock |
| `test/` | Test plan and fixtures (loopback fake providers, env stripping) |
| `scripts/validate.mjs` | The declared M0 tooling exception: schema, example, strict-subset, bilingual-doc, audit, manifest and reference-registry checks |
| `AGENTS.md`, `CLAUDE.md` | Guidance for agents that develop keel itself |

The complete, checked file list is the manifest in
[docs/13-artifacts-schemas.md](docs/13-artifacts-schemas.md).

## Checking the skeleton

Requires Node >= 22.13.

```sh
npm ci
npm run check                                  # typecheck + validate, as CI runs it
node scripts/validate.mjs --only audit         # one check
node scripts/validate.mjs --only schemas,examples,strict,i18n,audit,manifest,references,issues
```

CI runs the same commands on windows-latest and ubuntu-latest with Node 22.13 and 24.

## Name note: not dcsg/keel

This project is unrelated to dcsg/keel, a separate ELv2-licensed agent workflow that also uses the name
keel. This project borrows one idea from it (re-injecting context after compaction), credited in
[docs/16-sources-credits.md](docs/16-sources-credits.md), and copies no text or code from it. The package
name is `@qither/keel`; the CLI name `keel` will be revisited before the first publish
([docs/17-open-decisions.md](docs/17-open-decisions.md)).

## Language

English is canonical. Every human-facing document (everything under `docs/`, this README, `runtimes/README.md`
and `test/README.md`) has a Simplified Chinese mirror named `<name>.zh-CN.md` with the same heading structure;
the i18n check in `scripts/validate.mjs` enforces it. Identifiers, file names, schemas, YAML, templates,
skills and prompts are English only.

## Licence

MIT. Copyright (c) 2026 Qither. See [LICENSE](LICENSE).
