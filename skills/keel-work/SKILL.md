---
name: keel-work
description: Use when a keel brief or dispatch assigns you the engineer seat for a task such as P-7F3K9Q.T2, including fix rounds and test-first tasks.
---

# keel-work: engineer seat procedure

This skill is the procedure behind the engineer seat contract (`org/seats/engineer.yaml`). The seat
implements exactly one work order in its own sparse worktree. Proposal files are absent from that worktree
on purpose: the brief is the whole contract. The Steward commits your changes, runs the gates and
re-executes the acceptance commands itself; nothing you report counts as evidence on its own.

## Actions you use

- Read the brief: `keel brief <P>.T<n> --seat engineer`, or the copy delivered with this run.
- ACK: `keel api ack --input - --json`, or the same payload on the submit channel the brief names.
- Ask, rule and submit: through the submit channel named at the end of the brief (final message, MCP
  `keel_submit`, or the outbox through `keel api ask|rule|submit --input - --json`).
- Re-read a brief section after context loss: `keel api context --input - --json` or MCP `keel_context`.

## Procedure

1. Read the brief top to bottom once: the why-chain (goal, requirements, frozen intent, work order), the
   in-scope invariants and obligations, the element brief, the write set, the forbidden paths, the gates,
   the decision boundaries and the output contract.
2. ACK before your first edit (`schemas/ack.schema.json`): `brief_hash` (the brief id), `subject`, `seat`, the
   `objective` in your own words, `ids` (exactly the id set the brief lists for the engineer seat: ACC, R,
   in-scope INV and must/must_not obligation ids), `non_goals`, a `write_set` that is a subset of the work
   order's, planned `steps`, `assumptions` and `questions`. Edits made before a matching ACK void the run. If
   keel reports a mismatch, re-read the brief and ACK once more; a second mismatch blocks the task
   (`blocked(ack_mismatch)`).
3. If the work order assigns tests to you, go red first: write the test, run it, and see it fail for the
   reason the ACC describes. Then implement until it passes.
4. Implement inside the write set only. Keep changes as small as the work order allows.
5. Run the declared build and test commands from the work order. They help you, but produce no evidence:
   the Steward's runner re-executes the acceptance table in a clean checkout.
6. Before submitting, check for fake completion: no `.skip`, `.only`, `xit` or `it.todo`; no filtered test
   runs presented as full runs; no "TODO implement" markers or not-implemented stubs. The submit gate scans
   for all of these, and skipped or filtered tests count as missing.
7. Submit the result (`schemas/result.schema.json`): `status`, `goal_echo`, the brief id as
   `brief_hash`, a `summary`, your `rulings`, open `questions`, a `blocker` or null, and a `handoff` with
   `notes`, `not_tested` (each entry becomes a Not-tested trailer), `concerns` and `next`. The Steward
   commits the worktree tree with trailers at submit; you never commit.

Result status:

- `DONE`: the work order is complete and the declared commands pass.
- `DONE_WITH_CONCERNS`: complete, with concerns you name in the handoff.
- `BLOCKED`: you cannot continue; say why and which ask or stop class applies.
- `NEEDS_CONTEXT`: something the brief should contain is missing; say exactly what.

## Fix rounds

A fix round brings a findings list. Fix those findings only, inside the same write set, and ACK the new
brief first. Rounds 1-3 resume you; rounds 4-5 start a fresh engineer one tier up; past round 5 the task
blocks (`blocked(non_convergence)`) and goes to the Board, or to the architect on the system track. If you
believe a finding is wrong, say so in the handoff with evidence; do not work around it.

## Test-first tasks

A test-first task writes tests for a different builder. Write only the tests the work order names, inside
its write set; run them and confirm they fail against the current code for the reason each ACC describes.
Do not write the implementation.

## Decisions, asks and rulings

- Precedence: Board ruling > INV > accepted ADR obligation > frozen intent (ACC, non-goals, scope) >
  requirement > plan > task notes > model preference.
- Inside the decision boundaries, decide and record a ruling with `clause`, `what`, `why`,
  `cost_if_wrong` (`low`, `medium` or `high`) and `reversible`. The audit lens later compares your
  diff with your rulings, so record every real decision.
- Outside them, ask with the clause id. Requirements go to product, architecture and obligations to the
  architect, plan steps and interfaces to the planner; ACC, scope, non-goals, INV and goals to the Board.
  The task parks until the answer arrives.
- If the work needs files outside the write set, ask; do not edit them. A diff that reaches further than
  the task's track allows blocks the task (`blocked(track_raised)`).

## Stop classes

These four always become an ask to the Board and are never settled by a ruling:

- `irreversible_or_destructive`: deleting data, rewriting history, dropping tables, force operations.
- `security_sensitive`: credentials, permissions, secrets, authentication or trust settings.
- `side_effect_outside_workspace`: network calls, installs or writes outside your worktree and run dir.
- `every_path_a_guess`: every way forward rests on a guess.

When one applies, stop, ask, and submit `BLOCKED` if the run must end.

## What this seat may do

- Write files that match the write set, in its own worktree.
- Write its run outbox through `keel api`.
- Run the declared build and test commands.

## What this seat may not do

- Touch `frozen_tests`, `.keel/**`, or any path outside the write set.
- Commit, push, move refs, rebase, write commit trailers, or use `jj undo` / `jj op restore`.
- Run a mutating keel verb (`new`, `run`, `land`, `sync`, `audit`, `approve`), or take any other action
  listed in `org/reserved-actions.yaml`.
- Claim or pick tasks, mark work done, or weaken acceptance.
- Use permission-bypass flags or spawn writing subagents.
- Open provider, credential or shared runtime settings files; the Steward checks tool events at ingest.
  If a model or tool call fails with an authentication error, ask; do not look for keys or endpoints.
