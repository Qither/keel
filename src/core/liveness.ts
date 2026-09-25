/**
 * The liveness invariant and per-route track records.
 *
 * @packageDocumentation
 * Every non-terminal task holds exactly one liveness item: a claim, a queued dispatch, a named
 * `unblock_owner` with an open ask, or a pending approval (docs/03-lifecycle.md). A task holding none is an
 * orphan, flagged by `keel audit` and the dashboard Board queue. Heartbeats have one channel: parsed stream
 * events. Track records aggregate ledger events per route; they are computed, never stored. The quiescence
 * audit (M8) complements liveness. Implemented in M3; track records from M2, completed in M6.
 */
import type {
  ApprovalStage,
  BlockReason,
  ConformanceStatus,
  IsoDateTime,
  ProfileAlias,
  ProposalId,
  QuestionId,
  RunId,
  RuntimeId,
  Seat,
  TaskId,
} from "./ids.js";
import type { TaskState, UnblockOwner } from "./lifecycle.js";
import type { Outcome } from "../runtime/dispatch.js";

/** The four kinds of liveness item. */
export type LivenessHoldKind = "claim" | "queued-dispatch" | "unblock-owner" | "pending-approval";

/** The liveness item a task holds. */
export type LivenessHold =
  | { kind: "claim"; task: TaskId; run: RunId; lease_until: IsoDateTime }
  | {
      kind: "queued-dispatch";
      task: TaskId;
      purpose: "build" | "fix-round" | "runner" | "lens";
      queued_at: IsoDateTime;
    }
  | {
      kind: "unblock-owner";
      task: TaskId;
      owner: UnblockOwner;
      ask: QuestionId | null;
      reason: BlockReason | null;
    }
  | { kind: "pending-approval"; task: TaskId; stage: ApprovalStage | "hold" };

/** A non-terminal task that holds no liveness item. */
export interface LivenessOrphan {
  task: TaskId;
  state: TaskState;
  since: IsoDateTime;
}

/** The liveness part of `keel audit` and of the close check. */
export interface LivenessReport {
  proposal: ProposalId | null;
  tasks: number;
  held: number;
  orphans: LivenessOrphan[];
  expired_leases: TaskId[];
}

/** The route a track record aggregates over. */
export interface TrackRecordKey {
  seat: Seat;
  runtime: RuntimeId;
  alias: ProfileAlias;
  /** The profile revision the user bumps when the model behind an alias changes. */
  revision: number;
}

/** A counted ratio with its denominator. */
export interface Ratio {
  passed: number;
  total: number;
}

/** What a route has done, computed from ledger events; the dashboard shows it per route. */
export interface TrackRecord {
  key: TrackRecordKey;
  runs: number;
  outcomes: Partial<Record<Outcome, number>>;
  ack_first_attempt: Ratio;
  ack_second_attempt: Ratio;
  blocked: Partial<Record<BlockReason, number>>;
  /** Fix rounds started, over tasks built on this route. */
  fix_rounds: { rounds: number; tasks: number };
  conformance_status: ConformanceStatus;
}
