// `context add`: records a context entry (fact, decision, inference or
// summary) with its source, freshness and limits. Entries enter the next
// ContextPack as what they are; an inference or summary can never widen the
// Grant or establish acceptance.
// Source: HC-07 s1–s2; W-08; design 4.9.
import { UsageError } from "../errors.js";
import type { ContextEntry } from "../model.js";
import { now, type Store } from "../store.js";

export function contextAdd(store: Store, workitemId: string, kind: string, content: string, source: string | undefined, limits: string | undefined): Record<string, unknown> {
  store.assertConsistent();
  const kinds = ["fact", "decision", "inference", "summary"];
  if (!kinds.includes(kind)) throw new UsageError(`--kind must be one of ${kinds.join(", ")}`);
  if (!content) throw new UsageError("--content is required");
  store.readDoc("workitem", workitemId);
  const entry: ContextEntry = { kind: kind as ContextEntry["kind"], content, source: source ?? "unstated", freshness: now(), limits: limits ?? "" };
  const ev = store.append("context.added", { workitem_id: workitemId, entry });
  return { event: ev.id, entry, effect: kind === "inference" || kind === "summary" ? "visible in the next ContextPack as an inference or summary only; the Grant and Acceptance are unchanged" : "visible in the next ContextPack" };
}
