# .keel/approvals

This directory holds the Board's approval records as committed JSON files. keel creates the files; nobody
edits them. Every clone can read them to see what was approved, by whom (as declared) and at which content
version; they are process history, not identity credentials.

## What lands here

`keel approve` is the only way a record is made. It writes one JSON file per approval:

```text
.keel/approvals/<record-sha256>.<kind>.json
```

- `<record-sha256>` is the SHA-256 of the record's normalized bytes, so the name is content-addressed and
  two approvals can never collide.
- `<kind>` says what was approved: a stage checkpoint (`contract`, `plan`, `land`, `receipt`), a governance
  document (`doc`), a standing policy (`policy`, approved with `keel approve --policy <name>`), a change
  request made with `keel new --policy` (`request`), or a ruling (`rule`).

The Steward commits each record as soon as it is written, so dispatch and land can check it from git:

- governance documents, policies and receipt acknowledgements: a governance commit on trunk (trailers
  `Keel-Doc` and `Keel-Approval`);
- contract, plan and request records and rulings on a proposal: a governance-style commit on
  `keel/<P>/main` (the same two trailers; `Keel-Doc` names the record file), which reaches trunk with the
  proposal's archive commit;
- the land record: the archive commit itself, which also renders the Land approval section of `receipt.md`.

The ledger refers to each record by its content-addressed id (`AP-` plus 12 hex characters) in an
`approval.recorded` event that the same `keel approve` process appends. A file here without that event is
not an approval.

## What a record binds

The exact shape is `schemas/approval.schema.json`. In substance a record binds:

- the stage or kind, and the subject (a proposal id, a document path, a request or a ruling subject);
- the commit the artifacts were read from;
- every approved artifact as `{path, sha256}` of its normalized bytes; these hashes are what the approval
  covers, and the record never hashes itself;
- the declared approver name (`board.approver` in `.keel/local.yaml`, or the name typed at confirmation);
- the local approval time;
- the ledger chain head at the time of the record, for consistency checks;
- an optional note the Board typed.

Changing any approved byte invalidates the approval. A changed frozen intent, for example, blocks dispatch
and land until the Board reads the change and approves the contract again. Changes to files the record
does not cover, other proposals' activity and ordinary ledger appends leave it valid.

## How keel checks

- At every gate the Steward re-hashes the bound artifacts and compares them with the record; it also
  requires the record's `approval.recorded` event on the verified ledger chain, a matching subject and
  kind, no superseding amendment and no expiry.
- The approver is a declared name and the time is the local clock. keel does not authenticate either, and
  the hashes bind content, not identity ([docs/14-trust-security.md](../../../docs/14-trust-security.md)).

## Rules

- Do not edit, rename or delete files here. A damaged record simply stops matching, and whatever it approved
  becomes unapproved.
- Records contain hashes, paths, ids, a name and a note only; never a key, token or endpoint.
- The dashboard is read-only and has no approval path. Approvals come only from `keel approve`, run by a
  Board member at an interactive terminal outside any keel run. Seat output, drops and files that claim
  approval are data, never an approval.
