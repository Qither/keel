/**
 * The hash-chained ledger: event envelope, per-type data, chain links, and the single-writer and reader
 * interfaces.
 *
 * @packageDocumentation
 * Mirrors schemas/ledger-event.schema.json. The ledger lives at
 * `$(git rev-parse --git-common-dir)/keel/ledger/<yyyy-mm>.jsonl`, one event per line, one file per month,
 * with one chain across months. It is the only truth store for events: state (proposal, task and element
 * status, the current track, claims and leases) is computed from events and never stored. `hash` is the
 * sha256 of the canonical JSON of the event without `hash`; `prev` is the previous event's hash. Approval
 * records include the chain head, so an edit before a recorded head is detectable by a consistency check
 * (not resisted against a writer that can rewrite records and hashes; docs/14-trust-security.md). Records hold
 * environment variable NAMES, aliases and `${ENV:NAME}` placeholders only. Implemented from M1a.
 */
import type { AckDiff } from "./ack.js";
import type { AckId } from "./brief.js";
import type { CheckId } from "./gates.js";
import type { ApprovalKind, AskRoute, Until } from "./governance.js";
import type {
  AmendmentId,
  ApprovalId,
  ApprovalStage,
  BlockReason,
  BriefId,
  CheckStatus,
  ConformanceStatus,
  ContentId,
  EventId,
  EvidenceId,
  Family,
  GitOid,
  GoalId,
  ImpactId,
  IsoDateTime,
  Lens,
  OverrideId,
  ProfileAlias,
  PromptId,
  ProposalId,
  QuestionId,
  Recommendation,
  RepoPath,
  ResultStatus,
  RoundId,
  RuleKind,
  RulingId,
  RunId,
  Rung,
  RuntimeId,
  Seat,
  Semver,
  Sha256,
  Slug,
  SubmitChannel,
  TaskId,
  Track,
  TriageId,
  VerdictId,
} from "./ids.js";
import type { ProposalOrigin, UnblockOwner } from "./lifecycle.js";
import type { ReservedActionId, ReservedOpDetection } from "../org/seats.js";
import type { Route } from "../providers/routing.js";
import type { Outcome } from "../runtime/dispatch.js";
import type { ExposureProfile } from "../runtime/exposure.js";
import type { ClaimRecord, LandMethod, VcsBackendId } from "../vcs/vcs.js";

// ---- Envelope parts ----

/**
 * Who acted. For seats: the seat, runtime, declared family (the Board-approved declaration from routing,
 * never a verified fact), profile alias and run. `board` is written only by `keel approve` after an
 * explicit confirmation; an actor field alone never makes an event an approval.
 */
export interface Actor {
  kind: "board" | "steward" | "seat";
  seat?: Seat | null;
  runtime?: RuntimeId | null;
  declared_family?: Family | null;
  alias?: ProfileAlias | null;
  run?: RunId | null;
}

/** Hash and version bindings of an event. `op` is the jj operation id when jj is enabled. */
export interface EventRefs {
  brief?: BriefId | null;
  pg?: PromptId | null;
  contract_hash?: Sha256 | null;
  charter_version?: Semver | null;
  commit?: GitOid | null;
  tree?: GitOid | null;
  op?: string | null;
}

/** The id an event is about. */
export type LedgerSubject = ProposalId | TaskId | RoundId | RunId | GoalId | ContentId | null;

// ---- Per-type data ($defs/<camelCase type>) ----

/** `proposal.created`: intake by `keel new`. */
export interface ProposalCreatedData {
  slug: Slug;
  title: string;
  origin: ProposalOrigin;
  goals: GoalId[];
  policy: Slug | null;
  request_approval: ApprovalId | null;
  base: GitOid;
  branch: string;
}

/** `track.decided`: the track at intake, raised by the ratchet, or lowered by `--rule track`. */
export interface TrackDecidedData {
  track: Track;
  previous: Track | null;
  cause: "intake" | "ratchet" | "rule";
  ruling: ApprovalId | null;
}

/** `hold.changed`: `keel run --hold on|off`. */
export interface HoldChangedData {
  on: boolean;
}

/**
 * `approval.recorded`: written by the `keel approve` process that wrote the record, under the writer lock
 * and outside any run window. A record without this event is not an approval.
 */
export interface ApprovalRecordedData {
  approval: ApprovalId;
  kind: ApprovalKind;
  stage: ApprovalStage | null;
  rule: RuleKind | null;
  record: RepoPath;
  approver: string;
}

/** `amendment.recorded`. */
export interface AmendmentRecordedData {
  amendment: AmendmentId;
}

/** `override.recorded`: an expiring override (waivers are overrides). */
export interface OverrideRecordedData {
  override: OverrideId;
  check: CheckId;
  until: Until;
}

/** `dispatch.queued`. */
export interface DispatchQueuedData {
  seat: Seat;
  route: Route;
}

/** `claim.acquired`: the claim record; the lock ref holds only the token. */
export type ClaimAcquiredData = ClaimRecord;

/** `claim.heartbeat`: derived from parsed stream events only. */
export interface ClaimHeartbeatData {
  lease_until: IsoDateTime;
}

/** `claim.released`. */
export interface ClaimReleasedData {
  reason: "submitted" | "cancelled" | "expired" | "blocked" | "failed";
}

/** `run.started`: route, exposure profile and conformance status are frozen here. */
export interface RunStartedData {
  run: RunId;
  seat: Seat;
  mode: Slug;
  route: Route;
  exposure: ExposureProfile;
  conformance_status: ConformanceStatus;
  submit_channel: SubmitChannel;
  /** null for the direct lane (outside the A-D ladder). */
  rung: Rung | null;
}

/** `run.finished`. On Windows `killed` comes from keel's own cancellation journal. */
export interface RunFinishedData {
  run: RunId;
  outcome: Outcome;
  exit_code: number | null;
}

/** `ack.recorded`: the mechanical ACK diff of one attempt. */
export interface AckRecordedData extends AckDiff {
  channel: SubmitChannel;
  attempt: number;
}

/** `ruling.made`: flagged when outside the decision boundaries or on a stop class. */
export interface RulingMadeData {
  ruling: RulingId;
  clause: string;
  flagged: boolean;
}

/** `question.asked`: routed by clause type; the task parks. */
export interface QuestionAskedData {
  question: QuestionId;
  clause: string;
  routed_to: AskRoute;
}

/** `result.submitted`. */
export interface ResultSubmittedData {
  status: ResultStatus;
  channel: SubmitChannel;
}

/** `round.committed`: a Steward round commit on the task branch. */
export interface RoundCommittedData {
  round: RoundId;
  commit: GitOid;
  tree: GitOid;
  branch: string;
  snapshots: string[];
}

/** `gate.checked`: one check result with its denominator. */
export interface GateCheckedData {
  check: CheckId;
  status: CheckStatus;
  passed: number;
  total: number;
  unit: string | null;
  reason: string | null;
}

/** `task.blocked`. */
export interface TaskBlockedData {
  reason: BlockReason;
  detail: string;
  unblock_owner: UnblockOwner;
}

/** `task.unblocked`. */
export interface TaskUnblockedData {
  by: ApprovalId | null;
}

/** `fix.started`: rounds 1-3 resume the engineer, rounds 4-5 use a fresh engineer one tier up. */
export interface FixStartedData {
  round: number;
  findings: string[];
}

/** `budget.warned`: at 80%; 100% blocks. */
export interface BudgetWarnedData {
  percent: number;
}

/** `reserved_op.detected`: an unexplained ref, HEAD, reflog, remote or op-log change. */
export interface ReservedOpDetectedData {
  source: ReservedOpDetection;
  action: ReservedActionId | null;
  ref: string | null;
  detail: string;
}

/** `evidence.recorded`. */
export interface EvidenceRecordedData {
  evidence: EvidenceId;
  commit: GitOid;
  status: CheckStatus;
}

/** `verdict.recorded`. */
export interface VerdictRecordedData {
  verdict: VerdictId;
  lens: Lens;
  recommendation: Recommendation;
}

/** `triage.recorded`. */
export interface TriageRecordedData {
  triage: TriageId;
  verdict: VerdictId;
}

/** `impact.recorded`. */
export interface ImpactRecordedData {
  impact: ImpactId;
  kind: "predicted" | "actual";
}

/** `conformance.recorded`. */
export interface ConformanceRecordedData {
  seat: Seat;
  route: Route;
  status: ConformanceStatus;
}

/** `land.completed`: carries the landed sha, which the approved receipt draft cannot name. */
export interface LandCompletedData {
  landed: GitOid;
  trunk: string;
  method: LandMethod;
  approval: ApprovalId | null;
  policy: Slug | null;
}

/** `vcs.op`: a ref or commit change the Steward made (explains ref-snapshot diffs). */
export interface VcsOpData {
  backend: VcsBackendId;
  op: string;
  ref: string | null;
  jj_op: string | null;
}

/** `cleanup.completed`: only keel-provenance worktrees and refs are removed. */
export interface CleanupCompletedData {
  worktrees: number;
  refs: number;
}

/** Event type to data shape; the keys are the `eventType` enum of the schema. */
export interface LedgerEventDataMap {
  "proposal.created": ProposalCreatedData;
  "track.decided": TrackDecidedData;
  "hold.changed": HoldChangedData;
  "approval.recorded": ApprovalRecordedData;
  "amendment.recorded": AmendmentRecordedData;
  "override.recorded": OverrideRecordedData;
  "dispatch.queued": DispatchQueuedData;
  "claim.acquired": ClaimAcquiredData;
  "claim.heartbeat": ClaimHeartbeatData;
  "claim.released": ClaimReleasedData;
  "run.started": RunStartedData;
  "run.finished": RunFinishedData;
  "ack.recorded": AckRecordedData;
  "ruling.made": RulingMadeData;
  "question.asked": QuestionAskedData;
  "result.submitted": ResultSubmittedData;
  "round.committed": RoundCommittedData;
  "gate.checked": GateCheckedData;
  "task.blocked": TaskBlockedData;
  "task.unblocked": TaskUnblockedData;
  "fix.started": FixStartedData;
  "budget.warned": BudgetWarnedData;
  "reserved_op.detected": ReservedOpDetectedData;
  "evidence.recorded": EvidenceRecordedData;
  "verdict.recorded": VerdictRecordedData;
  "triage.recorded": TriageRecordedData;
  "impact.recorded": ImpactRecordedData;
  "conformance.recorded": ConformanceRecordedData;
  "land.completed": LandCompletedData;
  "vcs.op": VcsOpData;
  "cleanup.completed": CleanupCompletedData;
}

/** The event type union. */
export type LedgerEventType = keyof LedgerEventDataMap;

// ---- Events ----

/** One event of type `T`. */
export interface LedgerEventEnvelope<T extends LedgerEventType> {
  v: 1;
  id: EventId;
  /** Hash of the previous event; null only for the first event. */
  prev: Sha256 | null;
  ts: IsoDateTime;
  type: T;
  actor: Actor;
  subject: LedgerSubject;
  refs: EventRefs;
  data: LedgerEventDataMap[T];
  hash: Sha256;
}

/** A ledger event, discriminated by `type`. */
export type LedgerEvent<T extends LedgerEventType = LedgerEventType> = {
  [K in T]: LedgerEventEnvelope<K>;
}[T];

/** What a Steward module hands to the writer; the writer assigns `id`, `prev`, `ts` and `hash`. */
export type UnsealedLedgerEvent<T extends LedgerEventType = LedgerEventType> = {
  [K in T]: Omit<LedgerEventEnvelope<K>, "v" | "id" | "prev" | "ts" | "hash">;
}[T];

// ---- Chain ----

/** The hash of the newest event; every approval record includes it. */
export type ChainHead = Sha256;

/** One link of the chain as stored. */
export interface ChainLink {
  event: EventId;
  prev: Sha256 | null;
  hash: Sha256;
  /** Month file, `ledger/<yyyy-mm>.jsonl`. */
  file: string;
  line: number;
}

/** The result of verifying the whole chain (`keel audit` default pass). */
export type ChainVerification =
  | { status: "ok"; events: number; head: ChainHead | null }
  | {
      status: "chain-break";
      events: number;
      at: EventId | null;
      file: string;
      line: number;
      expected: Sha256 | null;
      found: Sha256 | null;
    };

/** The writer lock, relative to the git common dir; taken with an exclusive create (O_EXCL). */
export type LedgerLockPath = "keel/locks/ledger.lock";

/**
 * The supervisor lock: held by the `keel run` process that supervises seats, so that while a seat runs
 * only that process appends. Every other mutating verb, `keel approve` included, waits for it; there is
 * no exception, because an approval record no longer verifies itself.
 */
export type SupervisorLockPath = "keel/locks/supervisor.lock";

/**
 * The ledger anchor `refs/keel/ledger/head`: a Steward-owned ref to a blob holding the chain hash and the
 * event id of the tail. It is CAS-updated after every append, every process checks the file tail against
 * it, and it is part of the pre-spawn ref snapshot.
 */
export interface LedgerAnchor {
  ref: "refs/keel/ledger/head";
  blob: GitOid;
  chain_hash: Sha256;
  event: EventId;
}

/**
 * The window check at ingest: every event appended while the seat ran must be one of the supervisor's own
 * appends; anything else, an `approval.recorded` event included, is foreign and makes the run
 * `blocked(reserved_op)`.
 */
export interface LedgerWindowCheck {
  run: RunId;
  anchor_before: LedgerAnchor;
  anchor_after: LedgerAnchor;
  own_appends: EventId[];
  foreign: EventId[];
  ok: boolean;
}

// ---- Writer and reader ----

/**
 * The single writer. Before each append it takes the O_EXCL lock and checks that the file tail equals the
 * chain hash held by the ledger anchor; a mismatch is a `chain-break` and the append is refused. After the
 * append it CAS-updates the anchor.
 */
export interface LedgerWriter {
  append<T extends LedgerEventType>(event: UnsealedLedgerEvent<T>): Promise<LedgerEvent<T>>;
  head(): Promise<ChainHead | null>;
}

/** A filter for reading events. */
export interface LedgerFilter {
  types?: readonly LedgerEventType[];
  subject?: LedgerSubject;
  after?: EventId;
}

/** Reads, filters and verifies the chain. */
export interface LedgerReader {
  read(filter?: LedgerFilter): AsyncIterable<LedgerEvent>;
  head(): Promise<ChainHead | null>;
  verify(): Promise<ChainVerification>;
}
