/**
 * GitBackend configuration types: trailer keys, ref namespaces, worktree names, sparse patterns and the
 * seat git hardening, all as literal types.
 *
 * @packageDocumentation
 * GitBackend implements the whole {@link Vcs} interface with plain git and is fully sufficient (D4).
 * Mirrors `common.schema.json#/$defs/trailers` (roundTrailers, governanceTrailers). Branches never nest:
 * `keel/<P>/main` for the proposal and `keel/<P>/t/<n>` for tasks, because a ref cannot be both a file and
 * a directory; doctor and the selftest check for such conflicts. In JSON records multi-valued trailers are
 * arrays; in commit messages they are repeated trailer lines. Implemented from M1a (trailers) to M3.
 */
import type {
  AccId,
  ApprovalId,
  BriefId,
  GitOid,
  PromptId,
  ProposalId,
  RepoPath,
  ReqId,
  RoundId,
  RulingId,
  RunId,
  RuntimeId,
  ScenarioRef,
  Seat,
  Semver,
  TaskId,
} from "../core/ids.js";
import type { Vcs, VcsFeatureProbe } from "./vcs.js";

// ---- Trailers ----

/** Trailers of a Steward round commit. */
export type RoundTrailerKey =
  | "Keel-Round"
  | "Keel-Req"
  | "Keel-Acc"
  | "Keel-Seat"
  | "Keel-Run"
  | "Keel-Runtime"
  | "Keel-Brief"
  | "Keel-Prompt"
  | "Keel-Charter"
  | "Keel-Ruling"
  | "Not-tested";

/** Trailers of a Steward governance or archive commit. */
export type GovernanceTrailerKey = "Keel-Doc" | "Keel-Approval";

/** Every trailer key keel writes. */
export type TrailerKey = RoundTrailerKey | GovernanceTrailerKey;

/** Trailers that repeat in a commit message and are arrays in JSON. */
export type MultiValuedTrailerKey = "Keel-Req" | "Keel-Acc" | "Keel-Ruling" | "Not-tested";

/** `<runtimeId>@<version>`. */
export type KeelRuntimeTrailer = `${RuntimeId}@${string}`;

/** The trailers of a round commit `<P>.T<n>.r<k>`. */
export interface RoundTrailers {
  "Keel-Round": RoundId;
  "Keel-Req": (ReqId | ScenarioRef)[];
  "Keel-Acc": AccId[];
  "Keel-Seat": Seat;
  "Keel-Run": RunId;
  "Keel-Runtime": KeelRuntimeTrailer;
  "Keel-Brief": BriefId;
  "Keel-Prompt": PromptId;
  "Keel-Charter": Semver;
  "Keel-Ruling"?: RulingId[];
  "Not-tested"?: string[];
}

/**
 * The trailers of a governance commit (`keel approve --doc`) or an archive commit (the archived receipt.md
 * and the land approval, or on a policy land the approved request).
 */
export interface GovernanceTrailers {
  "Keel-Doc": RepoPath;
  "Keel-Approval": ApprovalId;
}

/** Either trailer set (`common.schema.json#/$defs/trailers`). */
export type Trailers = RoundTrailers | GovernanceTrailers;

/** The three kinds of Steward commit; anything else in the trace range is an untraced commit. */
export type StewardCommitKind = "round" | "governance" | "archive";

// ---- Refs and worktrees ----

/** The ref namespaces keel owns. */
export type RefNamespace = "refs/heads/keel/" | "refs/keel/claims/" | "refs/keel/snap/" | "refs/keel/ledger/";

/**
 * The ledger anchor: a blob holding the current chain hash, CAS-updated under the writer lock after every
 * append (docs/04-trace-and-state.md "Single writer").
 */
export type LedgerAnchorRef = "refs/keel/ledger/head";

/** The proposal branch: proposal files, integration and the archive commit. */
export type ProposalBranch = `keel/${ProposalId}/main`;

/** A task branch; holds the round commits of `<P>.T<n>`. */
export type TaskBranch = `keel/${ProposalId}/t/${number}`;

/** The claim lock of a task; its blob holds only a token. */
export type ClaimRef = `refs/keel/claims/${TaskId}`;

/** A shadow snapshot (Steward-side trigger), or a preserved seat-made commit. */
export type SnapRef = `refs/keel/snap/${TaskId}/${number}` | `refs/keel/snap/${TaskId}/seat-${number}`;

/** Worktree directory names under the workspace root (default `../<repo>.ws/`). */
export type WorktreeName = `${ProposalId}.plan` | `${TaskId}` | `_verify/${string}`;

/** The per-run directory under the workspace root (not a worktree). */
export type RunDirName = `_runs/${RunId}`;

/** The sparse patterns of task and verify worktrees: everything except `/.keel/proposals/`. */
export type SparsePatterns = readonly ["/*", "!/.keel/proposals/"];

/** The per-worktree `remote.<name>.pushurl` value set by the hardening (needs extensions.worktreeConfig). */
export type DisabledPushUrl = "https://push-disabled.invalid/";

/**
 * Seat git hardening variables: `credential.helper` reset to empty through the GIT_CONFIG_* triple,
 * `GIT_TERMINAL_PROMPT=0` and `GCM_INTERACTIVE=never`. Values are fixed strings, never credentials.
 */
export type GitHardeningEnvName =
  | "GIT_CONFIG_COUNT"
  | `GIT_CONFIG_KEY_${number}`
  | `GIT_CONFIG_VALUE_${number}`
  | "GIT_TERMINAL_PROMPT"
  | "GCM_INTERACTIVE";

/** The worktree lock, relative to the git common dir; worktrees are created one at a time. */
export type WorktreeLockPath = "keel/locks/worktree.lock";

// ---- Backend configuration ----

/**
 * git feature probes run by `keel doctor --section vcs`. The floor is 2.38; `worktree add --lock --reason`
 * needs 2.35; `merge-tree --merge-base` and keeping skip-worktree bits through the temporary index and
 * `read-tree HEAD` are verify by probe.
 */
export type GitFeatureProbeId =
  | "merge-tree-write-tree"
  | "merge-tree-name-only"
  | "merge-tree-merge-base"
  | "worktree-lock-reason"
  | "sparse-no-cone"
  | "worktree-config"
  | "skip-worktree-kept";

/** GitBackend settings resolved at detect. */
export interface GitBackendConfig {
  /** Resolved git executable; spawned with shell:false. */
  git_path: string;
  git_version: string;
  trunk: string;
  remotes: string[];
  workspace_root: string;
  /** `core.longpaths=true` is expected on Windows. */
  core_longpaths: boolean;
  /** `extensions.worktreeConfig`, enabled once at init; may raise the repository format version. */
  worktree_config: boolean;
  /** 40 zeros in a SHA-1 repository, 64 in a SHA-256 repository. */
  zero_oid: GitOid;
  probes: (VcsFeatureProbe & { id: GitFeatureProbeId })[];
}

/** The complete git backend. */
export interface GitBackend extends Vcs {
  readonly backend: "git";
  readonly config: GitBackendConfig;
}
