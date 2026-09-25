/**
 * The agent-facing `keel api` contract: ops, submit channels, outbox drops, the seat result, and the JSON
 * envelope every verb prints with `--json`.
 *
 * @packageDocumentation
 * Mirrors schemas/api-envelope.schema.json and schemas/result.schema.json (OpenAI strict subset).
 * `keel api` is how a seat, or at rung D the human acting for it, talks to the Steward. Every op writes at
 * most one file, an O_EXCL drop `<workspace_root>/_runs/<RUN>/outbox/<seq>-<kind>.json`, and the Steward
 * re-validates it at ingest; api-side validation is a convenience, never a trust boundary. `keel api`
 * never commits, never writes outside the outbox and never touches refs. The run is identified by
 * `KEEL_RUN_ID`; without a run every op except `context` refuses. docs/12-cli-api-mcp.md sections 2 to 4
 * are the home. Implemented in M1a (envelope) and M2 (ops).
 */
import type { Ack, AckQuestion } from "../core/ack.js";
import type { BriefSectionId, Freshness } from "../core/brief.js";
import type { TriageRecord, Verdict } from "../core/evidence.js";
import type { RulingPayload } from "../core/governance.js";
import type { BriefId, ProposalId, RepoPath, ResultStatus, Seat, SubmitChannel, TaskId } from "../core/ids.js";
import type { ExitCode } from "../cli/commands.js";

export type { SubmitChannel } from "../core/ids.js";

// ---- Ops ----

/** The `keel api` ops (`mcp` is a server mode of the verb, not an op). */
export type ApiOp = "ack" | "ask" | "rule" | "submit" | "context";

/** Which channel carries the ACK and the result for a mode; chosen per descriptor. */
export interface SubmitRoute {
  ack: SubmitChannel;
  result: SubmitChannel;
}

// ---- The seat result ----

/** Handoff notes of a result. */
export interface ResultHandoff {
  notes: string;
  not_tested: string[];
  concerns: string[];
  next: string | null;
}

/**
 * A seat's result (result.json). The submit gate checks the schema and the BR echo, then recompiles the
 * brief.
 */
export interface SeatResult {
  kind: "result";
  /** The BR echo. */
  brief_hash: BriefId;
  subject: ProposalId | TaskId;
  seat: Seat;
  status: ResultStatus;
  /** The goal restated by the seat. */
  goal_echo: string;
  summary: string;
  rulings: RulingPayload[];
  questions: AckQuestion[];
  blocker: string | null;
  handoff: ResultHandoff;
  /**
   * Proposal files authored by a product, architect or planner seat, which run in read-only modes; the
   * Steward checks each path against the seat's writable globs, writes it into the planning worktree and
   * commits it. Empty for the engineer.
   */
  files: AuthoredFile[];
}

/** One authored proposal file with its full content. */
export interface AuthoredFile {
  path: RepoPath;
  content: string;
}

// ---- Outbox drops ----

/** `keel api ask`: the question names the clause id it is about. */
export interface AskDrop {
  kind: "ask";
  question: AckQuestion;
}

/** `keel api rule`. */
export interface RuleDrop {
  kind: "rule";
  ruling: RulingPayload;
}

/**
 * The payload of each drop kind, keyed by the `<kind>` of the drop file name. The planner submits triage
 * records through `submit`.
 */
export interface OutboxDropPayloads {
  ack: Ack;
  ask: AskDrop;
  rule: RuleDrop;
  result: SeatResult;
  verdict: Verdict;
  triage: TriageRecord;
}

/** The kinds a drop file can have. */
export type OutboxDropKind = keyof OutboxDropPayloads;

/** One drop payload. */
export type OutboxDrop = OutboxDropPayloads[OutboxDropKind];

/** The file name of a drop; the sequence number is assigned by keel, never taken from the payload. */
export type OutboxDropFileName = `${number}-${OutboxDropKind}.json`;

/** What `keel api submit` accepts: a result, a lens verdict, or a planner triage record. */
export type SubmitPayload = SeatResult | Verdict | TriageRecord;

/**
 * `keel api context` (and MCP `keel_context`): subject required. A null seat means the seat of the run bound
 * by `KEEL_RUN_ID` (refused when no run is bound); a null section means the whole brief.
 */
export interface ContextRequest {
  subject: ProposalId | TaskId;
  seat: Seat | null;
  section: BriefSectionId | null;
}

/** The input of each op. */
export interface ApiOpInput {
  ack: Ack;
  ask: AskDrop;
  rule: RuleDrop;
  submit: SubmitPayload;
  context: ContextRequest;
}

// ---- The JSON envelope ----

/** Diagnostic severity. */
export type DiagnosticSeverity = "error" | "warning" | "info";

/**
 * A diagnostic. `code` is a check id from docs/11 or a refusal code; every error carries a `hint` with the
 * next command to run.
 */
export interface Diagnostic {
  code: string;
  severity: DiagnosticSeverity;
  message: string;
  subject: string | null;
  hint: string | null;
}

/**
 * The envelope every verb prints with `--json`, and every `keel api` op prints: exactly one JSON document
 * on stdout. `ok` is true exactly when `exit_code` is 0. Aggregates carry denominators; no field ever
 * carries a provider value.
 */
export interface ApiEnvelope<D extends object | null = object | null> {
  v: 1;
  ok: boolean;
  command: string;
  subject?: string | null;
  exit_code: ExitCode;
  /** Command-specific payload: the same model the dashboard and MCP use. */
  data: D;
  diagnostics: Diagnostic[];
  next: string[];
  freshness?: Freshness | null;
}
