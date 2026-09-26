# ADR-0006 Provider values by reference

## Status

Accepted on 2026-09-25. Follows the owner's standing preference P1; the choice not to record model names
was adopted by recommendation ([17-open-decisions.md](../17-open-decisions.md)).

## Context

The user sets every provider endpoint, API key and model name in their own environment and connects through
several protocols (anthropic-messages, openai-chat, openai-responses, google). keel must route seats to
these providers without ever holding the values in a file it reads, a record it writes, or a transcript.

The natural debugging move when a model call fails is to open the provider configuration. That move is
forbidden to keel, and a seat that can execute code might make it anyway by reading the user's credential or
provider files. A rule that says only "keel never reads values" is not verifiable, because keel must
dereference env values to spawn a runtime or call a provider from the direct lane.

## Decision

1. The invariant, stated so that it can be checked:
   - keel never opens a file that holds provider values, runtime credentials or shared runtime settings, in
     any mode;
   - keel reads env values only in memory, in exactly two modules: `src/providers/env-policy.ts` (building
     child environments at spawn and mapping `KEEL_PROFILE_*` names to native names) and
     `src/direct/client.ts` (unwrapping an opaque handle from env-policy at call time);
   - keel never persists, prints, logs, hashes or puts a value in argv;
   - a CI lint allows exactly these two modules to reference provider env names or unwrap the handle.
2. The committed, Board-approved `.keel/routing.yaml` holds names only: per alias a protocol from the common
   enum, a declared family, an auth mode (`env`, `runtime-login`, `runtime-profile`), env var NAMES
   (defaulting to `KEEL_PROFILE_<ALIAS>_BASE_URL`, `_API_KEY`, `_MODEL_FRONTIER` and so on), and a revision
   the user bumps when the model behind an alias changes.
3. Each runtime descriptor declares a names-only provider path set (home env var names, runtime credential
   locations, user-global configs, `.env*`). keel tests those paths with stat only.
4. Exposure rule, with no Board-acknowledgement path: a code-executing seat is dispatched only when
   `tool_env_exposure` is `scrubbed` and `tool_file_exposure` is `none` or `blocked`; otherwise the task is
   `blocked(runtime_unavailable)`. Ingest fails a run on any tool event touching the path set.
5. Concrete model names are not recorded (`policy.record_model_names: false`). Records hold alias, tier,
   declared family and revision. An optional check compares runtime-reported model ids of two lanes in
   memory and persists only "same" or "different".
6. Diagnosis goes through `keel doctor --section providers`, which prints variable NAMES as SET or UNSET,
   provider paths as PRESENT or ABSENT, compatibility and exposure, and never a value.
7. Documentation and tests use placeholders only: `https://provider.example.invalid/v1`,
   `<set-in-your-own-environment>`, fake keys `sk-fake-keel-*`, fake models `fake-frontier`,
   `fake-standard`, `fake-fast`, and loopback fakes on `http://127.0.0.1:<port>`.

## Consequences

- The user can change providers without touching committed files beyond the approved alias revision.
- Families are declared by the Board and shown as "declared", never "verified"; keel cannot inspect the
  endpoint.
- Many native Windows routes will not qualify for code-executing seats; those seats fall to routes with a
  verified scrub, and the isolated seat OS account is evaluated in M6
  ([17-open-decisions.md](../17-open-decisions.md)).
- Codex serves custom endpoints only after an env-only route is verified by probe.
- Tests never read the user's environment or configuration; the harness strips provider variables before
  injecting fakes.
- The routing format, compatibility table, injection per runtime and doctor output live in
  [10-providers.md](../10-providers.md); the exposure profile and its limits live in
  [14-trust-security.md](../14-trust-security.md).

## Alternatives considered

- **A sealed reader that opens a user value file but never prints it.** Rejected: it still opens the file,
  its guarantees cannot be verified from outside, and it would ship a schema for a file keel must not
  read.
- **Values stored in keel config or an OS keychain managed by keel.** Rejected: values belong to the user,
  outside keel.
- **A Board acknowledgement that allows a code-executing seat on an exposed route.** Rejected by P1.
- **Recording runtime-reported model names by default.** Rejected: model names are provider values under
  P1.
- **A local proxy or router that holds the keys.** Rejected: keel is not an LLM router or proxy.

## Sources

- The owner's standing preference P1 and the rule that assistants never read the provider configuration.
- The cross-runtime research behind [09-runtimes.md](../09-runtimes.md): provider protocols and credential
  locations per runtime.
- oh-my-codex: a capability matrix, reused for the exposure profile.
- The compliance review pass: provider path sets, deny-read rules, the "provider 401 temptation" scenario.
- See [16-sources-credits.md](../16-sources-credits.md).
