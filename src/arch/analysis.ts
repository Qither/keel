/**
 * The lifter and its products: element edges, drift findings with the invariant proof, impact reports,
 * search hits mapped to elements, element pages, change feeds and series points.
 *
 * @packageDocumentation
 * @status deferred:M4
 *
 * Minimal shapes until M4; schemas/arch-report.schema.json is the (stub) schema. The lifter maps each file
 * to the most specific element glob and aggregates symbol edges into element edges. Only NEW errors backed
 * by scip or tree-sitter edges fail; every rule reaching the affected elements is listed as proven or
 * unproven. `unknown` blocks on the system track, or when rules reach the affected elements, unless a Board
 * override exists; otherwise it is advisory. There is no scalar health score, and LLM narration is
 * optional and labelled non-authoritative.
 */
import type { Freshness } from "../core/brief.js";
import type {
  ArchRuleId,
  ElementId,
  EventId,
  GitOid,
  IsoDateTime,
  Provenance,
  RepoPath,
  ReqId,
  RoundId,
} from "../core/ids.js";
import type { ArchDriftClass, ArchElement, ArchModel } from "./model.js";
import type { IndexProvider, SymbolSite } from "./index-provider.js";

/** Aggregated symbol edges between two elements, with the strongest provenance. */
export interface ElementEdge {
  from: ElementId;
  to: ElementId;
  count: number;
  provenance: Provenance;
  sample_sites: SymbolSite[];
}

/** The lifted graph at a commit. */
export interface LiftedGraph {
  commit: GitOid;
  edges: ElementEdge[];
  unmapped: RepoPath[];
}

/** Maps paths to elements and aggregates edges on top of the IndexProvider. */
export interface Lifter {
  lift(model: ArchModel, index: IndexProvider, at: GitOid): Promise<LiftedGraph>;
  elementOf(path: RepoPath, model: ArchModel): ElementId | null;
}

/** One rule's proof status for the affected elements (the invariant proof). */
export interface RuleProof {
  rule: ArchRuleId;
  status: "proven" | "unproven";
}

/** One drift finding. */
export interface DriftFinding {
  class: ArchDriftClass;
  severity: "error" | "warn" | "info";
  rule: ArchRuleId | null;
  from: ElementId | null;
  to: ElementId | null;
  provenance: Provenance;
  /** Not in the baseline. */
  new: boolean;
  sites: SymbolSite[];
}

/**
 * Impact: changed files to symbols to dependents at depth 2 to elements. Affected tests are mandatory in
 * acceptance. Without an index, the path fallback of the ratchet applies.
 */
export interface ImpactReport {
  kind: "predicted" | "actual";
  commit: GitOid;
  freshness: Freshness;
  changed_files: RepoPath[];
  elements: ElementId[];
  boundaries_crossed: { from: ElementId; to: ElementId }[];
  owners: string[];
  requirements: ReqId[];
  affected_tests: RepoPath[];
  collisions: RepoPath[];
  /** A failed diff overlay gives `unknown`. */
  unknown: boolean;
}

/** A search hit mapped to its element, owner and index freshness (`keel arch find`, MCP `keel_arch`). */
export interface ArchSearchHit {
  site: SymbolSite;
  element: ElementId | null;
  owner: string | null;
  freshness: Freshness;
}

/** A series point appended to `.keel/arch/series.jsonl` by the archive commit. */
export interface SeriesPoint {
  commit: GitOid;
  violations_new: number;
  known: number;
  cross_element_edges: number;
  unmapped: number;
  churn_by_element?: Record<string, number>;
  by_seat?: Record<string, number>;
  by_runtime?: Record<string, number>;
}

/** One change-feed item: series points plus ledger land and round events touching the element. */
export interface ChangeFeedItem {
  element: ElementId;
  ts: IsoDateTime;
  kind: "series-point" | "land" | "round";
  commit: GitOid;
  round: RoundId | null;
  event: EventId | null;
}

/** The element page (CLI, MCP, dashboard dialog). */
export interface ElementPage {
  element: ArchElement;
  rules: RuleProof[];
  drift: DriftFinding[];
  feed: ChangeFeedItem[];
  freshness: Freshness;
}
