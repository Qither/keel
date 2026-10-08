// `log check`: verifies every event's hash and link and the agreement between
// the log and the documents it recorded. A break or mismatch is reported with
// its location and writes stay refused (exit 5) until the owner resolves it.
// Source: HC-04 s2; HC-05 s1; design 4.11.
import { AuthorityError } from "../errors.js";
import { faultActive } from "../faults.js";
import { type LogProblem, type Store } from "../store.js";

export function logCheck(store: Store): Record<string, unknown> {
  let problems: LogProblem[] = store.check();
  if (faultActive("logcheck-ignores-mismatch")) problems = problems.filter((p) => p.kind !== "document-mismatch");
  const blocking = problems.filter((p) => p.kind !== "unrecorded-document");
  const warnings = problems.filter((p) => p.kind === "unrecorded-document");
  const events = blocking.some((p) => p.kind === "chain-break") ? null : store.events();
  const result = {
    ok: blocking.length === 0,
    events_verified: events?.length ?? 0,
    documents_recorded: events?.filter((e) => e.type === "document.written").length ?? 0,
    last_hash: events?.at(-1)?.hash ?? null,
    problems: blocking,
    warnings,
  };
  if (blocking.length > 0) {
    throw new AuthorityError(`log check failed: ${blocking.map((p) => `${p.kind} at ${p.location}: ${p.detail}`).join("; ")}; writes are refused until resolved`, "HC-04 s2", result);
  }
  return result;
}
