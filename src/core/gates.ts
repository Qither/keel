/**
 * Phase gates, check ids, check results and plan readiness.
 *
 * @packageDocumentation
 * There are five phase gates (`frame`, `plan`, `submit`, `verify`, `land`), each holding named checks with
 * ids `<gate>.<name>`. The catalogue (what each check verifies, when it fails, since which milestone)
 * has one home: docs/11-verification.md. This module holds shapes only, never rule values: no thresholds,
 * no synthesis rules, no check lists. Every check fails closed and records one status with a denominator;
 * a gate passes only when each required check is `pass` or `waived`, and `not_run` is never shown as
 * `pass`. Implemented from M1a (frame) to M3 (verify, land).
 */
import type {
  CheckId,
  CheckStatus,
  Gate,
  GitOid,
  ProposalId,
  RepoPath,
  RoundId,
  Slug,
  TaskId,
} from "./ids.js";

export type { CheckId, CheckStatus, Gate } from "./ids.js";

/** A phase gate. */
export type PhaseGate = Gate;

/** The milestone a check or module arrives in. */
export type Milestone = "M0" | "M1a" | "M1b" | "M2" | "M3" | "M4" | "M5" | "M6" | "M7" | "M8";

/** One check result with its denominator (the data of `gate.checked`). */
export interface CheckResult {
  check: CheckId;
  status: CheckStatus;
  passed: number;
  total: number;
  /** What is counted, for example `matrix rows` or `changed paths in scope`. */
  unit: string | null;
  /** Why the check did not run, could not decide, or failed. */
  reason: string | null;
}

/** What a gate was evaluated on. */
export type GateSubject = ProposalId | TaskId | RoundId;

/** The results of one gate evaluation. */
export interface GateResult {
  gate: PhaseGate;
  subject: GateSubject;
  /** The commit evaluated (`keel check --at`). */
  at: GitOid;
  checks: CheckResult[];
  /** True only when every required check is `pass` or `waived`. */
  passed: boolean;
}

/** Aggregated plan readiness (`plan.ready`): warnings alone give CONCERNS, listed at plan approval. */
export type Readiness = "PASS" | "CONCERNS" | "FAIL";

/** One row of the check catalogue as docs/11 lists it. */
export interface CheckCatalogueEntry {
  id: CheckId;
  gate: PhaseGate;
  verifies: string;
  fails_when: string;
  since: Milestone;
  /** The checks of Board authority and P1 cannot be waived. */
  waivable: boolean;
}

/** A negative control: a fixture that must make its check fail with a pinned reason. */
export interface NegativeControl {
  check: CheckId;
  fixture: RepoPath;
  pinned_reason: string;
}

/**
 * Per-gate configuration in .keel/config.yaml: declared command ids and a timeout. Only the submit and verify
 * gates run declared commands, recorded as the checks `submit.commands` and `verify.commands`.
 */
export interface GateSettings {
  commands?: Slug[];
  timeout_seconds?: number;
}

/** Evaluates one gate (`keel check --gate`), or one check (`--check`). */
export interface GateRunner {
  run(gate: PhaseGate, subject: GateSubject, at?: GitOid): Promise<GateResult>;
  runCheck(check: CheckId, subject: GateSubject, at?: GitOid): Promise<CheckResult>;
}
