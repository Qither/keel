/**
 * The direct lane's request builder.
 *
 * @packageDocumentation
 * @status deferred:M6
 *
 * Minimal shape until M6. The direct lane is keel's own tool-less, read-only lane for lenses and the intent
 * auditor: a separate child process spawned through the `runtimes/direct.yaml` descriptor like any runtime.
 * The Steward process itself never calls a model. The lane's whole input is the brief or lens prompt, with
 * the diff inline within the brief budget; diffs over budget split the review.
 *
 * This module and `src/providers/env-policy.ts` are the only two modules allowed to reference provider
 * environment variable names or to unwrap an {@link OpaqueSecretHandle}. The builder unwraps the routed
 * profile's handles in memory at call time; no value is persisted, printed, logged, hashed or put in argv.
 * Tested only against loopback fakes.
 */
import type { ProfileAlias, Tier } from "../core/ids.js";
import type { OpaqueSecretHandle } from "../providers/env-policy.js";
import type { ModelError, ModelRequest, ModelResponse, TranslatedProtocol } from "../providers/protocols.js";

/** The handles of one routed profile; each is resolved only inside the builder at call time. */
export interface DirectLaneHandles {
  base_url: OpaqueSecretHandle;
  api_key: OpaqueSecretHandle;
  model: OpaqueSecretHandle;
}

/** One direct-lane call. */
export interface DirectLaneRequest {
  protocol: TranslatedProtocol;
  alias: ProfileAlias;
  tier: Tier;
  handles: DirectLaneHandles;
  request: ModelRequest;
  /** Native structured output where probed, else a JSON-only instruction with one validated retry. */
  structured: "native" | "json-instruction";
}

/** The outcome of a call; a length cut-off on a structured answer is an error. */
export type DirectLaneResult = { ok: true; response: ModelResponse } | { ok: false; error: ModelError };

/** The request builder and caller (M6). */
export type DirectLaneClient = (request: DirectLaneRequest) => Promise<DirectLaneResult>;
