# ADR-0009 TanStack for every frontend

## Status

Accepted on 2026-09-25. Decided by the owner (P2, clause 7 of the statement in
[00-mandate.md](../00-mandate.md)). This ADR decides the technology of every frontend keel ships;
[ADR-0008](ADR-0008-read-only-dashboard.md) owns the dashboard's read-only rule, serve boundary and single
approval path. The choice of the React adapter and of pre-rendering were adopted by recommendation and are
reversible ([17-open-decisions.md](../17-open-decisions.md)).

## Context

ADR-0008 fixed the dashboard as native HTML with hand-written CSS and about 300 lines of vanilla
JavaScript, following the owner's earlier standing preference. On 2026-09-25 the owner replaced that
preference: where keel has a frontend display, TanStack must be used. The dashboard (M5) is keel's only
planned frontend, and the rule covers any later one.

Constraints that do not move:

- one self-contained file that opens from disk, with no external requests;
- read-only, with one approval path ([ADR-0005](ADR-0005-explicit-confirmation-approvals.md), ADR-0008);
- one DashboardModel behind CLI `--json`, the MCP tools and the page;
- honest views: text labels, visible denominators, a deterministic architecture layout (KP-12);
- keel's runtime dependency surface stays as [ADR-0002](ADR-0002-node-windows-native.md) lists it;
- native Windows build and CI.

TanStack is a family of headless libraries (Router, Query, Table, Virtual, Form, Store) with adapters for
React, Solid, Vue and Svelte, plus TanStack Start, a full-stack framework. Headless means the libraries
manage state and behaviour and render nothing; the markup belongs to the application.

## Decision

1. Every frontend keel ships is built with TanStack libraries on the React adapter: TanStack Router with
   hash history, so that a view can be linked (`#/trace`) and the page still works from `file://`; all
   eight views are always in the tree, and the matched route only sets `aria-current` on the nav, scrolls
   to the view and carries search-param state (sort, filter, selected element), never mounting or
   unmounting a view. TanStack Query for loading the model, with `initialData` from the embedded model in
   build mode and invalidation on server-sent events in serve mode; in build mode the model query has no
   fetch function, `staleTime: Infinity` and refetching disabled, so the page performs no request of any
   kind, and only serve mode registers the `/api/model` fetcher. TanStack Table for every tabular view (the
   RTM, gate results, the capability and conformance matrices, findings). TanStack Virtual for long lists
   (the change feed, the ledger tail, the symbol list), each pre-rendered in full, with Virtual taking over
   only after the first user scroll. Form and Store are not needed by a read-only page and are not used.
2. Headless only. The rendered markup keeps the native elements and the accessibility rules of
   [08-dashboard.md](../08-dashboard.md): `table` with `caption` and `th scope`, `details` and `summary`,
   `dialog`, `meter` and `progress` with visible denominators, native inputs, inline SVG. CSS stays
   hand-written custom-property tokens with light and dark values and a system font stack. No UI kit, no
   CSS framework, no icon font, no web font, no CDN.
3. Pre-rendered, then hydrated. `keel dashboard build` renders the React tree to static HTML with the model
   embedded in a `<script type="application/json">` block, inlines the client bundle and writes one file.
   The static HTML shows every view without JavaScript: all eight views are always rendered, pre-rendered
   and hydrated alike, each as a `section` whose `id` equals its route path so the fragment works as an
   anchor, and long lists are pre-rendered in full. JavaScript adds sorting, filtering, search, overlays,
   the element dialog and live refresh. Hydration must not change the markup: an M5 golden test hydrates at
   a fixed set of locations (at least `#/` and one deep link) and compares the trees.
4. Bundled, not depended upon. The frontend and its libraries are compiled at package build time into two
   self-contained bundles shipped inside the npm package: a render bundle that keel imports to pre-render,
   and the client bundle that it inlines. `react`, `react-dom` and the `@tanstack/*` packages are
   development dependencies of keel and never entries in `dependencies`, so the runtime dependency list of
   [ADR-0002](ADR-0002-node-windows-native.md) is unchanged and no frontend code loads for any other
   command. The bundler is chosen in M5 and runs only at package build.
5. Determinism. The same model and keel version produce a byte-identical page: a pinned lockfile, no build
   timestamps or random ids in the bundle, and a freshness stamp that comes from the model alone.
6. Serve mode is unchanged from ADR-0008: loopback only, Host and Origin checks, `GET` and `HEAD`,
   `/api/model` and server-sent events, and no write endpoints. Query invalidates the model on events.
7. Budgets, checked in M5: the page under 2 MB for a 5,000-file fixture; inline JavaScript under 600 KB
   minified (the client bundle only; the embedded model JSON counts toward the page budget); zero external
   requests; every view readable without JavaScript.

## Consequences

- The page is larger than the vanilla design by a few hundred kilobytes of libraries, and still one file
  under the 2 MB budget.
- A build toolchain enters keel's development dependencies at M5; nothing enters the runtime dependencies.
- Framework churn becomes a risk keel carries (RK-15 in [15-roadmap.md](../15-roadmap.md)). The lockfile
  pins versions, the libraries are headless and the model is framework-independent, so a migration touches
  `src/dashboard/` only.
- Pre-render plus hydrate means two rendering paths; the golden test that they agree is the price of
  keeping the readable-without-JavaScript guarantee.
- The static mock `examples/dashboard/sample.html` stays hand-written in M0. It illustrates the markup and
  token rules that the TanStack page must reproduce.
- [17-open-decisions.md](../17-open-decisions.md) records React and pre-rendering as adopted by
  recommendation.

## Alternatives considered

- **Native HTML with vanilla JavaScript and no library.** Rejected by P2, which requires TanStack for every
  frontend display.
- **TanStack on Solid, Vue or Svelte.** The React adapters are the most complete across Router, Query,
  Table and Virtual; reversible if the owner prefers another adapter.
- **TanStack Start.** Rejected: a full-stack framework assumes a server, while keel's page must open from
  disk and serve mode is an optional read-only add-on.
- **A UI kit or component library on top of TanStack.** Rejected: the markup must stay native (P2 and
  the accessibility rules of KP-12).
- **A client-only single-page application without pre-render.** Rejected: it would drop the
  readable-without-JavaScript guarantee and the honest fallback when a browser blocks scripts on `file://`.
- **A runtime dependency on React.** Rejected: it contradicts the dependency surface of ADR-0002, and
  bundling gives the same result without it.

## Sources

- The owner's statement ([00-mandate.md](../00-mandate.md), clause 7).
- TanStack public documentation: Router, Query, Table and Virtual, their adapters, and the headless design.
- [ADR-0008](ADR-0008-read-only-dashboard.md) for everything this ADR keeps.
- See [16-sources-credits.md](../16-sources-credits.md).
