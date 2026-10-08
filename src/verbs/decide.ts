// `decide`: lists open DecisionRequests, or resolves one with a chosen option
// bound to the request's content hash. A resolution that widens the Grant
// never edits it; it directs the owner to `keel grant` for a new version.
// Source: HC-03 s1–s2; HC-08 s1; HC-04 s1; design 4.6.
import { Refused, UsageError } from "../errors.js";
import type { DecisionRequest } from "../model.js";
import { now, type Store } from "../store.js";
import { decisionContentHash } from "./common.js";

export function listDecisions(store: Store): { open: DecisionRequest[]; resolved: DecisionRequest[] } {
  const all = store.recordedDocs("decision").map((id) => store.readDoc<DecisionRequest>("decision", id));
  return { open: all.filter((d) => d.state === "open"), resolved: all.filter((d) => d.state !== "open") };
}

export function decide(store: Store, decisionId: string, option: string, approver: string | undefined): Record<string, unknown> {
  store.assertConsistent();
  const doc = store.readDoc<DecisionRequest>("decision", decisionId);
  if (doc.state !== "open") throw new Refused(`decision ${decisionId} is already ${doc.state}`, "HC-04 s1");
  if (!doc.options.some((o) => o.key === option)) throw new UsageError(`unknown option ${option}; options: ${doc.options.map((o) => o.key).join(", ")}`);
  if (!approver) throw new UsageError("--approver <name> is required (declared, not authenticated)");
  const bound_hash = decisionContentHash(doc);
  const at = now();
  return store.transaction((ap) => {
    const { version: _v, ...rest } = doc;
    const resolved: DecisionRequest = { ...rest, state: "resolved", resolution: { option, approver, at, bound_hash } };
    const ref = store.writeDoc("decision", decisionId, resolved, ap);
    ap("decision.resolved", { decision_id: decisionId, workitem_id: doc.workitem_ref.id, option, approver, bound_hash, version: ref.version });
    const next =
      option === "widen-grant" || option === "extend-budget"
        ? "the Grant is unchanged; create a new Grant version with `keel grant … --confirm <hash prefix> --approver <name>`"
        : "no Grant change";
    return { decision_id: decisionId, version: ref.version, option, approver, bound_hash, next };
  });
}
