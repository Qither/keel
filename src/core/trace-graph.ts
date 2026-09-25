/**
 * The trace graph: nodes, edges, trace queries and answers, the requirements traceability matrix (RTM)
 * and the trace drift classes.
 *
 * @packageDocumentation
 * docs/04-trace-and-state.md is the only home of trace. `keel trace <query>` follows blame (or jj annotate,
 * verify by probe) to trailers, round, task, ACC and requirement, then the goal; ledger records give
 * evidence, verdicts, signatures and rulings; path lift gives the element, owner, obligations and rules.
 * The trace check covers `merge-base(trunk, keel/<P>/main)..tip` at land and trunk history after
 * `trace.since` in audit; history before the epoch never fails. `trace.db` (node:sqlite) is a derived
 * index only. Implemented in M1b (check) and M3 (gate).
 */
import type {
  AccId,
  ApprovalId,
  ElementId,
  EvidenceId,
  Family,
  GitOid,
  GoalId,
  InvId,
  ObligationId,
  OverrideId,
  PromptId,
  ProposalId,
  ReqId,
  RepoPath,
  RoundId,
  RulingId,
  RuntimeId,
  ScenarioRef,
  Seat,
  TaskId,
  VerdictId,
  BriefId,
} from "./ids.js";

// ---- Queries ----

/** What `keel trace` accepts: a file line, a symbol, a commit, or an id. */
export type TraceQuery =
  | { kind: "file-line"; path: RepoPath; line: number }
  | { kind: "symbol"; symbol: string }
  | { kind: "commit"; commit: GitOid }
  | { kind: "requirement"; id: ReqId | ScenarioRef }
  | { kind: "goal"; id: GoalId }
  | { kind: "proposal"; id: ProposalId }
  | { kind: "element"; id: ElementId };

// ---- Nodes and edges ----

/** A node of the trace graph. */
export type TraceNode =
  | { kind: "goal"; id: GoalId }
  | { kind: "requirement"; id: ReqId }
  | { kind: "scenario"; id: ScenarioRef }
  | { kind: "acceptance"; id: AccId }
  | { kind: "task"; id: TaskId }
  | { kind: "round"; id: RoundId }
  | { kind: "commit"; id: GitOid }
  | { kind: "test"; id: string }
  | { kind: "evidence"; id: EvidenceId }
  | { kind: "verdict"; id: VerdictId }
  | { kind: "approval"; id: ApprovalId }
  | { kind: "override"; id: OverrideId }
  | { kind: "ruling"; id: RulingId }
  | { kind: "element"; id: ElementId }
  | { kind: "obligation"; id: ObligationId }
  | { kind: "invariant"; id: InvId };

/** The kind of a node. */
export type TraceNodeKind = TraceNode["kind"];

/** Where an edge was read from. */
export type TraceEdgeSource = "trailer" | "declared" | "ledger" | "junit" | "path-lift" | "blame";

/** An edge kind, named from the source node's point of view. */
export type TraceEdgeKind =
  | "goal-ref"
  | "covers"
  | "round-of"
  | "committed-as"
  | "tagged"
  | "evidences"
  | "reviews"
  | "approves"
  | "rules-on"
  | "realized-in"
  | "applies-to";

/** One edge. */
export interface TraceEdge {
  from: TraceNode;
  to: TraceNode;
  kind: TraceEdgeKind;
  source: TraceEdgeSource;
}

/** The range and epoch the trace check covers. */
export interface TraceRange {
  /** `merge-base(trunk, keel/<P>/main)` at land; the epoch in audit. */
  base: GitOid;
  tip: GitOid;
  /** `trace.since`, set by `keel init` to the trunk tip at adoption. */
  since: GitOid;
}

/** One answer of `keel trace` from a file line or commit (the text format is fixed in M1b). */
export interface TraceAnswer {
  query: TraceQuery;
  commit: GitOid | null;
  round: RoundId | null;
  seat: Seat | null;
  runtime: `${RuntimeId}@${string}` | null;
  /** The declared family of the seat's route, shown as "declared". */
  declared_family: Family | null;
  brief: BriefId | null;
  prompt: PromptId | null;
  task: TaskId | null;
  covers: (AccId | ReqId | ScenarioRef)[];
  goals: GoalId[];
  evidence: EvidenceId[];
  verdicts: VerdictId[];
  approvals: ApprovalId[];
  rulings: RulingId[];
  elements: ElementId[];
}

// ---- RTM ----

/** A gap in an RTM row; every gap cell carries a text label, never only a colour. */
export type RtmGap =
  | "no-acceptance"
  | "no-task"
  | "no-commit"
  | "no-tagged-test"
  | "no-evidence-at-head"
  | "stale-evidence"
  | "no-verdict"
  | "stale-verdict"
  | "not-realized";

/** Requirement status in the RTM, computed at head. */
export type RtmStatus = "verified" | "covered" | "uncovered";

/** One RTM row per requirement and scenario in scope (`keel trace --matrix`). */
export interface RtmRow {
  requirement: ReqId;
  scenario: ScenarioRef | null;
  goals: GoalId[];
  acc: AccId[];
  tasks: TaskId[];
  rounds: RoundId[];
  commits: GitOid[];
  tests: string[];
  evidence: EvidenceId[];
  verdicts: VerdictId[];
  elements: ElementId[];
  status: RtmStatus;
  gaps: RtmGap[];
}

// ---- Drift ----

/** The trace drift classes. */
export type TraceDriftKind =
  | "untraced-commit"
  | "orphan-task"
  | "uncovered-requirement"
  | "unverified-requirement"
  | "stale-evidence"
  | "stale-verdict"
  | "realization-mismatch"
  | "citation-drift"
  | "charter-lag"
  | "unsigned-approval"
  | "unacknowledged-receipt"
  | "chain-break";

/** The seven classes the trace check fails on. */
export type TraceFailingDriftKind = Extract<
  TraceDriftKind,
  | "untraced-commit"
  | "orphan-task"
  | "uncovered-requirement"
  | "unverified-requirement"
  | "stale-evidence"
  | "stale-verdict"
  | "realization-mismatch"
>;

/** One drift finding. */
export interface TraceDrift {
  kind: TraceDriftKind;
  subject: string;
  commit: GitOid | null;
  detail: string;
}

/** The result of the trace check over a range. */
export interface TraceCheckReport {
  range: TraceRange;
  commits: { passed: number; total: number };
  drift: TraceDrift[];
}
