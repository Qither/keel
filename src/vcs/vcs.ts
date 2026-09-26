/**
 * The Vcs interface both backends implement, with workspace handles, ref snapshots, claims and the land
 * request.
 *
 * @packageDocumentation
 * git is primary and fully sufficient (D4, ADR-0001); every guarantee is specified in git primitives, and
 * GitBackend (`./git.ts`) implements this whole interface. JjBackend (`./jj.ts`, M7) implements the same
 * interface and adds optional capabilities, never replaces one; disabling jj loses nothing. The Steward
 * never calls git or jj outside this interface. docs/05-vcs.md is the home of the mechanics. Implemented
 * from M1a (detect, trailers) through M3 (integration, land).
 */
import type { Trailers } from "./git.js";
import type {
  ApprovalId,
  CheckStatus,
  GitOid,
  IsoDateTime,
  ProposalId,
  RepoPath,
  RunId,
  Sha256,
  Slug,
  TaskId,
} from "../core/ids.js";
import type { ReservedOpDetection } from "../org/seats.js";

// ---- Backend selection and detection ----

/**
 * `vcs.backend` in .keel/config.yaml. `keel init` writes `auto` with `jj_opt_in: false` (then `auto` behaves
 * exactly like `git`) unless `--vcs` says otherwise.
 */
export type VcsBackendChoice = "auto" | "git" | "jj";

/** The backend actually in use; every run record and receipt names it. */
export type VcsBackendId = "git" | "jj";

/** The `vcs` table of .keel/config.yaml. */
export interface VcsConfig {
  backend?: VcsBackendChoice;
  trunk?: string;
  remotes?: string[];
  /** The Board's opt-in to JjBackend. */
  jj_opt_in?: boolean;
}

/** A hazard that rules out JjBackend or weakens a guarantee. */
export type VcsHazard =
  | "git-below-floor"
  | "not-colocated"
  | "lfs"
  | "submodules"
  | "filters"
  | "ref-conflict"
  | "longpaths-off"
  | "existing-pushurl"
  | "eol-mismatch";

/** One feature probe; a capability counts only when `verified`. */
export interface VcsFeatureProbe {
  id: Slug;
  verified: boolean;
  detail: string | null;
}

/** The result of `detect`; with `auto`, a failed condition means GitBackend and doctor names it. */
export interface VcsDetectReport {
  backend: VcsBackendId;
  choice: VcsBackendChoice;
  git_version: string;
  /** The floor is git 2.38 (merge-tree --write-tree and --name-only). */
  git_floor_ok: boolean;
  jj_version: string | null;
  colocated: boolean;
  probes: VcsFeatureProbe[];
  hazards: VcsHazard[];
  /** Existing refs that would block keel's non-nesting names, such as a branch named `keel`. */
  ref_conflicts: string[];
}

// ---- Workspaces ----

/** The kind of worktree: planning (full checkout of keel/<P>/main), task (sparse) or verify (detached). */
export type WorkspaceKind = "planning" | "task" | "verify";

/** A keel-provenance worktree under the workspace root (default `../<repo>.ws/`). */
export interface WorkspaceHandle {
  kind: WorkspaceKind;
  path: string;
  /** Null for a detached verify or index checkout. */
  branch: string | null;
  base: GitOid;
  /** Sparse patterns; task and verify worktrees exclude `/.keel/proposals/`. */
  sparse: readonly string[];
  /** `keel:<task>:<run>` for locked task worktrees. */
  lock_reason: string | null;
  task: TaskId | null;
  run: RunId | null;
}

/** A request to create one worktree; creation is serialized under a lock. */
export interface WorkspaceCreateRequest {
  kind: WorkspaceKind;
  proposal: ProposalId;
  task: TaskId | null;
  run: RunId | null;
  base: GitOid;
}

/** Workspace operations. */
export interface WorkspaceOps {
  create(request: WorkspaceCreateRequest): Promise<WorkspaceHandle>;
  list(): Promise<WorkspaceHandle[]>;
  /** Removes only worktrees with keel provenance. */
  remove(workspace: WorkspaceHandle): Promise<void>;
}

// ---- Snapshots and ref detection ----

/**
 * What triggered a shadow snapshot. Headless runs have no turns keel controls, so every trigger is a
 * Steward-side event (docs/05-vcs.md "Snapshots between turns").
 */
export type SnapshotTrigger = "pre-spawn-base" | "stream-boundary" | "ack-ingest" | "submit-ingest";

/**
 * A shadow snapshot; it never touches the seat's index or branch. The temporary-index snapshot is the
 * mechanism for git worktrees under both backends; `jj util snapshot` applies only to jj workspaces, once
 * they are allowed.
 */
export interface ShadowSnapshot {
  ref: string;
  commit: GitOid;
  tree: GitOid;
  taken_at: IsoDateTime;
  trigger: SnapshotTrigger;
}

/**
 * The name-only listing (`git status --porcelain -z --untracked-files=all`) that runs before every
 * `add -A`. Paths matching the provider path set, `.env`, `.env.*` or a credential basename are never
 * staged: the snapshot or round fails with `submit.provider-path-events` and the path is reported by name.
 */
export interface PreStageListing {
  paths: RepoPath[];
  provider_path_hits: RepoPath[];
}

/**
 * Exclude pathspecs passed to every `add -A`: one glob pathspec per provider pattern (`.env`, `.env.*`, each
 * credential basename) at any depth. The pathspec magic on the git floor is verify by probe.
 */
export type ExcludePathspec = `:(exclude,glob)${string}`;

/** One ref and the object it points at. */
export interface RefEntry {
  ref: string;
  oid: GitOid;
}

/** The HEAD and branch of one worktree. */
export interface WorktreeHead {
  path: string;
  head: GitOid;
  branch: string | null;
}

/** The newest reflog entries of one ref. */
export interface ReflogTail {
  ref: string;
  entries: GitOid[];
}

/**
 * The pre-spawn snapshot: `for-each-ref` over refs/heads, refs/tags, refs/remotes and refs/keel, each
 * worktree's HEAD, and the reflog tails. JjBackend adds the op-log head.
 */
export interface RefSnapshot {
  taken_at: IsoDateTime;
  refs: RefEntry[];
  heads: WorktreeHead[];
  reflogs: ReflogTail[];
  jj_op_head: string | null;
}

/** A read-only `git ls-remote` of one configured remote. */
export interface RemoteState {
  remote: string;
  reachable: boolean;
  refs: RefEntry[];
}

/** `ls-remote` of every configured remote, before and after each run. */
export interface RemoteSnapshot {
  taken_at: IsoDateTime;
  remotes: RemoteState[];
}

/** One changed ref. */
export interface RefChange {
  ref: string;
  before: GitOid | null;
  after: GitOid | null;
  source: ReservedOpDetection;
}

/**
 * A change is explained only by a Steward `vcs.op` ledger event, by a seat commit fast-forwarding the
 * seat's own task branch (preserved under refs/keel/snap), or by a move of the ledger anchor
 * `refs/keel/ledger/head` that matches the supervising Steward's own appends.
 */
export interface RefExplanation {
  ref: string;
  after: GitOid | null;
  by: "vcs.op" | "seat-fast-forward" | "ledger-append";
}

/** The diff of two snapshots; unexplained changes set `blocked(reserved_op)`. */
export interface RefDiff {
  changes: RefChange[];
  unexplained: RefChange[];
  /** `unknown` when a remote could not be reached, never `pass`. */
  status: CheckStatus;
}

// ---- Commits and trailers ----

/**
 * The Steward commit at submit ingest: a temporary index, `commit-tree -p <tip>`, then a CAS update-ref.
 * Every submitted round is committed; the submit gate then evaluates the round commit.
 */
export interface CommitTreeRequest {
  workspace: WorkspaceHandle;
  branch: string;
  /** The task branch tip recorded before the run. */
  tip: GitOid;
  /** The branch value now; differs from `tip` only when the seat committed. */
  current: GitOid;
  message: string;
  trailers: Trailers;
  /** The temporary index under the run directory, set as GIT_INDEX_FILE in the child only. */
  index_file: string;
  /** Exclude pathspecs for provider paths, passed to `add -A` after a clean {@link PreStageListing}. */
  excludes: ExcludePathspec[];
}

/** The result of a Steward commit; the worktree index is refreshed afterwards. */
export interface CommitTreeResult {
  commit: GitOid;
  tree: GitOid;
  /** Seat-made commits preserved under refs/keel/snap/<P>.T<n>/seat-<n>. */
  preserved: string[];
}

/** Trailer operations (`git interpret-trailers --parse` on GitBackend). */
export interface TrailerOps {
  read(commit: GitOid): Promise<Trailers | null>;
}

// ---- Claims ----

/** The worktree recorded in a claim. */
export interface ClaimWorkspace {
  path: string;
  branch: string;
  base: GitOid;
  sparse: string[];
  lock_reason?: string;
}

/**
 * A task claim (schemas/claim.schema.json). The lock is `refs/keel/claims/<P>.T<n>`, created with
 * `git update-ref <ref> <blob> <zero-oid>` (create-only CAS) and released by a CAS delete; its blob holds
 * the token only. Lease, route and heartbeat live in ledger events.
 */
export interface ClaimRecord {
  task: TaskId;
  ref: string;
  token: Sha256;
  run: RunId;
  acquired_at: IsoDateTime;
  lease_seconds: number;
  workspace: ClaimWorkspace;
}

/** A lost CAS exits 4 and is never retried. */
export type ClaimAcquireResult =
  | { ok: true; ref: string; token_blob: GitOid }
  | { ok: false; conflict: "exists"; ref: string };

/** Claim lock operations. */
export interface ClaimOps {
  acquire(task: TaskId, token: Sha256): Promise<ClaimAcquireResult>;
  /** CAS delete; fails when the ref no longer holds this token. */
  release(task: TaskId, token_blob: GitOid): Promise<{ ok: boolean }>;
}

// ---- Integration ----

/** Merge all submitted tips into a throwaway commit, without a worktree. */
export interface PreviewRequest {
  /** keel/<P>/main, already restacked onto trunk. */
  base: GitOid;
  /** Submitted tips in wave order. */
  tips: GitOid[];
}

/** A conflict becomes a resolution task; keel never uses -X ours or -X theirs. */
export interface IntegrationConflict {
  tip: GitOid;
  paths: RepoPath[];
}

/** The preview result; the final commit is checked out detached in a verify worktree. */
export interface PreviewResult {
  commit: GitOid | null;
  conflicts: IntegrationConflict[];
}

/** Replay commits onto a new base, keeping messages and trailers. */
export interface RestackRequest {
  branch: string;
  commits: GitOid[];
  onto: GitOid;
  expected_current: GitOid;
}

/** Old to new commit ids; the ledger records the mapping. */
export interface RestackResult {
  mapping: { old: GitOid; new: GitOid }[];
  conflicts: IntegrationConflict[];
}

// ---- Land ----

/** The context of a land; the Vcs moves trunk only after the land gate and the approval check passed. */
export interface LandRequest {
  proposal: ProposalId;
  trunk: string;
  approval: ApprovalId | null;
  policy: Slug | null;
}

/**
 * The three land cases after the ancestry check:
 * - A: a clean worktree has trunk checked out, so `git -C <wt> merge --ff-only <new>` (also a CAS);
 * - B: that worktree is dirty, so refuse with exit 5 and guidance;
 * - C: no worktree has trunk checked out, so `git update-ref refs/heads/<trunk> <new> <expected-old>`.
 */
export type LandCase = "A" | "B" | "C";

/** How trunk moved: case A or case C. */
export type LandMethod = "ff-only" | "cas-update-ref";

/** The result of `land`. `trunk-moved` means trunk is not an ancestor: exit 5, restack. */
export type LandResult =
  | { ok: true; case: "A" | "C"; landed: GitOid; method: LandMethod }
  | { ok: false; case: "B" | null; refused: "trunk-moved" | "trunk-worktree-dirty" | "cas-failed" };

/** Line to commit, for `keel trace`. */
export interface AnnotateResult {
  commit: GitOid;
  path: RepoPath;
  line: number;
  original_line: number;
}

// ---- The interface ----

/** The version-control interface. GitBackend implements all of it. */
export interface Vcs {
  readonly backend: VcsBackendId;
  /** Choose the backend; report versions, feature probes and hazards. */
  detect(): Promise<VcsDetectReport>;
  /** Locked, sparse worktrees for planning, tasks and verification. */
  readonly workspace: WorkspaceOps;
  /** Name-only listing before any staging; never opens a file. */
  preStageListing(workspace: WorkspaceHandle): Promise<PreStageListing>;
  /** Shadow snapshot of a seat's files at a Steward-side trigger. */
  snapshot(
    workspace: WorkspaceHandle,
    tip: GitOid,
    seq: number,
    trigger: SnapshotTrigger,
  ): Promise<ShadowSnapshot>;
  /** Reserved-operation detection: take a snapshot before each spawn. */
  refSnapshot(): Promise<RefSnapshot>;
  /** Diff two snapshots at ingest and at land. */
  refDiff(before: RefSnapshot, after: RefSnapshot, explained: readonly RefExplanation[]): RefDiff;
  /** Push detection: read-only `ls-remote` of each configured remote. */
  remoteSnapshot(remotes: readonly string[]): Promise<RemoteSnapshot>;
  /** Changed paths for scope, impact and the ratchet. */
  diffNames(from: GitOid, to: GitOid): Promise<RepoPath[]>;
  /** sha256 of `git ls-tree -r -z --full-tree <commit>` without `.keel/**`. */
  sourceTreeHash(commit: GitOid): Promise<Sha256>;
  /** The Steward commit with trailers. */
  commitTree(request: CommitTreeRequest): Promise<CommitTreeResult>;
  readonly trailers: TrailerOps;
  /** Create-only CAS lock refs. */
  readonly claims: ClaimOps;
  /** Throwaway integration of submitted tips. */
  previewIntegration(request: PreviewRequest): Promise<PreviewResult>;
  /** Replay commits onto a new base. */
  restack(request: RestackRequest): Promise<RestackResult>;
  /** Move trunk from `expectedOld` to `newTip` by one of the three land cases. */
  land(expectedOld: GitOid, newTip: GitOid, request: LandRequest): Promise<LandResult>;
  /** Line to commit (`git blame --porcelain`; jj file annotate on JjBackend). */
  annotate(path: RepoPath, line: number, at?: GitOid): Promise<AnnotateResult>;
}
