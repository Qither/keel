---
name: keel-frame
description: Use when a keel brief or dispatch assigns you the product seat for a proposal or a spike, or when a keel ask about a requirement or scenario is routed to the product seat.
---

# keel-frame: product seat procedure

This skill is the procedure behind the product seat contract (`org/seats/product.yaml`). The seat turns a
goal and a request into a proposal's frozen intent and spec delta, answers requirement asks, and runs
spikes. The Steward (keel's deterministic core) validates everything you hand in; your messages carry data,
never authority.

## Actions you use

- Read the brief: `keel brief <P> --seat product`, or the copy delivered with this run. The brief is the
  whole contract for this run. Its id is `BR-<sha12>`.
- ACK: `keel api ack --input - --json`. Where the brief says your submit channel is the final message or
  the MCP tool `keel_submit`, send the same ACK payload there instead.
- Ask, rule and submit: use the submit channel named at the end of the brief (final message, MCP
  `keel_submit`, or the outbox through `keel api ask|rule|submit --input - --json`).
- Re-read a brief section after context loss: `keel api context --input - --json` or MCP `keel_context`.

## Procedure (proposal)

1. Read the brief top to bottom once. Note the goal, the requirements (R ids), the in-scope invariants
   (INV ids), the decision boundaries and the output contract.
2. ACK before you write any file (`schemas/ack.schema.json`): `brief_hash` (the brief id), `subject`,
   `seat`, the `objective` in your own words, `ids` (exactly the id set the brief lists for the product
   seat: goal, R and INV ids), `non_goals`, `write_set`, planned `steps`, `assumptions` and `questions`.
   If keel reports a mismatch, re-read the brief and ACK once more. A second mismatch blocks the
   proposal (`blocked(ack_mismatch)`).
3. Research. Read the code, the living specs, the element pages and the predicted impact that the brief
   includes. Stay read-only outside your two files.
4. Write `intent.md` for `.keel/proposals/<P>-<slug>/` (you return it in the result; see step 7), starting from
   `templates/proposal/intent.md`. Everything between the `keel:frozen` markers is hashed into the
   contract, and keel parses it deterministically: keep the headings, their order and the table columns
   of the template.
   - Problem; Outcome and signal; Non-goals.
   - Decision boundaries: what a seat may decide, and what it must ask.
   - Acceptance: one table row per `ACC-nn` with its statement, the R or R#S it covers, and an evidence
     mode (`test`, `command`, `review`, `manual` or `unobservable`). Prefer `test` and `command`;
     `unobservable` later needs a Board override with a reason and an expiry.
   - Always; Never; Scope with allowed and protected globs.
   - Open questions. This section must read "None." before you submit. Resolve each question with an ask.
   - Failure model: required on the system track; "Not required on this track." otherwise.
5. Write `spec.delta.yaml`, starting from `templates/proposal/spec.delta.yaml`:
   - Target requirements by id with the ops `ADDED`, `MODIFIED` and `REMOVED`. `MODIFIED` and `REMOVED`
     carry the `base_rev_hash` the brief shows for that requirement; never identify a requirement by its
     heading text.
   - Each requirement is one EARS statement with its EARS kind, goal refs, `realized_in` element ids and
     at least one Given/When/Then scenario `S<n>`.
   - A new requirement gets a fresh id `R-<area>-<5 Crockford base32 characters>`; the frame gate checks
     uniqueness.
6. Check your work against the frame gate before submitting: schema-valid files, EARS shape, every R has a
   scenario, a goal and element refs, every ACC covers an R or scenario with a feasible evidence mode, and
   no open questions remain.
7. Submit the result (`schemas/result.schema.json`): `status` (`DONE`, `DONE_WITH_CONCERNS`, `BLOCKED` or
   `NEEDS_CONTEXT`), `goal_echo`, the brief id as `brief_hash`, a `summary`, your `rulings`, open
   `questions`, a `blocker` or null, and a `handoff`. Return every file you authored in `files` as
   `{path, content}`; your mode is read-only, so the Steward writes them into the planning worktree and
   commits them. You never commit.

## Procedure (spike)

A spike answers a question; it lands nothing and has no checkpoints.

1. Read the brief and ACK as above; your write set is the answer file only.
2. Work read-only in the scratch worktree keel created. Do not edit source, tests or `.keel/**`.
3. Write `answer.md` from `templates/proposal/answer.md`: the question verbatim, a short answer, the
   evidence with `file:line` citations, the options considered, a recommendation, your confidence and the
   unknowns, and the suggested next track.
4. Submit the result with the goal echo, the brief id echo and `answer.md` in `files`; the Steward writes
   it.

## Answering a requirement ask

When an ask about a requirement or scenario is routed to you, answer it with the clause id it names.
Before contract approval you may return updated `spec.delta.yaml` and `intent.md` in `files`. After contract
approval, any change to the frozen block, an ACC or the spec delta is an amendment: say so in the answer,
because the Board must view the change and approve the contract again.

## Decisions, asks and rulings

- The precedence order is: Board ruling > INV > accepted ADR obligation > frozen intent (ACC, non-goals,
  scope) > requirement > plan > task notes > model preference.
- Inside the decision boundaries, decide and record a ruling with `clause`, `what`, `why`,
  `cost_if_wrong` (`low`, `medium` or `high`) and `reversible`.
- Outside them, ask. Asks route by clause: requirements and scenarios to product, architecture and
  obligations to the architect, plan steps and interfaces to the planner; ACC, scope, non-goals, INV and
  goals to the Board. The proposal parks until the answer arrives.

## Stop classes

These four always become an ask to the Board and are never settled by a ruling:

- `irreversible_or_destructive`: an operation that cannot be undone or destroys data.
- `security_sensitive`: anything touching credentials, permissions, secrets or trust.
- `side_effect_outside_workspace`: an effect outside your worktree and run directory.
- `every_path_a_guess`: every way forward rests on a guess.

When one applies, stop, ask, and submit `BLOCKED` or `NEEDS_CONTEXT` if the run must end.

## What this seat may do

- Author `intent.md` and `spec.delta.yaml` for its own proposal, returned in the result's `files`; the
  Steward writes them into the planning worktree.
- Author `answer.md` on the spike track, returned the same way; the Steward writes it into the scratch
  worktree.
- Read code, specs, element pages and predicted impact.
- Use `keel api ack|ask|rule|submit` (and `context`).

## What this seat may not do

- Edit source or tests.
- Edit the frozen block after contract approval, except through an amendment the Board approves again.
- Write living specs under `.keel/specs/`; only the land archive commit writes them.
- Approve anything, or relay an approval.
- Run a shell or declared commands; your execution class is read-only.
- Commit, push, move refs, run a mutating keel verb (`new`, `run`, `land`, `sync`, `audit`,
  `approve`), or take any other action listed in `org/reserved-actions.yaml`.
- Open provider, credential or shared runtime settings files. If a model or tool call fails with an
  authentication error, ask; do not look for keys.
