// Helpers shared by the verbs: decision requests, criterion evidence capture,
// context pack assembly and the grant check for one operation.
import { faultActive } from "../faults.js";
import { matchesPattern, normalizePath } from "../glob.js";
import { hashObject } from "../hash.js";
import type { Acceptance, ContextEntry, ContextPack, DecisionRequest, Evidence, EvidenceStatus, Grant, Step, Task } from "../model.js";
import { newId, now, type Store } from "../store.js";
import { deriveView, type View } from "../derive.js";
import { UsageError } from "../errors.js";
import { artifactHash, headRevision } from "../workspace.js";

/** Resolves the WorkItem id: the given one, or the only one in the state directory. */
export function resolveWorkItem(store: Store, given: string | undefined): string {
  if (given) return given;
  const ids = store.recordedDocs("workitem");
  if (ids.length === 1) return ids[0]!;
  if (ids.length === 0) throw new UsageError("no WorkItem exists; run `keel work create --spec <file>`");
  throw new UsageError(`several WorkItems exist (${ids.join(", ")}); name one`);
}

/** Source: HC-03 s1; design 3.9. */
export function raiseDecision(
  store: Store,
  input: Omit<DecisionRequest, "id" | "state" | "resolution">,
): DecisionRequest & { version: number } {
  const id = newId("decision");
  const doc: DecisionRequest = { id, state: "open", ...input };
  const ref = store.writeDoc("decision", id, doc);
  store.append("decision.raised", { decision_id: id, workitem_id: input.workitem_ref.id, run_id: input.run_ref, doc_hash: ref.hash, blocked: input.blocked });
  return { ...doc, version: ref.version };
}

export function decisionContentHash(d: DecisionRequest): string {
  return hashObject({ workitem_ref: d.workitem_ref, run_ref: d.run_ref, facts: d.facts, options: d.options, blocked: d.blocked, continuing: d.continuing, release_path: d.release_path });
}

export interface GrantViolation {
  kind: "operation-kind" | "write-outside-grant" | "exec-not-allowed";
  detail: string;
}

/** Checks one declared Step against the Grant before it is performed. Source: HC-03 s1–s2. */
export function checkStep(step: Step, grant: Grant, extraAllowed: Grant["allowed_operations"] = []): GrantViolation[] {
  const allowed = [...grant.allowed_operations, ...extraAllowed];
  const violations: GrantViolation[] = [];
  const program = normalizePath(step.argv[0] ?? "");
  if (step.kind === "exec") {
    const ok = allowed.some((op) => op.kind === "exec" && matchesPattern(op.pattern, program));
    if (!ok) violations.push({ kind: "exec-not-allowed", detail: `exec of \`${program}\` matches no allowed exec pattern` });
  } else {
    const ok = allowed.some((op) => op.kind === step.kind);
    if (!ok) violations.push({ kind: "operation-kind", detail: `operation kind \`${step.kind}\` is not allowed` });
  }
  for (const w of step.writes) {
    if (!allowedWrite(w, grant, extraAllowed)) violations.push({ kind: "write-outside-grant", detail: `declared write \`${normalizePath(w)}\` matches no allowed write pattern` });
  }
  return violations;
}

export function allowedWrite(path: string, grant: Grant, extraAllowed: Grant["allowed_operations"] = []): boolean {
  return [...grant.allowed_operations, ...extraAllowed].some((op) => op.kind === "write" && matchesPattern(op.pattern, path));
}

export interface StepOutcomeFact {
  step: string;
  exit_status: number | null;
  signal: string | null;
  stdout_ref: string | null;
  stderr_ref: string | null;
  reconciled: boolean;
}

/** The latest observed or reconciled outcome per step, across the Task's runs. */
export function stepOutcomes(view: View, taskId: string): Map<string, StepOutcomeFact> {
  const runIds = new Set(view.runs.filter((r) => r.task_ref === taskId).map((r) => r.id));
  const out = new Map<string, StepOutcomeFact>();
  for (const intent of view.intents) {
    if (!runIds.has(intent.run_ref) || !intent.outcome) continue;
    if (intent.outcome.outcome !== "observed" && intent.outcome.outcome !== "reconciled") continue;
    const step = intent.operation["step"] as string;
    const d = intent.outcome.detail;
    out.set(step, {
      step,
      exit_status: (d["exit_status"] as number | null | undefined) ?? null,
      signal: (d["signal"] as string | null | undefined) ?? null,
      stdout_ref: (d["stdout_ref"] as string | null | undefined) ?? null,
      stderr_ref: (d["stderr_ref"] as string | null | undefined) ?? null,
      reconciled: intent.outcome.outcome === "reconciled",
    });
  }
  return out;
}

/**
 * Captures one Evidence per Acceptance criterion from the workspace and the
 * recorded step outcomes. Raw status is recorded before any summary exists.
 * Source: HC-05 s1; HC-04 s1; W-07; harness §4.2.
 */
export function captureCriterionEvidence(store: Store, view: View, runId: string, task: Task, acceptance: Acceptance & { version: number }): Evidence[] {
  if (faultActive("evidence-not-captured")) return [];
  const revision = headRevision(task.workspace);
  const outcomes = stepOutcomes(view, task.id);
  const captured: Evidence[] = [];
  for (const c of acceptance.criteria) {
    let status: EvidenceStatus;
    let artifact_versions: Evidence["artifact_versions"] = [];
    let raw_status: Evidence["raw_status"] = null;
    if (c.evidence_mode === "artifact-exists") {
      const h = artifactHash(task.workspace, c.path ?? "");
      artifact_versions = [{ path: c.path ?? "", sha256: h }];
      status = h === null ? "missing" : "present";
    } else if (c.evidence_mode === "artifact-hash") {
      const h = artifactHash(task.workspace, c.path ?? "");
      artifact_versions = [{ path: c.path ?? "", sha256: h }];
      status = h === null ? "missing" : h === c.sha256 ? "present" : "failed";
    } else if (c.evidence_mode === "command-exit-status") {
      const o = outcomes.get(c.step ?? "");
      if (!o) {
        status = "not-run";
      } else if (o.reconciled && o.exit_status === null) {
        status = "inferred";
        raw_status = { exit_status: null, signal: null, stdout_ref: o.stdout_ref, stderr_ref: o.stderr_ref };
      } else {
        raw_status = { exit_status: o.exit_status, signal: o.signal, stdout_ref: o.stdout_ref, stderr_ref: o.stderr_ref };
        status = o.exit_status === (c.expected_status ?? 0) ? "present" : "failed";
      }
    } else {
      // human-confirmation: only a human confirmation submitted through `keel evidence submit --human` counts.
      continue;
    }
    const ev: Evidence = {
      id: newId("evidence"),
      run_ref: runId,
      claim: c.id,
      artifact_versions,
      raw_status,
      status,
      captured_at: now(),
      source_revision: revision,
      acceptance_version: acceptance.version,
    };
    store.append("evidence.captured", { evidence: ev, workitem_id: acceptance.workitem_ref.id });
    captured.push(ev);
  }
  return captured;
}

/** Source: HC-07 s1–s2; harness §4.2; design 4.9. */
export function buildContextPack(store: Store, view: View): ContextPack & { version: number } {
  const wi = view.workitem;
  const entries: ContextEntry[] = [];
  const t = now();
  entries.push({ kind: "fact", content: `goal: ${wi.goal}`, source: `workitem ${wi.id} v${wi.version}`, freshness: t, limits: "" });
  entries.push({ kind: "fact", content: `scope: ${wi.scope}`, source: `workitem ${wi.id} v${wi.version}`, freshness: t, limits: "" });
  if (view.grant) {
    const g = view.grant;
    entries.push({
      kind: "fact",
      content: `allowed operations: ${g.allowed_operations.map((o) => `${o.kind}:${o.pattern}`).join(", ")}; budget attempts=${g.budget.attempts} elapsed_seconds=${g.budget.elapsed_seconds} cost=${typeof g.budget.cost === "string" ? g.budget.cost : JSON.stringify(g.budget.cost)}`,
      source: `grant ${g.id} v${g.version}`,
      freshness: t,
      limits: view.grant_valid ? "" : `grant not valid: ${view.grant_invalid_reason}`,
    });
  } else {
    entries.push({ kind: "missing", content: "no grant", source: "event log", freshness: t, limits: "nothing may run" });
  }
  for (const c of view.acceptance.criteria) {
    entries.push({ kind: "fact", content: `criterion ${c.id} (${c.required ? "required" : "optional"}, ${c.evidence_mode}): ${c.statement}`, source: `acceptance ${view.acceptance.id} v${view.acceptance.version}`, freshness: t, limits: "" });
  }
  const rev = headRevision(view.task.workspace);
  if (rev === "no-revision-store") {
    entries.push({ kind: "missing", content: "workspace revision unknown: no revision store", source: `task ${view.task.id} v${view.task.version}`, freshness: t, limits: "evidence cannot be bound to a revision" });
  } else {
    entries.push({ kind: "fact", content: `workspace revision: ${rev}`, source: `git rev-parse HEAD in ${view.task.workspace}`, freshness: t, limits: rev === "unborn" ? "no commit yet" : "" });
  }
  for (const d of view.decisions) {
    if (d.state === "resolved" && d.resolution) {
      entries.push({ kind: "decision", content: `decision ${d.id}: ${d.resolution.option} by ${d.resolution.approver}`, source: `decision ${d.id} v${d.version}`, freshness: d.resolution.at, limits: "" });
    } else if (d.state === "open") {
      entries.push({ kind: "fact", content: `open decision ${d.id}: ${d.blocked}`, source: `decision ${d.id} v${d.version}`, freshness: t, limits: "blocks the named operation" });
    }
  }
  for (const ev of view.evidence.slice(-10)) {
    entries.push({ kind: "summary", content: `evidence ${ev.id}: claim ${ev.claim} is ${ev.status}${ev.superseded ? " (superseded generation)" : ""}`, source: ev.origin, freshness: ev.captured_at, limits: "summary of one evidence record; the record is the authority" });
  }
  for (const e of view.context_entries) {
    entries.push({ kind: e.kind as ContextEntry["kind"], content: e.content, source: e.source, freshness: e.freshness, limits: e.limits });
  }
  const id = newId("ctx");
  const body = { id, workitem_ref: { id: wi.id, version: wi.version }, entries };
  const content_hash = hashObject(body);
  const ref = store.writeDoc("contextpack", id, { ...body, content_hash });
  return { ...body, content_hash, version: ref.version };
}

/** Extra allowed operations an inference entry would grant, honored only under the N-11 fault. */
export function inferenceWidening(view: View): Grant["allowed_operations"] {
  if (!faultActive("context-inference-widens-grant")) return [];
  const out: Grant["allowed_operations"] = [];
  for (const e of view.context_entries) {
    if (e.kind !== "inference" && e.kind !== "summary") continue;
    const m = /widen-grant:\s*(exec|write):(\S+)/.exec(e.content);
    if (m) out.push({ kind: m[1] as "exec" | "write", pattern: m[2]! });
  }
  return out;
}

export function refreshView(store: Store, id: string): View {
  return deriveView(store, id);
}
