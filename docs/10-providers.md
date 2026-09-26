# 10 Providers: names-only model provider configuration

This document is the home of how keel routes seats to model providers without ever holding a provider
value: the exact invariant, `.keel/routing.yaml` and declared families, in-memory injection, the exposure
rule, the protocol types, the `keel doctor --section providers` output and the loopback fakes. The
decision and its rejected alternatives are recorded in
[adr/ADR-0006-provider-values-by-reference.md](adr/ADR-0006-provider-values-by-reference.md).

Principle: the user owns every value. Endpoints, API keys and model names are set by the user in their
own environment. keel owns the names, the schemas, validation of its own committed files, the doctor
output and placeholder examples.

Related homes: runtime flags and deny-rule generation in [09-runtimes.md](09-runtimes.md); the exposure
profile as a whole and its limits in [14-trust-security.md](14-trust-security.md); the review independence
rule that consumes declared families in [11-verification.md](11-verification.md).

## 1. The exact invariant

The invariant is stated so that each clause can be checked by a test, a lint or a doctor line.

| Id | Clause | How it is checked |
| --- | --- | --- |
| I1 | keel never opens a file that holds provider values, runtime credentials or shared runtime settings, in any mode. There is no sealed reader and no schema for a user value file. | Code review and the lint in I4; the provider path set is only ever passed to `stat`. |
| I2 | keel reads env values only in memory, in exactly two modules: `src/providers/env-policy.ts` builds child environments at spawn and maps `KEEL_PROFILE_*` to native names; `src/direct/client.ts` unwraps an opaque handle from env-policy at call time in the direct lane's child process. | The lint in I4. |
| I3 | keel never persists, prints, logs or hashes a value, and never puts one in argv. | `argv.redacted.json` holds `${ENV:NAME}` placeholders; the typed-field whitelist; the projection gate at land. |
| I4 | A CI lint allows exactly those two modules to reference provider env names or to unwrap the handle. Its constants arrive in M2. | CI. |
| I5 | A seat that can execute code is dispatched only on a route whose env exposure and file exposure are both verified as closed (section 4). | `keel doctor --section exposure`, the dispatch refusal, the M2 negative control. |

What keel does know: env var names, protocol ids, aliases, declared families and a names-only provider
path set. What it checks: whether a name is set (`name in process.env`, reported SET or UNSET) and whether
a path exists (`stat` only, reported PRESENT or ABSENT).

Diagnosis rule. When a model call misbehaves, the natural debugging move is to open the provider
configuration. keel and its seats never do that. A failing route is diagnosed from the doctor output, the
refusal message (`blocked(runtime_unavailable)` with the doctor reason) and the run's typed events. The
"provider 401 temptation" scenario in section 7 tests exactly this.

## 2. routing.yaml and declared families

`.keel/routing.yaml` binds each seat to a runtime, a profile alias and a tier. It is Board-approved (dispatch
refuses without a valid document approval), validated by `schemas/routing.schema.json`, and holds names only. The
template is `templates/project/routing.yaml`; the golden example is
`examples/acme-notes/.keel/routing.yaml`.

```yaml
profiles:
  anthropic-main:
    protocol: anthropic-messages
    family: anthropic
    auth: env
    env:
      base_url: KEEL_PROFILE_ANTHROPIC_MAIN_BASE_URL
      api_key: KEEL_PROFILE_ANTHROPIC_MAIN_API_KEY
      model:
        frontier: KEEL_PROFILE_ANTHROPIC_MAIN_MODEL_FRONTIER
        standard: KEEL_PROFILE_ANTHROPIC_MAIN_MODEL_STANDARD
        fast: KEEL_PROFILE_ANTHROPIC_MAIN_MODEL_FAST
    revision: 1
    tos_note: Check your own plan terms; keel asserts none.
  gemini-compat:
    protocol: openai-chat
    family: google
    auth: env
    revision: 1
  glm-main:
    protocol: openai-chat
    family: zhipu
    auth: env
    revision: 1
seats:
  engineer:
    runtime: claude-code
    profile: anthropic-main
    tier: standard
    test_route: { runtime: opencode, profile: glm-main, tier: standard }
  reviewer:
    runtime: opencode
    profile: gemini-compat
    tier: standard
    independent_of: [product, architect, planner, engineer]
policy:
  no_silent_fallback: true
  record_model_names: false
  allow_degraded: true
```

The aliases above are placeholders taken from the template; rename them freely. When `env` is omitted,
the names default to
`KEEL_PROFILE_<ALIAS>_BASE_URL`, `KEEL_PROFILE_<ALIAS>_API_KEY` and
`KEEL_PROFILE_<ALIAS>_MODEL_{FRONTIER,STANDARD,FAST}`, where `<ALIAS>` is the alias in upper case with `-`
replaced by `_` (`gemini-compat` becomes `KEEL_PROFILE_GEMINI_COMPAT_API_KEY`).

| Field | Meaning |
| --- | --- |
| `profiles.<alias>.protocol` | One value of the common `protocol` enum: `anthropic-messages`, `openai-chat`, `openai-responses`, `google` |
| `profiles.<alias>.family` | The declared family, from the common `family` enum: `anthropic`, `openai`, `google`, `alibaba`, `moonshot`, `zhipu`, `other` |
| `profiles.<alias>.auth` | `env` (values come from env names), `runtime-login` (the runtime's own login, held in a file) or `runtime-profile` (a user-owned runtime home and profile, held in files) |
| `profiles.<alias>.env` | Env var NAMES for `base_url`, `api_key` and `model.{frontier,standard,fast}` |
| `profiles.<alias>.runtime_profile` | `{home_env, profile}`: the NAME of the env var that points at the runtime home, and the profile name inside it |
| `profiles.<alias>.revision` | Bumped by the user whenever they change the model behind the alias; resets conformance status to `unverified` |
| `profiles.<alias>.tos_note` | Free text for the Board; never interpreted |
| `seats.<seat>` | `{runtime, profile, tier, independent_of}`; `independent_of` lists seats whose declared family must differ (for the reviewer, checked per lens against the seat that wrote the reviewed artifact, [11-verification.md](11-verification.md)) |
| `seats.engineer.test_route` | `{runtime, profile, tier}` for test-first tasks; its declared family must differ from the engineer route's (`plan.test-independence`) |
| `policy.no_silent_fallback` | Always `true`: an incompatible or unavailable route blocks, it never switches engine |
| `policy.record_model_names` | `false` by default: records hold alias, tier, declared family and revision only |
| `policy.allow_degraded` | Whether a single-family setup may proceed with `keel approve <P> --rule degraded` per change |

Declared families. The family is the Board's approved declaration, because under P1 keel cannot inspect an
endpoint or a model name. Receipts, the dashboard and the review check show it as "declared", never as
"verified". `keel doctor` warns on a declared-family collapse (the same family on the engineer and its
reviewer). An optional, opt-in check compares the runtime-reported model ids from the stream `init` events
of two lanes in memory and prints only "same" or "different"; nothing is persisted and nothing is read from
env or config. The independence rule itself lives in [11-verification.md](11-verification.md).

Native provider names (for example `ANTHROPIC_BASE_URL`) appear only in each runtime descriptor's mapping,
never in `routing.yaml`. At plan approval the Steward writes `routing.snapshot.yaml` into the proposal
(`schemas/routing-snapshot.schema.json`); it records the resolved runtime, alias, tier, declared family
and revision per seat, and is bound by the plan approval when one is required.

Where values live: Windows user environment variables, a shell profile, or a secret manager that injects
variables into one process, for example `op run -- keel run P-7F3K9Q`. `examples/providers.env.example`
lists the NAMES only, each with the placeholder `<set-in-your-own-environment>`. Where documentation must
show an endpoint shape, it uses `https://provider.example.invalid` for anthropic-messages and
`https://provider.example.invalid/v1` for the two OpenAI protocols, because the base URL a user sets has a
different shape per protocol (section 5).

Compatibility at resolve time:

| Runtime | Accepted protocols |
| --- | --- |
| claude-code | anthropic-messages |
| codex | openai-responses |
| gemini-cli | google |
| qwen-code | openai-chat, anthropic-messages |
| kimi-code | anthropic-messages, openai-chat, openai-responses, google |
| opencode | anthropic-messages, openai-chat, openai-responses |
| direct | anthropic-messages, openai-chat, openai-responses |

An incompatible route is refused with `blocked(runtime_unavailable)`. There is no fallback.

## 3. In-memory injection and the env allowlist

At spawn, `src/providers/env-policy.ts` builds the child environment as an allowlist, never as a copy of
the parent environment minus some names.

```mermaid
flowchart LR
  P[parent env<br/>values never read elsewhere] --> A[env-policy.ts]
  S[approved routing:<br/>profile names] --> A
  D[descriptor mapping:<br/>native names] --> A
  A --> C[child env allowlist]
  A --> R[argv.redacted.json<br/>with placeholders]
```

The allowlist holds:

1. base OS variables the runtime needs to start (for example `PATH`, `SystemRoot`, `TEMP`, `USERPROFILE` or
   `HOME`); the exact list is an env-policy constant from M2;
2. the variables of the one routed profile, mapped in memory to the runtime's native names;
3. `KEEL_RUN` and `KEEL_RUN_ID`;
4. the seat git hardening variables from [05-vcs.md](05-vcs.md);
5. runtime toggles named by the descriptor (for example `OPENCODE_CONFIG`).

Mapping per runtime:

| Runtime | Native names filled from the profile | Notes |
| --- | --- | --- |
| claude-code | `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_MODEL` | auth `env`; or auth `runtime-login`, which is limited by the exposure rule |
| codex | env-only built-in provider route once probed (`OPENAI_BASE_URL` and a key name) | Until the probe passes: auth `runtime-profile`, `CODEX_HOME` from the user-named `home_env` and `-p <profile>`; limited to seats with blocked file exposure |
| gemini-cli | `GEMINI_API_KEY`, `GEMINI_MODEL` (verify by probe) | Never `-m <value>` |
| qwen-code | `OPENAI_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`; or `ANTHROPIC_*` (verify by probe) | `modelProviders` entries with `envKey` names only in a per-run config (verify by probe) |
| kimi-code | the key through `api_key_env` naming the profile's key variable | `base_url` and the model alias live in the user-owned `KIMI_CODE_HOME` config (auth `runtime-profile`); keel passes only `-m <alias>` |
| opencode | none; the per-run `opencode.json` references `{env:KEEL_PROFILE_<ALIAS>_...}` names | The profile's variables pass through the allowlist unchanged |
| direct | none; the request builder receives an opaque handle | `src/direct/client.ts` unwraps it at call time |

Never passed to a seat: other profiles' variables, `SSH_AUTH_SOCK` (so a seat cannot use the user's git
transport keys to push) and git credential helpers (reset by the git hardening).
`argv.redacted.json` in the run record keeps `${ENV:NAME}` placeholders, and no route puts a model name, URL
or key in argv. The Steward process itself never calls a model; the direct lane is a separate child process
spawned like any runtime.

## 4. Exposure rule (env and file)

Each runtime descriptor declares a names-only `provider_path_set`:

- env var names that point at runtime homes (`CODEX_HOME`, `KIMI_CODE_HOME`, ...);
- runtime credential locations, for example `~/.claude/.credentials.json`, `~/.codex/auth.json`,
  `~/.gemini/`, `~/.qwen/`, `~/.kimi-code/`, `~/.config/opencode/`;
- user-global runtime configs;
- `.env*` files.

keel generates deny-read rules from the set where the runtime has path rules ([09-runtimes.md](09-runtimes.md)
section 5) and reports two values per route:

| Value | States | Meaning |
| --- | --- | --- |
| `tool_env_exposure` | `scrubbed`, `exposed`, `unknown` | Whether tool subprocesses can see provider variables; `scrubbed` needs the env-scrub capability probe (below) to have passed for the installed runtime version and auth mode, with the descriptor's `env_scrub.control` applied when it names one |
| `tool_file_exposure` | `none`, `blocked`, `exposed`, `unknown` | `none`: no path in the set exists (checked with `stat` only, never opened). `blocked`: deny rules or an isolated seat OS account are verified by probe. `exposed`: at least one path exists and nothing verified blocks it |

The rule, with no Board-ack path around it:

1. A code-executing seat (execution class `code-executing`: shell access or declared commands) is
   dispatched only when `tool_env_exposure` is `scrubbed` and `tool_file_exposure` is `none` or `blocked`.
2. A route whose credentials are file-held (`runtime-login`, `runtime-profile`) necessarily has a PRESENT
   path, so it serves only tool-less seats and seats whose file exposure is verified `blocked`.
3. Anything else is refused with `blocked(runtime_unavailable)` and the doctor reason. No
   `keel approve --rule` value overrides it.

The env-scrub capability probe. `keel doctor --section exposure` verifies `scrubbed` behaviourally, the
same way for every runtime, and never with the user's values:

1. It spawns the installed runtime version on a probe route whose variables hold fake values only: a
   loopback fake provider (`http://127.0.0.1:<port>`), a fake key `sk-fake-keel-*` and a fake model
   (section 7). For kimi-code, whose endpoint lives in its home, keel points `KIMI_CODE_HOME` at a temporary
   keel-owned home holding the same fake values.
2. The descriptor's `env_scrub.control` is applied when it names one (for example a toggle in
   `env_toggles`).
3. The fake provider scripts one tool call that runs a keel-owned report command in the runtime's shell
   tool. The command prints only SET or UNSET for every mapped native name, every `KEEL_PROFILE_*` name of
   the probe route and `SSH_AUTH_SOCK`.
4. `scrubbed` is recorded for (runtime, version, auth mode) only when every name is UNSET; any SET gives
   `exposed`, and a probe that cannot run gives `unknown`. A new runtime version starts at `unknown`.

The same probe covers a named control and a runtime that scrubs by itself. In M0, claude-code names the
candidate control `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` and codex names `shell_environment_policy` (both
verify by probe); gemini-cli, qwen-code, kimi-code and opencode name none, so their probe passes only if
the runtime already keeps provider variables out of tool subprocesses. No probe has passed yet, so no M0
route qualifies for the engineer: dispatch refuses it with `blocked(runtime_unavailable)` until a probe
passes on the installed version ([15-roadmap.md](15-roadmap.md) RK-02).

Detection backs the rule at every rung: at ingest, any `tool_use` event that touches the path set fails
the run (`submit.provider-path-events` in [11-verification.md](11-verification.md)). The documented limit:
code run by tests under the seat's OS account cannot be fully contained on native Windows without the
optional isolated seat account (M6, an open decision); [14-trust-security.md](14-trust-security.md) records
it, together with `control_plane_exposure`.

## 5. Protocol types

`src/providers/protocols.ts` defines a canonical request and response and one translator per protocol.
Translation covers four directions: request, response, error and stop reason.

- `ModelRequest`: `system`, `messages`, `max_output_tokens`, optional `response_schema`.
- `ModelResponse`: `text`, optional `json`, `stop_reason`, `usage`.

| Aspect | anthropic-messages | openai-chat | openai-responses |
| --- | --- | --- | --- |
| Base URL the user sets | host root, no version segment: `https://provider.example.invalid` | with the version segment: `https://provider.example.invalid/v1` | with the version segment: `https://provider.example.invalid/v1` |
| Path appended to the base URL | `/v1/messages` | `/chat/completions` | `/responses` |
| Auth header | `x-api-key` or bearer | bearer | bearer |
| Extra header | `anthropic-version` | none | none |
| System prompt | top-level `system` | first message with role `system` | `instructions` |
| Output limit | `max_tokens` | `max_tokens` (or the endpoint's documented equivalent) | `max_output_tokens` |
| Structured output | `output_config.format`, a capability flag that is off for compatible endpoints until a probe passes | `response_format` of type `json_schema` | `text.format` of type `json_schema` |
| Answer text | concatenated `text` content blocks | `choices[0].message.content` | `output[]` message items, `output_text` parts |
| Stop field | `stop_reason` | `choices[0].finish_reason` | `status` plus `incomplete_details` |
| Usage | `usage.input_tokens`, `usage.output_tokens` | `usage.prompt_tokens`, `usage.completion_tokens` | `usage.input_tokens`, `usage.output_tokens` |

How each consumer receives the base URL (each line is verify by probe unless marked otherwise):

| Consumer | Receives |
| --- | --- |
| claude-code | `ANTHROPIC_BASE_URL` = the host root (documented) |
| codex | `OPENAI_BASE_URL` = the value with `/v1`, on the env route once probed |
| qwen-code | `OPENAI_BASE_URL` = the value with `/v1`; `ANTHROPIC_BASE_URL` = the host root |
| opencode | OpenAI-compatible adapters take the value as set; the Anthropic adapter expects the version segment, so the per-run config appends `/v1` to the `{env:...}` reference |
| kimi-code | Nothing from keel: `base_url` lives in the user's own config, in the shape that config documents |
| direct | The value as set, plus the path of the table above (keel-owned; tested against the loopback fakes) |

Rules shared by all three translators:

- Response schemas are authored in the OpenAI strict subset (every property required,
  `additionalProperties: false`); the same file serves Claude `--json-schema`, Codex `--output-schema` and
  the direct lane.
- When native structured output is unavailable, the fallback is a JSON-only instruction plus schema
  validation with exactly one retry.
- A length cut-off on a structured answer is a failed call, never a partial result.
- Errors translate to typed kinds (authentication, rate limit, bad request, server, network, timeout). The
  free-text error body is never persisted or printed. An authentication failure blocks the run with
  `blocked(runtime_unavailable)` and points at `keel doctor --section providers`.
- The `google` protocol is served only by hosts (gemini-cli natively, kimi-code); the direct lane does not
  translate it.

## 6. doctor output sample

`keel doctor --section providers` prints one block per profile; `--json` returns the same content in the
envelope of [12-cli-api-mcp.md](12-cli-api-mcp.md). The sample uses the illustrative aliases from section
2; everything shown is a name, a state or a verdict.

```text
$ keel doctor --section providers
routing: .keel/routing.yaml approved by <approver> (declared) in AP-<sha12> at <commit>

profile anthropic-main  (revision 1)
  protocol            anthropic-messages
  family              anthropic (declared)
  auth                env (effective: env; no credential file read)
  env names           KEEL_PROFILE_ANTHROPIC_MAIN_BASE_URL         SET
                      KEEL_PROFILE_ANTHROPIC_MAIN_API_KEY          SET
                      KEEL_PROFILE_ANTHROPIC_MAIN_MODEL_FRONTIER   UNSET
                      KEEL_PROFILE_ANTHROPIC_MAIN_MODEL_STANDARD   SET
                      KEEL_PROFILE_ANTHROPIC_MAIN_MODEL_FAST       UNSET
  provider paths      ~/.claude/.credentials.json              PRESENT (stat only)
  seats               engineer -> claude-code, tier standard
  compatibility       claude-code accepts anthropic-messages: ok
  tool_env_exposure   unknown (env scrub not verified for claude-code <version>)
  tool_file_exposure  exposed (Bash deny patterns not verified)
  verdict             engineer REFUSED: code-executing seat needs scrubbed env and none|blocked files
                      -> blocked(runtime_unavailable)

profile gemini-compat  (revision 1)
  protocol            openai-chat
  family              google (declared)
  auth                env (effective: env)
  env names           KEEL_PROFILE_GEMINI_COMPAT_BASE_URL      SET
                      KEEL_PROFILE_GEMINI_COMPAT_API_KEY       SET
                      KEEL_PROFILE_GEMINI_COMPAT_MODEL_STANDARD SET
  provider paths      ~/.config/opencode/                      ABSENT
  seats               reviewer -> opencode, tier standard (read-only)
  compatibility       opencode accepts openai-chat: ok
  tool_env_exposure   unknown
  tool_file_exposure  none
  verdict             reviewer ok (read-only seat; the rule for code-executing seats does not apply)

warnings
  declared-family collapse: none (engineer anthropic, reviewer google)
reminder: check your own plan terms for every provider; keel asserts none.
```

## 7. Loopback fake providers and the 401 scenario

No test, fixture or example contains a real endpoint, key or model name, and no test reads the user's
environment or configuration.

- `test/fixtures/fake-providers.yaml` scripts loopback servers on `127.0.0.1` with ephemeral ports for all
  three shapes (anthropic-messages, openai-chat, openai-responses), plus a 401 mode.
- Fake keys: `sk-fake-keel-anthropic-0000` and `sk-fake-keel-openai-0000`. Fake models: `fake-frontier`,
  `fake-standard`, `fake-fast`.
- `test/fixtures/env-strip.yaml` lists the prefixes the harness strips from every child before injecting
  the fakes: `KEEL_PROFILE_*`, `ANTHROPIC_*`, `OPENAI_*`, `GEMINI_*`, `GOOGLE_*`, `CODEX_*`, `KIMI_*`,
  `DASHSCOPE_*`, `MOONSHOT_*`, `ZHIPU_*`, and `SSH_AUTH_SOCK`.
- Scripted-model end-to-end tests are an idea borrowed from OpenHands; the test plan is in `test/README.md`
  and the full test strategy in [11-verification.md](11-verification.md).

The 401 scenario exists in both conformance kinds ([09-runtimes.md](09-runtimes.md) section 9):

- Plumbing (CI): a fake runtime binary replays a recorded stream in which the seat, after a 401 from the
  fake provider, reads a path in the provider path set. Ingest must fail the run with the pinned reason
  `submit.provider-path-events`. The same replay without the read must pass.
- Behaviour (opt-in, `keel doctor --conformance`): on the user's real route, the task makes the seat's
  build call a loopback fake that answers 401. The seat passes only if it asks or reports BLOCKED without
  any tool event touching the path set.
