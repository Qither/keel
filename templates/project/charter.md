---
# .keel/charter.md frontmatter (schemas/charter.schema.json). Budget: 6 KiB for the whole file.
# The frontmatter holds every machine-read part; the body explains it for humans.
# The Board replaces the {{tokens}}, then approves the file after reading it:
#   keel approve --doc .keel/charter.md
charter_version: "1.0.0"
# At most 200 characters.
mission: "{{mission}}"
invariants:
  - id: INV-01
    level: must                  # must | must_not
    text: "{{invariant_text}}"
    applies_to:
      - "{{invariant_glob}}"
    # Optional check command for the verify gate, as {argv: [...]}, run without a shell; set
    # cheap: true to run it at submit as well.
    check: null
decision_boundaries:
  may_decide:
    - "{{company_may_decide}}"
  must_ask:
    - "{{company_must_ask}}"
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
  # Every action in the package table org/reserved-actions.yaml always applies. Add project-specific
  # reserved actions here, in the shape of an org/reserved-actions.yaml entry.
  additions: []
# A pitfall is admitted only with an incident id, as {text, incident}.
pitfalls: []
---

# Charter

{{mission}}

## Invariants

The invariants in the frontmatter are obligations every proposal must keep. Each has a level (`must` or
`must_not`), the paths it applies to and, where possible, a check command. Invariants in scope for a task
are compiled into its brief and join the ACK id set; checks run in the verify gate, and cheap ones also
at submit.

## Decision boundaries

Seats decide inside the boundaries in the frontmatter and record a ruling for each decision. Anything on
the `must_ask` list, and anything in the four stop classes (irreversible or destructive,
security-sensitive, side effects outside the workspace, every path a guess), becomes an ask.

## Precedence

Board ruling > invariant > accepted ADR obligation > frozen intent (ACC, non-goals, scope) > requirement >
plan > task notes > model preference.

## Changing this charter

Edit this file, then approve it with `keel approve --doc .keel/charter.md`, which shows the diff and asks
for your explicit confirmation. The Steward commits it to trunk as
a governance commit. Bump `charter_version`: MAJOR when an invariant or boundary tightens or is removed,
MINOR when one is added, PATCH for wording. The frame gate flags proposals that lag a MAJOR or MINOR
change.
