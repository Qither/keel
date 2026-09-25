---
# examples/acme-notes/.keel/charter.md frontmatter (schemas/charter.schema.json).
# Signed by the Board with `keel approve --doc .keel/charter.md` (approval AP-1c4e6a8b0d2f in the ledger
# sample) and committed to trunk by a Steward governance commit.
charter_version: "1.0.0"
mission: "Acme Notes keeps each user's notes private, quick to find and easy to organize."
# Fake fingerprint of the root Board signer (board-owner@example.com in .keel/board/allowed_signers).
root_signer: "SHA256:FakeKeelBoardOwnerKey0000000000000000000000"
invariants:
  - id: INV-01
    level: must
    text: "Every HTTP handler authenticates the request before it reads or writes a note."
    applies_to:
      - "src/web/**"
    check:
      argv: ["npm", "run", "check:auth"]
    cheap: true
  - id: INV-02
    level: must
    text: "Every storage migration ships with a tested down migration."
    applies_to:
      - "migrations/**"
    check:
      argv: ["npm", "run", "test:migrations"]
    cheap: false
decision_boundaries:
  may_decide:
    - "Names and layout of internal helpers inside a task's write set."
    - "Wording of test descriptions and fixture data."
  must_ask:
    - "Any new runtime dependency."
    - "Any change to data a user can see or export."
precedence:
  - board_ruling
  - invariant
  - adr_obligation
  - frozen_intent
  - requirement
  - plan
  - task_notes
  - model_preference
reserved_actions:
  additions:
    - id: reset-demo-data
      summary: "Reset or reseed the shared acme-notes demo database."
      stop_class: side_effect_outside_workspace
      patterns:
        - "npm run demo:reset"
      detect:
        - tool-events
      prevent:
        - permission-rules
        - pretooluse-hook
pitfalls:
  - text: "Normalize Unicode before comparing user-typed strings; a title typed in NFD once created a duplicate note."
    incident: "INC-2026-014"
---

# Charter

Acme Notes keeps each user's notes private, quick to find and easy to organize. This charter is the
highest document the seats read; the frontmatter above is what keel parses.

## Invariants

- `INV-01` (must): every HTTP handler authenticates the request before it reads or writes a note. It
  applies to `src/web/**`; its check `npm run check:auth` also runs at submit because it is cheap.
- `INV-02` (must): every storage migration ships with a tested down migration. It applies to
  `migrations/**`; its check runs in the verify gate.

Invariants in scope for a task are compiled into its brief. Tasks whose write set does not reach
`src/web/**` or `migrations/**` never see them.

## Decision boundaries

Seats may decide the names and layout of internal helpers inside their write set, and the wording of test
descriptions and fixture data; each such decision is recorded as a ruling. A new runtime dependency and any
change to data a user can see or export are always asked. The four stop classes (irreversible or
destructive, security-sensitive, side effects outside the workspace, every path a guess) always go to the
Board.

## Precedence

Board ruling > invariant > accepted ADR obligation > frozen intent (ACC, non-goals, scope) > requirement >
plan > task notes > model preference.

## Reserved actions and pitfalls

Every action in keel's `org/reserved-actions.yaml` applies, including publishing a package. acme-notes
adds `reset-demo-data`: resetting the shared demo database is a side effect outside the workspace and is
always a Board decision.

Pitfall INC-2026-014: a note title typed in NFD was stored next to the same title in NFC, which created a
duplicate note. Normalize Unicode before comparing user-typed strings.
