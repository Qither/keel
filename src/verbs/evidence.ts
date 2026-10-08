// `evidence submit`: a result delivered for a Run after the fact (how a late
// executor result or a human confirmation enters the record). A result from a
// Run of an older generation is stored as superseded Evidence and never
// changes progress.
// Source: HC-06 s2; HC-05 s1; W-05 (acceptance half); harness §4.3; design 4.5.
import { UsageError } from "../errors.js";
import { faultActive } from "../faults.js";
import type { Evidence } from "../model.js";
import { newId, now, type Store } from "../store.js";
import { deriveView, latestGeneration } from "../derive.js";
import { artifactHash, headRevision } from "../workspace.js";

export interface SubmitOptions {
  run: string | undefined;
  claim: string;
  artifact: string | undefined;
  human: boolean;
  approver: string | undefined;
}

export function evidenceSubmit(store: Store, workitemId: string, opts: SubmitOptions): Record<string, unknown> {
  store.assertConsistent();
  const view = deriveView(store, workitemId);
  if (!opts.claim) throw new UsageError("--claim <criterion id> is required");
  const criterion = view.acceptance.criteria.find((c) => c.id === opts.claim);
  if (!criterion) throw new UsageError(`unknown criterion ${opts.claim}`);
  const revision = headRevision(view.task.workspace);
  let runRef: string;
  let superseded = false;
  let status: Evidence["status"];
  let artifact_versions: Evidence["artifact_versions"] = [];
  if (opts.human) {
    if (criterion.evidence_mode !== "human-confirmation") throw new UsageError(`criterion ${opts.claim} does not take human confirmation (evidence_mode ${criterion.evidence_mode})`);
    if (!opts.approver) throw new UsageError("--approver <name> is required with --human");
    runRef = "human";
    status = "present";
  } else {
    if (!opts.run) throw new UsageError("--run <run id> is required");
    const run = view.runs.find((r) => r.id === opts.run);
    if (!run) throw new UsageError(`unknown run ${opts.run}`);
    runRef = run.id;
    superseded = run.generation < latestGeneration(view, run.task_ref) && !faultActive("evidence-ignores-generation");
    if (!opts.artifact) throw new UsageError("--artifact <workspace path> is required");
    const h = artifactHash(view.task.workspace, opts.artifact);
    artifact_versions = [{ path: opts.artifact, sha256: h }];
    status = h === null ? "missing" : criterion.evidence_mode === "artifact-hash" ? (h === criterion.sha256 ? "present" : "failed") : "present";
  }
  const ev: Evidence = {
    id: newId("evidence"),
    run_ref: runRef,
    claim: opts.claim,
    artifact_versions,
    raw_status: null,
    status,
    captured_at: now(),
    source_revision: revision,
    acceptance_version: view.acceptance.version,
    ...(superseded ? { superseded: true } : {}),
  };
  const event = store.append("evidence.captured", { workitem_id: workitemId, evidence: ev, submitted: true, approver: opts.approver ?? null });
  return {
    evidence_id: ev.id,
    event: event.id,
    status,
    superseded,
    effect: superseded ? "stored as evidence from a superseded generation; progress unchanged" : "stored; `keel verify` evaluates it",
  };
}
