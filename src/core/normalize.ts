/**
 * Normalization rules and hash inputs.
 *
 * @packageDocumentation
 * Every content hash keel takes (brief ids, prompt ids, content-addressed record ids, ledger event hashes,
 * `contract_hash`, `rev_hash`, the source tree hash) is taken over bytes produced by a fixed list of
 * normalization rules, so that the same input hashes identically on a Windows CRLF checkout and on Linux.
 * The M1a golden tests pin the exact rules; this module only names them and the inputs they apply to.
 * No hash is ever taken over an environment variable value (P1).
 */
import type { RunnerOs } from "./evidence.js";
import type { ContentKind, GitOid, PromptId, RepoGlob, RepoPath, Semver, Sha12, Sha256 } from "./ids.js";

// ---- JSON values ----

/** A JSON scalar. */
export type JsonPrimitive = string | number | boolean | null;

/** A JSON array. */
export type JsonArray = readonly JsonValue[];

/** A JSON object. */
export interface JsonObject {
  readonly [key: string]: JsonValue;
}

/** Any JSON value, as parsed from a schema-validated record. */
export type JsonValue = JsonPrimitive | JsonArray | JsonObject;

// ---- Rules ----

/**
 * One normalization step.
 *
 * - `strip-bom`: a leading U+FEFF is removed.
 * - `lf-line-endings`: CRLF and lone CR become LF.
 * - `unicode-nfc`: text is put in Unicode Normalization Form C.
 * - `canonical-json`: keys sorted, no insignificant whitespace, UTF-8 (the exact form is fixed by the M1a
 *   golden test).
 * - `omit-hash-field`: the record's own `hash` field is left out before hashing (ledger events).
 * - `exclude-keel-paths`: entries under `.keel/` are dropped from a tree listing, in-process.
 */
export type NormalizationRule =
  | "strip-bom"
  | "lf-line-endings"
  | "unicode-nfc"
  | "canonical-json"
  | "omit-hash-field"
  | "exclude-keel-paths";

/** The ordered rule lists keel applies, per kind of input. */
export interface NormalizationProfiles {
  /** Markdown and YAML text: briefs, the frozen block, receipt drafts, governance documents. */
  text: readonly ["strip-bom", "lf-line-endings", "unicode-nfc"];
  /** Content-addressed JSON records (EV, VD, TR, IM, AP, AM, OV, RL, Q). */
  record: readonly ["canonical-json"];
  /** One ledger event; `prev` is included, `hash` is not. */
  "ledger-event": readonly ["omit-hash-field", "canonical-json"];
  /** The NUL-separated `git ls-tree -r -z --full-tree <commit>` listing. */
  "source-tree": readonly ["exclude-keel-paths"];
}

/** The name of a rule list. */
export type NormalizationProfileId = keyof NormalizationProfiles;

// ---- Hash inputs ----

/** What a normalized text is hashed for. */
export type TextHashPurpose =
  | "brief-body"
  | "frozen-block"
  | "receipt-draft"
  | "governance-document"
  | "prompt-part";

/**
 * A text hashed under the `text` profile. The runtime wrapper (flags, a short fixed prompt, an agent file
 * frame) is never part of a brief body.
 */
export interface TextHashInput {
  kind: "text";
  purpose: TextHashPurpose;
  text: string;
}

/** A content-addressed JSON record; its id is `<KIND>-<sha12>`. */
export interface RecordHashInput {
  kind: "record";
  content_kind: ContentKind;
  record: JsonObject;
}

/** A ledger event without its `hash` field. */
export interface LedgerEventHashInput {
  kind: "ledger-event";
  event: JsonObject;
}

/**
 * The inputs of `contract_hash`: the normalized frozen block, the spec.delta blob, the arch.delta blob
 * (system track) and the `rev_hash` of every covered requirement. It is frozen at contract approval and
 * never recomputed after archive.
 */
export interface ContractHashInput {
  kind: "contract";
  frozen_block: string;
  spec_delta_blob: GitOid;
  arch_delta_blob: GitOid | null;
  covered_rev_hashes: readonly Sha256[];
}

/** `rev_hash`: the sha256 of one normalized requirement. */
export interface RequirementHashInput {
  kind: "requirement";
  requirement: JsonObject;
}

/**
 * The source tree hash: the listing of all non-`.keel` paths at a commit. It hashes blob ids, so it does
 * not depend on the checkout's line endings.
 */
export interface SourceTreeHashInput {
  kind: "source-tree";
  commit: GitOid;
}

/**
 * A glob-scoped hash over the same listing, matched by keel's own glob matcher (never by `git ls-tree`
 * pathspecs). A scope that matches zero paths is an error.
 */
export interface GlobScopeHashInput {
  kind: "glob-scope";
  commit: GitOid;
  globs: readonly RepoGlob[];
}

/**
 * The composition hashed as `PG-<sha12>`: seat contract, skill, runtime overlay, tier overlay, descriptor
 * and keel version, each by content hash.
 */
export interface PromptHashInput {
  kind: "prompt";
  seat_contract: Sha256;
  skill: Sha256;
  runtime_overlay: Sha256 | null;
  tier_overlay: Sha256 | null;
  descriptor: Sha256;
  keel_version: Semver;
}

/**
 * The runner environment fingerprint `env_fp` of the source-state binding: facts about the runner (OS,
 * Node, keel and declared tool versions). It never includes an environment variable value (P1). The exact
 * fact list is fixed in M3.
 */
export interface EnvFingerprintInput {
  kind: "env-fingerprint";
  os: RunnerOs;
  node: string;
  keel_version: Semver;
  tools: readonly { name: string; version: string }[];
}

/** A committed file hashed as bytes of a blob (for example an approval artifact). */
export interface BlobHashInput {
  kind: "blob";
  path: RepoPath;
  normalized: boolean;
}

/** Every input keel hashes. */
export type HashInput =
  | TextHashInput
  | RecordHashInput
  | LedgerEventHashInput
  | ContractHashInput
  | RequirementHashInput
  | SourceTreeHashInput
  | GlobScopeHashInput
  | PromptHashInput
  | EnvFingerprintInput
  | BlobHashInput;

/** The result of hashing one input. */
export interface HashResult {
  algorithm: "sha256";
  sha256: Sha256;
  sha12: Sha12;
  rules: readonly NormalizationRule[];
}

/** The deterministic hasher (M1a). */
export type Hasher = (input: HashInput) => HashResult;

/** The prompt id derived from a {@link PromptHashInput}. */
export type PromptHash = (input: PromptHashInput) => PromptId;
