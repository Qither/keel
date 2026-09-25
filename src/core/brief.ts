/**
 * The compiled brief: its intermediate representation, sections with input hashes, the freshness stamp,
 * the per-seat ACK id set, and the compiler interface.
 *
 * @packageDocumentation
 * Mirrors schemas/brief.schema.json and `common.schema.json#/$defs/freshness`. The Steward compiles a brief
 * deterministically per seat and subject from canonical documents and the proposal branch at the approved
 * commit, and renders it through the single template `templates/prompts/brief.md.tmpl`. The body is
 * hashed as LF-normalized, BOM-stripped, NFC bytes (`BR-<sha12>`); the runtime wrapper sits outside the
 * hashed body, and the same bytes go through every channel. ACC items and must and must_not obligations
 * are never truncated; an over-budget brief means the task must be split. Implemented in M1a.
 */
import type {
  AccId,
  BriefId,
  ContentId,
  EvidenceId,
  GitOid,
  GoalId,
  ImpactId,
  InvId,
  IsoDateTime,
  Lens,
  ObligationId,
  ProposalId,
  ReqId,
  RepoGlob,
  RepoPath,
  RuntimeId,
  ScenarioRef,
  Seat,
  Semver,
  Sha256,
  StopClass,
  SubmitChannel,
  TaskId,
} from "./ids.js";
import type { CheckId } from "./gates.js";
import type { DecisionBoundaries, Goal, Invariant, Precedence } from "./governance.js";
import type { Obligation, Requirement, WorkOrder, WriteSet } from "./lifecycle.js";

// ---- Freshness and derivation ----

/**
 * What an answer or a brief was computed from (`common.schema.json#/$defs/freshness`). It sits in the
 * brief header, outside the hashed body.
 */
export interface Freshness {
  computed_at: IsoDateTime;
  head_commit: GitOid;
  index_commit: GitOid | null;
  charter_version: Semver;
}

/**
 * Input name to content hash. Plans, work orders, briefs, verdicts and evidence carry it; an upstream
 * change marks every dependent stale, and stale work cannot land.
 */
export type DerivedFrom = Readonly<Record<string, Sha256>>;

// ---- Sections ----

/** The sections of a brief body, in template order. */
export type BriefSectionId =
  | "why-chain"
  | "requirements"
  | "frozen-intent"
  | "work-order"
  | "invariants"
  | "obligations"
  | "element-brief"
  | "impact"
  | "write-set"
  | "gates"
  | "precedence"
  | "decision-boundaries"
  | "stop-classes"
  | "submit"
  | "output-contract"
  | "review-packet";

/**
 * `contract` sections (ACC, must and must_not obligations, covered requirements) force a re-ACK when they
 * change (`stale_contract`); `context` sections only annotate.
 */
export type BriefSectionClass = "contract" | "context";

/** One section with its input hashes. */
export interface BriefSection {
  id: BriefSectionId;
  class: BriefSectionClass;
  sha256: Sha256;
  inputs: DerivedFrom;
  bytes: number;
  truncated: boolean;
}

// ---- ACK id sets ----

/** Kinds of ids a seat's ACK must echo. */
export type AckIdKind = "goal" | "requirement" | "invariant" | "acceptance" | "obligation" | "packet";

/** One id of an ACK id set. */
export type AckId = GoalId | ReqId | ScenarioRef | InvId | AccId | ObligationId | TaskId | ContentId;

/** The exact id set the seat's ACK must echo. */
export interface AckIdSet {
  kinds: AckIdKind[];
  ids: AckId[];
}

/**
 * The ACK id kinds of one seat. The kinds come from the seat contract (`ack_id_set` in
 * org/seats/<seat>.yaml), which is their single home; the blueprint fixes product (goal, requirement,
 * invariant), planner (acceptance, requirement), engineer (acceptance, requirement, invariant, obligation:
 * in-scope INV and must and must_not ADR obligations) and
 * reviewer (packet ids).
 */
export interface SeatAckIdSet {
  seat: Seat;
  kinds: readonly AckIdKind[];
}

// ---- Intermediate representation ----

/** The subject of a brief: the proposal for product, architect and planner; the task for an engineer. */
export type BriefSubject = ProposalId | TaskId;

/** charter → goal → requirement → frozen intent (verbatim) → work order. */
export interface WhyChain {
  charter_version: Semver;
  mission: string;
  goals: Goal[];
  requirements: Requirement[];
  proposal: ProposalId;
  task: TaskId | null;
}

/** How a reviewer receives the diff: inline for tool-less lanes, by path otherwise. */
export interface ReviewDiff {
  mode: "inline" | "path";
  digest: Sha256;
  path: RepoPath | null;
}

/** The review packet a lens receives; the reviewer never sees the engineer's transcript. */
export interface ReviewPacket {
  lens: Lens;
  commit: GitOid;
  diff: ReviewDiff;
  /** The verbatim frozen block. */
  frozen_intent: string;
  work_order: TaskId | null;
  element_brief: string | null;
  evidence: EvidenceId[];
}

/** How to ACK, ask, rule and submit on this runtime's submit channel. */
export interface SubmitInstructions {
  runtime: RuntimeId;
  ack_via: SubmitChannel;
  result_via: SubmitChannel;
  output_schema: RepoPath;
}

/** The deterministic IR selected from canonical documents before rendering. */
export interface BriefIR {
  subject: BriefSubject;
  seat: Seat;
  runtime: RuntimeId;
  why_chain: WhyChain;
  /** Verbatim between the keel:frozen markers. */
  frozen_intent: string | null;
  work_order: WorkOrder | null;
  /** In-scope INV: those whose applies_to intersects the write_set. */
  invariants: Invariant[];
  /** ADR obligations whose applies_to intersects the write_set. */
  obligations: Obligation[];
  element_brief: string | null;
  impact: ImpactId | null;
  write_set: WriteSet | null;
  forbidden: RepoGlob[];
  gates: CheckId[];
  precedence: Precedence;
  decision_boundaries: DecisionBoundaries;
  stop_classes: StopClass[];
  submit: SubmitInstructions;
  review_packet: ReviewPacket | null;
  ack_id_set: AckIdSet;
}

// ---- The compiled brief (brief.schema.json) ----

/** `.git/keel/briefs/BR-<sha12>.json`, the JSON companion of the body `BR-<sha12>.md`. */
export interface BriefRecord {
  id: BriefId;
  subject: BriefSubject;
  seat: Seat;
  runtime: RuntimeId;
  freshness: Freshness;
  body_sha256: Sha256;
  bytes: number;
  budget_bytes: number;
  sections: BriefSection[];
  ack_id_set: AckIdSet;
  write_set: WriteSet | null;
  forbidden: RepoGlob[];
  submit_channel: SubmitChannel;
  output_schema: RepoPath;
  derived_from: DerivedFrom;
}

/** A compiled brief: the record plus the normalized body bytes as text. */
export interface CompiledBrief {
  record: BriefRecord;
  body: string;
}

/** The result of recompiling at submit and at each gate. */
export type BriefStaleness =
  | { kind: "fresh" }
  | { kind: "stale_contract"; sections: BriefSectionId[] }
  | { kind: "context_only"; sections: BriefSectionId[] };

/** What the compiler needs to compile one brief. */
export interface BriefCompileRequest {
  subject: BriefSubject;
  seat: Seat;
  runtime: RuntimeId;
  /** The approved commit of keel/<P>/main. */
  at: GitOid;
  lens?: Lens;
}

/** The deterministic brief compiler (M1a). */
export interface BriefCompiler {
  compile(request: BriefCompileRequest): Promise<CompiledBrief>;
  recompile(previous: BriefRecord): Promise<{ brief: CompiledBrief; staleness: BriefStaleness }>;
}
