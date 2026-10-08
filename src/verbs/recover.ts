// `recover`: reloads authority, reconciles every IntentRecord without an
// outcome against the workspace, never repeats the operation, and starts a new
// generation only when every effect is reconciled. Uncertain effects wait for
// an explicit human abandonment.
// Source: HC-06 s1–s2; HC-01 s2; W-04; harness §4.3; design 4.5.
import { AuthorityError, Refused, Waiting } from "../errors.js";
import { faultActive } from "../faults.js";
import { newId, now, type Store } from "../store.js";
import { deriveView, type IntentView } from "../derive.js";
import { artifactHash, headRevision } from "../workspace.js";
import { run, type RunResult } from "./run.js";

export interface RecoverOptions {
  retry: boolean;
  abandon: boolean;
  session_ref: string | undefined;
}

export interface RecoverResult {
  crashed_runs: { run_id: string; generation: number; session_ref: string | null; session_resolution: string }[];
  reconciliations: { intent_id: string; step: string; outcome: "reconciled" | "uncertain" | "abandoned"; artifacts: { path: string; sha256: string | null }[] }[];
  reloaded: { grant: string | null; acceptance: string; source_revision: string; budget_attempts_used: number };
  new_run: RunResult | null;
  claim: string;
}

export async function recover(store: Store, workitemId: string, opts: RecoverOptions): Promise<RecoverResult> {
  store.assertConsistent();
  const view = deriveView(store, workitemId);
  const task = view.task;
  const crashed = view.runs.filter((r) => r.state === "outcome-uncertain");
  const crashedIds = new Set(crashed.map((r) => r.id));
  // An intent is unreconciled while it has no outcome or its last outcome is `uncertain`.
  const openIntents = view.intents.filter((i) => crashedIds.has(i.run_ref) && (i.outcome === null || i.outcome.outcome === "uncertain"));

  const sessions = crashed.map((r) => {
    const resolution =
      r.session_ref === null
        ? "none recorded; recovery uses documents and the event log"
        : "unresolved: Stage A has no session transport; the reference is reported, not consulted; recovery uses documents and the event log";
    if (r.session_ref !== null && faultActive("recover-trusts-session")) {
      throw new AuthorityError(`session ${r.session_ref} cannot be resumed; state lost`, "FAULT recover-trusts-session");
    }
    return { run_id: r.id, generation: r.generation, session_ref: r.session_ref, session_resolution: resolution };
  });

  const reloaded = {
    grant: view.grant ? `${view.grant.id} v${view.grant.version}${view.grant_valid ? "" : " (invalid: " + view.grant_invalid_reason + ")"}` : null,
    acceptance: `${view.acceptance.id} v${view.acceptance.version}`,
    source_revision: headRevision(task.workspace),
    budget_attempts_used: view.runs.filter((r) => r.task_ref === task.id).length,
  };

  if (opts.retry && openIntents.length > 0 && !faultActive("recover-repeats-operation")) {
    throw new Refused(
      `recover refused: ${openIntents.length} IntentRecord(s) have no reconciled outcome (${openIntents.map((i) => i.id).join(", ")}); reconcile first or abandon explicitly with --abandon`,
      "HC-06 s1",
      { intents: openIntents.map((i) => i.id) },
    );
  }

  const reconciliations: RecoverResult["reconciliations"] = [];
  if (opts.abandon) {
    for (const intent of openIntents) {
      store.append("intent.outcome", { intent_id: intent.id, run_id: intent.run_ref, outcome: "abandoned", detail: { by: "owner", at: now() } });
      reconciliations.push({ intent_id: intent.id, step: intent.operation["step"] as string, outcome: "abandoned", artifacts: [] });
    }
    for (const r of crashed) {
      store.append("run.ended", { run_id: r.id, state: "abandoned", reason: "abandoned by the owner after an unreconciled outcome", usage: r.usage });
    }
    return { crashed_runs: sessions, reconciliations, reloaded, new_run: null, claim: "abandoned; no completion is claimed" };
  }

  let anyUncertain = false;
  if (!faultActive("recover-skips-reconcile")) {
    for (const intent of openIntents) {
      const r = reconcile(intent, task.workspace);
      store.append("intent.outcome", { intent_id: intent.id, run_id: intent.run_ref, outcome: r.outcome, detail: { artifacts: r.artifacts, exit_status: null, checked_at: now(), method: "expected_effect artifacts checked against the workspace" } });
      if (r.outcome === "uncertain") anyUncertain = true;
      reconciliations.push({ intent_id: intent.id, step: intent.operation["step"] as string, outcome: r.outcome, artifacts: r.artifacts });
    }
    if (anyUncertain) {
      for (const r of crashed) {
        store.append("run.state", { run_id: r.id, state: "outcome-uncertain", reason: "expected effect not found in the workspace; reconcile by hand or abandon" });
      }
      throw new Waiting(
        "recover waits: an effect remains uncertain; the operation is not repeated. Release: `keel recover --abandon` records an explicit abandonment with no completion claim",
        "HC-06 s1",
        { reconciliations },
      );
    }
    for (const r of crashed) {
      store.append("run.ended", { run_id: r.id, state: "failed", reason: "process ended without recording an outcome; effects reconciled", usage: r.usage });
    }
  }

  if (crashed.length === 0 && !opts.retry) {
    return { crashed_runs: [], reconciliations: [], reloaded, new_run: null, claim: "nothing to recover" };
  }
  const new_run = await run(store, workitemId, { session_ref: opts.session_ref, crash_after_effect: undefined });
  return { crashed_runs: sessions, reconciliations, reloaded, new_run, claim: `new generation ${new_run.generation} started after reconciliation; acceptance is decided by \`keel verify\`` };
}

function reconcile(intent: IntentView, workspace: string): { outcome: "reconciled" | "uncertain"; artifacts: { path: string; sha256: string | null }[] } {
  const artifacts = intent.expected_effect.artifacts.map((p) => ({ path: p, sha256: artifactHash(workspace, p) }));
  const allPresent = artifacts.length > 0 && artifacts.every((a) => a.sha256 !== null);
  return { outcome: allPresent ? "reconciled" : "uncertain", artifacts };
}

export { newId };
