# keel runtime descriptors

This directory holds the data that drives dispatch: one descriptor per runtime and the canonical hook
table. The design, the Windows spawn contract, the degradation rungs and the full verify-by-probe list
live in [docs/09-runtimes.md](../docs/09-runtimes.md); provider routing, in-memory injection and the
exposure rule live in [docs/10-providers.md](../docs/10-providers.md). This page renders the capability
matrix from the YAML for readers of the package. When this page and a descriptor disagree, the descriptor
wins, and `keel doctor --section runtimes` prints the same matrix for the installed versions.

## Files

| File | Content | Schema |
| --- | --- | --- |
| `claude-code.yaml` | Claude Code | `schemas/runtime-descriptor.schema.json` |
| `codex.yaml` | Codex CLI, with its probe list (trust on linked worktrees, the `OPENAI_BASE_URL` env route, `windows.sandbox`) | `schemas/runtime-descriptor.schema.json` |
| `gemini-cli.yaml` | Gemini CLI (not installed locally; the `--policy` probe gates writing seats) | `schemas/runtime-descriptor.schema.json` |
| `qwen-code.yaml` | Qwen Code | `schemas/runtime-descriptor.schema.json` |
| `kimi-code.yaml` | Kimi Code CLI (`bypass_equivalent: true`; rung D until verified) | `schemas/runtime-descriptor.schema.json` |
| `opencode.yaml` | opencode, the default GLM host and a vendor-neutral host for Qwen-, Kimi- and Gemini-family models | `schemas/runtime-descriptor.schema.json` |
| `direct.yaml` | keel's own tool-less direct lane (M6) | `schemas/runtime-descriptor.schema.json` |
| `hook-events.yaml` | Canonical hook events, their native names per runtime, blockability | `schemas/hook-events.schema.json` |

GLM and Gemini-family models are provider families (declared families `zhipu` and `google`), not
runtimes; they reach keel through the hosts above.

## Verification status

Every group of facts in a descriptor carries `verification_status`:

- `documented`: the vendor's documentation (or, for the direct lane, keel's own design documents) states it;
- `probed`: observed on a local binary (help text, strings in the binary, a dry run), without a keel
  conformance probe;
- `verified`: keel's own doctor probe passed on this binary version;
- `unverified`: no evidence yet. Verify by probe.

Only `verified` capabilities promote a rung or count as prevention in the exposure profile. Every
descriptor is `unverified` as a whole until the doctor probes pass on the installed version.

## Argv placeholders

`argv_template`, mode `argv`, `session.resume`, `session.fork`, `auth_argv` and `env_toggles` values use
`{placeholders}` that the dispatcher fills. A token that is exactly `{mode_argv}`, `{budget_argv}`,
`{session_argv}`, `{config_argv}` or `{auth_argv}` splices a list of tokens; any other placeholder is
replaced inside its token. No placeholder ever expands to an endpoint, a key or a model name.

| Placeholder | Filled with |
| --- | --- |
| `{fixed_prompt}` | `prompt_channel.fixed_prompt`, a fixed short instruction; never the brief |
| `{brief_path}` | `<run>/inputs/brief.md`, the compiled brief |
| `{run_dir}` | The run directory `<workspace_root>/_runs/<RUN>/` |
| `{workspace}` | The task or verify worktree (the child's working directory) |
| `{result_schema_path}` | `<run>/inputs/result.schema.json`, a copy of the seat's output schema (the verdict schema for reviewers) |
| `{result_schema_inline}` | The same schema minified into one argv token (`schema_flag_takes: inline`) |
| `{allowed_tools}` | The tool allowlist derived from the seat contract and its execution class |
| `{session_id}` | The session id keel minted or read from the stream |
| `{seat}` | The seat id, for example `engineer` |
| `{alias}` | The routing profile alias from the Board-signed `.keel/routing.yaml` |
| `{runtime_profile}` | The routing profile's `runtime_profile.profile` name (a name defined in the user's own runtime config) |
| `{mode_argv}` | The selected mode's `argv` |
| `{budget_argv}` | The descriptor's budget flags with the work order's limits |
| `{session_argv}` | `session.resume` or `session.fork` tokens, or nothing |
| `{config_argv}` | Codex `-c` keys that carry names only |
| `{auth_argv}` | The descriptor's `auth_argv` tokens for the routed profile's auth mode (Codex); nothing when the mode is not listed |
| `{workspace_root}` | The configured `workspace_root`; used only in `provider_path_set` entries |

## Capability matrix: invocation

| Runtime | Tested version | Binary (Windows resolution) | Prompt channel | Structured output | `schema_flag_takes` | Session | git |
| --- | --- | --- | --- | --- | --- | --- | --- |
| claude-code | 2.1.259 | `claude`, npm-shim-to-script (unverified) | file `--append-system-prompt-file` (documented) | native-schema `--json-schema` (documented) | inline | resume, fork (documented) | not required |
| codex | 0.154.0 | `codex`, npm-shim-to-script (unverified) | stdin (verified) | native-schema `--output-schema` plus `-o` (documented) | path | resume (documented) | required |
| gemini-cli | not installed | `gemini`, npm-shim-to-script (unverified) | stdin with fixed `-p` (unverified) | final message (unverified) | none | resume (unverified) | not required |
| qwen-code | 0.21.7 | `qwen`, npm-shim-to-script (unverified) | stdin with fixed `-p` (documented) | native-schema `--json-schema @path` (documented) | path | resume (documented) | not required |
| kimi-code | not installed (docs 2.1.0) | `kimi`, npm-shim-to-script (unverified) | file `--agent-file` plus fixed `-p` (unverified) | final message (unverified) | none | resume (documented) | not required |
| opencode | 1.18.18 | `opencode`, npm-shim-to-script (unverified) | file `-f` plus positional message (unverified) | outbox or MCP (documented) | none | resume, fork (unverified) | not required |
| direct | not built (M6) | keel child process (documented) | stdin (documented) | native-schema in the request body (documented) | none | none | not required |

Every spawn uses `shell: false`; npm `.cmd` and `.ps1` shims are resolved to the node entry script or the
native executable (docs/09-runtimes.md section 3).

## Capability matrix: enforcement

| Runtime | Hooks delivery | Env scrub | Permission mechanism | Trust (project layers) | Control plane | Bypass-equivalent |
| --- | --- | --- | --- | --- | --- | --- |
| claude-code | per-run settings, exit 2 blocks (documented) | `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` (candidate), expected unknown (unverified) | per-run settings with deny-read rules (documented) | always loaded (documented) | exposed | no |
| codex | none until the hook probe (unverified) | `shell_environment_policy`, expected unknown (unverified) | flags; no deny-read, reads are unrestricted (documented) | trusted only (documented) | sandboxed (writes only) | no |
| gemini-cli | printed snippet, exit 2 blocks (unverified) | no control recorded, expected unknown (unverified) | per-run `--policy` with deny-read rules (unverified) | trusted only (unverified) | exposed | no |
| qwen-code | printed snippet, exit 2 blocks (documented) | no control recorded, expected unknown (unverified) | flags; tool exclusions only, no deny-read (documented) | trusted only (documented) | exposed | no |
| kimi-code | user-global snippet, exit 2 blocks (documented) | no control recorded, expected unknown (unverified) | agent-file tools allowlist; deny rules only in the user-owned config (unverified) | none (unverified) | exposed | yes |
| opencode | none; plugin API not used in v1 (documented) | no control recorded, expected unknown (unverified) | per-run config and agent file with deny-read rules (documented) | always loaded (unverified) | exposed | no |
| direct | none (documented) | no tool subprocess, scrubbed (documented) | none; tool-less (documented) | none (documented) | sandboxed (tool-less) | no |

A code-executing seat is dispatched only when `tool_env_exposure` is `scrubbed` and `tool_file_exposure`
is `none` or `blocked`. `scrubbed` needs the env-scrub capability probe to pass on the installed version,
with the descriptor's control applied when it names one (claude-code and codex name a candidate; the others
name none, so their probe passes only if the runtime keeps provider variables out of tool subprocesses by
itself). No probe has passed in M0, so M0 descriptors let no runtime host the engineer yet; the refusal is
`blocked(runtime_unavailable)` with the doctor reason, and no ruling overrides it
(docs/10-providers.md section 4).

## Modes, seats and rungs

| Runtime | Mode | Execution class | Submit channel | Rung | Seats | Status |
| --- | --- | --- | --- | --- | --- | --- |
| claude-code | `plan` | read-only | final-message | A | product, architect, planner, reviewer | documented |
| claude-code | `accept-edits` | code-executing | outbox | A | engineer | documented |
| codex | `read-only` | read-only | final-message | C (A after the hook probe) | product, architect, planner, reviewer | documented |
| codex | `workspace-write` | code-executing | final-message | C (A after the hook probe) | engineer | documented |
| gemini-cli | `plan` | read-only | final-message | B | reviewer | unverified |
| gemini-cli | `auto-edit` | code-executing | outbox | B | none until the `--policy` probe passes | unverified |
| qwen-code | `plan` | read-only | final-message | C (A candidate after the hook probe) | product, architect, planner, reviewer | documented |
| qwen-code | `auto-edit` | code-executing | final-message | C (A candidate after the hook probe) | engineer | documented |
| kimi-code | `print` | code-executing | outbox | D | any seat, run by a human | documented |
| opencode | `read-only-agent` | read-only | mcp | C | product, architect, planner, reviewer | documented |
| opencode | `build-agent` | code-executing | outbox | C | engineer | documented |
| direct | `tool-less` | none | final-message | outside the ladder (`rung: null`) | reviewer | documented |

Native schema output is a capability of its own: codex and qwen-code keep it at rung C, but without a hook
that loads in a headless run nothing prevents an edit before the ACK. The submit channel is the result
channel. ACK channels per mode (for example a pre-run final message for read-only seats) are tabulated in
"ACK and submit channels" of docs/02-alignment.md. Every runtime can fall back to rung D.

## Providers

| Runtime | Protocols | Auth modes | Native names mapped in memory | Provider path set (names only; stat, never opened) |
| --- | --- | --- | --- | --- |
| claude-code | anthropic-messages | env, runtime-login | `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_MODEL` | `CLAUDE_CONFIG_DIR`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`, `~/.claude.json`, `.claude/settings.json`, `.claude/settings.local.json`, `.env*` |
| codex | openai-responses | env (after its probe), runtime-profile, runtime-login | `OPENAI_BASE_URL`, `OPENAI_API_KEY` | `CODEX_HOME`, `~/.codex/auth.json`, `~/.codex/config.toml`, `~/.codex/`, `.codex/config.toml`, `.env*` |
| gemini-cli | google | env, runtime-login | `GEMINI_API_KEY`, `GEMINI_MODEL` (unverified) | `~/.gemini/`, `.gemini/settings.json`, `.gemini/.env`, `.env*` |
| qwen-code | openai-chat, anthropic-messages | env, runtime-login | `OPENAI_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`; `ANTHROPIC_BASE_URL`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (unverified) | `~/.qwen/`, `.qwen/settings.json`, `.qwen/.env`, `.env*` |
| kimi-code | anthropic-messages, openai-chat, openai-responses, google | runtime-profile, runtime-login | none; the user's config names the key variable with `api_key_env` | `KIMI_CODE_HOME`, `~/.kimi-code/`, `.env*` |
| opencode | anthropic-messages, openai-chat, openai-responses | env | none; the per-run config references `{env:KEEL_PROFILE_...}` names | `~/.config/opencode/`, `~/.local/share/opencode/auth.json`, `opencode.json`, `.opencode/opencode.json`, `.env*` |
| direct | anthropic-messages, openai-chat, openai-responses | env | none; an opaque handle reaches the request builder | none (tool-less) |

Every set except the direct lane's also lists `{workspace_root}/_runs/*/raw/`. keel never writes a raw
runtime stream; the entry makes any capture left there by other tooling count as a provider path.

An incompatible route is refused at resolve time with `blocked(runtime_unavailable)`; there is no
fallback. Values live only in the user's environment; examples use the placeholders
`https://provider.example.invalid` (anthropic-messages), `https://provider.example.invalid/v1` (the OpenAI
protocols) and `<set-in-your-own-environment>` (docs/10-providers.md section 5).

## Budget flags and exit codes

| Runtime | Budget flags | Exit codes |
| --- | --- | --- |
| claude-code | `--max-budget-usd` (documented), `--max-turns` (unverified) | 0 completed, 1 failed, 143 killed (POSIX only) |
| codex | none | 0 completed, 1 failed, 143 killed (POSIX only) |
| gemini-cli | none | 0 completed, 1 failed, 42 input_error, 53 turn_limit, 143 killed (POSIX only) |
| qwen-code | `--max-session-turns`, `--max-wall-time`, `--max-tool-calls` (probed; hidden from `--help` in 0.21.7) | 0 completed, 1 failed, 42 input_error, 53 turn_limit, 55 budget, 143 killed (POSIX only) |
| kimi-code | none | 0 completed, 1 failed, 143 killed (POSIX only) |
| opencode | none | 0 completed, 1 failed, 143 killed (POSIX only) |
| direct | none | 0 completed, 1 failed, 143 killed (POSIX only) |

On Windows the outcome `killed` comes from keel's own cancellation journal, never from an exit code
(docs/06-parallelism.md).

## Hook events

`keel hook <canonical event> --runtime <id>` is the single entry point; `hook-events.yaml` is the only
home of the mapping. Hooks warn and gates decide: every hook fails open and journals a typed outcome.
opencode and the direct lane have no hook entries.

| Canonical event | claude-code | codex | gemini-cli | qwen-code | kimi-code |
| --- | --- | --- | --- | --- | --- |
| `session-start` | `SessionStart` [startup] (documented) | `SessionStart` (probed) | `SessionStart` (unverified) | `SessionStart` (documented) | `SessionStart` [startup] (documented) |
| `user-prompt-submit` | `UserPromptSubmit`, blocks (documented) | `UserPromptSubmit`, blocks (probed) | `BeforeAgent`, blocks (unverified) | `UserPromptSubmit`, blocks (documented) | `UserPromptSubmit`, blocks (documented) |
| `pre-tool-use` | `PreToolUse`, blocks (documented) | `PreToolUse`, blocks (probed) | `BeforeTool`, blocks (unverified) | `PreToolUse`, blocks (documented) | `PreToolUse`, blocks (documented) |
| `post-tool-use` | `PostToolUse` (documented) | `PostToolUse` (probed) | `AfterTool` (unverified) | `PostToolUse` (documented) | `PostToolUse` (documented) |
| `pre-compact` | `PreCompact`, blocks (documented) | `PreCompact` (probed) | `PreCompress` (unverified) | `PreCompact` (documented) | `PreCompact` (documented) |
| `post-compact` | `SessionStart` [compact] (documented) | `PostCompact` (probed) | `BeforeAgent`, blocks (unverified) | `PostCompact` (unverified) | `PostCompact` (documented) |
| `stop` | `Stop`, blocks (documented) | `Stop`, blocks (probed) | `AfterAgent`, blocks (unverified) | `Stop`, blocks (documented) | `Stop`, blocks (documented) |
| `subagent-start` | `SubagentStart` (documented) | `SubagentStart` (probed) | none | `SubagentStart` (unverified) | `SubagentStart` (documented) |

For codex, `probed` means the event name is present in the 0.154.0 binary; whether each event blocks or
injects is verify by probe. Claude Code's `PostCompact` output never reaches the model, so post-compaction
re-injection uses `SessionStart` with the `compact` matcher. Kimi's `PostCompact` is not registered by
keel's printed snippet; re-injection stays a pull with `keel brief` until a probe shows its output reaches
the model.

## Open probes

Each descriptor's `capability_probes` list is its verify-by-probe list. In M0:

| Runtime | verified | documented | probed | unverified |
| --- | --- | --- | --- | --- |
| claude-code | 0 | 2 | 0 | 8 |
| codex | 1 | 1 | 0 | 8 |
| gemini-cli | 0 | 0 | 0 | 9 |
| qwen-code | 0 | 0 | 2 | 7 |
| kimi-code | 0 | 0 | 0 | 8 |
| opencode | 0 | 0 | 0 | 8 |
| direct | 0 | 0 | 0 | 3 |

Until a probe passes on the installed version, keel takes the conservative path named in
docs/09-runtimes.md section 8 (a lower rung, a refused route, or a pull instead of an injection); no
unverified fact is assumed.
