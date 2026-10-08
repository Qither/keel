// Stage A objects. Every object restates design section 3 with the same
// sources; field names are the product's.

/** Source: HC-01 s1; harness §3.1. Status is never stored; see derive.ts. */
export interface WorkItem {
  id: string;
  goal: string;
  scope: string;
  grant_ref: { id: string; version: number } | null;
  acceptance_ref: { id: string; version: number };
  task_ref: { id: string; version: number };
  open_questions: string[];
  evidence_refs: string[];
}

export type OperationKind = "exec" | "write";

/** Source: HC-03 s1–s2; HC-02 s2; HC-08 s1; harness §4.1; KP-03 supports-goal. */
export interface Grant {
  id: string;
  version: number;
  workitem_ref: { id: string; version: number };
  allowed_operations: AllowedOperation[];
  budget: Budget;
  decision_classes: string[];
  /** Present only on a confirmed version; the confirmation event is the authority. */
  confirmed_by?: string;
  confirmed_at?: string;
  confirmed_subject?: { workitem_version: number; grant_content_hash: string };
}

export interface AllowedOperation {
  kind: OperationKind;
  /** Path pattern for `write`; for `exec` the pattern is matched against the program name. */
  pattern: string;
}

export interface Budget {
  attempts: number;
  elapsed_seconds: number;
  cost: "unknown" | { amount: number; currency: string; observed_at: string };
}

export type EvidenceMode = "command-exit-status" | "artifact-exists" | "artifact-hash" | "human-confirmation";

/** Source: HC-05 s1–s2; W-01. */
export interface Acceptance {
  id: string;
  version: number;
  workitem_ref: { id: string };
  criteria: Criterion[];
  source_revision_policy: "workspace-head";
}

export interface Criterion {
  id: string;
  statement: string;
  required: boolean;
  evidence_mode: EvidenceMode;
  /** `artifact-exists` / `artifact-hash`: workspace-relative path. */
  path?: string;
  /** `artifact-hash`: expected sha256. */
  sha256?: string;
  /** `command-exit-status`: step id and expected status. */
  step?: string;
  expected_status?: number;
}

/** Source: harness §3.1; harness §4.3. */
export interface Task {
  id: string;
  workitem_ref: { id: string };
  workspace: string;
  steps: Step[];
  acceptance_obligations: string[];
}

/** One side-effecting operation the Stage A executor performs. */
export interface Step {
  id: string;
  kind: OperationKind;
  argv: string[];
  /** Workspace-relative paths the step declares it will write. */
  writes: string[];
}

export type RunState =
  | "assigned"
  | "running"
  | "stopping"
  | "outcome-uncertain"
  | "completed"
  | "failed"
  | "abandoned";

export type EvidenceStatus = "present" | "missing" | "stale" | "inferred" | "failed" | "not-run";

/** Source: HC-05 s1; HC-04 s1; W-07; harness §4.2. */
export interface Evidence {
  id: string;
  run_ref: string;
  claim: string;
  artifact_versions: { path: string; sha256: string | null }[];
  raw_status: { exit_status: number | null; signal: string | null; stdout_ref: string | null; stderr_ref: string | null } | null;
  status: EvidenceStatus;
  captured_at: string;
  source_revision: string;
  acceptance_version: number;
  /** Set when the evidence arrived from a Run of an older generation. */
  superseded?: boolean;
}

export type ContextKind = "fact" | "decision" | "inference" | "summary" | "missing";

/** Source: HC-07 s1–s2; harness §4.2. */
export interface ContextEntry {
  kind: ContextKind;
  content: string;
  source: string;
  freshness: string;
  limits: string;
}

export interface ContextPack {
  id: string;
  workitem_ref: { id: string; version: number };
  entries: ContextEntry[];
  content_hash: string;
}

/** Source: HC-03 s1; SCENARIOS §3; harness §2. */
export interface DecisionRequest {
  id: string;
  workitem_ref: { id: string };
  run_ref: string;
  facts: string[];
  options: { key: string; description: string }[];
  blocked: string;
  continuing: string;
  release_path: string;
  state: "open" | "resolved" | "withdrawn";
  resolution?: { option: string; approver: string; at: string; bound_hash: string };
}

/** Source: HC-01 s1; HC-06 s1; harness §3.1. */
export interface Checkpoint {
  id: string;
  workitem_ref: { id: string; version: number };
  progress: { satisfied: string[]; pending: string[]; failed: string[]; uncertain: string[] };
  decisions: { id: string; resolution: string | null }[];
  run_evidence: string[];
  artifact_versions: { path: string; sha256: string | null }[];
  recovery_data: { intent_id: string } | null;
  created_at: string;
}

/** Source: HC-04 s1–s2; harness §3.2. */
export interface AuthorityMap {
  declared_at: string;
  facts: { fact_class: string; authority: string; projections: string[] }[];
}

export const AUTHORITY_MAP: Omit<AuthorityMap, "declared_at"> = {
  facts: [
    {
      fact_class: "WorkItem, Grant, Acceptance, Task, DecisionRequest resolutions, ContextPack, Checkpoint",
      authority: "versioned documents under docs/<type>/<id>/v<N>.json, content-hashed per version, each version recorded in the event log",
      projections: ["show"],
    },
    {
      fact_class: "Run events, IntentRecords and outcomes, Evidence, confirmations",
      authority: "the append-only, hash-linked event log events.jsonl",
      projections: ["show", "summaries in ContextPack"],
    },
    {
      fact_class: "Workspace content and its revisions",
      authority: "the workspace's git revision store",
      projections: ["evidence artifact hashes"],
    },
    {
      fact_class: "Status, summaries, suggestions",
      authority: "derived at read time; never stored as authority",
      projections: ["themselves (projections/<id>.json is a convenience copy, never read back)"],
    },
  ],
};
