/**
 * Dispatch requests, run records, canonical run events and outcomes.
 *
 * @packageDocumentation
 * Mirrors schemas/run.schema.json. `keel run` is the deterministic dispatcher: resolve signed routing,
 * compatibility, the exposure rule and conformance status; claim; create the sparse worktree; snapshot
 * refs; compile the brief; spawn headless with per-run config; ingest submit channels; make Steward
 * commits. The route, the exposure profile and the conformance status are frozen into the run record.
 * Each runtime's stream is normalized to canonical events; persisted events pass a typed-field whitelist
 * (no free-text provider or runtime error bodies, no model field unless `record_model_names` is set), and
 * the raw stream is parsed in memory and never written to disk. Implemented in M2.
 */
import type { Budget } from "../core/governance.js";
import type {
  BriefId,
  ConformanceStatus,
  IsoDateTime,
  PromptId,
  ProposalId,
  RunId,
  Rung,
  RuntimeId,
  Seat,
  Slug,
  SubmitChannel,
  TaskId,
} from "../core/ids.js";
import type { Route } from "../providers/routing.js";
import type { ExposureProfile } from "./exposure.js";

// ---- Requests ----

/** `keel run <P|P.Tn>` in dispatch or dry-run mode. */
export interface DispatchRequest {
  subject: ProposalId | TaskId;
  seat: Seat | null;
  /** Dispatch every ready task of the next wave, up to max_parallel. */
  wave: boolean;
  runtime: RuntimeId | null;
  resume: boolean;
  /** Stop before the claim and the spawn; print the resolved route and argv template. */
  dry_run: boolean;
}

/** What a dry run prints, and what a real dispatch freezes before spawning. */
export interface DispatchPlan {
  run: RunId;
  subject: ProposalId | TaskId;
  seat: Seat;
  mode: Slug;
  route: Route;
  exposure: ExposureProfile;
  conformance_status: ConformanceStatus;
  submit_channel: SubmitChannel;
  /** null for the direct lane (outside the A-D ladder). */
  rung: Rung | null;
  argv: ArgvRedacted;
}

// ---- Run records ----

/** argv as persisted (`argv.redacted.json`): `${ENV:NAME}` placeholders, never a model name, URL or key. */
export type ArgvRedacted = string[];

/** Canonical run outcome, mapped from native exit codes; `killed` comes from keel's cancellation journal. */
export type Outcome =
  | "completed"
  | "failed"
  | "killed"
  | "timeout"
  | "turn_limit"
  | "budget"
  | "input_error"
  | "runtime_unavailable";

/** `.git/keel/runs/<RUN>/run.json`, with argv.redacted.json and events.jsonl beside it. */
export interface RunRecord {
  id: RunId;
  subject: ProposalId | TaskId;
  seat: Seat;
  mode: Slug;
  route: Route;
  runtime_version: string;
  brief: BriefId;
  prompt: PromptId;
  exposure: ExposureProfile;
  conformance_status: ConformanceStatus;
  submit_channel: SubmitChannel;
  /** null for the direct lane (outside the A-D ladder). */
  rung: Rung | null;
  argv: ArgvRedacted;
  started_at: IsoDateTime;
  ended_at: IsoDateTime | null;
  outcome: Outcome | null;
  exit_code: number | null;
  budget?: Budget | null;
}

// ---- Canonical run events ----

/** The kinds of canonical event a parser emits. */
export type CanonicalRunEventKind =
  | "session.init"
  | "message"
  | "tool_use"
  | "tool_result"
  | "usage"
  | "compaction"
  | "subagent"
  | "error"
  | "final";

/** A typed error class; the free-text error body is never persisted. */
export type RunErrorClass = "auth" | "rate_limit" | "network" | "schema" | "timeout" | "other";

/**
 * One canonical event, after the typed-field whitelist. Heartbeats derive from these events only;
 * `tool_use` paths are checked against the provider path set, and `subagent` events from builder seats are
 * a submit-gate finding.
 */
export interface CanonicalRunEvent {
  seq: number;
  ts: IsoDateTime;
  kind: CanonicalRunEventKind;
  tool?: string | null;
  paths?: string[];
  tokens?: { input: number; output: number } | null;
  cost_usd?: number | null;
  error_class?: RunErrorClass | null;
  /** Dropped unless routing sets record_model_names. */
  model?: string | null;
}

/** A stream parser: one runtime's native stream line to zero or more canonical events. */
export type StreamParser = (line: string, seq: number) => readonly CanonicalRunEvent[];
