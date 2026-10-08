// `show`: a read-only projection recomputed from authority on every call.
// Every displayed value names its origin and freshness; uncertain and unknown
// values are shown as such. The projection file it writes is a convenience
// copy that is never read back.
// Source: HC-04 s1–s2; HC-01 s1; KP-12 supports-goal; design 4.10.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { faultActive } from "../faults.js";
import { type Store } from "../store.js";
import { deriveView } from "../derive.js";
import { headRevision } from "../workspace.js";

export function show(store: Store, workitemId: string): Record<string, unknown> {
  if (faultActive("show-trusts-projection")) {
    const p = join(store.projectionsDir, `${workitemId}.json`);
    if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")) as Record<string, unknown>;
  }
  const view = deriveView(store, workitemId);
  const wi = view.workitem;
  const lastCheckpoint = view.checkpoints.at(-1) ?? null;
  const latestGen = view.runs.reduce((m, r) => Math.max(m, r.generation), 0);
  const projection = {
    projection: "derived; editing this object changes nothing",
    computed_at: new Date().toISOString(),
    workitem: { id: wi.id, version: wi.version, goal: wi.goal, scope: wi.scope, origin: `workitem ${wi.id} v${wi.version}` },
    status: view.status,
    grant: view.grant
      ? {
          id: view.grant.id,
          version: view.grant.version,
          valid: view.grant_valid,
          reason: view.grant_invalid_reason,
          allowed_operations: view.grant.allowed_operations,
          budget: view.grant.budget,
          confirmed_by: view.grant.confirmed_by ?? null,
          origin: view.grant_confirmation ? `event ${view.grant_confirmation.id}` : `grant ${view.grant.id} v${view.grant.version} (unconfirmed)`,
        }
      : { id: wi.grant_ref?.id ?? null, version: 0, valid: false, reason: "no grant", origin: "event log" },
    acceptance: { id: view.acceptance.id, version: view.acceptance.version, criteria: view.acceptance.criteria.map((c) => c.id), origin: `acceptance ${view.acceptance.id} v${view.acceptance.version}` },
    workspace: { path: view.task.workspace, revision: headRevision(view.task.workspace), origin: "git rev-parse HEAD", freshness: "now" },
    runs: view.runs.map((r) => ({
      id: r.id,
      generation: r.generation,
      state: r.state,
      reason: r.reason,
      superseded: r.generation < latestGen,
      executor: r.executor_alias,
      pid: r.pid,
      process_alive: r.process_alive,
      session_ref: r.session_ref,
      usage: r.usage,
      started_at: r.started_at,
      ended_at: r.ended_at,
      origin: r.origin,
    })),
    intents: view.intents.map((i) => ({ id: i.id, run: i.run_ref, step: i.operation["step"], outcome: i.outcome?.outcome ?? "none recorded", origin: i.outcome ? `${i.origin}; ${i.outcome.origin}` : i.origin })),
    evidence: view.evidence.map((e) => ({ id: e.id, run: e.run_ref, claim: e.claim, status: e.status, superseded: e.superseded ?? false, source_revision: e.source_revision, acceptance_version: e.acceptance_version, captured_at: e.captured_at, origin: e.origin })),
    open_decisions: view.open_decisions.map((d) => ({ id: d.id, blocked: d.blocked, options: d.options.map((o) => o.key), release_path: d.release_path, origin: `decision ${d.id} v${d.version}` })),
    resolved_decisions: view.decisions.filter((d) => d.state !== "open").map((d) => ({ id: d.id, option: d.resolution?.option ?? null, approver: d.resolution?.approver ?? null, origin: `decision ${d.id} v${d.version}` })),
    last_checkpoint: lastCheckpoint ? { id: lastCheckpoint.id, progress: lastCheckpoint.progress, created_at: lastCheckpoint.created_at, origin: `checkpoint ${lastCheckpoint.id} v${lastCheckpoint.version}` } : null,
    context_entries: view.context_entries,
    accepted: view.accepted,
    test_hooks_active: view.test_hooks_active,
    event_count: view.events.length,
  };
  store.writeProjection(workitemId, projection);
  return projection;
}
