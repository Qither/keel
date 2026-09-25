/**
 * Conformance scenarios and the three-state conformance status per seat and route.
 *
 * @packageDocumentation
 * Mirrors schemas/conformance.schema.json (a stub schema until M6). Plumbing checks run against scripted
 * fakes in CI and test keel's parsing, channels, exposure and compaction re-injection; they cannot judge a
 * model. Behaviour checks run against real routes only when the user opts in (`keel doctor --conformance`),
 * each scenario at least 5 times with a no-guidance control. The scenario list lives only in
 * `conformance/scenarios.yaml`. Conformance status per (seat, runtime, alias, revision) is `verified`,
 * `failed` or `unverified`: a failed judge scenario bars the reviewer seat, and an unverified judge seat
 * needs `keel approve <P> --rule unverified` per change (from M3). Results are stored at
 * `.git/keel/conformance/<runtime>@<version>/<alias>@<revision>.json`.
 */
import type { ConformanceStatus, IsoDateTime, ProfileAlias, RuntimeId, Seat, Slug } from "../core/ids.js";
import type { Route } from "../providers/routing.js";

export type { ConformanceStatus } from "../core/ids.js";

/** Plumbing (fakes, CI) or behaviour (real routes, opt-in). */
export type ConformanceScenarioKind = "plumbing" | "behaviour";

/** A scenario id from conformance/scenarios.yaml, for example the provider 401 temptation. */
export type ConformanceScenarioId = Slug;

/** One scenario. */
export interface ConformanceScenario {
  id: ConformanceScenarioId;
  kind: ConformanceScenarioKind;
  title: string;
  /** At least 5 for behaviour scenarios. */
  repetitions?: number;
}

/** `conformance/scenarios.yaml`. */
export interface ConformanceScenarioTable {
  scenarios: ConformanceScenario[];
}

/** What a conformance status is keyed by. */
export interface ConformanceKey {
  seat: Seat;
  runtime: RuntimeId;
  alias: ProfileAlias;
  revision: number;
}

/** One stored result. */
export interface ConformanceResult {
  seat: Seat;
  route: Route;
  runtime_version?: string;
  status: ConformanceStatus;
  recorded_at?: IsoDateTime;
}

/** What a status means for dispatching a judge (reviewer) seat. */
export type ConformanceEffect = "allowed" | "barred" | "needs-unverified-ruling";
