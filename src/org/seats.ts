/**
 * Seat contracts, execution classes, independence, and the reserved-action table.
 *
 * @packageDocumentation
 * Mirrors schemas/seat.schema.json and schemas/reserved-actions.schema.json. The company is data: five LLM
 * seat contracts in org/seats/*.yaml (product, architect, planner, engineer, reviewer), one deterministic
 * Steward that is not a seat, and a human Board. The lens sets live only in org/seats/reviewer.yaml and
 * the reserved actions only in org/reserved-actions.yaml; their identifiers are typed here as names, and
 * the literal unions are generated from those tables (M2), with `keel sync --check` catching drift.
 * Implemented in M1a (contracts) and M2 (reserved-operation detection).
 */
import type { ApiOp } from "../api/contract.js";
import type { AckIdKind } from "../core/brief.js";
import type {
  ExecutionClass,
  Family,
  Lens,
  RepoGlob,
  RepoPath,
  Seat,
  Slug,
  StopClass,
  SubmitChannel,
  Tier,
} from "../core/ids.js";

export type { ExecutionClass, Seat } from "../core/ids.js";

// ---- Lens sets ----

/** The named lens sets of org/seats/reviewer.yaml. */
export type LensSetName =
  | "frame"
  | "frame_system"
  | "plan"
  | "test_task"
  | "patch"
  | "quick"
  | "policy"
  | "thorough";

/** The lens-set table; its contents have one home, org/seats/reviewer.yaml. */
export interface LensSets {
  frame: Lens[];
  frame_system?: Lens[];
  plan?: Lens[];
  /** Verify stage of a test task, next to `verify.test-red`. */
  test_task?: Lens[];
  patch: Lens[];
  quick: Lens[];
  policy: Lens[];
  thorough: Lens[];
}

// ---- Seat contracts ----

/** Writable globs and fields of a seat. */
export interface SeatWritable {
  globs: RepoGlob[];
  fields?: string[];
}

/**
 * One seat contract. It lists what the seat reads and writes, its allowed `keel api` ops, its execution
 * class, its ACK id kinds, its output schema and submit channels, its default tier, its independence rule,
 * and the assumption it encodes, so that the seat can be retired with evidence.
 */
export interface SeatContract {
  seat: Seat;
  duty: string;
  assumption: string;
  inputs: string[];
  outputs: string[];
  writable: SeatWritable;
  api_ops: ApiOp[];
  execution_class: ExecutionClass;
  ack_id_set: AckIdKind[];
  output_schema: RepoPath;
  submit_channels: SubmitChannel[];
  default_tier: Tier;
  /** Seats whose declared family this seat's route must differ from. */
  independent_of: Seat[];
  may: string[];
  may_not: string[];
  /** Only on the reviewer contract. */
  lens_sets?: LensSets;
}

// ---- Independence ----

/**
 * `independent` when the reviewer's declared family differs from the engineer's; `degraded` when one
 * family serves both, which needs `keel approve <P> --rule degraded` per change. Families are Board
 * declarations in the approved routing and are always shown as "declared".
 */
export type Independence = "independent" | "degraded";

/**
 * The declared engineer families and the reviewer family, carried by the land approval record, the routing
 * snapshot and the receipt. `engineer` lists every engineer route the proposal uses: the build route and,
 * when a test task runs, the test route, so the reviewer's independence from both is recorded.
 */
export interface FamilyPair {
  engineer: Family[];
  reviewer: Family;
  independence: Independence;
}

// ---- Reserved actions ----

/** A reserved-action id from org/reserved-actions.yaml (literal union generated in M2). */
export type ReservedActionId = Slug;

/** How a reserved operation is detected; detection is the guarantee on plain git. */
export type ReservedOpDetection =
  | "ref-snapshot"
  | "worktree-head"
  | "reflog"
  | "ls-remote"
  | "jj-op-log"
  | "tool-events"
  | "scope-check";

/** How a reserved operation is prevented; best-effort and reported per runtime. */
export type ReservedOpPrevention =
  | "permission-rules"
  | "pretooluse-hook"
  | "env-hardening"
  | "advisory-shim"
  | "sparse-checkout";

/** One reserved action: only the Board may take it. */
export interface ReservedAction {
  id: ReservedActionId;
  summary: string;
  stop_class: StopClass | null;
  patterns?: string[];
  detect: ReservedOpDetection[];
  prevent: ReservedOpPrevention[];
}

/** org/reserved-actions.yaml. A charter may add project actions, never remove one. */
export interface ReservedActionTable {
  actions: ReservedAction[];
}
