/**
 * The declared architecture: model, rules, baseline and the per-proposal delta of typed ops.
 *
 * @packageDocumentation
 * @status deferred:M4
 *
 * Minimal shapes until M4; schemas/arch-model, arch-rules, arch-baseline and arch-delta are normative.
 * The declared model is committed under `.keel/arch/` and changes only through an arch.delta applied by the
 * land archive commit; the derived graph joins it by element ids, and unmapped files are listed, never
 * guessed. The baseline shrinks freely and grows only through a contract approval; loosening a rule also
 * needs one. docs/07-architecture-intelligence.md is the home.
 */
import type {
  AdrId,
  ArchRuleId,
  ElementId,
  GitOid,
  ProposalId,
  Provenance,
  RepoGlob,
  RepoPath,
  Semver,
  Sha12,
  Sha256,
  Slug,
} from "../core/ids.js";

// ---- model.yaml ----

/** A C4 element kind. */
export type ElementKind = "system" | "container" | "component";

/** A declared relation. */
export interface ArchRelation {
  to: ElementId;
  kind: Slug;
  note?: string;
}

/** One element: path globs, an owner label, tags (layer:*, stakes:high, public-api) and relations. */
export interface ArchElement {
  id: ElementId;
  kind: ElementKind;
  parent: ElementId | null;
  title: string;
  purpose?: string;
  paths: RepoGlob[];
  owner: string;
  tags?: string[];
  relations?: ArchRelation[];
  /**
   * Derived projection of the `governs` lists of accepted decisions, refreshed by the archive commit and
   * by the governance commit that accepts a decision; `governs` is the single source.
   */
  adrs?: AdrId[];
}

/** `.keel/arch/model.yaml`. */
export interface ArchModel {
  elements: ArchElement[];
  layers?: Slug[];
  mapping?: {
    overrides?: { path: RepoGlob; element: ElementId }[];
    ignore?: RepoGlob[];
  };
}

// ---- rules.yaml ----

/** Rule kinds. */
export type ArchRuleKind = "forbidden" | "allowed" | "required" | "layers" | "acyclic" | "independent";

/** Selects elements by id, tag or owner. */
export type RuleSelector = { element: ElementId } | { tag: string } | { owner: string };

/** One executable rule; only new errors backed by scip or tree-sitter edges fail the arch check. */
export interface ArchRule {
  id: ArchRuleId;
  kind: ArchRuleKind;
  from: RuleSelector;
  to: RuleSelector | null;
  severity: "error" | "warn" | "info";
  adr: AdrId | null;
  rationale: string;
}

/** `.keel/arch/rules.yaml`. */
export interface ArchRules {
  rules: ArchRule[];
}

// ---- baseline.json ----

/** Architecture drift classes. */
export type ArchDriftClass =
  | "undeclared-dependency"
  | "forbidden-dependency"
  | "element-cycle"
  | "unmapped-code"
  | "phantom-relation"
  | "ownership-gap"
  | "realization-mismatch";

/** One frozen known violation. */
export interface BaselineViolation {
  key: Sha12;
  class: ArchDriftClass;
  rule: ArchRuleId | null;
  from: ElementId | null;
  to: ElementId | null;
  sites: { path: RepoPath; line: number | null }[];
  provenance: Provenance;
}

/** `.keel/arch/baseline.json`. */
export interface Baseline {
  commit: GitOid;
  violations: BaselineViolation[];
}

// ---- arch.delta.yaml ----

/** One typed arch op (`keel arch plan`; `--suggest` drafts them). */
export type TypedArchOp =
  | { op: "add-element"; element: ArchElement }
  | { op: "remove-element"; id: ElementId; reason: string }
  | { op: "add-relation"; from: ElementId; to: ElementId; kind: Slug }
  | { op: "remove-relation"; from: ElementId; to: ElementId; kind: Slug }
  | { op: "move-paths"; paths: RepoGlob[]; from: ElementId; to: ElementId }
  | { op: "add-rule"; rule: ArchRule }
  | { op: "tighten-rule"; rule: ArchRule }
  | { op: "loosen-rule"; rule: ArchRule; reason: string }
  | { op: "baseline-grow"; violation: BaselineViolation; reason: string }
  | { op: "baseline-shrink"; key: Sha12 };

/** `.keel/proposals/<P>-<slug>/arch.delta.yaml`; applied at land, refused when the base hashes differ. */
export interface ArchDelta {
  proposal: ProposalId;
  charter_version: Semver;
  base: { model_sha256: Sha256; rules_sha256: Sha256; baseline_sha256?: Sha256 };
  adrs: AdrId[];
  ops: TypedArchOp[];
}
