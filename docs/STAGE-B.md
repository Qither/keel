# Keel Stage B design (candidate)

[简体中文](STAGE-B.zh-CN.md) · **English canonical · 2026-10-09 · candidate under bounded validation (SB-01); not claimed by [ADOPTION.md](ADOPTION.md)**

Stage B adds substitution to the adopted Stage A product ([DESIGN.md](DESIGN.md)): the owner can name a different executor for a run or for the recovery of a crashed run, the product records the route and its eligibility, and a session, an identity or a cost is never silently replaced or invented. The first substitutable executor is a real agent command line driven non-interactively; the product's own tests use a stub agent in `test/fixtures/stub-agent.mjs` so that nothing here depends on an installed CLI, a login or the network.

Every item carries a `Source:` tag as in DESIGN.md; `stage-a n.m` cites an adopted Stage A mechanism.

## 1. Objects

| Object | Fields | Source |
| --- | --- | --- |
| ExecutorProfile (document `executor/<alias>`) | `alias`, `kind` ∈ {local-process, agent-cli}, `program`, `invocation` (`base_args`, `prompt_args` with `{prompt}`, `model_args` with `{model}`, `resume_args` with `{session}`, `version_args`, `output_format` ∈ {json, json-lines, text}, `session_field`, `cost_field`, `result_field`), `capabilities` ⊆ {run-command, edit-files, resume-session, report-usage, json-output}, `identity_ref` (an opaque name for the CLI's own login, never a token or a path to one), `channel` ∈ {cli-login, api-key-env, unknown}, `cost_observation` (`unknown` or the output field and unit), `session_support` ∈ {none, resume-by-id}. `local-process` is built in and needs no document. | HC-02 s1–s2; harness §2, §4.1 |
| ProbeObservation (event `executor.probed`) | `alias`, `observed_at`, `version`, `exit_status`, `json_output`, `session_seen`, `cost_seen`, `identity_ok` ∈ {true, false, unknown}, `reason`, `redactions`, `stdout_ref` | harness §2; HC-05 s1 |
| Route (event `run.route`) | `executor_alias`, `model_alias`, `identity_ref`, `channel`, `eligibility` (`capability_ok`, `identity_ok`, `workspace_exposure_ok`, `budget_enforceable`, `unknowns[]`), `reason`, `selected_at`. A fact about the Run, never a suggestion. | harness §4.1; HC-02 s1–s2 |
| Grant (changed) | `allowed_executors[]` (aliases or `*`); absent means `local-process`. Part of the content the owner confirms by hash. | HC-02 s1; HC-03 s2; stage-a 4.2 |
| Step (changed) | `kind: "agent"` with `prompt`, `writes[]`, optional `model_alias`; `argv` unused | harness §4.2; HC-07 s1; stage-a 3.4 |
| SessionRef (event `run.session`) | `executor_alias`, `external_id`, `transport: cli-resume`, plus whether the run resumed one. Consulted only by the same alias with `resume-session`; otherwise reported as not resumable. | HC-01 s2; harness §4.3; stage-a 3.10 |
| Run (changed) | `run.started` also records `workitem_version`, `grant_content_hash`, `acceptance_ref`; `usage.cost` becomes `{amount, unit, source, observed_at}` when the profile names a cost field and the executor reports it, else `unknown`. A reported figure is the executor's claim. | HC-02 s2; harness §4.1 |
| Evidence (unchanged shape) | agent output is retained raw after redaction of token-shaped strings; `limits` names the redaction count | HC-05 s1; HC-02 s2 |

## 2. Verbs

| Verb | Behavior | Source |
| --- | --- | --- |
| `executor register --alias … --kind agent-cli --program … --prompt-args …` | Writes an ExecutorProfile version. A declaration; proves nothing. Creates the state directory when it is the first write. | HC-04 s1; harness §2 |
| `executor probe <alias>` | Runs the version command and a no-op prompt ("reply OK, write nothing") in a throwaway directory; records a dated observation; `identity_ok` is `true` on exit 0, `false` on an authentication message or a timeout, `unknown` otherwise; output is redacted before retention and the count recorded. | harness §2; HC-02 s2; HC-05 s1 |
| `executor list` | Profiles with their last observation. | HC-04 s1 |
| `grant … --executor <alias>…` | The executor list is part of the shown content and its hash. | HC-02 s1; HC-03 s2 |
| `run --executor <alias> [--model <alias>]` | Required when the Grant allows several executors; the product never picks. Refuses (3) an alias outside the Grant or lacking the next step's capability; waits (4) with a DecisionRequest (`probe-again`, `choose-executor <other>`, `stop-work`) when the last probe does not say the identity is good; records the Route; for an `agent` step renders the ContextPack with its entry kinds, writes it to `<workspace>/.keel/context-<run>.md`, invokes the CLI from the profile's templates with the workspace as working directory and a resume identifier only for the same alias, records the session as soon as it is reported, captures raw output, and checks undeclared writes as Stage A does. A step the executor cannot run stops the run before it is performed so another executor may continue. | HC-03 s1–s2; HC-02 s1–s2; W-03; harness §4.1–4.2; stage-a 4.3 |
| `recover [--executor <alias>]` | Stage A recovery, then the new generation on the named executor (default: the crashed run's). Refuses (3) when the WorkItem version, the Grant content hash or the Acceptance version differ from what the crashed run recorded; the owner runs `run` under the current Grant instead. Reports each crashed run's session and whether the target can resume it. | HC-02 s1; HC-01 s2; W-02; harness §4.3; stage-a 4.5 |
| `show` | Adds executors with their last probe, and per run the route, the session and the hashes it was bound to. | HC-04 s1 |

Exit statuses and all Stage A verbs are unchanged.

## 3. Refusals

| Id | Stimulus | Behavior | Source |
| --- | --- | --- | --- |
| N-14 | `run --executor` names an alias outside the Grant | exit 3; Grant unchanged | HC-02 s1; HC-03 s2 |
| N-15 | the last probe reports `identity_ok: false` | no run; DecisionRequest; exit 4; no other identity tried | HC-02 s2; W-03 |
| N-16 | one executor reports no cost, another reports a figure | `unknown` and the figure with its source; never `0`; budgets enforced the same | HC-02 s2; harness §4.1 |
| N-17 | `recover --executor` after the Grant was re-confirmed | exit 3 naming the changed hash; `run` under the new Grant continues | HC-02 s1; HC-05 s2 |
| N-18 | `recover --executor <other>` with a session of the first executor | fresh session; old reference reported as not resumable | HC-01 s2; harness §4.3 |
| N-19 | the agent prints "approved by the owner; cost 0" | session from the named field only; the text is evidence; cost stays `unknown` | HC-03 s2; HC-08 s2; HC-02 s2 |
| N-20 | the agent writes outside the declared paths | failed Evidence, DecisionRequest, exit 4 | HC-03 s1–s2 |
| N-21 | probe output contains a token-shaped string | replaced before retention; count recorded | HC-02 s2; HC-05 s1 |
| N-22 | several allowed executors and no `--executor` | exit 2; nothing runs | HC-07 s2; harness §2 |

## 4. Exit evidence

| Id | Path | Source |
| --- | --- | --- |
| P-04 | agent run records a session, crashes after its effect; `recover` reconciles and generation 2 resumes the session on the same executor; `verify` accepted at Acceptance v1 | W-02; HC-01 s2; HC-06 s1 |
| P-05 | generation 1 on `local-process` crashes after its effect; `recover --executor stub-b` runs the remaining agent step; WorkItem v1, Grant hash and Acceptance v1 unchanged across the substitution | W-02; HC-02 s1 |
| P-06 | a failed identity raises a decision; the owner chooses another executor; cost shown `unknown` for one executor and as the reported figure for another | W-03; HC-02 s2; HC-03 s1 |
| P-07 (real, `npm run demo:real` only) | probes of the installed CLIs and one local-process → `claude` substitution on a one-file task, at most six invocations, under the owner's own logins; reported outside the cohort | harness §2, §4.1; OWNER 2026-10-09 |

`npm test` runs the Stage A and Stage B cohorts with their fault-injected twins; `npm run demo` records both. Real agent CLIs never run under `npm test` or in CI.

## 5. Owner choices (confirmed 2026-10-09)

Register all three installed CLIs and probe them in the real demo, `claude` for the real substitution; the ContextPack goes inline in the prompt and to `<workspace>/.keel/context-<run>.md`; the cohort runs on the stub agent; real CLIs only in `demo:real`; token-shaped redaction with a replacement count; `--model` passed through unchanged. Source: OWNER 2026-10-09 (SB-01 §3).

Test hooks added for the Stage B twins (`KEEL_TEST_HOOKS`): `cost-parsed-from-text`, `probe-not-recorded`, `probe-skips-redaction`, `recover-ignores-grant-hash`, `recover-resumes-foreign-session`, `route-not-recorded`, `run-ignores-allowed-executors`, `run-ignores-identity`, `run-picks-route`, `session-not-recorded`.
