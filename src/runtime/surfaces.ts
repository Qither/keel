/**
 * keel-owned generated surfaces, printed snippets, and the generated lock.
 *
 * @packageDocumentation
 * Mirrors schemas/generated-lock.schema.json. `keel sync` follows adapter-registry semantics (detect,
 * install, uninstall, printConfig). keel reads, writes and hashes only files it wholly owns plus the
 * AGENTS.md managed block (at most 8 KiB; the instruction chain under 32 KiB). Skills are copied, never
 * symlinked, only into directories each runtime is probed to scan. Shared runtime settings files and
 * user-global configs are never read, written or hashed: keel prints snippets for the user to paste. A
 * hand-edited managed file is reported and never overwritten, and `sync --check` fails on drift.
 * Implemented in M2.
 */
import type { RepoPath, RuntimeId, Semver, Sha256 } from "../core/ids.js";

/** Kinds of keel-owned surface. */
export type SurfaceKind =
  | "agents-block"
  | "claude-bridge"
  | "skill-copy"
  | "agent-file"
  | "generated-lock";

/** One entry of `.keel/generated.lock.json`. */
export interface GeneratedLockEntry {
  path: RepoPath;
  kind: "file" | "managed-block";
  runtime: RuntimeId | null;
  generated_by: string;
  sha256: Sha256;
}

/** `.keel/generated.lock.json`: covers only keel-owned files and the managed block. */
export interface GeneratedLock {
  v: 1;
  keel_version: Semver;
  files: GeneratedLockEntry[];
}

/** Where a printed snippet belongs; the user pastes it, keel never writes it. */
export type SnippetTarget = "project-settings" | "user-global-config" | "mcp-registration" | "context-files";

/** A snippet rendered from `templates/runtime/*.snippet.tmpl`. */
export interface Snippet {
  runtime: RuntimeId;
  target: SnippetTarget;
  template: RepoPath;
  purpose: string;
  content: string;
}

/** A drift found by `keel sync --check`. */
export interface SurfaceDrift {
  path: RepoPath;
  kind: "hand-edited" | "missing" | "stale" | "over-budget" | "unowned";
  detail: string;
}

/** What one adapter would install for a runtime. */
export interface SurfacePlan {
  runtime: RuntimeId;
  writes: { path: RepoPath; kind: SurfaceKind }[];
  snippets: Snippet[];
}

/** One runtime's surface adapter. */
export interface SurfaceAdapter {
  readonly runtime: RuntimeId;
  /** Whether the runtime is installed and which directories it scans (probed). */
  detect(): Promise<{ installed: boolean; version: string | null; skill_dirs: RepoPath[] }>;
  /** Writes keel-owned files and records them in the lock. */
  install(plan: SurfacePlan): Promise<GeneratedLockEntry[]>;
  /** Removes only files recorded in the lock with an unchanged hash. */
  uninstall(lock: GeneratedLock): Promise<RepoPath[]>;
  /** Prints the snippets for shared settings. */
  printConfig(): Promise<Snippet[]>;
}
