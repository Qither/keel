/**
 * The keel command surface as types: the 16 verbs, their 40 counted modes, what each mode does under
 * `KEEL_RUN`, and the exit-code map.
 *
 * @packageDocumentation
 * docs/12-cli-api-mcp.md is the human home of this surface and must list the same verbs, modes and exit
 * codes. The surface budget is 16 verbs and at most 40 modes; the budget is full, so a new mode must
 * replace an existing one. A mode is a subcommand word, or a flag that selects a different operation;
 * enum parameter values, output views, filters and tuners are not modes (docs/12 section 1).
 *
 * Synopses:
 *
 * ```text
 * keel init [--vcs auto|git|jj] [--runtimes <id,...>] [--yes]
 * keel sync [--check] [--runtime <id>]
 * keel doctor [--section runtimes|providers|vcs|approvals|exposure|arch] [--conformance] [--selftest] [--json]
 * keel new "<title>" [--goal G-nn] [--track spike|patch|feature|system] [--policy <name>]
 * keel approve <subject> --stage contract|plan|land|receipt | --doc <path> | --policy <name> | --request
 *              | --rule answer|budget|track|override|dismiss|degraded|unverified|abandon
 *              [--until <date|land|commit-touching:path>] [--limit <usd|runs|wall_minutes>=<n>]
 *              [--to spike|patch|feature|system] [--note "<text>"] [--as <approver>]
 * keel run <P|P.Tn> [--seat <seat>] [--wave] [--runtime <id>] [--resume] [--dry-run] | --hold on|off <P>
 * keel check [<P>] [--gate frame|plan|submit|verify|land|all] [--check <id>] [--at <commit>] [--json]
 * keel land <P> [--preview]
 * keel status [<id>] [--next] [--json]
 * keel trace <file:line|symbol|commit|R-...|G-...|P-...|el:...> [--matrix] [--json]
 * keel brief <P|P.Tn> [--seat <seat>] [--format md|json]
 * keel arch index|find|impact|drift|plan|render ...
 * keel audit [--rebuild] [--export-vcs] [--backfill]
 * keel dashboard build [--out <file>] | serve [--port 0]
 * keel api ack|ask|rule|submit|context --input <json|-> --json | keel api mcp [--http]
 * keel hook <canonical event> --runtime <id>
 * ```
 *
 * M0 ships no executable: package.json has no `bin` until M1.
 */
import type { CheckId } from "../core/gates.js";
import type { Budget, Until } from "../core/governance.js";
import type {
  ApprovalStage,
  Gate,
  GitOid,
  GoalId,
  ProposalId,
  RepoPath,
  RuleKind,
  RuntimeId,
  Seat,
  Slug,
  TaskId,
  Track,
} from "../core/ids.js";
import type { TraceQuery } from "../core/trace-graph.js";
import type { CanonicalHookEventId } from "../runtime/hooks.js";

/**
 * What a mode does when `KEEL_RUN` or `KEEL_RUN_ID` is set, or when an ancestor process is a registered
 * keel run (the Windows ancestor walk is verify by probe).
 *
 * - `refused`: the mode exits 6 (environment); only the Steward writes the declared plane, the control
 *   plane and refs.
 * - `allowed`: the mode runs normally.
 * - `report-only`: the mode runs but appends nothing to the ledger (`keel check`).
 * - `print-only`: the mode prints its result and writes nothing (`keel arch plan`).
 */
export type KeelRunPolicy = "refused" | "allowed" | "report-only" | "print-only";

/**
 * Every counted mode per verb, with its `KEEL_RUN` policy. This table is the type-level mirror of the
 * verb table in docs/12 section 1.
 */
export interface ModeTable {
  init: { init: "refused" };
  sync: { generate: "refused"; check: "refused" };
  doctor: { probe: "allowed"; conformance: "refused"; selftest: "refused" };
  new: { intake: "refused" };
  approve: {
    stage: "refused";
    doc: "refused";
    policy: "refused";
    request: "refused";
    rule: "refused";
  };
  run: { dispatch: "refused"; "dry-run": "refused"; hold: "refused" };
  check: { check: "report-only" };
  land: { land: "refused"; preview: "refused" };
  status: { status: "allowed" };
  trace: { trace: "allowed" };
  brief: { brief: "allowed" };
  arch: {
    index: "refused";
    find: "allowed";
    impact: "allowed";
    drift: "allowed";
    plan: "print-only";
    render: "refused";
  };
  audit: { default: "refused"; rebuild: "refused"; "export-vcs": "refused"; backfill: "refused" };
  dashboard: { build: "refused"; serve: "refused" };
  api: {
    ack: "allowed";
    ask: "allowed";
    rule: "allowed";
    submit: "allowed";
    context: "allowed";
    mcp: "allowed";
  };
  hook: { hook: "allowed" };
}

/** The 16 top-level verbs. */
export type Verb = keyof ModeTable;

/** The counted modes of one verb (or of every verb). */
export type CommandMode<V extends Verb = Verb> = V extends Verb ? keyof ModeTable[V] & string : never;

/**
 * The literal union of every verb and counted mode: 40 members. `under_keel_run` repeats the policy of
 * {@link ModeTable} so that a dispatcher can switch on one object.
 */
export type CommandSpec = {
  [V in Verb]: {
    [M in keyof ModeTable[V] & string]: {
      verb: V;
      mode: M;
      under_keel_run: ModeTable[V][M];
    };
  }[keyof ModeTable[V] & string];
}[Verb];

/** A command written as `<verb> <mode>`, for diagnostics and the surface manifest. */
export type CommandKey = CommandSpec extends infer S
  ? S extends { verb: infer V extends string; mode: infer M extends string }
    ? `${V} ${M}`
    : never
  : never;

/** The surface budget, stated as a type so that docs/12 and this file can be compared. */
export interface SurfaceBudget {
  verbs: 16;
  modes: 40;
}

/**
 * keel's own exit codes, shared by every verb. Runtime exit codes (53 turn limit, 55 budget, 42 input
 * error, 143 on POSIX only) are a different thing: descriptors map them to run outcomes.
 */
export interface ExitCodeMap {
  /** Command succeeded; every selected check passed or was waived. */
  0: "ok";
  /** A check failed (`keel check`, the gates inside `run` and `land`). */
  1: "gate_failed";
  /** Unknown verb, mode or flag; invalid input JSON. */
  2: "usage";
  /** A Board item is pending: approval, ask, ruling, stop class, or a blocked task needing a decision. */
  3: "needs_human";
  /** A lost CAS on a claim ref; never retried automatically. */
  4: "claim_conflict";
  /** Trunk moved (restack and retry), or a worktree with trunk checked out is dirty. */
  5: "stale_or_trunk_dirty";
  /** Missing or too old git, refusal under KEEL_RUN or a keel-run ancestor. */
  6: "environment";
}

/** 0 to 6; the `exitCode` definition of schemas/api-envelope.schema.json. */
export type ExitCode = keyof ExitCodeMap;

/** The meaning of an exit code. */
export type ExitMeaning = ExitCodeMap[ExitCode];

// ---- Parameter value types (not counted as modes) ----

/** `keel init --vcs`. */
export type InitVcsOption = "auto" | "git" | "jj";

/** `keel doctor --section`. */
export type DoctorSection = "runtimes" | "providers" | "vcs" | "approvals" | "exposure" | "arch";

/** `keel check --gate`. */
export type GateSelector = Gate | "all";

/** `keel brief --format`. */
export type BriefFormat = "md" | "json";

/** `keel run --hold`. */
export type HoldSwitch = "on" | "off";

/** The subject of `keel run` and `keel brief`: a proposal or one of its tasks. */
export type RunSubject = ProposalId | TaskId;

/** The arguments of `keel trace`; the query forms are defined with the trace graph. */
export interface TraceArgs {
  query: TraceQuery;
  matrix: boolean;
  json: boolean;
}

/**
 * The arguments of each approve mode (`keel approve`, the single Board approval path). `note` is the
 * optional commentary recorded with the approval; `as` overrides the configured `board.approver` name
 * for this confirmation and is asked for when neither is set.
 */
export type ApproveArgs =
  | { mode: "stage"; subject: ProposalId; stage: ApprovalStage; note: string | null; as: string | null }
  | { mode: "doc"; path: RepoPath; note: string | null; as: string | null }
  | { mode: "policy"; policy: Slug; note: string | null; as: string | null }
  | { mode: "request"; subject: ProposalId; note: string | null; as: string | null }
  | {
      mode: "rule";
      subject: string;
      rule: RuleKind;
      until: Until | null;
      /** `--limit <usd|runs|wall_minutes>=<n>` (repeatable) for a budget ruling. */
      limit: Budget | null;
      /** `--to <track>` for a track ruling. */
      to: Track | null;
      note: string | null;
      as: string | null;
    };

/** The arguments of `keel new`. */
export interface NewArgs {
  title: string;
  goal: GoalId | null;
  track: Track | null;
  policy: Slug | null;
}

/** The arguments of `keel run` in its dispatch and dry-run modes. */
export interface RunArgs {
  subject: RunSubject;
  seat: Seat | null;
  wave: boolean;
  runtime: RuntimeId | null;
  resume: boolean;
  dry_run: boolean;
}

/** The arguments of `keel check`. */
export interface CheckArgs {
  subject: ProposalId | null;
  gate: GateSelector;
  check: CheckId | null;
  at: GitOid | null;
  json: boolean;
}

/** The arguments of `keel hook`. */
export interface HookArgs {
  event: CanonicalHookEventId;
  runtime: RuntimeId;
}
