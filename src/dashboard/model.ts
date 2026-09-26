/**
 * The DashboardModel: the one model behind the dashboard, CLI `--json` and the MCP tools.
 *
 * @packageDocumentation
 * @status deferred:M5
 *
 * Minimal shape until M5. The model is computed from ledger events, the committed `.keel/` files and the
 * derived caches; nothing in it is stored state, and the only file written is the rendered page. It holds
 * names only (profile aliases, env var names with SET or UNSET, declared families), never a provider
 * value. The page is a TanStack (React) application, headless over native HTML with hand-written CSS tokens
 * (revised P2, ADR-0009), pre-rendered so it reads without JavaScript and hydrated for interaction, with
 * text labels for every colour and visible denominators. Board actions appear only as copyable
 * `keel approve ...` commands; `keel dashboard serve` has no write endpoints. docs/08-dashboard.md is the
 * home.
 */
import type { ElementPage, SeriesPoint } from "../arch/analysis.js";
import type { Freshness } from "../core/brief.js";
import type { CheckResult } from "../core/gates.js";
import type { ConformanceStatus, GoalId, ProposalId, Seat, Sha256 } from "../core/ids.js";
import type { ProposalState } from "../core/lifecycle.js";
import type { LivenessOrphan, Ratio, TrackRecord } from "../core/liveness.js";
import type { RtmRow } from "../core/trace-graph.js";
import type { Route } from "../providers/routing.js";
import type { CapabilityMatrix } from "../runtime/descriptor.js";
import type { ExposureProfile } from "../runtime/exposure.js";

/** The eight views. */
export type DashboardView =
  | "overview"
  | "trace"
  | "architecture"
  | "org"
  | "proposals"
  | "evidence"
  | "runtime-health"
  | "series";

/** Kinds of Board queue item. */
export type BoardQueueKind =
  | "approval-due"
  | "ruling"
  | "ask"
  | "degraded-lane"
  | "unverified-lane"
  | "liveness-orphan"
  | "unacknowledged-receipt"
  | "unapproved-document"
  | "reserved-op";

/** One Board queue item, with what to read and the copyable command. */
export interface BoardQueueItem {
  kind: BoardQueueKind;
  subject: string;
  read: string[];
  command: string;
}

/** The model, one section per view. */
export interface DashboardModel {
  freshness: Freshness;
  chain_head: Sha256 | null;
  overview: {
    goals: { goal: GoalId; progress: Ratio }[];
    proposals: { proposal: ProposalId; state: ProposalState }[];
    failing: CheckResult[];
    board_queue: BoardQueueItem[];
    orphans: LivenessOrphan[];
  };
  trace: { rows: RtmRow[] };
  architecture: { elements: ElementPage[] };
  org: {
    seats: { seat: Seat; route: Route }[];
    track_records: TrackRecord[];
    conformance: { seat: Seat; route: Route; status: ConformanceStatus }[];
  };
  proposals: { proposal: ProposalId; state: ProposalState; checks: CheckResult[] }[];
  evidence: { proposal: ProposalId; checks: CheckResult[] }[];
  runtime_health: { capabilities: CapabilityMatrix; exposure: ExposureProfile[] };
  series: SeriesPoint[];
}
