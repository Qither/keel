/**
 * Board governance: the approved documents (charter, goals, standing policies), the approval record,
 * rulings and other governance records, and the receipt.
 *
 * @packageDocumentation
 * Mirrors schemas/charter, goals, policy, approval, governance-record and receipt. Every Board act is an
 * explicit confirmation of a shown subject at one content version: `keel approve` shows the subject and
 * its change, the Board confirms, and the Steward writes a record binding the subject, the normalized
 * content hash of every bound artifact, the declared approver and the local time, committed at
 * `.keel/approvals/<record-sha256>.<kind>.json` (docs/02-alignment.md). A record is valid only while every
 * bound artifact still hashes to the recorded value; any change to approved content invalidates it. The
 * hash binds content, the approver is a declared local identity and the time is the local clock: none is
 * an authenticated identity or an anti-forgery proof (docs/14-trust-security.md, ADR-0005). receipt.md is
 * never edited after the land approval. Implemented in M1b (approvals) and M3 (receipts).
 */
import type { CommandLine } from "./evidence.js";
import type { CheckId } from "./gates.js";
import type {
  AccId,
  ApprovalId,
  ApprovalStage,
  CheckStatus,
  ConformanceStatus,
  EvidenceId,
  EvidenceMode,
  Family,
  GitOid,
  GoalId,
  InvId,
  IsoDateTime,
  Lens,
  OverrideId,
  ProposalId,
  Recommendation,
  RepoGlob,
  RepoPath,
  ReqId,
  RoundId,
  RuleKind,
  RulingId,
  RunId,
  RuntimeId,
  ScenarioRef,
  Seat,
  Semver,
  Sha256,
  Slug,
  StopClass,
  TaskId,
  Track,
  VerdictId,
} from "./ids.js";
import type { ContractHash, ProposalOrigin } from "./lifecycle.js";
import type { FamilyPair, LensSetName, ReservedAction } from "../org/seats.js";
import type { Route } from "../providers/routing.js";
import type { ExposureProfile } from "../runtime/exposure.js";

// ---- Charter (L0) ----

/** An invariant: a must or must_not obligation with its scope and optional check. */
export interface Invariant {
  id: InvId;
  level: "must" | "must_not";
  text: string;
  applies_to: RepoGlob[];
  check: CommandLine | null;
  /** Cheap checks also run in the submit gate. */
  cheap?: boolean;
}

/** What a seat may decide on its own and what it must ask. */
export interface DecisionBoundaries {
  may_decide: string[];
  must_ask: string[];
}

/**
 * The precedence order, highest first. Every brief ends with it: Board ruling > INV > accepted ADR
 * obligation > frozen intent (ACC, non-goals, scope) > requirement > plan > task notes > model preference.
 */
export type Precedence = readonly [
  "board_ruling",
  "invariant",
  "adr_obligation",
  "frozen_intent",
  "requirement",
  "plan",
  "task_notes",
  "model_preference",
];

/** One precedence level. */
export type PrecedenceLevel = Precedence[number];

/** A pitfall; admitted only with an incident id. */
export interface Pitfall {
  text: string;
  incident: string;
}

/** The frontmatter of `.keel/charter.md` (budget 6 KiB for the whole file). */
export interface Charter {
  charter_version: Semver;
  /** At most 200 characters. */
  mission: string;
  invariants: Invariant[];
  decision_boundaries: DecisionBoundaries;
  precedence: Precedence;
  /** Project additions to org/reserved-actions.yaml, which always applies. */
  reserved_actions: { additions: ReservedAction[] };
  pitfalls: Pitfall[];
}

// ---- Goals (L1) ----

/** A budget; 80% warns, 100% blocks until `--rule budget`. */
export interface Budget {
  usd?: number;
  runs?: number;
  wall_minutes?: number;
}

/** Goal lifecycle status. */
export type GoalStatus = "active" | "paused" | "done" | "dropped";

/** One goal. Progress is requirements verified at head over total, computed and never stored. */
export interface Goal {
  id: GoalId;
  objective: string;
  success_signal: string;
  non_goals?: string[];
  budget?: Budget | null;
  status: GoalStatus;
}

/** `.keel/goals.yaml`. */
export interface GoalsFile {
  charter_version: Semver;
  goals: Goal[];
}

// ---- Standing policies ----

/** Predicates a change must meet for a standing policy to apply. */
export interface PolicyPredicates {
  max_sessions?: number;
  max_files?: number;
  max_loc?: number;
  max_elements?: number;
  touches_protected_globs?: boolean;
  touches_invariants?: boolean;
  touches_obligations?: boolean;
  touches_arch_rules?: boolean;
  touches_contracts?: boolean;
  touches_public_api?: boolean;
  /** Always false: new ACC items always need a per-change contract approval. */
  adds_acceptance?: false;
}

/** What a standing policy requires in exchange. */
export interface PolicyRequirements {
  approved_request?: boolean;
  red_green_proof?: boolean;
  lens_set?: LensSetName;
}

/**
 * `.keel/policies/<id>.yaml`, Board-approved, revocable and listed in receipts. A contract policy stands in
 * for the per-change contract approval of a change started with `keel new --policy`; a land policy stands
 * in for the per-change land approval, followed by a receipt acknowledgement.
 */
export interface StandingPolicy {
  id: Slug;
  kind: "contract" | "land";
  summary?: string;
  charter_version: Semver;
  track: Track;
  predicates: PolicyPredicates;
  requires: PolicyRequirements;
  expires: string | null;
}

// ---- Approval records ----

/** What a record approves. */
export type ApprovalKind = "stage" | "doc" | "policy" | "request" | "rule";

/** One approved artifact with its normalized blob hash. */
export interface ApprovalArtifact {
  path: RepoPath;
  sha256: Sha256;
}

/** An override expiry: a date, a date-time, `land`, or the next commit touching a path. */
export type Until = string | "land" | `commit-touching:${string}`;

/** The recorded track and the track a `--rule track --to <track>` ruling sets. */
export interface TrackChange {
  from: Track;
  to: Track;
}

/**
 * The ruling of a `--rule` approval record. A budget ruling carries the new limit (`--limit
 * <usd|runs|wall_minutes>=<n>`), a track ruling the track change (`--to <track>`); both are null for other
 * kinds, so the approval record holds the parameter the Board decided.
 */
export interface ApprovalRule {
  kind: RuleKind;
  until: Until | null;
  clause: string | null;
  budget: Budget | null;
  track: TrackChange | null;
}

/** The land binding: integrated commit, expected trunk tip, receipt draft hash and declared families. */
export interface LandBinding {
  integrated_commit: GitOid;
  expected_trunk_tip: GitOid;
  receipt_draft: Sha256;
  families: FamilyPair;
}

/**
 * The declared approver: the `board.approver` name from the personal configuration layer, or the name
 * typed at confirmation. A recorded name, not an authenticated identity.
 */
export interface Approver {
  name: string;
}

/**
 * The approval record (`AP-<sha12>` of its normalized bytes), committed at
 * `.keel/approvals/<record-sha256>.<kind>.json`. The hashes in `artifacts` are what the approval covers:
 * a change to any of them invalidates it, a change elsewhere does not, and the record never hashes
 * itself.
 */
export interface ApprovalRecord<K extends ApprovalKind = ApprovalKind> {
  v: 1;
  kind: K;
  stage: ApprovalStage | null;
  rule: ApprovalRule | null;
  /** A proposal or task id, a document path, a policy name, a question id or a record id. */
  subject: string;
  /** keel/<P>/main for stages, trunk for documents. */
  commit: GitOid;
  /** Empty for a request record, whose bound content is `request`. */
  artifacts: ApprovalArtifact[];
  contract_hash: ContractHash | null;
  /** The verbatim request, for request records. */
  request: string | null;
  land: LandBinding | null;
  /** Optional Board commentary typed at confirmation (`--note`). */
  note: string | null;
  approver: Approver;
  /** For consistency checks; null only when the ledger has no event yet. */
  ledger_chain_head: Sha256 | null;
  /** The local machine time at confirmation; not a trusted timestamp. */
  approved_at: IsoDateTime;
}

/** A Board approval of a checkpoint, document, policy or ruling. */
export type Approval = ApprovalRecord<Exclude<ApprovalKind, "request">>;

/** A Board-approved verbatim change request (`keel new --policy`, one confirmation). */
export type ChangeRequest = ApprovalRecord<"request">;

/**
 * Why the Steward treats an approval as invalid at a gate (`missing-approval` in the trace drift
 * classes). `changed-during-confirmation` is the refusal `keel approve` itself gives when a bound
 * artifact changed between being shown and being confirmed; nothing is recorded in that case.
 */
export type ApprovalInvalidity =
  | "no-record"
  | "no-ledger-event"
  | "subject-mismatch"
  | "artifact-changed"
  | "superseded-by-amendment"
  | "expired"
  | "chain-head-not-on-chain"
  | "changed-during-confirmation";

/**
 * The confirmation flow of `keel approve`, in order: show the subject and its change, take the explicit
 * confirmation, re-hash the bound artifacts and compare them with what was shown, then record. A bare
 * Enter or any word other than the confirmation word is a refusal.
 */
export type ConfirmationStep = "show" | "confirm" | "recheck" | "record";

// ---- Rulings, questions and other records ----

/** Cost if a ruling is wrong; receipts sort rulings by it. */
export type CostIfWrong = "low" | "medium" | "high";

/** A seat's ruling inside its decision boundaries (`keel api rule`). */
export interface RulingPayload {
  clause: string;
  what: string;
  why: string;
  cost_if_wrong: CostIfWrong;
  reversible: boolean;
}

/** Where an ask goes. */
export type AskRoute = Seat | "board";

/** `RL-<sha12>`: a recorded seat ruling; flagged when outside the boundaries or on a stop class. */
export interface Ruling {
  record: "ruling";
  subject: ProposalId | TaskId;
  run: RunId | null;
  seat: Seat;
  ruling: RulingPayload;
  within_boundaries: boolean;
  stop_class: StopClass | null;
  flagged: boolean;
  recorded_at: IsoDateTime;
}

/** `Q-<sha12>`: a question, routed by clause type; the task parks until it is answered. */
export interface QuestionRecord {
  record: "question";
  subject: ProposalId | TaskId;
  run: RunId | null;
  seat: Seat | null;
  question: { clause: string; question: string };
  routed_to: AskRoute;
  stop_class: StopClass | null;
  recorded_at: IsoDateTime;
}

/**
 * `AM-<sha12>`: derived from git when the frozen block or an ACC changes after contract approval. It
 * invalidates the contract and plan approvals until the Board looks again and approves again.
 */
export interface Amendment {
  record: "amendment";
  proposal: ProposalId;
  original: string;
  replacement: string;
  changed_ids: (AccId | ReqId | ScenarioRef)[];
  reason: string;
  invalidates: ApprovalId[];
  authority: ApprovalId | null;
  recorded_at: IsoDateTime;
}

/** `OV-<sha12>`: an expiring override (waivers are overrides); it can adopt a human commit. */
export interface Override {
  record: "override";
  /** Proposal, task or commit the override applies to. */
  subject: string;
  check: CheckId;
  reason: string;
  until: Until;
  approval: ApprovalId;
  adopts_commit: GitOid | null;
  recorded_at: IsoDateTime;
}

/** A per-change acknowledgement of degraded independence or of an unverified judge seat. */
export interface LaneAck {
  record: "degraded-ack" | "unverified-ack";
  proposal: ProposalId;
  seat: Seat;
  route: Route;
  approval: ApprovalId;
  recorded_at: IsoDateTime;
}

/** Any governance record. */
export type GovernanceRecord = Ruling | QuestionRecord | Amendment | Override | LaneAck;

// ---- Receipt (L11) ----

/** The rounds of one task. */
export interface ReceiptTaskRounds {
  task: TaskId;
  rounds: { round: RoundId; commit: GitOid }[];
}

/** One row of the ACC to command table, a first-class section of receipt.md. */
export interface ReceiptAccRow {
  acc: AccId;
  evidence_mode: EvidenceMode;
  commands: CommandLine[];
  status: CheckStatus;
}

/** One verdict with its declared family. */
export interface ReceiptVerdictRow {
  verdict: VerdictId;
  lens: Lens;
  recommendation: Recommendation;
  declared_family: Family;
  open_findings: number;
}

/** One ruling, listed by cost if wrong. */
export interface ReceiptRulingRow {
  ruling: RulingId;
  cost_if_wrong: CostIfWrong;
  clause: string;
  what: string;
  reversible: boolean;
}

/**
 * `.keel/archive/<yyyy>/<P>-<slug>/receipt.json`; receipt.md renders it for the Board. The approved draft
 * names the integrated commit and the expected trunk tip; the landed sha goes in `land.completed`.
 */
export interface Receipt {
  proposal: ProposalId;
  slug: Slug;
  title: string;
  track: Track;
  origin: ProposalOrigin;
  charter_version: Semver;
  contract_hash: ContractHash;
  integrated_commit: GitOid;
  expected_trunk_tip: GitOid;
  trunk: string;
  tasks: ReceiptTaskRounds[];
  acceptance: ReceiptAccRow[];
  /** status is the record's own result; expect is what the gate required (red for a test task). */
  evidence: { evidence: EvidenceId; commit: GitOid; status: CheckStatus; expect: "green" | "red" }[];
  land_reexecution: { status: CheckStatus; passed: number; total: number };
  verdicts: ReceiptVerdictRow[];
  rulings: ReceiptRulingRow[];
  gates_not_run: { check: CheckId; reason: string }[];
  overrides: { override: OverrideId; check: CheckId; until: Until; reason: string }[];
  deferred_minors: { verdict: VerdictId; finding: string; title: string }[];
  risks: string[];
  arch_delta: { sha256: Sha256; ops: number } | null;
  rtm: { requirements: number; covered: number; verified: number };
  independence: FamilyPair;
  conformance: { seat: Seat; route: Route; status: ConformanceStatus }[];
  exposure: { runtime: RuntimeId; profile: ExposureProfile }[];
  /**
   * Approvals that existed before land (contract, plan, request, rulings). The land approval is never
   * listed: it binds the draft hash, and its id hashes a record that contains the draft hash. receipt.md
   * shows it in the Land approval section, filled by the archive commit from the land approval record.
   */
  approvals: ApprovalId[];
  policies: Slug[];
}
