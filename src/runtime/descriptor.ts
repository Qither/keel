/**
 * Runtime descriptors and the capability matrix.
 *
 * @packageDocumentation
 * Mirrors schemas/runtime-descriptor.schema.json: one descriptor per runtime in `runtimes/<id>.yaml`, the
 * data that drives dispatch. Every unverified fact carries a `verification_status`; a rung promotion or a
 * prevention counts only when the capability behind it is `verified` for the installed version. Bypass
 * flags are never generated, and dispatch refuses any argv containing a flag listed in
 * `permissions.never_generate`. Native provider variable names appear only in each descriptor's
 * `provider.native_env` mapping. docs/09-runtimes.md section 2 is the home. Implemented in M2 (claude-code,
 * codex) and M6 (the others).
 */
import type {
  AuthMode,
  ControlPlaneExposure,
  EnvVarName,
  ExecutionClass,
  Protocol,
  RepoGlob,
  RepoPath,
  Rung,
  RuntimeId,
  Seat,
  Slug,
  SubmitChannel,
  ToolEnvExposure,
  VerificationStatus,
} from "../core/ids.js";
import type { Outcome } from "./dispatch.js";
import type { ProviderPathSet } from "./exposure.js";
import type { PromptChannel, ProfileSlot, WindowsResolution } from "./spawn.js";

export type { VerificationStatus } from "../core/ids.js";

/** The executable and how it resolves on Windows; always spawned with shell:false. */
export interface DescriptorBinary {
  name: string | null;
  windows_resolution: WindowsResolution;
  shell: false;
  verification_status?: VerificationStatus;
}

/** Skill directories the runtime is probed to scan, and keel-owned agent files it can select. */
export interface DescriptorSkills {
  dirs: RepoPath[];
  agent_files?: RepoGlob[];
  verification_status: VerificationStatus;
}

/** A runtime toggle keel sets in the child environment; the value is keel-owned, never a provider value. */
export interface EnvToggle {
  name: EnvVarName;
  /** May use argv placeholders such as `{run_dir}`. */
  value: string;
  purpose: string;
  verification_status: VerificationStatus;
}

/** Tokens spliced at `{auth_argv}` for one auth mode of the routed profile. */
export interface AuthArgv {
  auth_mode: AuthMode;
  argv: string[];
  verification_status: VerificationStatus;
}

/** How the runtime returns structured output. */
export interface StructuredOutput {
  mechanism: "native-schema" | "final-message" | "mcp" | "outbox";
  schema_flag: string | null;
  output_flag?: string | null;
  verification_status: VerificationStatus;
}

/** One permission mode: its execution class, argv, submit channel and rung. */
export interface RuntimeMode {
  id: Slug;
  execution_class: ExecutionClass;
  argv: string[];
  /** The result channel; the ACK channel per mode is tabulated in docs/02-alignment.md. */
  submit_channel: SubmitChannel;
  /** null only for the direct lane, which has no tools or hooks and sits outside the A-D ladder. */
  rung: Rung | null;
  seats?: Seat[];
  verification_status: VerificationStatus;
}

/** Session id, resume and fork flags. */
export interface DescriptorSession {
  id_flag?: string | null;
  resume?: string[];
  fork?: string[];
  verification_status?: VerificationStatus;
}

/** A per-run limit flag the runtime accepts. */
export interface BudgetFlag {
  kind: "usd" | "turns" | "wall_time" | "tool_calls";
  flag: string;
  verification_status: VerificationStatus;
}

/** A native exit code mapped to a canonical outcome (143 is POSIX-only). */
export interface NativeExitCode {
  code: number;
  outcome: Outcome;
  posix_only?: boolean;
}

/** The control that keeps provider variables out of tool subprocesses, and what it is expected to give. */
export interface EnvScrub {
  control: string | null;
  expected: ToolEnvExposure;
  verification_status: VerificationStatus;
}

/** One native variable the runtime reads, filled in memory from the routed profile's named variable. */
export interface NativeEnv {
  protocol: Protocol;
  from: ProfileSlot;
  name: EnvVarName;
}

/**
 * Per protocol, the adapter package a per-run config names (opencode: the AI SDK provider package) and the
 * suffix appended to the base URL reference. Names only.
 */
export interface ProviderAdapter {
  protocol: Protocol;
  package: string;
  base_url_suffix: "" | "/v1";
  verification_status: VerificationStatus;
}

/** Protocols and auth modes the runtime supports; the source of the compatibility check. */
export interface DescriptorProvider {
  protocols: Protocol[];
  auth_modes: AuthMode[];
  native_env: NativeEnv[];
  adapters?: ProviderAdapter[];
}

/** How keel provisions permissions for a headless run. */
export interface DescriptorPermissions {
  mechanism: "per-run-settings" | "per-run-policy" | "per-run-config" | "flags" | "agent-file" | "none";
  deny_read: boolean;
  /** Bypass flags keel never generates and refuses in any argv. */
  never_generate?: string[];
  verification_status: VerificationStatus;
}

/** How the runtime decides project trust; override flags need a Board `--rule override`. */
export interface DescriptorTrust {
  project_layers: "trusted-only" | "always" | "none";
  override_flags?: string[];
  verification_status: VerificationStatus;
}

/** How hooks are delivered; keel never writes shared settings files. */
export interface DescriptorHooks {
  delivery: "per-run-settings" | "printed-snippet" | "user-global-snippet" | "none";
  blocking_exit_code?: number | null;
  verification_status: VerificationStatus;
}

/** A doctor probe that moves a claim from documented or probed to verified. */
export interface CapabilityProbe {
  id: Slug;
  claim: string;
  verification_status: VerificationStatus;
  min_version?: string | null;
}

/** `runtimes/<id>.yaml`. */
export interface RuntimeDescriptor {
  id: RuntimeId;
  display_name: string;
  kind: "cli" | "direct";
  verification_status: VerificationStatus;
  tested_version: string | null;
  min_version: string | null;
  binary: DescriptorBinary;
  git_required: boolean;
  instruction_files?: string[];
  skills?: DescriptorSkills;
  prompt_channel: PromptChannel;
  structured_output: StructuredOutput;
  /** `inline` (minified JSON in argv) or `path`. */
  schema_flag_takes: "inline" | "path" | null;
  modes: RuntimeMode[];
  argv_template?: string[];
  parser?: Slug;
  session?: DescriptorSession;
  cwd?: "workspace" | "run-dir";
  budget_flags?: BudgetFlag[];
  exit_codes: NativeExitCode[];
  env_scrub: EnvScrub;
  env_toggles?: EnvToggle[];
  auth_argv?: AuthArgv[];
  provider: DescriptorProvider;
  provider_path_set: ProviderPathSet;
  permissions: DescriptorPermissions;
  /** True when the headless mode cannot run without auto-approval. */
  bypass_equivalent: boolean;
  trust?: DescriptorTrust;
  hooks?: DescriptorHooks;
  control_plane_exposure?: ControlPlaneExposure;
  capability_probes: CapabilityProbe[];
  notes?: string[];
}

// ---- Capability matrix ----

/** One capability of one runtime with its verification status. */
export interface CapabilityCell {
  /** A capability probe id or descriptor field group. */
  capability: Slug;
  status: VerificationStatus;
  min_version: string | null;
  note: string | null;
}

/** One runtime row of the matrix. */
export interface CapabilityRow {
  runtime: RuntimeId;
  installed_version: string | null;
  rungs: { mode: Slug; rung: Rung | null }[];
  cells: CapabilityCell[];
}

/** The capability matrix printed by `keel doctor --section runtimes` and rendered in runtimes/README.md. */
export type CapabilityMatrix = readonly CapabilityRow[];
