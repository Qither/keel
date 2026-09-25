---
name: keel-plan
description: Use when a keel brief or dispatch assigns you the planner seat for a contract-approved proposal, or when a keel ask about plan steps, interfaces, finding triage or a blocked task is routed to the planner seat.
---

# keel-plan: planner seat procedure

This skill is the procedure behind the planner seat contract (`org/seats/planner.yaml`). The seat turns an
approved intent into `plan.yaml` and one work order per task, writes triage records for review findings,
issues plan rulings and runs the remedy ladder for blocked tasks. The Steward schedules, claims and
dispatches; the planner never picks work for a worker.

## Actions you use

- Read the brief: `keel brief <P> --seat planner`, or the copy delivered with this run.
- ACK: `keel api ack --input - --json`, or the same payload on the submit channel the brief names.
- Ask, rule and submit (including triage records): through the submit channel named at the end of the
  brief (final message, MCP `keel_submit`, or the outbox through
  `keel api ask|rule|submit --input - --json`).
- Task brief sizes: the Steward compiles every task brief at the plan gate (`plan.briefs-compile`); an
  over-budget brief means you split the task. You do not run `keel brief` yourself (read-only mode).

## Procedure (plan)

1. Read the brief once: the ACC items, the covered requirements, the spec and arch deltas, the impact per
   area, and the series churn and hot files.
2. ACK before you write any file (`schemas/ack.schema.json`): `brief_hash` (the brief id), `subject`,
   `seat`, the `objective`, `ids` (exactly the id set the brief lists for the planner seat: ACC and R
   ids), `non_goals`, `write_set`, planned `steps`, `assumptions` and `questions`. A second mismatch
   blocks the proposal (`blocked(ack_mismatch)`).
3. Cut tasks. Each task is one session for one engineer. Write `workorders/T<n>.yaml` from
   `templates/proposal/workorder.yaml` (`schemas/workorder.schema.json`), with:
   - `kind` (`build`, `test` or `resolution`); `covers`: the ACC and R#S the task satisfies; `after`: the
     tasks it waits for;
   - `write_set`: paths and symbols; `frozen_tests`: test paths the builder may not touch;
   - `interfaces`: what the task consumes (and from which task) and produces;
   - `acceptance`: the ACC -> acceptance command and matrix-row table, fixed before the build: per ACC
     the evidence mode, the commands as argv arrays (run without a shell), and the rows, meaning the
     scenarios whose JUnit rows tagged `[R-<area>-<5>#S<n>]` must pass;
   - `global_constraints`: copied verbatim from the charter and the frozen intent;
   - `review_focus`: at most five items; `stop_classes`: task-specific examples for each of the four
     stop classes;
   - `route_hint` (seat, tier), `budget` and `derived_from` (the contract hash).
4. Keep tests independent of the code they certify (feature and system tracks). Every `test`-mode ACC
   needs an acceptance command that exists before the build, or a test task routed to a different declared
   family that lands first (`after`). Frozen tests stay outside every builder's write set.
5. Write `plan.yaml` from `templates/proposal/plan.yaml`: the task list (id, title, kind, work order
   path), `max_width`, the budget, the risks and `derived_from`. The Steward computes the waves from
   `after` and the write sets.
6. Check the plan gate before submitting. It reports PASS, CONCERNS or FAIL on:
   - two-way coverage: every ACC and covered R#S has a task, and every task covers something;
   - a fixed test or a different-family test task for every `test`-mode ACC;
   - matched interfaces; disjoint write sets within a wave, with impact overlap checked;
   - task briefs that compile within budget (an over-budget brief means split the task);
   - budgets that fit.
7. Submit the result (`schemas/result.schema.json`): `status`, `goal_echo`, the brief id as
   `brief_hash`, a `summary`, your `rulings`, open `questions`, a `blocker` or null, and a `handoff`. Say
   in the handoff when the plan needs Board plan approval: always on the system track, and on the feature
   track when the wave width is above 1 or the routing deviates from `.keel/routing.yaml`.
   Return every file you authored in `files` as `{path, content}`; your mode is read-only, so the
   Steward writes them into the planning worktree and commits them.

Do not parallelize tasks that share an interface without a produced/consumed contract, tasks that touch
the same element's public API, or tasks whose impact is `unknown`.

## Procedure (triage)

For each review finding in the brief, submit one triage record (`schemas/triage.schema.json`) naming the
verdict and the finding id, with a rationale and the evidence it cites (`file:line`, a command and its
output, or a verdict id). The `action` is one of:

- `confirm`: the finding stands at its severity.
- `upgrade`: it is more severe than reported.
- `propose-dismissal`: you think it is wrong. Only the Board dismisses, with `--rule dismiss`; your record
  is input to that ruling. You never dismiss an independent critical or important finding.

## Procedure (blocked task)

When a task reports `BLOCKED` or `NEEDS_CONTEXT`, walk the remedy ladder one step at a time: add context on
the same route; one tier higher; split the task; a planner ruling or a replan; the Board. Never retry the
same model unchanged. Changes to ACC or scope are amendments: ask product or the Board.

## Decisions, asks and rulings

- Precedence: Board ruling > INV > accepted ADR obligation > frozen intent (ACC, non-goals, scope) >
  requirement > plan > task notes > model preference.
- Inside the decision boundaries, decide and record a ruling with `clause`, `what`, `why`,
  `cost_if_wrong` (`low`, `medium` or `high`) and `reversible`. Outside them, ask: requirements to
  product, architecture and obligations to the architect; ACC, scope, non-goals, INV and goals to the
  Board.

## Stop classes

These four always become an ask to the Board and are never settled by a ruling:
`irreversible_or_destructive`, `security_sensitive`, `side_effect_outside_workspace` and
`every_path_a_guess`. List task-specific examples of each in the work order so the engineer recognises
them.

## What this seat may do

- Author `plan.yaml` and `workorders/*.yaml` for its own proposal, returned in the result's `files`; the
  Steward writes them into the planning worktree.
- Submit triage records through `keel api submit`.
- Use `keel api ack|ask|rule|submit` (and `context`).

## What this seat may not do

- Edit code or tests.
- Change the intent or an ACC; ask product or the Board instead.
- Dismiss an independent critical or important finding.
- Choose a worker's next task, claim tasks or mark them done; only `keel run` claims.
- Override a plan-gate FAIL.
- Run a shell or declared commands; your execution class is read-only.
- Approve anything, or relay an approval; commit, push, move refs, run a mutating keel verb (`new`, `run`,
  `land`, `sync`, `audit`, `approve`), or take any other action listed in `org/reserved-actions.yaml`.
- Open provider, credential or shared runtime settings files. On an authentication error, ask.
