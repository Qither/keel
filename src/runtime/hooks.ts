/**
 * Canonical hook events, their native counterparts, and the typed outcomes `keel hook` journals.
 *
 * @packageDocumentation
 * Mirrors schemas/hook-events.schema.json. The canonical event names, their native counterparts per
 * runtime and their blockability live only in `runtimes/hook-events.yaml`; the literal union of event ids
 * is generated from that table (M2) and `keel sync --check` catches drift, so this module types the id as
 * a slug. `keel hook <canonical event> --runtime <id>` is the single hook entry point. It fails open on any
 * internal error and journals a typed outcome; hooks warn, gates decide, and every guarantee a hook helps
 * with is re-checked by the Steward at ingest, submit and land. Implemented in M2.
 */
import type { IsoDateTime, RunId, RuntimeId, Slug, VerificationStatus } from "../core/ids.js";

/** A canonical event id from runtimes/hook-events.yaml, for example the post-compact event. */
export type CanonicalHookEventId = Slug;

/** One native event of one runtime. */
export interface NativeHookEvent {
  runtime: RuntimeId;
  name: string;
  matcher?: string | null;
  blockable: boolean;
  verification_status: VerificationStatus;
  note?: string;
}

/** One canonical event and its native counterparts. */
export interface HookEventEntry {
  id: CanonicalHookEventId;
  description: string;
  native: NativeHookEvent[];
}

/** `runtimes/hook-events.yaml`. */
export interface HookEventTable {
  events: HookEventEntry[];
}

/** The guards a hook evaluates for its event. */
export type HookGuard =
  | "ack-before-edit"
  | "write-set"
  | "frozen-paths"
  | "provider-path-set"
  | "reserved-ops"
  | "brief-reinjection";

/** The typed outcome of one invocation; `error` means the hook failed open. */
export type HookOutcome = "allow" | "block" | "inject" | "error";

/** One invocation: the native payload is read from stdin and mapped to the canonical event. */
export interface HookInvocation {
  event: CanonicalHookEventId;
  runtime: RuntimeId;
  /** Null outside a keel run, where the hook is advisory and journals nothing. */
  run: RunId | null;
}

/** The answer in the runtime's native form: exit code 2 blocks where supported. */
export interface HookResponse {
  outcome: HookOutcome;
  exit_code: number;
  guard: HookGuard | null;
  /** Context injected through the runtime's context field, for example the brief after compaction. */
  additional_context: string | null;
}

/** A journal entry, written inside a run as an O_EXCL outbox drop and ingested as a ledger event. */
export interface HookJournalEntry {
  ts: IsoDateTime;
  event: CanonicalHookEventId;
  runtime: RuntimeId;
  run: RunId;
  outcome: HookOutcome;
  guard: HookGuard | null;
}

/** Per-event denominators for doctor; `unknown` where the outbox is not writable. */
export interface HookDenominators {
  event: CanonicalHookEventId;
  runtime: RuntimeId;
  fired: number | "unknown";
  blocked: number | "unknown";
  errored: number | "unknown";
}
