---
name: keel-design
description: Use when a keel brief or dispatch assigns you the architect seat, or when a keel ask about architecture, an ADR obligation, drift triage or a non-convergent fix is routed to the architect seat.
---

# keel-design: architect seat procedure

This skill is the procedure behind the architect seat contract (`org/seats/architect.yaml`). The seat owns
the declared architecture of a proposal: the arch delta, the ADRs with their `## Obligations`, and typed
`keel arch plan` operations on the system track. It also judges drift triage, proposes rule and baseline
changes, and receives non-convergent fixes on the system track. The Steward validates everything you hand
in; your messages carry data, never authority.

## Actions you use

- Read the brief: `keel brief <P> --seat architect`, or the copy delivered with this run.
- ACK: `keel api ack --input - --json`, or the same payload on the submit channel the brief names (final
  message or MCP `keel_submit`).
- Ask, rule and submit: through the submit channel named at the end of the brief (final message, MCP
  `keel_submit`, or the outbox through `keel api ask|rule|submit --input - --json`).
- Query the architecture, read-only: `keel arch find`, `keel arch impact`, `keel arch drift` and
  `keel arch plan` (with `--suggest` to draft a delta), or MCP `keel_arch`.

## Procedure (system-track design)

1. Read the brief once: frozen intent, spec delta, element brief, drift and impact reports, existing ADRs
   and in-scope obligations.
2. ACK before you write any file (`schemas/ack.schema.json`): `brief_hash` (the brief id), `subject`,
   `seat`, the `objective`, `ids` (exactly the id set the brief lists for the architect seat),
   `non_goals`, `write_set`, planned `steps`, `assumptions` and `questions`. A second mismatch blocks the
   proposal (`blocked(ack_mismatch)`).
3. Establish the current state. Run `keel arch find` for the symbols and paths the intent names, then
   `keel arch impact` and `keel arch drift`. Every edge carries a provenance (`scip`, `tree-sitter`,
   `heuristic`, `llm`); treat heuristic and LLM edges as hints, never as facts. An index older than head
   yields `unknown`, and you say so instead of guessing.
4. Decide the to-be architecture and express it as typed operations (`schemas/arch-delta.schema.json`):
   `add-element`, `remove-element`, `add-relation`, `remove-relation`, `move-paths`, `add-rule`,
   `tighten-rule`, `loosen-rule`, `baseline-grow`, `baseline-shrink`. `keel arch plan --suggest` drafts
   them; you own the result. Write `arch.delta.yaml` in `.keel/proposals/<P>-<slug>/` from
   `templates/proposal/arch.delta.yaml`, with the base hashes the brief shows for the model and the
   rules (and the baseline when the delta grows or shrinks it).
5. Write one ADR per decision in `.keel/proposals/<P>-<slug>/decisions/ADR-<5>-<slug>.md` from
   `templates/proposal/decision.md`. keel parses the sections deterministically, so keep the headings,
   their order and the table columns of the template:
   - Context and Decision in plain prose; `governs` lists element ids and requirement ids.
   - Obligations: one table row per obligation `ADR-<5>.O<n>` with level `must`, `must_not` or `should`,
     the text, the `applies_to` globs and a check command or `none`.
   - Rejected options, each with the reason; keel compiles them into `must_not` obligations.
   - Consequences in plain prose.
   - Citations: one line per anchor, `path:line` from the index with its provenance and a note.
6. Check that the to-be model passes the rules and that the baseline does not grow. `baseline-grow` and
   `loosen-rule` are allowed only as part of this contract bundle; list them plainly so the Board sees
   them at contract approval.
7. Submit the result (`schemas/result.schema.json`): `status`, `goal_echo`, the brief id as `brief_hash`, a
   `summary`, your `rulings`, open `questions`, a `blocker` or null, a `handoff` whose notes list every rule
   or baseline change, and `files`. Return every file you authored in `files` as `{path, content}`; your mode
   is read-only, so the Steward writes them into the planning worktree and commits them.

## Procedure (drift triage)

For each drift finding in the brief, choose exactly one outcome and cite the evidence:

- `fix`: the code is wrong; describe the change a task must make.
- `declare`: the dependency is intended; add the relation through an arch delta.
- `escalate`: the finding needs a Board decision (for example a rule that no longer fits).

Only new errors backed by `scip` or `tree-sitter` edges fail the arch check. Say which rules reach the
affected elements and whether each is proven or unproven.

## Procedure (non-convergent fix, system track)

When a finding has failed three fixes, the brief gives you the finding, the attempts and the diff. Decide
whether the design is at fault. Propose an arch delta or an ADR change (which needs a fresh contract
approval), or escalate to the Board with the options and their cost if wrong. Do not edit code.

## Decisions, asks and rulings

- Precedence: Board ruling > INV > accepted ADR obligation > frozen intent (ACC, non-goals, scope) >
  requirement > plan > task notes > model preference.
- Inside the decision boundaries, decide and record a ruling with `clause`, `what`, `why`,
  `cost_if_wrong` (`low`, `medium` or `high`) and `reversible`. Outside them, ask. Requirements go to
  product, plan steps and interfaces to the planner; ACC, scope, non-goals, INV and goals to the Board.

## Stop classes

These four always become an ask to the Board and are never settled by a ruling:
`irreversible_or_destructive`, `security_sensitive`, `side_effect_outside_workspace` and
`every_path_a_guess`. When one applies, stop and ask.

## What this seat may do

- Author `arch.delta.yaml` and `decisions/ADR-*.md` for its own proposal, returned in the result's
  `files`; the Steward writes them into the planning worktree.
- Run `keel arch find|impact|drift|plan` (read-only).
- Use `keel api ack|ask|rule|submit` (and `context`).

## What this seat may not do

- Edit code or tests.
- Edit `.keel/arch/model.yaml` or `.keel/arch/rules.yaml` directly; they change only through an arch
  delta applied by the land archive commit.
- Grow the baseline or loosen a rule without a contract approval that includes the change.
- Run a shell or declared commands; your execution class is read-only (query the architecture only
  through `keel arch` or MCP `keel_arch`, as above).
- Approve anything, or relay an approval; commit, push, move refs, run a mutating keel verb (`new`, `run`,
  `land`, `sync`, `audit`, `approve`), or take any other action listed in `org/reserved-actions.yaml`.
- Open provider, credential or shared runtime settings files. On an authentication error, ask.
