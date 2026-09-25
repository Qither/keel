# .keel/signatures

This directory holds the Board's signed approvals as committed, detached envelopes. Every clone can verify
them with nothing but git and `ssh-keygen`. keel creates the files; nobody edits them.

## What lands here

`keel approve` is the only way an envelope is made. It writes one JSON file per approval:

```text
.keel/signatures/<blob-sha256>.<kind>.json
```

- `<blob-sha256>` is the SHA-256 of the signed payload bytes, so the name is content-addressed and two
  approvals can never collide.
- `<kind>` says what was approved: a stage checkpoint (`contract`, `plan`, `land`, `receipt`), a governance
  document (`doc`), a standing policy (`policy`, signed with `keel approve --policy <name>`), a change
  request made with `keel new --policy` (`request`), a ruling (`rule`), or the first signer that
  `keel init` records on first use (`tofu`).

The Steward commits each envelope as soon as it is signed, so dispatch and land can verify it from git:

- governance documents, policies, the trust-on-first-use record and receipt acknowledgements: a governance
  commit on trunk (trailers `Keel-Doc` and `Keel-Approval`);
- contract, plan and request envelopes and rulings on a proposal: a governance-style commit on
  `keel/<P>/main` (the same two trailers; `Keel-Doc` names the envelope file), which reaches trunk with the
  proposal's archive commit;
- the land envelope: the archive commit itself, which also renders the Signed quote section of `receipt.md`.

The ledger refers to each envelope by its content-addressed id (for example `AP-` plus 12 hex characters); the
envelopes authenticate themselves.

## What an envelope binds

The exact shape is `schemas/approval.schema.json`. In substance an envelope binds:

- the stage or kind, and the subject (a proposal id, a document path, a request or a ruling subject);
- the commit the artifacts were read from;
- every approved artifact as `{path, sha256}` of its normalized bytes;
- the Board member's quoted consent (the signed quote);
- the approver's principal from `.keel/board/allowed_signers`;
- the ledger chain head at signing time, so later edits to the ledger before that head are detectable;
- a timestamp and a nonce;
- the ssh signature made with `ssh-keygen -Y sign -n keel-approval`.

Changing any approved byte invalidates the approval. A changed frozen intent, for example, blocks dispatch
and land until the Board signs the contract again.

## How keel verifies

- Signatures are checked with `ssh-keygen -Y verify` against `.keel/board/allowed_signers` as it stood at
  the last Board-signed trunk revision, never against a working-tree copy.
- The root signer's fingerprint is pinned in the signed charter. `keel init` records trust on first use
  here, with the owner's quoted consent.
- keel refuses to make or accept an approval while any allowed signer key is loaded in a reachable
  ssh-agent, unless it is a FIDO2 (`-sk`) key.

To check an envelope by hand, extract its payload and signature as `docs/14-trust-security.md` describes,
take the signer list from the last Board-signed trunk revision, and verify:

```text
git show <signed-revision>:.keel/board/allowed_signers > signers.txt
ssh-keygen -Y verify -f signers.txt -I <principal> -n keel-approval -s <signature-file> < <payload-file>
```

## Rules

- Do not edit, rename or delete files here. A damaged envelope simply stops verifying, and whatever it
  approved becomes unapproved.
- Envelopes contain hashes, paths, ids, principals and quotes only; never a key, token or endpoint.
- The dashboard is read-only and has no approval path. Approvals come only from `keel approve`, run by a
  Board member at an interactive terminal outside any keel run.
