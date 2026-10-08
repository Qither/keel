// `run`: executes the Task's remaining steps under a valid Grant. Every
// side-effecting operation is preceded by an IntentRecord, followed by its
// outcome, and raw status is captured into Evidence before any summary.
// Source: HC-03 s1; HC-05 s1; HC-06 s1; HC-02 s2; HC-07 s1; harness §4.2; design 4.3.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CheckFailed, Refused, Waiting } from "../errors.js";
import { EXECUTOR_ALIAS, execStep } from "../executor.js";
import { faultActive } from "../faults.js";
import { normalizePath } from "../glob.js";
import type { Grant } from "../model.js";
import { newId, now, type Store } from "../store.js";
import { deriveView, latestGeneration, type View } from "../derive.js";
import { changedPaths, artifactHash, headRevision } from "../workspace.js";
import { allowedWrite, buildContextPack, captureCriterionEvidence, checkStep, inferenceWidening, raiseDecision, stepOutcomes } from "./common.js";

export interface RunOptions {
  session_ref: string | undefined;
  /** Test hook: kill the product process right after this step's effect, before its outcome is recorded (W-04). */
  crash_after_effect: string | undefined;
}

export interface RunResult {
  run_id: string;
  generation: number;
  state: string;
  steps_executed: string[];
  steps_skipped_as_done: string[];
  evidence_captured: { id: string; claim: string; status: string }[];
  usage: { attempts_used: number; elapsed_seconds: number; cost: unknown };
  summary: { kind: "summary"; content: string; limits: string };
}

/** Under the N-05 fault only: an unrecorded grant file claiming confirmation is trusted. */
function trustedUnrecordedGrant(store: Store, view: View): (Grant & { version: number }) | null {
  if (!faultActive("grant-trusts-document")) return null;
  const grantId = view.workitem.grant_ref?.id;
  if (!grantId) return null;
  const dir = join(store.docsDir, "grant", grantId);
  if (!existsSync(dir)) return null;
  for (const file of readdirSync(dir).sort().reverse()) {
    try {
      const doc = JSON.parse(readFileSync(join(dir, file), "utf8")) as Grant & { version: number };
      if (doc.confirmed_by) return doc;
    } catch {
      /* ignore */
    }
  }
  return null;
}

export async function run(store: Store, workitemId: string, opts: RunOptions): Promise<RunResult> {
  store.assertConsistent();
  let view = deriveView(store, workitemId);
  let grant = view.grant;
  if (!view.grant_valid) {
    const trusted = trustedUnrecordedGrant(store, view);
    if (trusted) grant = trusted;
    else throw new Refused(`run refused: ${view.grant_invalid_reason}`, "HC-03 s2", { grant_id: view.workitem.grant_ref?.id ?? null });
  }
  if (!grant) throw new Refused("run refused: no grant", "HC-03 s2");
  if (view.open_decisions.length > 0) {
    const d = view.open_decisions[0]!;
    throw new Waiting(`run waits: decision ${d.id} is open (${d.blocked}); resolve it with \`keel decide ${d.id} --option <key>\``, "HC-03 s1", { decision_id: d.id, options: d.options });
  }
  const uncertain = view.runs.find((r) => r.state === "outcome-uncertain");
  if (uncertain) {
    throw new Refused(`run refused: run ${uncertain.id} (generation ${uncertain.generation}) has an unreconciled outcome; use \`keel recover\``, "HC-06 s1", { run_id: uncertain.id });
  }
  const active = view.runs.find((r) => r.state === "running" || r.state === "stopping");
  if (active) throw new Refused(`run refused: run ${active.id} is still ${active.state} (pid ${active.pid})`, "HC-06 s1", { run_id: active.id });

  const task = view.task;
  const attemptsUsed = view.runs.filter((r) => r.task_ref === task.id).length;
  if (attemptsUsed >= grant.budget.attempts) {
    const d = raiseDecision(store, {
      workitem_ref: { id: workitemId },
      run_ref: "none",
      facts: [
        `budget attempts=${grant.budget.attempts} is exhausted: ${attemptsUsed} runs recorded (grant ${grant.id} v${grant.version})`,
        `cost is ${typeof grant.budget.cost === "string" ? grant.budget.cost : JSON.stringify(grant.budget.cost)}; the ${EXECUTOR_ALIAS} executor reports no cost observation`,
      ],
      options: [
        { key: "extend-budget", description: "create a new Grant version with a larger attempts budget through `keel grant`" },
        { key: "stop-work", description: "leave the WorkItem as it is" },
      ],
      blocked: "starting another run",
      continuing: "nothing",
      release_path: "keel decide <id> --option extend-budget, then keel grant … --confirm",
    });
    throw new Waiting(`run waits: attempts budget exhausted; decision ${d.id} raised`, "HC-03 s1", { decision_id: d.id });
  }

  const done = stepOutcomes(view, task.id);
  const remaining = task.steps.filter((s) => {
    const o = done.get(s.id);
    return !(o && (o.reconciled || o.exit_status === 0));
  });
  const skipped = task.steps.filter((s) => !remaining.includes(s)).map((s) => s.id);

  const pack = buildContextPack(store, view);
  const widening = inferenceWidening(view);
  const runId = newId("run");
  const generation = latestGeneration(view, task.id) + 1;
  const startedAt = Date.now();
  const deadline = startedAt + grant.budget.elapsed_seconds * 1000;
  const usage = () => ({
    attempts_used: attemptsUsed + 1,
    elapsed_seconds: Math.round((Date.now() - startedAt) / 100) / 10,
    cost: faultActive("cost-defaults-zero") ? 0 : ("unknown" as const),
  });

  store.append("run.started", {
    run_id: runId,
    task_ref: task.id,
    workitem_id: workitemId,
    generation,
    executor_alias: EXECUTOR_ALIAS,
    workspace: task.workspace,
    context_pack_ref: pack.id,
    context_pack_hash: pack.content_hash,
    pid: process.pid,
    session_ref: opts.session_ref ?? null,
    attempts_used: attemptsUsed + 1,
    route: { executor: EXECUTOR_ALIAS, cost: "unknown", cost_note: "the local-process executor reports no cost observation; budget is enforced by attempts and elapsed_seconds only" },
    crash_point: opts.crash_after_effect ?? null,
    grant_ref: { id: grant.id, version: grant.version },
    acceptance_ref: { id: view.acceptance.id, version: view.acceptance.version },
  });

  const executed: string[] = [];
  const endRun = (state: "failed" | "completed", reason: string | null) =>
    store.append("run.ended", { run_id: runId, state, reason, usage: usage() });

  for (const step of remaining) {
    const violations = faultActive("run-skips-grant-check") ? [] : checkStep(step, grant, widening);
    if (violations.length > 0) {
      const d = raiseDecision(store, {
        workitem_ref: { id: workitemId },
        run_ref: runId,
        facts: [
          `step ${step.id} was not performed: ${violations.map((v) => v.detail).join("; ")}`,
          `grant ${grant.id} v${grant.version} allows: ${grant.allowed_operations.map((o) => `${o.kind}:${o.pattern}`).join(", ")}`,
          `steps already completed keep their evidence: ${[...skipped, ...executed].join(", ") || "none"}`,
        ],
        options: [
          { key: "widen-grant", description: "create a new Grant version through `keel grant` that allows the operation" },
          { key: "keep-grant", description: "keep the Grant; the Task cannot complete as declared" },
        ],
        blocked: `step ${step.id}`,
        continuing: "nothing; no later step runs before this decision",
        release_path: "keel decide <id> --option widen-grant|keep-grant",
      });
      endRun("failed", "grant-exceeded");
      throw new Waiting(`run waits: step ${step.id} exceeds the grant; decision ${d.id} raised`, "HC-03 s1", { decision_id: d.id, violations, run_id: runId });
    }

    const intentId = newId("intent");
    store.append("intent.recorded", {
      intent_id: intentId,
      run_id: runId,
      operation: { kind: step.kind, step: step.id, argv: step.argv, cwd: task.workspace },
      authorization_ref: { id: grant.id, version: grant.version },
      expected_effect: { artifacts: step.writes.map(normalizePath) },
    });
    const before = new Set(changedPaths(task.workspace));
    const remainingMs = Math.max(1, deadline - Date.now());
    const result = await execStep(step, task.workspace, remainingMs, (pid) => store.append("executor.spawned", { run_id: runId, intent_id: intentId, pid }));

    if (opts.crash_after_effect === step.id && result.exit_status === 0) {
      // W-04: the effect happened; the product dies before recording the outcome.
      process.kill(process.pid, "SIGKILL");
    }

    const out = store.writeBlob(runId, `${step.id}.stdout`, result.stdout);
    const err = store.writeBlob(runId, `${step.id}.stderr`, result.stderr);
    const artifacts = step.writes.map((p) => ({ path: normalizePath(p), sha256: artifactHash(task.workspace, p) }));
    store.append("intent.outcome", {
      intent_id: intentId,
      run_id: runId,
      outcome: "observed",
      detail: {
        exit_status: result.exit_status,
        signal: result.signal,
        timed_out: result.timed_out,
        spawn_error: result.spawn_error,
        elapsed_ms: result.elapsed_ms,
        artifacts,
        stdout_ref: out.ref,
        stdout_sha256: out.sha256,
        stderr_ref: err.ref,
        stderr_sha256: err.sha256,
      },
    });
    const revision = headRevision(task.workspace);
    store.append("evidence.captured", {
      workitem_id: workitemId,
      evidence: {
        id: newId("evidence"),
        run_ref: runId,
        claim: `step:${step.id}`,
        artifact_versions: artifacts,
        raw_status: { exit_status: result.exit_status, signal: result.signal, stdout_ref: out.ref, stderr_ref: err.ref },
        status: result.exit_status === 0 ? "present" : "failed",
        captured_at: now(),
        source_revision: revision,
        acceptance_version: view.acceptance.version,
      },
    });
    executed.push(step.id);

    const after = changedPaths(task.workspace).filter((p) => !before.has(p));
    const outside = faultActive("run-skips-grant-check") ? [] : after.filter((p) => !allowedWrite(p, grant!, widening));
    if (outside.length > 0) {
      store.append("evidence.captured", {
        workitem_id: workitemId,
        evidence: {
          id: newId("evidence"),
          run_ref: runId,
          claim: "grant.allowed_operations",
          artifact_versions: outside.map((p) => ({ path: p, sha256: artifactHash(task.workspace, p) })),
          raw_status: null,
          status: "failed",
          captured_at: now(),
          source_revision: revision,
          acceptance_version: view.acceptance.version,
        },
      });
      const d = raiseDecision(store, {
        workitem_ref: { id: workitemId },
        run_ref: runId,
        facts: [`step ${step.id} changed paths outside the grant: ${outside.join(", ")}`, "this is an actual overreach, recorded as failed evidence"],
        options: [
          { key: "widen-grant", description: "create a new Grant version that allows these paths" },
          { key: "keep-grant", description: "keep the Grant; the changed paths stay recorded as a violation" },
        ],
        blocked: "every later step",
        continuing: "nothing",
        release_path: "keel decide <id> --option widen-grant|keep-grant",
      });
      endRun("failed", "grant-violated");
      throw new Waiting(`run stopped: step ${step.id} wrote outside the grant (${outside.join(", ")}); decision ${d.id} raised`, "HC-03 s2", { decision_id: d.id, outside, run_id: runId });
    }
    if (result.timed_out) {
      const d = raiseDecision(store, {
        workitem_ref: { id: workitemId },
        run_ref: runId,
        facts: [`step ${step.id} exceeded the elapsed_seconds budget (${grant.budget.elapsed_seconds}) and was killed`],
        options: [
          { key: "extend-budget", description: "create a new Grant version with a larger elapsed_seconds budget" },
          { key: "stop-work", description: "leave the WorkItem as it is" },
        ],
        blocked: `step ${step.id}`,
        continuing: "nothing",
        release_path: "keel decide <id> --option extend-budget|stop-work",
      });
      endRun("failed", "budget-elapsed");
      throw new Waiting(`run stopped: elapsed budget reached at step ${step.id}; decision ${d.id} raised`, "HC-03 s1", { decision_id: d.id, run_id: runId });
    }
    if (result.exit_status !== 0) {
      const stopRequested = store.events().some((e) => e.type === "stop.requested" && e.data["run_id"] === runId);
      // Criterion evidence is captured for a failed run too: a failed required check stays visible as failed.
      captureCriterionEvidence(store, deriveView(store, workitemId), runId, task, view.acceptance);
      endRun("failed", stopRequested ? "stopped" : `step ${step.id} exited ${result.exit_status ?? result.signal ?? result.spawn_error}`);
      throw new CheckFailed(`run failed: step ${step.id} exited ${result.exit_status ?? "by signal " + result.signal}${stopRequested ? " after a stop request" : ""}`, "HC-05 s1", {
        run_id: runId,
        step: step.id,
        exit_status: result.exit_status,
        signal: result.signal,
        stderr_ref: err.ref,
      });
    }
  }

  view = deriveView(store, workitemId);
  const captured = captureCriterionEvidence(store, view, runId, task, view.acceptance);
  const ended = endRun("completed", null);
  const u = (ended.data["usage"] as RunResult["usage"]);
  const statuses = captured.map((e) => `${e.claim}=${e.status}`).join(", ");
  return {
    run_id: runId,
    generation,
    state: "completed",
    steps_executed: executed,
    steps_skipped_as_done: skipped,
    evidence_captured: captured.map((e) => ({ id: e.id, claim: e.claim, status: e.status })),
    usage: u,
    summary: {
      kind: "summary",
      content: `run ${runId} (generation ${generation}) completed ${executed.length} step(s); criterion evidence: ${statuses || "none captured"}`,
      limits: "a summary of the evidence events above; `keel verify` reads the events, not this line",
    },
  };
}
