// Type-only mirror of schemas/common.schema.json#/$defs.
//
// The id patterns (Crockford base32 alphabet, lengths, ULID shape) and the shared
// enums live only in schemas/common.schema.json. The template-literal types here
// give each id its recognizable shape and are intentionally looser than the
// patterns: validation is always done against the schema, never against these
// types. Other modules import these with `import type` and re-export them rather
// than restating a union. This file holds no runtime code (M0 is type-only).

type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type TwoDigits = `${Digit}${Digit}`;

// ---- Identifiers (patterns: common.schema.json#/$defs/<camelCase name>) ----

/** Five Crockford base32 characters (`crockford5`). */
export type Crockford5 = string;
/** Six Crockford base32 characters (`crockford6`). */
export type Crockford6 = string;
/** 26-character ULID (`ulid`). */
export type Ulid = string;
/** Lowercase kebab-case slug (`slug`). */
export type Slug = string;
/** Living-spec area (`areaSlug`). */
export type AreaSlug = string;

/** G-nn (`goalId`), Board-serialized. */
export type GoalId = `G-${TwoDigits}`;
/** INV-nn (`invId`), Board-serialized. */
export type InvId = `INV-${TwoDigits}`;
/** R-<area>-<5> (`reqId`). */
export type ReqId = `R-${AreaSlug}-${Crockford5}`;
/** S<n> inside one requirement (`scenarioLocalId`). */
export type ScenarioLocalId = `S${number}`;
/** R-<area>-<5>#S<n> (`scenarioRef`). */
export type ScenarioRef = `${ReqId}#${ScenarioLocalId}`;
/** ADR-<5> (`adrId`); keel's own docs/adr/ADR-0001... sequence is separate. */
export type AdrId = `ADR-${Crockford5}`;
/** ADR-<5>.O<n> (`obligationId`). */
export type ObligationId = `${AdrId}.O${number}`;
/** AR-<5> (`archRuleId`). */
export type ArchRuleId = `AR-${Crockford5}`;
/** P-<6> (`proposalId`). */
export type ProposalId = `P-${Crockford6}`;
/** el:<dotted.slug> (`elementId`). */
export type ElementId = `el:${string}`;
/** T<n> inside one proposal (`taskLocalId`). */
export type TaskLocalId = `T${number}`;
/** <P>.T<n> (`taskId`). */
export type TaskId = `${ProposalId}.${TaskLocalId}`;
/** <P>.T<n>.r<k> (`roundId`), carried by the Keel-Round trailer. */
export type RoundId = `${TaskId}.r${number}`;
/** ACC-nn inside one proposal (`accLocalId`). */
export type AccLocalId = `ACC-${TwoDigits}`;
/** <P>#ACC-nn (`accId`). */
export type AccId = `${ProposalId}#${AccLocalId}`;

/** Kinds of content-addressed records (`contentKind`). */
export type ContentKind =
  | "BR"
  | "PG"
  | "EV"
  | "VD"
  | "TR"
  | "IM"
  | "AP"
  | "AM"
  | "OV"
  | "RL"
  | "Q";
/** <KIND>-<sha12> (`contentId`). */
export type ContentId<K extends ContentKind = ContentKind> = `${K}-${Sha12}`;
/** BR-<sha12> (`briefId`). */
export type BriefId = ContentId<"BR">;
/** PG-<sha12> (`promptId`). */
export type PromptId = ContentId<"PG">;
/** EV-<sha12> (`evidenceId`). */
export type EvidenceId = ContentId<"EV">;
/** VD-<sha12> (`verdictId`). */
export type VerdictId = ContentId<"VD">;
/** TR-<sha12> (`triageId`). */
export type TriageId = ContentId<"TR">;
/** IM-<sha12> (`impactId`). */
export type ImpactId = ContentId<"IM">;
/** AP-<sha12> (`approvalId`). */
export type ApprovalId = ContentId<"AP">;
/** AM-<sha12> (`amendmentId`). */
export type AmendmentId = ContentId<"AM">;
/** OV-<sha12> (`overrideId`). */
export type OverrideId = ContentId<"OV">;
/** RL-<sha12> (`rulingId`). */
export type RulingId = ContentId<"RL">;
/** Q-<sha12> (`questionId`). */
export type QuestionId = ContentId<"Q">;

/**
 * A gate check id <gate>.<name> (`checkId`), for example `submit.scope`, as catalogued in
 * docs/11-verification.md. The namespace is separate from ledger event types such as `land.completed`.
 */
export type CheckId = `${Gate}.${string}`;
/** An OpenSSH SHA256 key fingerprint (`sshFingerprint`). */
export type SshFingerprint = `SHA256:${string}`;

/** RUN-<ulid> (`runId`). */
export type RunId = `RUN-${Ulid}`;
/** EVT-<ulid> (`eventId`). */
export type EventId = `EVT-${Ulid}`;

// ---- Scalars ----

/** Lowercase hex SHA-256 (`sha256`). */
export type Sha256 = string;
/** First 12 hex characters of a SHA-256 (`sha12`). */
export type Sha12 = string;
/** Full git object id, SHA-1 or SHA-256 (`gitOid`). */
export type GitOid = string;
/** Semantic version (`semver`), e.g. charter_version. */
export type Semver = `${number}.${number}.${number}${string}`;
/** Environment variable NAME, never a value (`envVarName`). */
export type EnvVarName = string;
/** ${ENV:NAME} placeholder (`envPlaceholder`). */
export type EnvPlaceholder = `\${ENV:${EnvVarName}}`;
/** Routing profile alias (`profileAlias`). */
export type ProfileAlias = string;
/** Repository-relative path with forward slashes (`repoPath`). */
export type RepoPath = string;
/** Repository-relative glob (`repoGlob`). */
export type RepoGlob = string;
/** RFC 3339 date-time (`isoDateTime`). */
export type IsoDateTime = string;
/** Documentation placeholder URL on a .invalid host (`placeholderUrl`). */
export type PlaceholderUrl = `https://${string}`;
/** Loopback URL for fake providers (`loopbackUrl`). */
export type LoopbackUrl = `http://127.0.0.1${string}`;

// ---- Shared enums (values: common.schema.json#/$defs/<camelCase name>) ----

export type Protocol = "anthropic-messages" | "openai-chat" | "openai-responses" | "google";
export type Family = "anthropic" | "openai" | "google" | "alibaba" | "moonshot" | "zhipu" | "other";
export type Seat = "product" | "architect" | "planner" | "engineer" | "reviewer";
export type Track = "spike" | "patch" | "feature" | "system";
export type Tier = "frontier" | "standard" | "fast";
export type RuntimeId =
  | "claude-code"
  | "codex"
  | "gemini-cli"
  | "qwen-code"
  | "kimi-code"
  | "opencode"
  | "direct";
export type AuthMode = "env" | "runtime-login" | "runtime-profile";
export type Gate = "frame" | "plan" | "submit" | "verify" | "land";
export type ApprovalStage = "contract" | "plan" | "land" | "receipt";
export type RuleKind =
  | "answer"
  | "budget"
  | "track"
  | "override"
  | "dismiss"
  | "degraded"
  | "unverified"
  | "abandon";
export type Lens =
  | "spec"
  | "blind-diff"
  | "edge-case"
  | "verification-gap"
  | "intent-alignment"
  | "architecture"
  | "audit";
export type FindingSeverity = "critical" | "important" | "minor";
export type Recommendation = "approve" | "revise" | "reject";
export type ResultStatus = "DONE" | "DONE_WITH_CONCERNS" | "BLOCKED" | "NEEDS_CONTEXT";
export type ExecutionClass = "none" | "read-only" | "code-executing";
export type SubmitChannel = "final-message" | "mcp" | "outbox";
export type BlockReason =
  | "ack_mismatch"
  | "non_convergence"
  | "track_raised"
  | "budget"
  | "runtime_unavailable"
  | "reserved_op";
export type ToolEnvExposure = "scrubbed" | "exposed" | "unknown";
export type ToolFileExposure = "none" | "blocked" | "exposed" | "unknown";
export type ControlPlaneExposure = "sandboxed" | "exposed";
export type CheckStatus = "pass" | "fail" | "not_run" | "unknown" | "waived";
export type Provenance = "scip" | "tree-sitter" | "heuristic" | "llm";
export type EvidenceMode = "test" | "command" | "review" | "manual" | "unobservable";
export type VerificationStatus = "documented" | "probed" | "verified" | "unverified";
export type ConformanceStatus = "verified" | "failed" | "unverified";
export type Rung = "A" | "B" | "C" | "D";
export type ObligationLevel = "must" | "must_not" | "should";
export type StopClass =
  | "irreversible_or_destructive"
  | "security_sensitive"
  | "side_effect_outside_workspace"
  | "every_path_a_guess";
