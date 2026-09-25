# ADR-0002 Node and native Windows

## Status

Accepted on 2026-09-25. Decided by the owner (D3). The distribution choice (npm first) was adopted by
recommendation ([17-open-decisions.md](../17-open-decisions.md)).

## Context

The owner works on native Windows, and keel must run there without tmux, WSL, Docker, bash or python in the
core design. Most of the agent CLIs keel drives are Node programs installed through npm, which on Windows
places `.cmd` and `.ps1` shims on the PATH. Windows imposes constraints a POSIX-first design would miss:

- spawning a `.cmd` through a shell with untrusted arguments is a command-injection risk (CVE-2024-27980),
  and Node refuses to spawn `.cmd` files without a shell since that fix;
- command lines are limited (8191 characters through `cmd.exe`, 32767 through `CreateProcess`);
- there are no POSIX signals: Node's `kill()` is always forceful, `taskkill` without `/F` cannot end console
  processes, and exit code 143 means nothing;
- symlinks need privileges, paths can exceed 260 characters, and checkouts may convert line endings.

keel also needs YAML parsing and JSON Schema validation, and must hash text identically on every OS.

## Decision

1. keel is written in TypeScript for Node ≥ 22.13, as ES modules, with `strict` type checking.
2. Node built-ins come first: `node:child_process` (`spawn` with `shell: false`), `node:crypto`,
   `node:fs`, `node:http` for the optional loopback dashboard server, and `node:sqlite` for the derived
   `trace.db` (built without a flag from Node 22.13 but still experimental: verify by probe per Node
   version; the database is derived and can always be rebuilt).
3. Runtime dependencies are limited to `yaml` (YAML 1.2 core schema) and `ajv` with its `ajv-formats`
   companion. No native addons. In M0 they are development dependencies used only by
   `scripts/validate.mjs`; `package.json` has no `dependencies` and no `bin` (D1). They move to runtime
   dependencies in M1.
4. The Windows spawn contract, part of every runtime descriptor:
   - resolve npm `.cmd`/`.ps1` shims to the underlying node script or `.exe`, and never spawn with
     `shell: true`;
   - deliver prompts through stdin or files; argv carries only a fixed short string;
   - build the child environment from an allowlist ([10-providers.md](../10-providers.md));
   - cancel by closing stdin, waiting a grace period, then `taskkill /PID <pid> /T /F`; record "killed" from
     keel's own cancellation journal; interpret exit 143 on POSIX only;
   - whether a force-killed session can be resumed is to be verified by probe per runtime.
5. Hash inputs are normalized to LF, without BOM, in Unicode NFC, so golden hashes match on a Windows CRLF
   checkout and on Linux.
6. keel writes copies, never symlinks; it expects `core.longpaths=true`; hook and shim scripts ship as an
   extensionless sh script, a `.cmd` and a `.ps1` (M2).
7. CI runs on windows-latest and ubuntu-latest with Node 22.13 and 24.
8. Distribution is an npm package first; a Node single executable application is evaluated after M6.

## Consequences

- The dependency surface is two packages plus their companions, and nothing needs a compiler on install.
- Windows is a first-class CI target, so Windows-only failures surface on every change.
- The spawn contract adds per-runtime descriptor fields (Windows resolution, prompt channel, exit-code map)
  that must be probed and kept current ([09-runtimes.md](../09-runtimes.md)).
- The derived trace index depends on an experimental built-in; losing it costs a rebuild, never data.
- keel cannot lean on POSIX tools (`flock`, bash, signals) anywhere in the core; locks use `O_EXCL` files and
  git CAS refs.

## Alternatives considered

- **Python or a bash orchestration layer.** Rejected by D3.
- **Go or Rust single binary.** Rejected: D3 chose TypeScript, the agent CLI ecosystem is Node-based, and a
  single executable remains possible through Node SEA later.
- **tmux, WSL or Docker for isolation and process control.** Rejected by D3; process control uses the spawn
  contract instead, and isolation limits are reported honestly ([14-trust-security.md](../14-trust-security.md)).
- **A native SQLite addon.** Rejected: native addons complicate Windows installs; the trace index is derived
  and `node:sqlite` suffices.
- **Node SEA as the first distribution.** Deferred until after M6.

## Sources

- superpowers: Windows lessons (spawn, symlinks, line endings).
- The runtime research behind [09-runtimes.md](../09-runtimes.md): npm shim resolution, argv limits and exit
  codes per CLI.
- Node.js security advisory CVE-2024-27980.
- Blueprint proposals B (ajv) and C (Windows spawn contract).
- See [16-sources-credits.md](../16-sources-credits.md).
