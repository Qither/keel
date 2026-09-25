/**
 * Runner evidence with its source-state binding and red/green proof, lens verdicts, and planner triage
 * records (L10).
 *
 * @packageDocumentation
 * Mirrors schemas/evidence.schema.json, verdict.schema.json (OpenAI strict subset), triage.schema.json and
 * `common.schema.json#/$defs/sourceStateBinding`. Only the Steward runner's evidence counts, taken in a
 * clean sparse detached checkout; evidence is reused only when every match field is equal, and land always
 * re-executes the full acceptance matrix on the integrated commit, so a forged or stale EV file is never
 * counted. A verdict bound to another commit or contract hash is stale and ignored. Implemented in M3.
 */
import type {
  AccId,
  BriefId,
  CheckStatus,
  EvidenceMode,
  FindingSeverity,
  GitOid,
  IsoDateTime,
  Lens,
  ProposalId,
  Recommendation,
  RepoPath,
  ScenarioRef,
  Semver,
  Sha256,
  TaskId,
  VerdictId,
} from "./ids.js";

// ---- Source-state binding ----

/**
 * Binds evidence to the state it was taken on. `recorded` names the commit and full tree; `match` holds
 * the fields that must all be equal for reuse. `source_tree` is the sha256 of the commit's tree listing
 * without `.keel/**`; `contract_hash` is the one frozen at contract approval; `env_fp` fingerprints the
 * runner environment and never includes an environment variable value.
 */
export interface SourceStateBinding {
  recorded: { commit: GitOid; tree: GitOid };
  match: {
    source_tree: Sha256;
    workorder_hash: Sha256;
    contract_hash: Sha256;
    charter_version: Semver;
    env_fp: Sha256;
  };
}

// ---- Commands and results ----

/** A declared command: argv only, never a shell string; spawned with shell:false. */
export interface CommandLine {
  argv: string[];
  cwd?: RepoPath;
  timeout_seconds?: number;
  /** JUnit XML the command writes, whose rows are tagged with scenario ids. */
  junit?: RepoPath;
}

/** One executed command; outputs are kept as digests only. */
export interface CommandRun {
  command: CommandLine;
  exit_code: number;
  status: CheckStatus;
  duration_ms: number;
  stdout_sha256: Sha256;
  stderr_sha256: Sha256;
}

/** One JUnit row, tagged `[R-...#Sn]` and mapped to scenarios. Skipped or filtered rows count as missing. */
export interface JunitRow {
  name: string;
  scenarios: ScenarioRef[];
  status: "passed" | "failed" | "skipped" | "error";
}

/** The result for one acceptance criterion, with its denominator. */
export interface AccResult {
  acc: AccId;
  evidence_mode: EvidenceMode;
  status: CheckStatus;
  passed: number;
  total: number;
}

/**
 * The red/green proof of a policy land: at least one cited scenario, or a test fixed first by a
 * different-family test task, fails at the base commit and passes at the change commit.
 */
export interface RedGreenProof {
  base: GitOid;
  change: GitOid;
  cited: (ScenarioRef | RepoPath)[];
  red_at_base: boolean;
  green_at_change: boolean;
  status: CheckStatus;
}

/** An item that was not run, with the reason; never shown as passing. */
export interface NotRunItem {
  item: string;
  reason: string;
}

/** The runner's operating system. */
export type RunnerOs = "win32" | "linux" | "darwin";

/** The runner that produced a record. */
export interface RunnerInfo {
  keel_version: Semver;
  os: RunnerOs;
  node: string;
}

/** `EV-<sha12>.json`: runner evidence (cached in .git/keel/records, projected at land). */
export interface EvidenceRecord {
  subject: ProposalId | TaskId;
  binding: SourceStateBinding;
  taken_at: IsoDateTime;
  checkout: "detached-sparse";
  runner: RunnerInfo;
  commands: CommandRun[];
  rows: JunitRow[];
  acceptance: AccResult[];
  not_run: NotRunItem[];
  red_green: RedGreenProof | null;
}

// ---- Verdicts ----

/** The lens's overall reading of the change against the frozen intent. */
export type SpecVerdict = "meets" | "partial" | "diverges" | "intent_gap" | "cannot_verify";

/** A defensible reading of the intent and whether the diff implements it (intent-alignment lens). */
export interface VerdictReading {
  reading: string;
  implemented: boolean;
}

/** Where a finding points. */
export interface FindingLocation {
  path: RepoPath;
  line: number | null;
}

/** One finding. critical or important findings close only by a fix and re-review, or `--rule dismiss`. */
export interface Finding {
  id: string;
  severity: FindingSeverity;
  title: string;
  detail: string;
  location: FindingLocation | null;
  clause: string | null;
}

/** Something the lens declined to judge, with its reason. */
export interface DeclinedItem {
  item: string;
  reason: string;
}

/**
 * `VD-<sha12>.json`: one lens verdict, captured at ingest from the child's final message, the MCP submit
 * tool or the outbox. It binds the commit, the diff digest, the contract hash and the packet brief.
 */
export interface Verdict {
  kind: "verdict";
  lens: Lens;
  subject: ProposalId | TaskId;
  brief_hash: BriefId;
  commit: GitOid;
  diff_digest: Sha256;
  contract_hash: Sha256;
  spec_verdict: SpecVerdict;
  readings: VerdictReading[];
  findings: Finding[];
  declined: DeclinedItem[];
  recommendation: Recommendation;
  summary: string;
}

// ---- Triage ----

/** What the planner does with a finding; only the Board can grant a dismissal. */
export type TriageAction = "confirm" | "upgrade" | "propose-dismissal";

/** A cited piece of evidence. */
export interface TriageEvidence {
  ref: string;
  note?: string;
}

/**
 * `TR-<sha12>.json`: a planner-owned triage record. A planner cannot dismiss an independent critical or
 * important finding; every triage record cites evidence.
 */
export interface TriageRecord {
  subject: ProposalId | TaskId;
  verdict: VerdictId;
  finding: string;
  action: TriageAction;
  severity: FindingSeverity;
  rationale: string;
  evidence: TriageEvidence[];
  brief_hash: BriefId;
  recorded_at: IsoDateTime;
  charter_version: Semver;
}
