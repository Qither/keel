/**
 * Tracks, phases, computed states, checkpoints, stop classes and blocked reasons, plus the proposal
 * artifacts each phase produces (proposal.yaml, intent.md, spec.yaml and spec.delta.yaml, ADRs,
 * plan.yaml, work orders) and the layered project configuration.
 *
 * @packageDocumentation
 * State is computed from ledger events and never stored (docs/03-lifecycle.md). The artifact shapes mirror
 * schemas/proposal, intent, spec, spec-delta, decision, plan, workorder and config. Gate check ids and
 * their catalogue live in `./gates.ts` and docs/11-verification.md. Implemented from M1a (intake, frame)
 * through M3 (verify, land).
 */
import type { DerivedFrom } from "./brief.js";
import type { CommandLine } from "./evidence.js";
import type { GateSettings } from "./gates.js";
import type { Budget, DecisionBoundaries } from "./governance.js";
import type {
  AccId,
  AccLocalId,
  AdrId,
  ApprovalId,
  ApprovalStage,
  AreaSlug,
  BlockReason,
  ElementId,
  EvidenceMode,
  Gate,
  GitOid,
  GoalId,
  ImpactId,
  InvId,
  IsoDateTime,
  ObligationId,
  ObligationLevel,
  ProposalId,
  Provenance,
  ReqId,
  RepoGlob,
  RepoPath,
  RuntimeId,
  ScenarioLocalId,
  ScenarioRef,
  Seat,
  Semver,
  Sha256,
  Slug,
  StopClass,
  TaskId,
  TaskLocalId,
  Tier,
  Track,
} from "./ids.js";
import type { IndexBackend } from "../arch/index-provider.js";
import type { VcsConfig } from "../vcs/vcs.js";

export type { BlockReason, StopClass, Track } from "./ids.js";

// ---- Phases and computed states ----

/** Phases 0 to 6. Patch skips phase 2; spike ends at intake with an answer. */
export type PhaseId = "intake" | "frame" | "plan" | "build" | "verify" | "land" | "close";

/** Proposal state, computed from ledger events. `abandoned` is reachable from any non-terminal state. */
export type ProposalState =
  | "intake"
  | "framing"
  | "answered"
  | "contract_pending"
  | "planning"
  | "plan_pending"
  | "executing"
  | "integrating"
  | "land_pending"
  | "landed"
  | "closed"
  | "abandoned";

/** Terminal proposal states. */
export type TerminalProposalState = "closed" | "abandoned";

/** Task state, computed from ledger events. At most 5 fix rounds lead back to `running`. */
export type TaskState =
  | "queued"
  | "claimed"
  | "running"
  | "submitted"
  | "verifying"
  | "verified"
  | "fixing"
  | "parked"
  | "blocked"
  | "landed"
  | "abandoned";

/** Terminal task states. */
export type TerminalTaskState = "landed" | "abandoned";

/** The computed state of a proposal with its overlays; a Board hold overlays any non-terminal state. */
export interface ProposalStatus {
  proposal: ProposalId;
  state: ProposalState;
  track: Track;
  held: boolean;
  tasks: readonly { task: TaskId; state: TaskState; fix_round: number }[];
}

// ---- Checkpoints ----

/** The four stage checkpoints the Board approves with `keel approve <P> --stage <stage>`. */
export type CheckpointStage = ApprovalStage;

/**
 * When a checkpoint applies on a track (`required_on` in org/checkpoints.yaml): always, never, unless the
 * change runs on the policy path, only when a wave is wider than 1 or routing deviates, as the approved
 * land policy decides, or after every land made under a standing policy (receipt acknowledgement).
 */
export type CheckpointRequirement =
  | "always"
  | "never"
  | "unless-policy-path"
  | "wider-wave-or-routing-deviation"
  | "per-land-policy"
  | "after-policy-land";

/** One stage of org/checkpoints.yaml: what it binds, when it applies per track, and what the Board reads. */
export interface Checkpoint {
  stage: CheckpointStage;
  /** The command, for example `keel approve <P> --stage contract`. */
  command: string;
  binds: readonly string[];
  required_on: Readonly<Record<Track, CheckpointRequirement>>;
  blocking: boolean;
  /** Receipt acknowledgement only: what an unacknowledged receipt blocks. */
  blocks_next?: string;
  /** Printed verbatim by `keel approve` before the typed confirmation. */
  read: readonly string[];
  ask_yourself: readonly string[];
  do_not_approve_when: readonly string[];
}

/** A Board approval that is not a stage checkpoint (`other_approvals` in org/checkpoints.yaml). */
export interface OtherApproval {
  kind: "request" | "doc" | "policy" | "rule";
  command: string;
  read: readonly string[];
  do_not_approve_when: readonly string[];
}

/** org/checkpoints.yaml: the four stage checkpoints plus the other approvals. */
export interface CheckpointTable {
  stages: readonly Checkpoint[];
  other_approvals: readonly OtherApproval[];
}

// ---- Blocking, asks, escalation ----

/** Who must act to unblock a task; rung-D tasks always hold `board`. */
export type UnblockOwner = Seat | "board" | "steward";

/** A blocked task, as recorded by `task.blocked`. */
export interface Blocked {
  reason: BlockReason;
  detail: string;
  unblock_owner: UnblockOwner;
}

/** The BLOCKED / NEEDS_CONTEXT remedy ladder, in order; the same model is never retried unchanged. */
export type RemedyStep = "add-context" | "tier-up" | "split-task" | "planner-ruling" | "board";

// ---- Proposal intake (proposal.yaml) ----

/** How a proposal was authorized at intake. */
export type ProposalOrigin = "board-requested" | "contract-approved";

/** The verbatim request; on the policy path the Board approves it (`keel new --policy`). */
export interface IntakeRequest {
  text: string;
  policy: Slug | null;
  approval: ApprovalId | null;
}

/** Anchors checked at intake. */
export interface Anchors {
  requirements: (ReqId | ScenarioRef)[];
  elements: ElementId[];
  paths: RepoPath[];
  symbols?: string[];
}

/** A declared boundary crossed by predicted impact. */
export interface BoundaryCrossing {
  from: ElementId;
  to: ElementId;
}

/** The recorded signals the track is computed from. */
export interface TrackSignals {
  anchors: Anchors;
  predicted_impact: ImpactId | null;
  elements_reached: ElementId[];
  boundaries_crossed: BoundaryCrossing[];
  protected_globs_touched: RepoGlob[];
  invariants_touched: InvId[];
  obligations_touched: ObligationId[];
  public_api_touched: boolean;
  estimated_files?: number | null;
}

/**
 * `.keel/proposals/<P>-<slug>/proposal.yaml`: intake signals only, written once by the Steward. The
 * current track, state and claims are derived from the ledger.
 */
export interface ProposalIntake {
  id: ProposalId;
  slug: Slug;
  title: string;
  goals: GoalId[];
  charter_version: Semver;
  created_at: IsoDateTime;
  origin: ProposalOrigin;
  request: IntakeRequest;
  requested_track: Track | null;
  signals: TrackSignals;
}

/** Patch-track limits (defaults in config/keel.defaults.yaml). */
export interface PatchLimits {
  max_sessions?: number;
  max_files?: number;
  max_loc?: number;
}

// ---- Frozen intent (intent.md, L5) ----

/** The frontmatter of intent.md. */
export interface IntentFrontmatter {
  proposal: ProposalId;
  title?: string;
  charter_version: Semver;
}

/** The level-2 sections of the frozen block, in order. */
export type IntentSections = readonly [
  "Problem",
  "Outcome and signal",
  "Non-goals",
  "Decision boundaries",
  "Acceptance",
  "Always",
  "Never",
  "Scope",
  "Open questions",
  "Failure model",
];

/** The markers around the frozen block. */
export type FrozenMarkers = readonly ["<!-- keel:frozen:start -->", "<!-- keel:frozen:end -->"];

/** One acceptance criterion. */
export interface AcceptanceCriterion {
  id: AccLocalId;
  statement: string;
  covers: (ReqId | ScenarioRef)[];
  evidence_mode: EvidenceMode;
}

/** Allowed and protected globs of the change. */
export interface IntentScope {
  allowed: RepoGlob[];
  protected: RepoGlob[];
}

/**
 * The frozen block as parsed deterministically. Any byte change after contract approval invalidates the
 * approval; acceptance changes only through an amendment the Board approves again.
 */
export interface FrozenIntent {
  problem: string;
  outcome: string;
  signal: string;
  non_goals: string[];
  decision_boundaries: DecisionBoundaries;
  acceptance: AcceptanceCriterion[];
  always: string[];
  never: string[];
  scope: IntentScope;
  /** Must be empty at the frame gate. */
  open_questions: string[];
  /** Required on the system track. */
  failure_model: string;
}

/** sha256 over the normalized frozen block, spec.delta, arch.delta and covered rev hashes. */
export type ContractHash = Sha256;

// ---- Living specs and spec deltas (L2) ----

/** EARS statement kinds. */
export type EarsKind = "ubiquitous" | "event-driven" | "state-driven" | "unwanted" | "optional" | "complex";

/** A Given/When/Then scenario. */
export interface Scenario {
  id: ScenarioLocalId;
  title?: string;
  given: string;
  when: string;
  then: string;
}

/** A requirement as drafted in a delta. */
export interface RequirementDraft {
  id: ReqId;
  title?: string;
  kind: EarsKind;
  statement: string;
  goals: GoalId[];
  realized_in: ElementId[];
  scenarios: Scenario[];
}

/** A living requirement; verification status is computed, never stored. */
export interface Requirement extends RequirementDraft {
  status: "active" | "deprecated";
  since: ProposalId | null;
}

/** `.keel/specs/<area>/spec.yaml`, written only by the land archive commit. */
export interface SpecFile {
  area: AreaSlug;
  charter_version: Semver;
  requirements: Requirement[];
}

/** sha256 of one normalized requirement. */
export type RevHash = Sha256;

/** A delta operation, targeting requirement ids and never heading text. */
export type SpecDeltaOp =
  | { op: "ADDED"; requirement: RequirementDraft }
  | { op: "MODIFIED"; id: ReqId; base_rev_hash: RevHash; requirement: RequirementDraft }
  | { op: "REMOVED"; id: ReqId; base_rev_hash: RevHash; reason: string };

/** `spec.delta.yaml`; the archive refuses on a base mismatch and shows base, current and proposed texts. */
export interface SpecDelta {
  proposal: ProposalId;
  charter_version: Semver;
  ops: SpecDeltaOp[];
}

// ---- Decisions and obligations (L3) ----

/** Obligation levels; must and must_not ids join the ACK set when delivered. */
export type { ObligationLevel } from "./ids.js";

/** One entry of an ADR's '## Obligations' list, parsed deterministically (no LLM extraction). */
export interface Obligation {
  id: ObligationId;
  level: ObligationLevel;
  text: string;
  applies_to: RepoGlob[];
  check: CommandLine | null;
  cheap?: boolean;
}

/** A rejected option, compiled to a must_not. */
export interface RejectedOption {
  option: string;
  reason: string;
}

/** A symbol citation; anchor or body drift voids acceptance (`citation-drift`). */
export interface Citation {
  path: RepoPath;
  line: number | null;
  provenance: Provenance;
  note: string;
}

/** The frontmatter of `.keel/decisions/ADR-<5>-<slug>.md`. */
export interface DecisionFrontmatter {
  id: AdrId;
  title: string;
  status: "proposed" | "accepted" | "superseded" | "rejected";
  proposal: ProposalId | null;
  charter_version: Semver;
  governs: (ElementId | ReqId)[];
  supersedes?: AdrId[];
  superseded_by?: AdrId | null;
  date?: string;
}

/** The level-2 sections an ADR body must contain, in order. */
export type DecisionSections = readonly [
  "Context",
  "Decision",
  "Obligations",
  "Rejected options",
  "Consequences",
  "Citations",
];

/** The parsed ADR body. */
export interface DecisionBody {
  context: string;
  decision: string;
  obligations: Obligation[];
  rejected_options: RejectedOption[];
  consequences: string;
  citations: Citation[];
}

// ---- Plan and work orders (L6) ----

/** One task line of plan.yaml; the work order is the single home of its details. */
export interface PlanTask {
  id: TaskLocalId;
  title: string;
  kind?: TaskKind;
  workorder?: RepoPath;
}

/** A standard plan. */
export interface StandardPlan {
  proposal: ProposalId;
  kind: "standard";
  charter_version: Semver;
  derived_from: DerivedFrom;
  max_width?: number;
  budget: Budget;
  tasks: PlanTask[];
  risks?: string[];
}

/** A campaign plan (M8): one work order per element matched by `on`. */
export interface CampaignPlan {
  proposal: ProposalId;
  kind: "campaign";
  charter_version: Semver;
  on: string;
  template?: RepoPath;
  budget?: Budget;
  derived_from?: DerivedFrom;
}

/** `.keel/proposals/<P>-<slug>/plan.yaml`. */
export type PlanFile = StandardPlan | CampaignPlan;

/** Build, test-first or conflict-resolution task. */
export type TaskKind = "build" | "test" | "resolution";

/** Paths and symbols a task may change. */
export interface WriteSet {
  paths: RepoGlob[];
  symbols: string[];
}

/** One row of the ACC to acceptance command and matrix-row table. */
export interface AcceptanceRow {
  acc: AccId;
  evidence_mode: EvidenceMode;
  commands: CommandLine[];
  rows: ScenarioRef[];
}

/** A stop class the work order calls out, with examples. */
export interface StopClassNote {
  class: StopClass;
  examples: string[];
}

/** An interface a task consumes from another task. */
export interface ConsumedInterface {
  name: string;
  contract?: string;
  from: TaskLocalId | TaskId;
}

/** An interface a task produces. */
export interface ProducedInterface {
  name: string;
  contract?: string;
}

/**
 * `.keel/proposals/<P>-<slug>/workorders/T<n>.yaml`. The engineer never reads it directly: keel compiles
 * it into the task's brief. `frozen_tests` lie outside every builder `write_set`.
 */
export interface WorkOrder {
  id: TaskId;
  title: string;
  kind: TaskKind;
  objective: string;
  charter_version: Semver;
  covers: { acc: AccId[]; requirements: (ReqId | ScenarioRef)[] };
  after: (TaskLocalId | TaskId)[];
  write_set: WriteSet;
  frozen_tests: RepoGlob[];
  interfaces: { consumes: ConsumedInterface[]; produces: ProducedInterface[] };
  acceptance: AcceptanceRow[];
  /** Copied verbatim. */
  global_constraints: string[];
  /** At most 5. */
  review_focus: string[];
  stop_classes: StopClassNote[];
  route_hint: { seat: Seat; tier: Tier };
  budget: Budget;
  derived_from: DerivedFrom;
  notes?: string;
}

// ---- Project configuration (.keel/config.yaml + .keel/local.yaml) ----

/** A declared command (bootstrap, build, test, lint, typecheck). */
export interface DeclaredCommand {
  id: Slug;
  purpose: "bootstrap" | "build" | "test" | "lint" | "typecheck" | "other";
  command: CommandLine;
}

/**
 * The layered configuration: package defaults, then team (.keel/config.yaml, Board-owned), then personal
 * (.keel/local.yaml, gitignored, never secrets). Tables deep-merge, arrays keyed by id replace, unknown keys
 * are errors.
 */
export interface KeelConfig {
  vcs?: VcsConfig;
  workspace_root?: string;
  trace?: { since?: GitOid };
  tracks?: {
    patch?: PatchLimits;
    protected_globs?: RepoGlob[];
    max_top_level_dirs?: number;
  };
  commands?: DeclaredCommand[];
  gates?: Partial<Record<Gate, GateSettings>>;
  caps?: {
    max_parallel?: number;
    ack_attempts?: number;
    fix_rounds?: number;
    resume_rounds?: number;
    review_focus_max?: number;
    handbook_block_bytes?: number;
    handbook_chain_bytes?: number;
    lease_seconds?: number;
    cancel_grace_seconds?: number;
    submit_payload_bytes?: number;
  };
  brief?: {
    max_bytes?: number;
    runtimes?: { runtime: RuntimeId; max_bytes: number }[];
    element_brief_bytes?: number;
  };
  budget?: { warn_at_percent?: number };
  index?: { backend?: IndexBackend; scip_index?: RepoPath };
  arch?: { unknown?: "default" | "block" };
  land?: { policy?: Slug | null };
}
