# Keel

[简体中文](README.zh-CN.md) · **Stage A · 2026-10-08 · English canonical · not yet released**

Keel is a command-line control plane for engineering work that must outlive the conversation, the model and the vendor that happened to perform it. Stage A covers one unit of work: a WorkItem with one Task and one executor, with its authorization, budget, durable state, evidence, stop and recovery paths. It is derived from the Keel Constitution v0.1.0; every mechanism in [docs/DESIGN.md](docs/DESIGN.md) names its source.

Stage A does not call a model, use credentials, or touch the network. The executor is a local process; richer executors, substitution, concurrency and any interface beyond the terminal belong to later stages and are not claimed here.

## Install and build

Requires Node ≥ 22 and git on `PATH`. There are no runtime dependencies.

```bash
npm ci
npm run build
node dist/cli.js help
```

`npm test` builds and runs the 16 cohort cases plus their 16 fault-injected twins. `npm run demo` runs the cohort and writes `demo/out/transcript.json` with every command, exit status, stdout, stderr and the environment, plus its sha256.

## Use

1. Write a work spec (JSON). The workspace must be a git repository the executor may write into.

   ```json
   {
     "goal": "write hello",
     "scope": "artifacts/",
     "workspace": "./ws",
     "acceptance": {
       "criteria": [
         { "id": "c1", "statement": "artifacts/hello.txt exists", "required": true, "evidence_mode": "artifact-exists", "path": "artifacts/hello.txt" }
       ]
     },
     "task": {
       "steps": [
         { "id": "s1", "kind": "exec", "argv": ["node", "-e", "require('fs').mkdirSync('artifacts',{recursive:true});require('fs').writeFileSync('artifacts/hello.txt','hi')"], "writes": ["artifacts/hello.txt"] }
       ]
     }
   }
   ```

   `evidence_mode` is one of `artifact-exists` (`path`), `artifact-hash` (`path`, `sha256`), `command-exit-status` (`step`, optional `expected_status`), `human-confirmation`.

2. Create the WorkItem, confirm a Grant, run, verify, accept:

   ```bash
   keel work create --spec work.json
   keel grant --allow exec:node --allow write:artifacts/** --attempts 3 --elapsed-seconds 60
   # shows the proposed Grant and its hash, exits 4; confirm by retyping the first 8 hash characters:
   keel grant --allow exec:node --allow write:artifacts/** --attempts 3 --elapsed-seconds 60 --confirm <8 chars> --approver <your name>
   keel run
   keel verify
   keel accept
   keel show
   keel log check
   ```

   Every verb accepts `--json` and `--state-dir <dir>` (default `./.keel`). When exactly one WorkItem exists its id may be omitted.

3. When something goes wrong: `keel stop` requests cancellation; `keel recover` reconciles an interrupted run against the workspace before anything is repeated, and `keel recover --abandon` records an explicit abandonment; `keel decide` lists and resolves decision requests raised when a step would exceed the Grant or a budget; `keel context add` records facts, decisions, inferences or summaries for the next run; `keel evidence submit` delivers a late result or a human confirmation.

Exit statuses: `0` done · `1` a check or acceptance failed · `2` usage · `3` refused by a rule (the message names the rule's source) · `4` waiting on a human decision · `5` an authoritative record is missing or inconsistent.

## State

Everything lives under the state directory: content-hashed document versions, one hash-linked append-only event log, raw executor output, and a convenience projection that is never read back. Hashes are over canonical JSON, so line endings never matter. See [docs/DESIGN.md §2](docs/DESIGN.md#2-state-directory-and-authority).

## Status

Stage A is a bounded validation under the research topic SA-01. Its adoption into the product and any public release are separate owner decisions that have not been made. Licence: to be chosen at the first public release.
