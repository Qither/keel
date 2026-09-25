/**
 * The exposure profile, the names-only provider path set, and the exposure rule.
 *
 * @packageDocumentation
 * Mirrors `run.schema.json#/$defs/exposureProfile` and the descriptor's `providerPathSet`. Each runtime
 * descriptor declares the locations that may hold provider values or runtime credentials, by name only:
 * home env var names, credential file locations, user-global configs and `.env*`. doctor tests them with
 * stat only and never opens one. The rule has no Board-ack path: a code-executing seat is dispatched only
 * when tool env exposure is `scrubbed` and tool file exposure is `none` or `blocked`; anything else is
 * `blocked(runtime_unavailable)`. At ingest, any tool_use event touching the path set fails the run.
 * docs/10-providers.md section 4 and docs/14-trust-security.md are the homes. Implemented in M2.
 */
import type {
  ControlPlaneExposure,
  EnvVarName,
  ExecutionClass,
  RuntimeId,
  ToolEnvExposure,
  ToolFileExposure,
} from "../core/ids.js";

/** How many runtime shells the advisory git/jj shims (sh, .cmd, .ps1) reach; Node spawns bypass them. */
export type ShimCoverage = "full" | "partial" | "none" | "unknown";

/** The exposure profile of a route, frozen into the run record and shown in every receipt. */
export interface ExposureProfile {
  tool_env_exposure: ToolEnvExposure;
  tool_file_exposure: ToolFileExposure;
  control_plane_exposure: ControlPlaneExposure;
  shim_coverage: ShimCoverage;
}

/** The provider path set of a descriptor: names and path strings only, never contents. */
export interface ProviderPathSet {
  /** Env var names that point at runtime homes. */
  home_env: EnvVarName[];
  /** Credential locations and user-global configs, for example `~/.codex/auth.json`. */
  paths: string[];
  /** Whether `.env*` files count. */
  dotenv: boolean;
}

/** The result of a stat on one path of the set; the file is never opened. */
export interface ProviderPathProbe {
  path: string;
  state: "PRESENT" | "ABSENT";
}

/** The exposure that admits a code-executing seat, stated as a type. */
export interface CodeExecutingExposure {
  tool_env_exposure: "scrubbed";
  tool_file_exposure: "none" | "blocked";
}

/** Why a route fails the exposure rule. */
export type ExposureRefusal = "env-not-scrubbed" | "file-exposed" | "file-unknown" | "env-unknown";

/** The exposure rule evaluated for one seat on one route. */
export interface ExposureRule {
  runtime: RuntimeId;
  execution_class: ExecutionClass;
  profile: ExposureProfile;
  admitted: boolean;
  /** Present when refused; the refusal is `blocked(runtime_unavailable)` with the doctor reason. */
  refusals: ExposureRefusal[];
}
