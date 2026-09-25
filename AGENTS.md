# AGENTS.md

Guide for AI agents (and humans) developing keel itself. keel is a TypeScript/Node CLI design for running a
small company of multi-vendor AI coding agents: a human Board, a deterministic Steward and five LLM seats,
with compiled intent, signed Board approvals, re-executed evidence, git-first traceability and architecture
intelligence.

## Status: M0 is design and skeleton only

- M0 ships design documents, JSON Schemas, Markdown templates, YAML descriptors and tables, type-only
  TypeScript, examples and fixtures. There is no product logic and no `bin` until M1.
- `scripts/validate.mjs` is the single declared tooling exception (D1). It is the only non-type code in the
  repository and must stay free of product logic.
- The roadmap and each milestone's exit criteria live in `docs/15-roadmap.md`.

## Where things live

- `docs/README.md` holds the reading order and the single-home table: every concept has exactly one home
  document. Update the home, and link to it from elsewhere instead of restating it.
- `schemas/common.schema.json` is the only home of id patterns and shared enums. `src/core/ids.ts` mirrors
  them as types without patterns.
- Other canonical tables: `org/reserved-actions.yaml`, `runtimes/hook-events.yaml`, the lens sets in
  `org/seats/reviewer.yaml`, and the gate catalogue in `docs/11-verification.md`.
- `docs/13-artifacts-schemas.md` lists every repository file (the manifest check enforces it).

## Schema-first workflow

1. Change or add the schema under `schemas/` (JSON Schema 2020-12, `$id`
   `https://keel.invalid/schemas/<name>.schema.json`, shared ids and enums by `$ref` to
   `common.schema.json#/$defs/<name>`).
2. Update the templates, examples and fixtures, and map each example data file in
   `schemas/examples.map.json`.
3. Update the type-only TypeScript in `src/`.
4. Update the home document in English and its Simplified Chinese mirror, and the manifest in
   `docs/13-artifacts-schemas.md`.
5. Run `npm run check`.

## House rules

- **Provider values belong to the user (P1).** keel stores environment variable NAMES only. Use only the
  placeholders `https://provider.example.invalid` (anthropic-messages) or
  `https://provider.example.invalid/v1` (OpenAI protocols), `<set-in-your-own-environment>` and
  `sk-fake-keel-*`.
  Never write a real provider API host or a key-shaped string anywhere in the repository.
- **Never read user credential or provider files.** Do not open, print, grep or copy runtime credential
  files, provider configuration files, gateway files or `.env*` files, in this repository or in the user's
  home directory. Tests use loopback fake providers with fake keys. Diagnose provider problems from doctor
  output and refusal messages, never from the user's files.
- **Fresh, independent design (D2).** No term from the D2 term list in `scripts/validate.mjs` may appear in
  any other file, and that list is not repeated in documentation. For seat qualification say "conformance
  status" (verified | failed | unverified).
- **Borrow ideas, not dependencies (P3).** No OpenSpec CLI dependency. Do not copy text or code from
  ELv2-licensed projects or from non-OSS sources; `docs/16-sources-credits.md` records every credited idea.
- **Bilingual docs (D5).** Human-facing docs (everything under `docs/`, the root README,
  `runtimes/README.md` and `test/README.md`) are English canonical in `<name>.md` with a Simplified Chinese
  mirror in `<name>.zh-CN.md` that has an identical heading structure. Identifiers, file names, schemas,
  YAML, templates, skills and prompts are English only.
- **Type-only `src/` (D1).** Only `import type`, `export type`, type aliases, interfaces, `export {}` and
  comments. No `enum`, `const`, `let`, `var`, `function`, `class` or expression statements. Use `.js`
  extensions in import specifiers (NodeNext).
- **Native Windows (D3).** Node >= 22.13. The core design uses no tmux, WSL, Docker, bash or python.
- **git first (D4).** git is primary and fully sufficient; jj is an optional enhancement behind the Vcs
  interface.
- **Unverified facts.** Mark unverified CLI, runtime and jj facts "verify by probe"; in YAML use
  `verification_status: unverified | documented | probed | verified`.
- **Terminology.** Keep the blueprint terms exactly: Board, Steward, seat (product, architect, planner,
  engineer, reviewer), track (spike, patch, feature, system), tier (frontier, standard, fast), brief, ACK,
  work order, lens, receipt, rung A-D, exposure profile, declared family.
- **Style.** UTF-8 without BOM, LF line endings, 2-space indentation, no trailing whitespace.

## Commands

```sh
npm ci
npm run check                      # typecheck + validate
npm run typecheck                  # tsc --noEmit -p tsconfig.json
node scripts/validate.mjs          # all checks
node scripts/validate.mjs --only schemas,examples,strict,i18n,audit,manifest
```

Every check prints `<check>: <passed>/<total>` and its errors; any error fails the run. CI runs the same
commands on windows-latest and ubuntu-latest with Node 22.13 and 24.
