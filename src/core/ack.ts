/**
 * The ACK a seat returns before its first counted edit, and the mechanical diff the Steward computes.
 *
 * @packageDocumentation
 * Mirrors schemas/ack.schema.json (OpenAI strict subset: every field required, nullable where optional).
 * The ACK arrives on the runtime's submit channel: the structured final message (of a short pre-run for
 * read-only modes), the MCP tool `keel_submit`, or the outbox. The Steward validates it at ingest and never
 * trusts seat-side checks: the id set must equal the brief's, `write_set` must be a subset and
 * `brief_hash` must match. The first mismatch returns success-shaped guidance; a second sets
 * `blocked(ack_mismatch)`. Edits made before a matching ACK void the run. Implemented in M2.
 */
import type { AckId } from "./brief.js";
import type { BriefId, ProposalId, RepoGlob, Seat, TaskId } from "./ids.js";

/**
 * A question routed by clause type: requirements to product, architecture and obligations to the
 * architect, plan steps and interfaces to the planner, and ACC, scope, non-goals, INV and goals to the
 * Board. The four stop classes always go to the Board.
 */
export interface AckQuestion {
  /** An R, ACC, INV or obligation id, a plan step or an interface name. */
  clause: string;
  question: string;
}

/** The ACK payload. */
export interface Ack {
  kind: "ack";
  brief_hash: BriefId;
  subject: ProposalId | TaskId;
  seat: Seat;
  objective: string;
  /** The per-seat id set; must equal the brief's. */
  ids: AckId[];
  non_goals: string[];
  /** Must be a subset of the work order's write_set. */
  write_set: RepoGlob[];
  steps: string[];
  assumptions: string[];
  questions: AckQuestion[];
}

/** The mechanical comparison of an ACK with its brief (the data of `ack.recorded`). */
export interface AckDiff {
  matched: boolean;
  /** Ids in the brief's set that the ACK did not echo. */
  missing: AckId[];
  /** Ids the ACK echoed that are not in the brief's set. */
  extra: AckId[];
  write_set_ok: boolean;
  hash_ok: boolean;
}

/** What ingest does with one ACK attempt. */
export type AckVerdict =
  | { kind: "accepted"; attempt: number }
  | { kind: "retry"; attempt: 1; diff: AckDiff; guidance: string }
  | { kind: "blocked"; attempt: number; diff: AckDiff; reason: "ack_mismatch" }
  | { kind: "void"; reason: "edits-before-ack" };
