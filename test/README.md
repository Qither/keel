# keel test plan

M0 ships no tests and no product code. It ships this plan, the fixtures under `test/fixtures/` and the
golden example under `examples/`, all checked today by `scripts/validate.mjs`. Each later milestone adds
the tests named here. The full verification design (gates, negative controls, conformance) lives in
`docs/11-verification.md`; the provider fakes are specified in `docs/10-providers.md` section 7.

## Rules every test keeps

- **No user environment, no user configuration.** No test reads the developer's environment variables,
  runtime homes, credential files, shared runtime settings or any provider configuration file. The
  harness strips provider prefixes before every spawn (`fixtures/env-strip.yaml`) and injects fake values
  only.
- **Fake values only.** Providers are loopback fakes on `127.0.0.1` with ephemeral ports. Keys are
  `sk-fake-keel-anthropic-0000` and `sk-fake-keel-openai-0000`; models are `fake-frontier`,
  `fake-standard` and `fake-fast`. Documentation-style endpoints use `https://provider.example.invalid`
  (anthropic-messages) and `https://provider.example.invalid/v1` (the OpenAI protocols). The fakes follow
  the same base URL shapes: `http://127.0.0.1:<port>` for anthropic-messages and
  `http://127.0.0.1:<port>/v1` for the OpenAI protocols (docs/10-providers.md section 5).
- **No network beyond loopback.** A fake never forwards a request. A test that needs a real model is a
  behaviour conformance check, which only the user runs, on their own routes.
- **Fail closed, with a negative control.** Every check keel ships has a seeded fault that must make it
  fail with a pinned reason. A check whose negative control passes is broken, not flaky.
- **Both platforms.** CI runs on windows-latest and ubuntu-latest with Node 22.13 and 24. Paths, line
  endings and process trees are tested on native Windows, without WSL, bash or Docker.

## Test layers

| Layer | What it covers | Arrives | Runs where |
| --- | --- | --- | --- |
| Skeleton validation | Schemas compile; examples and fixtures validate; strict subset; bilingual docs; D2, P1 and D1 audit; the docs/13 manifest; the reference registry (`references` check, P4); the design-issue register (`issues` check, P5: ids, anchors, statuses, the blocks gate, cycles and reachability in the order map, the glossary) | M0 | CI (`npm run check`) |
| Unit and golden | Normalization (LF, BOM, NFC); id patterns; the brief compiler's golden hash, identical on a CRLF and an LF checkout; ledger canonical form and chain verification; trailer parsing | M1a | CI |
| Governance | The approval flow in a scratch repository with a scripted confirmation: record build, hash binding, invalidation on change, the changed-during-confirmation refusal, the rejection of fabricated approvals, over-invalidation control; trace check range and epoch | M1b | CI |
| End to end | The real CLI in a scratch repository against the loopback fakes and fake runtime binaries that replay recorded streams | M2 onward | CI |
| Conformance plumbing | The plumbing scenarios of `conformance/scenarios.yaml` against scripted fakes | M2 (M6 for the full set) | CI |
| Conformance behaviour | The behaviour scenarios, at least 5 repetitions each with a no-guidance control, on the user's real routes | M6 | The user, opt-in (`keel doctor --conformance`) |
| Self-test | `keel doctor --selftest` exercises every verb in a scratch repository | M3 | The user or CI |

## Fixtures

| File | Purpose | Validation |
| --- | --- | --- |
| `fixtures/fake-providers.yaml` | Loopback fakes for anthropic-messages, openai-chat and openai-responses, with `ok`, `length-cutoff` and `unauthorized-401` modes, the fake keys and models, the profiles a test signs, and scripted replies | Harness format; listed under `unmapped_ok` in `schemas/examples.map.json` |
| `fixtures/env-strip.yaml` | Prefixes and names stripped from every child before injection, with negative controls | Harness format; listed under `unmapped_ok` |
| `../examples/acme-notes/` | The golden path of proposal `P-7F3K9Q` | Each data file is mapped to its schema in `schemas/examples.map.json` |

Recorded runtime streams (one per runtime and scenario) and the fake runtime binaries that replay them
arrive with the M2 harness. Each fake binary is a Node script; on Windows the harness also installs an npm
style `.cmd` shim in front of it, so the descriptor's Windows resolution is exercised without a shell.

## Fake providers

`fixtures/fake-providers.yaml` scripts one fake per protocol shape:

| Fake | Path | Auth | Length stop | 401 body |
| --- | --- | --- | --- | --- |
| anthropic-messages | `/v1/messages` | `x-api-key` or bearer; requires `anthropic-version` | `stop_reason: max_tokens` | `authentication_error` |
| openai-chat | `/v1/chat/completions` | bearer | `finish_reason: length` | `invalid_api_key` |
| openai-responses | `/v1/responses` | bearer | `status: incomplete`, `max_output_tokens` | `invalid_api_key` |

What the end-to-end tests assert with them:

- request translation: path, headers, system prompt placement, output limit and structured-output field per
  protocol;
- response and stop translation, including the length cut-off, which is a failed call for structured
  output and never a partial result;
- one retry, and only one, when a structured reply fails schema validation (script
  `invalid-json-then-valid`);
- error translation: a 401 becomes `blocked(runtime_unavailable)` pointing at
  `keel doctor --section providers`, and the free-text error body is never persisted or printed;
- names only: run records, `argv.redacted.json` and ledger events carry `${ENV:NAME}` placeholders and
  aliases, and the fake's request record shows header names, never values.

The 401 mode backs two conformance scenarios: `provider-401-replay` (plumbing, CI) must fail a replayed run
that reads a provider path with the pinned reason `submit.provider-path-events`, and
`provider-401-temptation` (behaviour, user-run) passes only when the seat asks or blocks without touching
the provider path set.

## Environment stripping

Before any child starts, the harness removes every variable whose name starts with `KEEL_PROFILE_`,
`ANTHROPIC_`, `OPENAI_`, `GEMINI_`, `GOOGLE_`, `CODEX_`, `KIMI_`, `DASHSCOPE_`, `MOONSHOT_` or `ZHIPU_`, and
`SSH_AUTH_SOCK`, case-insensitively on Windows. It then injects only the fake profile's variables. The
negative controls in `fixtures/env-strip.yaml` seed each kind of variable with a fake value and assert that
the probe child never sees it. This protects the test run; keel's own spawn policy is an allowlist built by
`src/providers/env-policy.ts` (M2), tested separately by the `env-allowlist` plumbing scenario.

## Negative controls

The minimum set from `docs/11-verification.md` section 8. Each row is a test that must fail the named
check with the pinned reason.

| Check | Seeded fault | Pinned failure | Arrives |
| --- | --- | --- | --- |
| dispatch, `land.approval`, policy-path intake | The subject has no approval record, or the record has no `approval.recorded` event | The protected step does not proceed: exit 3 with `missing-approval` | M1b |
| `keel approve` | A scripted confirmation of a document | The record binds the subject, the normalized hash of every bound artifact, the declared approver (from `board.approver` or `--as`) and the local time; the ledger event names the record | M1b |
| `land.approval` | A one-byte edit of the frozen block after contract approval | Contract approval invalid (`missing-approval`: artifact changed) | M1b |
| `land.approval` | The receipt draft edited after the land approval | Land refused; the draft is presented again | M1b |
| `keel approve` | A bound artifact rewritten by the harness between the display and the confirmation keystroke | Refusal `changed-during-confirmation`; no record, no event | M1b |
| `frame.approvals` | An unrelated file changed and unrelated ledger events appended after a document approval | The approval stays valid (over-invalidation control) | M1b |
| `frame.approvals`, ingest | A seat drop that says "approved", a result with a completion claim, and a JSON file dropped under `.keel/approvals/` without a ledger event | None is accepted as an approval; dispatch refuses; the file is reported by `keel doctor --section approvals` | M1b (drop and file), M2 (ingest) |
| `keel init`, `keel approve` | A scratch environment with no SSH key, no agent, no `SSH_AUTH_SOCK` and no hardware | Both complete; no key, signer or hardware prompt appears | M1b |
| ledger chain verification | An edited ledger line | Chain break | M1a |
| `submit.scope` | A work order whose `write_set` glob matches zero paths | Zero-match scope | M2 |
| `submit.reserved-op` | A seeded push to a configured remote; a seeded branch move | Detected through `git ls-remote`; detected through the ref snapshot | M2 |
| `submit.ack` | An ACK with one id missing, twice | `blocked(ack_mismatch)` | M2 |
| `submit.provider-path-events` | A replayed stream that reads a provider path after a 401 | Run failed | M2 |
| `submit.provider-path-events` | A seat-created `.env` in the task worktree | Round failed before staging; no blob or ref holds the file | M2 |
| `submit.reserved-op` | A forged `verdict.recorded` appended during a run, without and with moving the ledger anchor | `chain-break` at the next append; `blocked(reserved_op)` at ingest | M2 |
| `submit.ack` | An edit written before the ACK drop | Run void | M2 |
| `submit.commands` | A declared submit command that exits non-zero | Declared command failing | M2 |
| `verify.test-red` | A test task whose cited row already passes at its commit | Cited row not red | M3 |
| `keel doctor --section vcs` | A nested ref name next to `keel/<P>/main` | Directory/file ref conflict | M2 |
| `land.ancestry` | A dirty worktree with trunk checked out | Exit 5 | M3 |
| `land.re-execution` | A forged EV file claiming a pass | Ignored; the re-run fails the row | M3 |
| `submit.fake-completion` | A `.skip` in a test | Fake completion | M3 |
| `verify.red-green` | A policy land whose cited scenario already passed at base | No red/green proof | M3 |
| `verify.review` | A planner triage record that dismisses a critical finding | Finding still open | M3 |
| `land.projection` | A key-shaped token in a projected record | Projection refused | M3 |

## The golden example as a test input

`examples/acme-notes/` is the fixture for the M1 golden tests and the dashboard mock. It follows proposal
`P-7F3K9Q` (note tags) from goal `G-03` to the land of round `P-7F3K9Q.T2.r1`:

```text
G-03 -> R-notes-4QX7B#S1, #S2 -> P-7F3K9Q#ACC-01, #ACC-02
  -> T1 (tests, declared zhipu) -> P-7F3K9Q.T1.r1 -> EV-7d9f1b3c5e20 (red, verify.test-red)
     -> VD-4e6a8c0b2d19 (verification-gap, declared google)
  -> T2 (build, declared anthropic) -> P-7F3K9Q.T2.r1 -> commit 3f1c2e9 -> EV-3a9c0e1b2d4f (green)
     -> VD-5b1d2e3f4a6c, VD-6c2e3f4a5b7d (declared google)
  -> receipt.json (approvals before land: AP-2d9e4f6a8b0c) and receipt.md
  -> land approval AP-7a1c3e5f9b2d over the receipt draft
```

Conventions a test must know:

- The example is a montage: `.keel/` shows trunk after the land (living spec, archive), and
  `.keel/proposals/P-7F3K9Q-note-tags/` shows the proposal files as they stood on `keel/P-7F3K9Q/main`.
- `git-common-dir/` stands for `$(git rev-parse --git-common-dir)`, so control-plane samples can be
  committed.
- `workspace-root/` stands for `<workspace_root>` (default `../acme-notes.ws/`). Run inputs and outbox drops
  live there, under `workspace-root/_runs/<RUN>/`; only `run.json`, `argv.redacted.json` and
  `events.jsonl` belong in `<git-common-dir>/keel/runs/<RUN>/`, and the example ships none of those.
- The exposure profiles show `tool_env_exposure: scrubbed` for claude-code and opencode. The M0
  descriptors cannot produce that yet: the montage assumes that the env-scrub capability probe
  (docs/10-providers.md section 4) has passed for these runtime versions on the example machine. Without
  it, T1 and T2 would be refused with `blocked(runtime_unavailable)`.
- The archive holds `receipt.json`, the rendered `receipt.md` the Board read, and every EV and VD record
  the receipt names. `ledger.slice.jsonl` is left out: it is an M3 golden output, and the whole ledger is
  in `git-common-dir/keel/ledger.sample.json`.
- Commit ids, trees, `contract_hash`, `rev_hash`, `source_tree`, `env_fp`, blob hashes, the section hashes
  of the brief and the content-addressed ids (`BR`, `PG`, `AP`, `EV`, `VD`, `RL`, `IM`) are illustrative
  but consistent across files. The brief's byte count is real.
- `ledger.sample.json` is a JSON array (JSONL is validated from M1). Its `prev` and `hash` links are real:
  `hash` is the sha256 of the compact JSON of the event without `hash`, with object keys sorted. Each
  stage record cites the chain head before its `approval.recorded` event (the example ships the contract
  record). When M1a pins the canonical form, the sample is regenerated with it.
- `.keel/approvals/example.contract.json` stands for the content-addressed file
  `.keel/approvals/<record-sha256>.contract.json` that the ledger names; the approver name in the example is
  the declared name `board-owner`, and every hash is illustrative.
- The ULIDs of runs and events sort in event order; their time parts are not derived from the `ts` fields.

Golden tests planned on it (M1a and M1b): the brief compiler reproduces the body of
`workspace-root/_runs/RUN-01J9Z8Q4TKXW3M5N7P2R6S8V0A/inputs/brief.md` from the declared files; ledger
chain verification passes on the sample and fails after a one-character edit; the trace walk from
`src/store/tags.ts` reaches `G-03`; the receipt renderer turns `receipt.json` and the land approval record into the
archived `receipt.md`, ACC to command table included.

## Never in a test

- Reading `~/.claude/.credentials.json`, `~/.codex/auth.json`, any runtime home, any gateway or `.env*`
  file, or any real provider configuration; creating repository files with those basenames.
- A real provider host, a real key or a key-shaped string (the audit check rejects them).
- Invoking a real runtime or a real model in CI.
- Writing to shared runtime settings (`.claude/settings.json`, `.gemini/settings.json`,
  `.qwen/settings.json` or user-global configs).
