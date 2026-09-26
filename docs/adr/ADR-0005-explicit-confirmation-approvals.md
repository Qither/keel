# ADR-0005 Explicit-confirmation Board approvals

## Status

Accepted on 2026-09-26. Decided by the owner (D6, clause 6 of the statement in
[00-mandate.md](../00-mandate.md)).

## Context

Board approvals are keel's only source of authority: contract, plan, land and receipt checkpoints;
governance documents (charter, goals, routing, policies); policy-path requests; and rulings. The owner
asks for two things of them: a human decides after viewing the specific change, and what runs is exactly
what was approved. The owner explicitly does not ask keel to defeat a malicious program running under the
same operating-system account, and rules out SSH signatures, key management, signer lists, ssh-agent
checks, hardware key checks, presence verification and any separate identity system.

That rules out a cryptographic design, and it also settles what an honest local design can promise. On
native Windows most agent CLIs run with the user's full file rights, so any record keel writes can be
rewritten by a process of the same user; keel therefore promises consistency checks and refusals inside
its own cooperative flow, and states the limit instead of claiming an authenticity it cannot provide.

## Decision

1. **A Board approval is an explicit confirmation of a shown change.** `keel approve` shows the subject and
   its specific change (the reading list of `org/checkpoints.yaml`, the bound artifacts and their diff
   against the last approved version), and the Board confirms by typing the confirmation word. A bare
   Enter or a generic "continue" is not an approval; the confirmation applies only to the subject and the
   content version that were shown.
2. **The record binds subject, hashes, approver and time.** The Steward writes
   `.keel/approvals/<record-sha256>.<kind>.json` (`AP-<sha12>`) holding the kind and stage or rule, the
   subject, the commit, every bound artifact as `{path, sha256}` of its normalized bytes, the contract hash
   or request text or land binding when the kind has one, an optional note, the declared approver, the
   ledger chain head and the local approval time. The record never hashes itself. The shape is
   `schemas/approval.schema.json`; the flow is in [02-alignment.md](../02-alignment.md).
3. **Approved content that changes invalidates the approval.** At every gate the Steward re-hashes the
   bound artifacts and compares them with the record. Any difference is `missing-approval`: the Board must
   view the change and approve again. Changes to files the record does not cover, other proposals'
   activity and ordinary ledger appends do not invalidate it. Between showing and recording, `keel approve`
   re-hashes once more and refuses (`changed-during-confirmation`) if anything moved, so a confirmation is
   never bound to content the Board did not see.
4. **Only `keel approve` makes approvals.** An approval exists when its record was written by `keel approve`
   and its `approval.recorded` event was appended by that same process, under the ledger writer lock,
   outside any run window. A file that appears under `.keel/approvals/` without that event, a seat drop or
   final message that claims approval, a ledger line whose actor says `board`, and a seat's completion
   claim are data, never an approval. `keel approve` keeps refusing under `KEEL_RUN`, `KEEL_RUN_ID` and a
   keel-run ancestor, and it waits for the supervisor lock like every other mutating verb.
5. **The approver is a declared name and the time is the local clock.** The name comes from
   `board.approver` in `.keel/local.yaml`, from `--as`, or is typed at confirmation. keel records it and
   does not authenticate it. No account system, key, signer list or presence check is introduced.
6. **Nothing compensates for the guarantees keel does not give.** No resident service, no authentication
   system, no isolation architecture. The controls that hold are listed below.

```mermaid
sequenceDiagram
  participant B as Board
  participant K as keel approve (Steward)
  participant G as git
  participant L as ledger
  K->>K: refuse under KEEL_RUN or a keel-run ancestor; wait for the supervisor lock
  K->>B: reading list, bound artifacts, diff against the last approved version
  B-->>K: confirmation word (+ optional note, approver name if not configured)
  K->>K: re-hash the bound artifacts; refuse if anything changed since it was shown
  K->>G: commit .keel/approvals/<sha256>.<kind>.json
  K->>L: append approval.recorded under the writer lock
  Note over K: at every later gate: re-hash, compare, require the event on the verified chain
```

## Consequences

### What keel guarantees

- Seat output cannot approve or advance a protected state; approvals come only from `keel approve` at an
  interactive terminal outside any run.
- The Steward checks the approval subject, kind and content version at every gate; a one-byte change to a
  frozen block, a plan file, a governance document or a receipt draft invalidates the approval that covered
  it.
- Amendments, expiries (overrides, policies), revocation of standing policies, receipt acknowledgements and
  the land preconditions (a land approval over the draft, or an approved land policy plus an approved
  request plus the red/green proof) apply as before.
- Evidence re-execution at land, the scope check, the trace check, ref snapshots and the single-writer
  ledger with its anchor ref hold independently of approvals. The chain head in each record lets
  `keel audit` detect an edit of events before that head.
- The dashboard stays read-only with no approval path ([ADR-0008](ADR-0008-read-only-dashboard.md)).

### What keel does not claim

- Approval records do not authenticate themselves, cannot be verified as genuine on an arbitrary clone,
  and do not prove that a named person acted. On a clone they are process history.
- The approver field is a declared local identity; the approval time is the local clock, not a trusted
  timestamp; the artifact hashes bind content, not identity.
- The hash chain and the chain heads in records are consistency checks. They do not resist a process with
  the user's rights that rewrites records, ledger lines and the anchor together. That threat is out of
  scope by the owner's statement.
- No ledger event verifies itself, so the window check at ingest accepts only the supervising process's
  own appends; every other event, an `approval.recorded` included, is foreign.
- The Board's daily path needs nothing beyond a terminal: no key, no signer list, no hardware, no signing
  command. `keel init` needs none of them either. M1b's exit criteria are the seven approval behaviours
  listed in [15-roadmap.md](../15-roadmap.md) and `test/README.md`.

## Alternatives considered

- **SSH signatures (`ssh-keygen -Y`) over the record, verified against a committed signer list, with a
  fail-closed check for agent-held keys and FIDO2 hardware keys.** Rejected by the owner. It defends
  against same-account malware, which is out of scope; it makes every approval need a key, a passphrase or
  a touch, a signer principal, a public-key list and an environment variable, and blocks initialization
  without a key; it puts unverified platform facts (FIDO2 `-sk` on Windows `ssh-keygen`, the agent pipe)
  on the critical path; and it invites the overclaim that a record authenticates itself and proves who
  acted, which an agent-reachable key on native Windows cannot support. An optional signature mode is
  rejected for the same reasons: no dual-track approval.
- **GPG or git commit signatures.** Rejected for the same reasons, and because commits are Steward-made.
- **A confirmation code or one-time token per approval.** Rejected: it is another credential to manage
  with no gain over the explicit confirmation for the guarantees the owner asks for.
- **A resident approval service or a separate seat OS account.** Rejected: the guarantee they would
  restore is not required.

## Sources

- old-coder: consent bound to a version (the explicit confirmation of a shown version, with an optional
  note).
- superpowers: an approval binds only the presented artifact.
- BMAD-METHOD: intent frozen after approval.
- The owner's mandate, clause 6 ([00-mandate.md](../00-mandate.md)).
- See [16-sources-credits.md](../16-sources-credits.md).
