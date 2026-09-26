/**
 * The Windows spawn contract: binary resolution, prompt and submit channels, the environment allowlist
 * (names only) and cancellation.
 *
 * @packageDocumentation
 * Every spawn, on Windows and POSIX alike, uses `child_process.spawn` with `shell: false` (never
 * `shell: true`, because of CVE-2024-27980). npm `.cmd` / `.ps1` / extensionless shims are resolved to the
 * JS entry or the `.exe`. argv carries only fixed short strings and paths (Windows limits: 32767, or 8191
 * through cmd.exe), so a brief never travels in argv. The child environment is an allowlist built in
 * memory by `src/providers/env-policy.ts`; this module types it by variable NAME only. docs/09-runtimes.md
 * section 3 is the home. Implemented in M2.
 */
import type { GitHardeningEnvName } from "../vcs/git.js";
import type {
  EnvVarName,
  IsoDateTime,
  ProfileAlias,
  RunId,
  RuntimeId,
  VerificationStatus,
} from "../core/ids.js";

export type { SubmitChannel } from "../core/ids.js";

// ---- Binary resolution ----

/** How a runtime binary resolves on Windows. */
export type WindowsResolution = "npm-shim-to-script" | "exe" | "node-script" | "keel-child";

/** The resolved executable, recorded in the run record and shown by doctor. */
export interface ResolvedBinary {
  runtime: RuntimeId;
  resolution: WindowsResolution;
  /** `node` (for a script entry) or the `.exe`. */
  executable: string;
  /** The JS entry behind an npm shim, when the resolution is a script. */
  entry: string | null;
  version: string | null;
}

// ---- Prompt channel ----

/** How the brief reaches the runtime; argv only for a fixed short string. */
export type PromptChannelKind = "stdin" | "stdin-with-fixed-prompt" | "file" | "argv";

/** The prompt channel of a descriptor. */
export interface PromptChannel {
  kind: PromptChannelKind;
  fixed_prompt?: string | null;
  flag?: string | null;
  verification_status: VerificationStatus;
}

// ---- Environment allowlist (names only) ----

/** Variables keel sets for every run; mutating verbs refuse while either is set. */
export type KeelRunEnvName = "KEEL_RUN" | "KEEL_RUN_ID";

/** Which profile slot a mapped variable carries. */
export type ProfileSlot = "base_url" | "api_key" | "model";

/**
 * One mapping from the routed profile's variable to the runtime's native variable. Both are NAMES; the
 * value is read in memory by env-policy at spawn and never persisted, printed, logged, hashed or put in
 * argv.
 */
export interface ProfileEnvMapping {
  slot: ProfileSlot;
  from: EnvVarName;
  to: EnvVarName;
}

/**
 * The child environment as an allowlist, never a copy of the parent minus some names. Never passed:
 * other profiles' variables, the ssh agent socket (git transport credentials stay with the user) and git
 * credential helpers.
 */
export interface EnvAllowlist {
  /** Base OS variables the runtime needs to start; an env-policy constant from M2. */
  base: readonly EnvVarName[];
  /** The one routed profile. */
  profile: { alias: ProfileAlias; mappings: readonly ProfileEnvMapping[] };
  keel: readonly KeelRunEnvName[];
  git_hardening: readonly GitHardeningEnvName[];
  /** Runtime toggles named by the descriptor. */
  toggles: readonly EnvVarName[];
}

// ---- Spawn ----

/** What stdin carries: the brief (UTF-8 without BOM, LF-normalized) or nothing. */
export type StdinPayload = "brief" | "closed";

/** One spawn, exactly as keel performs it. */
export interface SpawnSpec {
  run: RunId;
  binary: ResolvedBinary;
  /** Fixed strings and expanded paths only; `argv.redacted.json` keeps `${ENV:NAME}` placeholders. */
  args: readonly string[];
  /** Always the task or verify worktree. */
  cwd: string;
  /** The run directory, the only extra directory passed to the runtime. */
  run_dir: string;
  shell: false;
  env: EnvAllowlist;
  stdin: StdinPayload;
}

// ---- Cancellation ----

/** Why a run is cancelled. */
export type CancelReason = "hold" | "budget" | "lease-expired" | "abandon";

/**
 * Cancellation steps. Windows: close stdin, wait, `taskkill /PID <pid> /T /F` (taskkill without /F cannot
 * end console processes; Node's kill() on Windows is always forceful and reaches only the direct child).
 * POSIX: SIGTERM, wait, SIGKILL; exit 143 is interpreted on POSIX only.
 */
export type CancelStep = "close-stdin" | "sigterm" | "grace" | "taskkill-tree-force" | "sigkill";

/**
 * A cancellation, journaled in the ledger before the first signal, so the outcome `killed` comes from
 * keel's own journal, never from an exit code. Resuming a force-killed session is verify by probe.
 */
export interface Cancellation {
  run: RunId;
  reason: CancelReason;
  platform: "win32" | "posix";
  journaled_at: IsoDateTime;
  grace_seconds: number;
  steps: readonly CancelStep[];
}
