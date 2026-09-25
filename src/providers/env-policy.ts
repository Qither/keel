/**
 * The environment policy: the only place provider environment values are ever dereferenced.
 *
 * @packageDocumentation
 * This module and `src/direct/client.ts` are the only two modules allowed to reference provider
 * environment variable names or to unwrap an {@link OpaqueSecretHandle}; a CI lint enforces it from M2.
 * Everything else in keel handles profile variables by the names in the Board-signed routing, typed as
 * plain `EnvVarName`.
 *
 * In M0 this module declares only the handle type. Its constants (the base OS variable allowlist, the
 * default profile variable names, the per-runtime native name mapping) and its functions arrive in M2.
 * The invariant it will implement (docs/10-providers.md section 1): keel never opens a file that holds
 * provider values, runtime credentials or shared runtime settings; it reads environment values only in
 * memory, here, to build a child environment at spawn and to map profile variables to native names, and
 * in the direct lane's request builder, which unwraps a handle at call time; it never persists, prints,
 * logs, hashes or puts a value in argv.
 */
import type { ProfileAlias, Tier } from "../core/ids.js";

/**
 * A reference to one provider value of one routed profile, without the value. It can be passed around,
 * but only this module can resolve it, in memory, at the moment of use; it is never serialized. The brand
 * keeps a plain string from standing in for a handle.
 */
export type OpaqueSecretHandle = {
  readonly __brand: "keel.OpaqueSecretHandle";
  readonly alias: ProfileAlias;
  readonly slot: "base_url" | "api_key" | `model:${Tier}`;
};
