/**
 * The IndexProvider port: per-commit index status, search, definitions, references and dependents.
 *
 * @packageDocumentation
 * @status deferred:M4
 *
 * Minimal shapes until M4. The port is modelled on the pluggable index provider of the arch_viz survey and
 * on Sourcegraph's code-intel API (per-commit uploads, nearest indexed ancestor, definitions and
 * references, search). keel's own lifter (`./analysis.ts`) computes element edges, impact and affected
 * tests on top of it. Derived data is cached in `<git-common-dir>/keel/cache/index/<commit>/` and never
 * committed. Backends: codegraph (default when installed; run only in keel's own detached checkout, index
 * and query commands only; verify by probe), scip (import of the user's index.scip), heuristic (advisory
 * only) and none (an honest "no index"). Every edge carries a provenance and a confidence; only scip and
 * tree-sitter edges are trusted provenance.
 */
import type { GitOid, Provenance, RepoPath } from "../core/ids.js";

/** The configured backend (`index.backend` in .keel/config.yaml). */
export type IndexBackend = "codegraph" | "scip" | "heuristic" | "none";

/** Per-commit upload state. */
export type UploadState = "queued" | "processing" | "completed" | "errored";

/** `status(commit)`. */
export interface IndexStatus {
  commit: GitOid;
  backend: IndexBackend;
  state: UploadState;
  nearest_indexed_ancestor: GitOid | null;
  coverage: { mapped: number; total: number };
  provenance_mix: Partial<Record<Provenance, number>>;
}

/** A search query by text, symbol or path. */
export interface SearchQuery {
  kind: "text" | "symbol" | "path";
  query: string;
}

/** A source location with the provenance of what put it there. */
export interface SymbolSite {
  path: RepoPath;
  line: number;
  symbol: string | null;
  provenance: Provenance;
  confidence: number;
}

/** Files and symbols that depend on the given files, to a depth. */
export interface DependentsResult {
  files: RepoPath[];
  symbols: SymbolSite[];
  depth: number;
}

/** The port. */
export interface IndexProvider {
  readonly backend: IndexBackend;
  status(commit: GitOid): Promise<IndexStatus>;
  search(query: SearchQuery, at: GitOid): Promise<SymbolSite[]>;
  definitions(symbol: string, at: GitOid): Promise<SymbolSite[]>;
  references(symbol: string, at: GitOid): Promise<SymbolSite[]>;
  dependents(files: readonly RepoPath[], depth: number, at: GitOid): Promise<DependentsResult>;
}
