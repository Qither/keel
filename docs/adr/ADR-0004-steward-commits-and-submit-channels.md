# ADR-0004 Steward commits and submit channels

## Status

Accepted on 2026-09-25, adopted by recommendation. Reversible through a superseding ADR.

## Context

Every landed line must trace back through trailers to a round, task, requirement and goal. If seats commit,
the trailers are only as honest as the seat, and a seat with commit rights can also move refs, write the
control plane and rewrite history. Hooks cannot stop that reliably: they fail open, they load only in
trusted projects, and some runtimes have no project hooks at all.

Seats also need a way to hand keel an ACK, rulings, asks and a result. The runtimes differ:

- some return a schema-checked final message (Codex `--output-schema` with `-o`; Claude Code and Qwen Code
  `--json-schema`, where Claude Code takes inline JSON and Qwen Code takes a literal or `@path`);
- some can call an MCP tool;
- read-only modes cannot write files, so a file drop is impossible there;
- a web chat (rung D) has none of these.

## Decision

1. Seats never commit. The Steward makes every commit:
   - at submit ingest it lists changed paths by name only (a provider-path hit stops the round before
     anything is staged), writes the tree through a temporary `GIT_INDEX_FILE` with exclude pathspecs for
     provider paths, runs `commit-tree -p <tip>` with the round trailers, and CAS-updates the task branch;
   - the submit gate then runs on that round commit; a failed round keeps its commit on the task branch as
     history and never enters verification;
   - it then runs `git -C <ws> read-tree HEAD`, so the task worktree's index matches the new HEAD (the files
     already do);
   - seat-made commits, if any, are preserved under `refs/keel/snap/<task>/seat-<n>` and never trusted;
   - governance documents reach trunk only through Steward governance commits with `Keel-Doc` and
     `Keel-Approval`.
2. Each runtime descriptor declares a `submit_channel` per mode, one of:
   - `final-message`: the runtime's native structured output, with `schema_flag_takes: inline | path`;
   - `mcp`: the `keel_submit` tool, whose only write is a drop in the run outbox (that MCP servers run
     outside the tool sandbox is to be verified by probe per runtime);
   - `outbox`: `O_EXCL` JSON drops through `keel api`, only in modes that can write.
3. Seats in read-only modes ACK through the structured final message of a short pre-run, or through MCP.
4. At rung D the human runs `keel api ack` and `keel api submit` with what the web chat produced.
5. The Steward captures drops at ingest from the child's channel, validates them against
   `schemas/ack|result|verdict.schema.json`, diffs ACK id sets against the brief, and never trusts
   seat-side checks.
6. An optional commit-msg hook (M2) adds trailers for interactive human sessions only.

```mermaid
sequenceDiagram
  participant S as Steward
  participant R as Seat runtime
  S->>R: spawn with brief, per-run config, submit channel
  R-->>S: ACK (final message, MCP keel_submit or outbox)
  S->>S: diff ACK id set, write_set, brief hash
  R-->>S: result drop
  S->>S: name-only listing; stop on a provider-path hit
  S->>S: temporary index, commit-tree + trailers, CAS update-ref
  S->>R: read-tree HEAD in the task worktree
  S->>S: submit gate on the round commit (scope, ratchet, ref snapshot, fake-completion)
```

## Consequences

- Trailers are written only by keel code, so the trace store is uniform across runtimes.
- Seat permissions can exclude git writes entirely; any ref change keel did not make is a reserved-operation
  finding ([05-vcs.md](../05-vcs.md)).
- Ingest must parse each runtime's stream format and channel; descriptors carry a parser id and a
  verification status per field ([09-runtimes.md](../09-runtimes.md)).
- Runtimes whose only non-interactive mode bypasses permissions (Kimi Code `-p`) stay at rung D until a
  safer mode is verified.
- The channel table per runtime and mode lives in [02-alignment.md](../02-alignment.md); the MCP write scope
  lives in [12-cli-api-mcp.md](../12-cli-api-mcp.md).

## Alternatives considered

- **Seats commit, and a hook adds trailers.** Rejected: hooks fail open and depend on trust layers, and
  commit rights let a seat move refs.
- **A loopback HTTP endpoint for submissions.** Rejected: it opens a port for every run, and the per-mode
  channels already cover every rung.
- **Seats append to the ledger directly.** Rejected: the ledger has one writer, and seat output is data,
  not authority.
- **Only file drops.** Rejected: read-only modes cannot write files.

## Sources

- oh-my-claudecode: a verdict-file contract for reviewers on other runtimes.
- OpenSpec: the one-JSON agent contract.
- jj-agentic-workflow (CodeAlive): the integrator as sole trunk writer.
- Runtime documentation for Claude Code, Codex CLI and Qwen Code structured output.
- The facts review pass: ACK and submit in read-only modes, inline schema for Claude Code.
- See [16-sources-credits.md](../16-sources-credits.md).
