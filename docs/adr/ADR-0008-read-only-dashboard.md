# ADR-0008 Read-only dashboard

## Status

Accepted on 2026-09-25. The technology rule follows the owner's standing preference P2; read-only operation
was adopted by recommendation. Reversible through a superseding ADR.

## Context

The Board needs one place to see goals, proposals, the trace matrix, architecture, the org, evidence,
runtime health and the change feed. Dashboards tend to grow action buttons, and an "approve" button would
create a second approval path that bypasses the signed, key-hygiene-checked `keel approve`
([ADR-0005](ADR-0005-signed-board-approvals.md)). A local web server with write endpoints would also be a
target for any page the user's browser loads.

P2 requires native HTML elements and hand-written CSS, with no frameworks.

## Decision

1. `keel dashboard build` renders one self-contained HTML file (default
   `.git/keel/cache/dashboard/index.html`, or `--out`). It uses the same DashboardModel as `--json` output
   and the MCP tools, so the dashboard never computes its own states or denominators.
2. Technology: native elements (header and nav, tables with caption and scope, details and summary, dialog,
   meter and progress with visible denominators, search inputs, fieldset checkboxes, inline SVG) and
   hand-written CSS with custom-property tokens for light and dark themes and no web fonts. The page reads
   fully without JavaScript; at most about 300 lines of vanilla JavaScript add filtering, search, overlays
   and refresh. No frameworks, widget libraries or CDN.
3. `keel dashboard serve` is optional: `node:http` on `127.0.0.1` with an ephemeral port, Host and Origin
   checks, a read-only `/api/model` and server-sent events tailing the ledger. There are no write
   endpoints.
4. Board actions appear only as copyable `keel approve …` commands, which the Board runs in a terminal.
5. The shell and CSS are written in M5; M0 ships only the static mock `examples/dashboard/sample.html`.

## Consequences

- Authority has exactly one path: the terminal and a Board key. The dashboard cannot be used to approve,
  even by a page that reaches the loopback server.
- The serve mode needs no authentication because it exposes no writes; the Host and Origin checks guard
  against DNS rebinding reads.
- The Board copies commands instead of clicking; that friction is intended.
- The page must stay under 2 MB for a 5k-file repository and render the same states and denominators as the
  `--json` golden tests (M5 exit).
- Views, layout and accessibility rules live in [08-dashboard.md](../08-dashboard.md).

## Alternatives considered

- **A web app with approve and ruling buttons.** Rejected: a second approval path outside key hygiene and
  interactive confirmation.
- **A frontend framework or widget library.** Rejected by P2.
- **A hosted dashboard.** Rejected: keel is local-first and not a hosted service.
- **CLI output only.** Rejected: the architecture view, trace matrix and Board queue need a visual overview;
  the CLI keeps `--json` for scripts.

## Sources

- axumquant/arch-viewer: a self-contained HTML/SVG view with click-through detail and a change feed.
- codegraph: loopback Host and Origin checks.
- The owner's standing preference P2.
- See [16-sources-credits.md](../16-sources-credits.md).
