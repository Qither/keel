/**
 * MCP tool input and output types for `keel api mcp`: two read tools and one outbox-only write tool.
 *
 * @packageDocumentation
 * `keel api mcp` serves MCP over stdio; `--http` serves it on 127.0.0.1 with an ephemeral port and Host
 * and Origin checks. Headless runs register it through the per-run `<run>/mcp.json`, which binds the
 * server to one run. The default set is capped at three tools; extra tools can be enabled by name through
 * `KEEL_MCP_TOOLS`, and they are read tools. `keel_submit` stays the only write tool.
 *
 * Write scope of `keel_submit`, exhaustively (docs/12-cli-api-mcp.md section 5): it writes only into the
 * outbox of the run the server was started for, and refuses with no bound run; each call creates exactly
 * one new O_EXCL file `<seq>-<kind>.json` with a server-assigned sequence number and never overwrites,
 * appends, renames or deletes; only kinds the seat contract allows are accepted; the payload is validated
 * against its schema and a size cap before the write; the file name and directory come from the server,
 * never from the payload; there is no other side effect (no ledger append, no git operation, no network
 * call, no read of any other file). The Steward ingests and re-validates the drop later. Implemented in M2.
 */
import type {
  ContextRequest,
  Diagnostic,
  OutboxDropFileName,
  OutboxDropKind,
  OutboxDropPayloads,
} from "../api/contract.js";
import type { ArchSearchHit, ElementPage, ImpactReport } from "../arch/analysis.js";
import type { BriefSectionId, Freshness } from "../core/brief.js";
import type { BriefId, ProposalId, RunId, Sha256, TaskId } from "../core/ids.js";

/** The three default tools. */
export type DefaultMcpToolName = "keel_context" | "keel_arch" | "keel_submit";

/** Any tool name, including extra read tools enabled through KEEL_MCP_TOOLS. */
export type McpToolName = DefaultMcpToolName | `keel_${string}`;

/** Read tools, or the one outbox-only write tool. */
export type McpToolKind = "read" | "write-outbox";

// ---- keel_context ----

/** `keel_context` input: subject required. */
export type KeelContextInput = ContextRequest;

/** `keel_context` output: brief sections by subject, the element brief and freshness. */
export interface KeelContextOutput {
  subject: ProposalId | TaskId;
  brief: BriefId;
  sections: { id: BriefSectionId; sha256: Sha256; text: string }[];
  element_brief: string | null;
  freshness: Freshness;
}

// ---- keel_arch ----

/** `keel_arch` input. */
export interface KeelArchInput {
  op: "find" | "impact" | "element";
  query: string;
}

/** `keel_arch` output: hits mapped to elements, owners and index freshness (shapes fixed in M4). */
export type KeelArchOutput =
  | { op: "find"; hits: ArchSearchHit[]; freshness: Freshness }
  | { op: "impact"; report: ImpactReport }
  | { op: "element"; page: ElementPage };

// ---- keel_submit ----

/** `keel_submit` input: a drop kind and its payload. */
export type KeelSubmitInput = {
  [K in OutboxDropKind]: { kind: K; payload: OutboxDropPayloads[K] };
}[OutboxDropKind];

/** `keel_submit` output: the drop's file name and a validation summary. */
export interface KeelSubmitOutput {
  file: OutboxDropFileName;
  valid: boolean;
  diagnostics: Diagnostic[];
}

// ---- Tool table ----

/** Each default tool's kind, input and output. */
export interface McpTools {
  keel_context: { kind: "read"; input: KeelContextInput; output: KeelContextOutput };
  keel_arch: { kind: "read"; input: KeelArchInput; output: KeelArchOutput };
  keel_submit: { kind: "write-outbox"; input: KeelSubmitInput; output: KeelSubmitOutput };
}

/** How the server is bound. */
export interface McpServerBinding {
  transport: "stdio" | "http-loopback";
  /** The run whose outbox `keel_submit` writes; null refuses every write. */
  run: RunId | null;
  tools: McpToolName[];
}
