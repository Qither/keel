/**
 * Board-approved routing: provider profiles by NAME, seat routes, declared families, the resolved route,
 * protocol compatibility, and the per-proposal routing snapshot.
 *
 * @packageDocumentation
 * Mirrors schemas/routing.schema.json and schemas/routing-snapshot.schema.json. The user owns every
 * provider value (P1): endpoints, keys and model names live only in the user's own environment or secret
 * manager. Routing holds names only: environment variable names, aliases, protocol, declared family and
 * auth mode; no field can hold an endpoint, a key or a model name. The default variable names and the
 * mapping to native names belong to `./env-policy.ts` (M2). Families are Board declarations, shown as
 * "declared" everywhere, never verified facts. An incompatible or unavailable route is
 * `blocked(runtime_unavailable)`; there is no fallback and never a silent engine switch. Implemented in M2.
 */
import type {
  ApprovalId,
  AuthMode,
  ConformanceStatus,
  EnvVarName,
  Family,
  IsoDateTime,
  Lens,
  ProfileAlias,
  Protocol,
  ProposalId,
  RuntimeId,
  Seat,
  Sha256,
  TaskLocalId,
  Tier,
  ToolEnvExposure,
  ToolFileExposure,
} from "../core/ids.js";
import type { FamilyPair } from "../org/seats.js";
import type { ExposureProfile, ProviderPathProbe } from "../runtime/exposure.js";

export type { AuthMode, Protocol } from "../core/ids.js";

/** A family as the Board declares it in routing; receipts and the dashboard label it "declared". */
export type DeclaredFamily = Family;

// ---- routing.yaml ----

/** Names of the variables that hold a profile's values; defaults are owned by env-policy. */
export interface ProfileEnvNames {
  base_url?: EnvVarName;
  api_key?: EnvVarName;
  model?: Partial<Record<Tier, EnvVarName>>;
}

/** A runtime-held profile: the variable naming the runtime home, and the profile inside it. */
export interface RuntimeProfileRef {
  home_env: EnvVarName;
  profile: ProfileAlias;
}

/** One provider profile, by alias. */
export interface ProviderProfile {
  protocol: Protocol;
  family: DeclaredFamily;
  auth: AuthMode;
  env?: ProfileEnvNames;
  runtime_profile?: RuntimeProfileRef | null;
  /** Bumped by the user whenever the model behind the alias changes. */
  revision: number;
  /** A reminder to check the user's own plan terms; never a URL. */
  tos_note?: string;
}

/** A runtime, profile alias and tier binding. */
export interface RouteBinding {
  runtime: RuntimeId;
  profile: ProfileAlias;
  tier: Tier;
}

/** A seat's route: runtime, profile alias and tier, plus independence and the engineer's test route. */
export interface SeatRoute extends RouteBinding {
  /** For the reviewer, checked per lens against the seat that wrote the reviewed artifact. */
  independent_of?: Seat[];
  /**
   * Engineer only: the route of test-first tasks; its declared family must differ from the engineer
   * route's (`plan.test-independence`).
   */
  test_route?: RouteBinding | null;
}

/** Routing policy. */
export interface RoutingPolicy {
  no_silent_fallback: true;
  /** Off by default: runtime-reported model names are dropped from persisted events. */
  record_model_names: boolean;
  allow_degraded: boolean;
}

/** `.keel/routing.yaml`, Board-approved; dispatch refuses without a valid document approval. */
export interface RoutingFile {
  profiles: Record<ProfileAlias, ProviderProfile>;
  seats: Partial<Record<Seat, SeatRoute>>;
  policy: RoutingPolicy;
}

// ---- Resolution ----

/** A resolved route, frozen into run records, snapshots and receipts. */
export interface Route {
  runtime: RuntimeId;
  alias: ProfileAlias;
  tier: Tier;
  declared_family: DeclaredFamily;
  protocol: Protocol;
  revision: number;
}

/**
 * Protocols each runtime can serve, read from each descriptor's `provider.protocols` (the single home of
 * the table).
 */
export type CompatibilityTable = Readonly<Record<RuntimeId, readonly Protocol[]>>;

/** The compatibility verdict for one route. */
export interface CompatibilityVerdict {
  runtime: RuntimeId;
  protocol: Protocol;
  compatible: boolean;
}

/** Why a route cannot be dispatched; every refusal is `blocked(runtime_unavailable)` with this reason. */
export type RouteRefusal =
  | "routing-unapproved"
  | "no-route"
  | "incompatible-protocol"
  | "runtime-missing"
  | "runtime-below-min-version"
  | "exposure-rule"
  | "conformance-failed";

/** The result of resolving a seat's route at dispatch. */
export type RouteResolution =
  | { ok: true; route: Route; exposure: ExposureProfile; conformance_status: ConformanceStatus }
  | { ok: false; blocked: "runtime_unavailable"; refusal: RouteRefusal; doctor_hint: string };

// ---- routing.snapshot.yaml ----

/** One seat's frozen route in a proposal. */
export interface SnapshotRoute {
  seat: Seat;
  tasks: TaskLocalId[];
  lenses?: Lens[];
  route: Route;
  conformance_status: ConformanceStatus;
  exposure: ExposureProfile;
}

/** A deviation from the approved routing; on feature it makes plan approval required. */
export interface RoutingDeviation {
  seat: Seat;
  tasks: TaskLocalId[];
  reason: string;
}

/** `.keel/proposals/<P>-<slug>/routing.snapshot.yaml`, written by the Steward, bound by the plan approval when one is required. */
export interface RoutingSnapshot {
  proposal: ProposalId;
  routing: { blob: Sha256; approval: ApprovalId };
  taken_at: IsoDateTime;
  routes: SnapshotRoute[];
  deviations: RoutingDeviation[];
  independence: FamilyPair;
}

// ---- doctor --section providers ----

/** SET or UNSET only (`name in process.env`); a value is never read for this. */
export type EnvNameState = "SET" | "UNSET";

/** One profile block of `keel doctor --section providers`. */
export interface ProviderDoctorReport {
  alias: ProfileAlias;
  protocol: Protocol;
  declared_family: DeclaredFamily;
  names: { name: EnvVarName; state: EnvNameState }[];
  paths: ProviderPathProbe[];
  seats: Seat[];
  compatibility: CompatibilityVerdict[];
  /** The effective auth mode, never verified by reading files. */
  auth_mode: AuthMode;
  tool_env_exposure: ToolEnvExposure;
  tool_file_exposure: ToolFileExposure;
  /** The same declared family on engineer and reviewer. */
  family_collapse: boolean;
}
