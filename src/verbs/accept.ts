// `accept`: allowed only when `verify` reports every required criterion
// present. Records the acceptance bound to the Acceptance version, the
// Evidence ids and artifact versions, then writes a Checkpoint. An executor's
// completion claim is never an input.
// Source: HC-05 s1; HC-08 s2; harness §2; design 4.8.
import { CheckFailed } from "../errors.js";
import { faultActive } from "../faults.js";
import type { Checkpoint } from "../model.js";
import { newId, now, type Store } from "../store.js";
import { verifyView } from "./verify.js";

export function accept(store: Store, workitemId: string): Record<string, unknown> {
  store.assertConsistent();
  const { result, view } = verifyView(store, workitemId);
  if (result.verdict !== "accepted" && !faultActive("accept-ignores-status")) {
    const failing = result.criteria.filter((c) => c.required && c.status !== "present");
    throw new CheckFailed(
      `accept refused: ${failing.map((c) => `${c.id} is ${c.status}`).join("; ")} (${result.satisfied}/${result.total} present)`,
      "HC-05 s2",
      { verdict: result.verdict, criteria: failing, satisfied: result.satisfied, total: result.total },
    );
  }
  const evidenceIds = result.criteria.map((c) => c.evidence_id).filter((id): id is string => id !== null);
  const artifacts = view.evidence.filter((e) => evidenceIds.includes(e.id)).flatMap((e) => e.artifact_versions);
  const checkpointId = newId("checkpoint");
  const lastOpenIntent = view.intents.find((i) => i.outcome === null) ?? null;
  return store.transaction((ap) => {
    const ev = ap("acceptance.recorded", {
      workitem_id: workitemId,
      acceptance_id: view.acceptance.id,
      acceptance_version: view.acceptance.version,
      evidence_ids: evidenceIds,
      artifact_versions: artifacts,
      source_revision: result.current_revision,
      satisfied: result.satisfied,
      total: result.total,
    });
    const checkpoint: Checkpoint = {
      id: checkpointId,
      workitem_ref: { id: workitemId, version: view.workitem.version },
      progress: {
        satisfied: result.criteria.filter((c) => c.status === "present").map((c) => c.id),
        pending: result.criteria.filter((c) => c.status === "not-run" || c.status === "missing").map((c) => c.id),
        failed: result.criteria.filter((c) => c.status === "failed" || c.status === "stale").map((c) => c.id),
        uncertain: result.criteria.filter((c) => c.status === "inferred").map((c) => c.id),
      },
      decisions: view.decisions.map((d) => ({ id: d.id, resolution: d.resolution?.option ?? null })),
      run_evidence: evidenceIds,
      artifact_versions: artifacts,
      recovery_data: lastOpenIntent ? { intent_id: lastOpenIntent.id } : null,
      created_at: now(),
    };
    const ref = store.writeDoc("checkpoint", checkpointId, checkpoint, ap);
    return { workitem_id: workitemId, acceptance_version: view.acceptance.version, acceptance_event: ev.id, checkpoint_id: checkpointId, checkpoint_version: ref.version, satisfied: result.satisfied, total: result.total, evidence_ids: evidenceIds, source_revision: result.current_revision };
  });
}
