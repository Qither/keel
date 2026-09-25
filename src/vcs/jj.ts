/**
 * JjBackend feature flags and optional capabilities.
 *
 * @packageDocumentation
 * @status deferred:M7
 *
 * Minimal shape until M7. JjBackend is opt-in and adds, never replaces: it implements the same {@link Vcs}
 * interface as GitBackend and exposes the extras below as optional capabilities. It is used only when
 * jj >= 0.45.1 is feature-probed, the repository is colocated, there is no LFS, submodule or filter, and
 * the Board opted in. Agent workspaces stay git worktrees until `jj workspace add --colocate` ships
 * (feature-detected). jj is pre-1.0, so every command is verify by probe. M7 exit: disabling jj loses no
 * trace, evidence or approval.
 */
import type { GitOid, RoundId } from "../core/ids.js";
import type { Vcs } from "./vcs.js";

/** Which jj enhancements are feature-probed and enabled. */
export interface JjFeatureFlags {
  /** jj change ids recorded next to Keel-Round. */
  change_ids: boolean;
  /** `operation.username=keel/<seat>/<run>`. */
  operation_username: boolean;
  /** The op log as an extra reserved-operation detection source. */
  op_log_detection: boolean;
  /** Op log and evolog export (`keel audit --export-vcs`). */
  evolog_export: boolean;
  /** Restack with `jj rebase -s 'roots(trunk()..tip)' -o 'trunk()'`. */
  rebase_restack: boolean;
  /**
   * `jj util snapshot` for jj workspaces only, once they are allowed. Seats work in git worktrees until
   * then, which jj does not track, so the temporary-index snapshot stays the mechanism for them.
   */
  util_snapshot: boolean;
  /** `jj run --ignore-changes` for per-revision checks. */
  run_checks: boolean;
  /** A megamerge as the integration preview. */
  megamerge_preview: boolean;
  /** Policy revsets for what seats may touch. */
  policy_revsets: boolean;
  /** `jj workspace add --colocate` (unreleased as of 0.45.1). */
  workspace_colocate: boolean;
}

/** Optional capabilities; each is absent unless its flag is on. */
export interface JjCapabilities {
  changeId?(commit: GitOid): Promise<string | null>;
  recordRound?(round: RoundId, commit: GitOid): Promise<{ change_id: string; op_id: string }>;
  exportOpLog?(): Promise<{ path: string; operations: number }>;
  exportEvolog?(): Promise<{ path: string; entries: number }>;
}

/** The jj backend: the full Vcs interface plus optional enhancements. */
export interface JjBackend extends Vcs {
  readonly backend: "jj";
  readonly jj_version: string;
  readonly features: JjFeatureFlags;
  readonly jj: JjCapabilities;
}
