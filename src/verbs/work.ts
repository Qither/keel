// `work create`: a WorkItem with goal, scope, Acceptance v1 and its one Task.
// No Grant exists yet, so nothing can run.
// Source: HC-01 s1; HC-05 s1; harness §2; design 4.1.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { UsageError } from "../errors.js";
import { faultActive } from "../faults.js";
import type { Acceptance, Criterion, Step, Task, WorkItem } from "../model.js";
import { newId, Store } from "../store.js";
import { Refused } from "../errors.js";

export interface WorkSpec {
  goal: string;
  scope: string;
  workspace: string;
  acceptance: { criteria: Criterion[] };
  task: { steps: Step[] };
}

function readSpec(path: string): WorkSpec {
  if (!existsSync(path)) throw new UsageError(`spec file not found: ${path}`);
  let spec: WorkSpec;
  try {
    spec = JSON.parse(readFileSync(path, "utf8")) as WorkSpec;
  } catch (err) {
    throw new UsageError(`spec file is not JSON: ${(err as Error).message}`);
  }
  for (const key of ["goal", "scope", "workspace"] as const) {
    if (typeof spec[key] !== "string" || spec[key].length === 0) throw new UsageError(`spec.${key} must be a non-empty string`);
  }
  if (!Array.isArray(spec.acceptance?.criteria) || spec.acceptance.criteria.length === 0) throw new UsageError("spec.acceptance.criteria must list at least one criterion");
  if (!Array.isArray(spec.task?.steps)) throw new UsageError("spec.task.steps must be an array");
  const modes = new Set(["command-exit-status", "artifact-exists", "artifact-hash", "human-confirmation"]);
  for (const c of spec.acceptance.criteria) {
    if (!c.id || !c.statement || typeof c.required !== "boolean" || !modes.has(c.evidence_mode)) {
      throw new UsageError(`criterion ${JSON.stringify(c.id)} needs id, statement, required and a known evidence_mode`);
    }
    if ((c.evidence_mode === "artifact-exists" || c.evidence_mode === "artifact-hash") && !c.path) throw new UsageError(`criterion ${c.id} needs a path`);
    if (c.evidence_mode === "artifact-hash" && !c.sha256) throw new UsageError(`criterion ${c.id} needs a sha256`);
    if (c.evidence_mode === "command-exit-status" && !c.step) throw new UsageError(`criterion ${c.id} needs a step`);
  }
  for (const s of spec.task.steps) {
    if (!s.kind) s.kind = "exec";
    if (!Array.isArray(s.writes)) s.writes = [];
    if (s.kind === "agent") {
      // Stage B: an agent step carries a prompt; its program is the executor. Source: stage-b 3.4.
      if (!s.id || typeof s.prompt !== "string" || s.prompt.length === 0) throw new UsageError(`agent step ${JSON.stringify(s.id)} needs id and a prompt`);
      if (!Array.isArray(s.argv)) s.argv = [];
    } else if (!s.id || !Array.isArray(s.argv) || s.argv.length === 0) {
      throw new UsageError(`step ${JSON.stringify(s.id)} needs id and a non-empty argv`);
    }
  }
  return spec;
}

export function workCreate(stateDir: string, specPath: string): { workitem_id: string; acceptance_id: string; task_id: string; grant_id: string; state_dir: string } {
  const spec = readSpec(specPath);
  const workspace = resolve(spec.workspace);
  if (!existsSync(workspace)) throw new UsageError(`workspace does not exist: ${workspace}`);
  if (faultActive("run-requires-code-change") && spec.task.steps.every((s) => s.writes.every((w) => w.endsWith(".md")))) {
    throw new Refused("work refused: no step changes code", "FAULT run-requires-code-change");
  }
  const store = Store.open(stateDir, true);
  const wiId = newId("wi");
  const accId = newId("acc");
  const taskId = newId("task");
  const grantId = newId("grant");
  return store.transaction((ap) => {
    const acceptance: Acceptance = { id: accId, workitem_ref: { id: wiId }, criteria: spec.acceptance.criteria, source_revision_policy: "workspace-head" } as Acceptance;
    const task: Task = { id: taskId, workitem_ref: { id: wiId }, workspace, steps: spec.task.steps, acceptance_obligations: spec.acceptance.criteria.map((c) => c.id) };
    const accRef = store.writeDoc("acceptance", accId, acceptance, ap);
    const taskRef = store.writeDoc("task", taskId, task, ap);
    const workitem: WorkItem = {
      id: wiId,
      goal: spec.goal,
      scope: spec.scope,
      grant_ref: { id: grantId, version: 0 },
      acceptance_ref: { id: accId, version: accRef.version },
      task_ref: { id: taskId, version: taskRef.version },
      open_questions: [],
      evidence_refs: [],
    };
    const wiRef = store.writeDoc("workitem", wiId, workitem, ap);
    ap("workitem.created", { workitem_id: wiId, version: wiRef.version, acceptance_id: accId, task_id: taskId, grant_id: grantId });
    return { workitem_id: wiId, acceptance_id: accId, task_id: taskId, grant_id: grantId, state_dir: stateDir };
  });
}
