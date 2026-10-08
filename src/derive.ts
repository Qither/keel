// Derived view of one WorkItem. Nothing here is stored as authority: every
// value is recomputed from documents and the event log on each call and is
// annotated with its origin (document version or event id) and freshness.
// Source: HC-04 s1–s2; HC-01 s1; design 3.11, 4.10; KP-12 supports-goal.
import { pidAlive } from "./lock.js";
import { hashObject } from "./hash.js";
import type {
  Acceptance,
  Checkpoint,
  ContextPack,
  DecisionRequest,
  Evidence,
  Grant,
  RunState,
  Task,
  WorkItem,
} from "./model.js";
import type { LogEvent, Store } from "./store.js";
import { activeFaults } from "./faults.js";

export interface Sourced<T> {
  value: T;
  origin: string;
  freshness: string;
}

export interface RunView {
  id: string;
  task_ref: string;
  generation: number;
  executor_alias: string;
  state: RunState;
  reason: string | null;
  pid: number | null;
  process_alive: boolean;
  session_ref: string | null;
  context_pack_ref: string | null;
  usage: { attempts_used: number; elapsed_seconds: number | "unknown"; cost: unknown };
  started_at: string;
  ended_at: string | null;
  origin: string;
}

export interface IntentView {
  id: string;
  run_ref: string;
  operation: Record<string, unknown>;
  authorization_ref: { id: string; version: number };
  expected_effect: { artifacts: string[] };
  recorded_at: string;
  outcome: { outcome: string; detail: Record<string, unknown>; at: string; origin: string } | null;
  origin: string;
}

export type DerivedStatus =
  | "created"
  | "granted"
  | "running"
  | "waiting-decision"
  | "outcome-uncertain"
  | "executed"
  | "failed"
  | "abandoned"
  | "accepted";

export interface View {
  workitem: WorkItem & { version: number };
  acceptance: Acceptance & { version: number };
  task: Task & { version: number };
  grant: (Grant & { version: number }) | null;
  grant_confirmation: LogEvent | null;
  grant_valid: boolean;
  grant_invalid_reason: string | null;
  runs: RunView[];
  intents: IntentView[];
  evidence: (Evidence & { origin: string })[];
  decisions: (DecisionRequest & { version: number })[];
  open_decisions: (DecisionRequest & { version: number })[];
  checkpoints: (Checkpoint & { version: number })[];
  accepted: { event: string; acceptance_version: number } | null;
  context_entries: { kind: string; content: string; source: string; freshness: string; limits: string; origin: string }[];
  status: Sourced<DerivedStatus>;
  test_hooks_active: string[];
  events: LogEvent[];
}

export function grantProposalHash(grant: Pick<Grant, "workitem_ref" | "allowed_operations" | "budget" | "decision_classes">): string {
  return hashObject({
    workitem_ref: grant.workitem_ref,
    allowed_operations: grant.allowed_operations,
    budget: grant.budget,
    decision_classes: grant.decision_classes,
  });
}

export function deriveView(store: Store, workitemId: string): View {
  const events = store.events();
  const workitem = store.readDoc<WorkItem>("workitem", workitemId, undefined, events);
  const acceptance = store.readDoc<Acceptance>("acceptance", workitem.acceptance_ref.id, undefined, events);
  const task = store.readDoc<Task>("task", workitem.task_ref.id, undefined, events);

  // Grant: the latest recorded version; valid only with a confirmation event bound to its content.
  let grant: (Grant & { version: number }) | null = null;
  let grant_confirmation: LogEvent | null = null;
  let grant_valid = false;
  let grant_invalid_reason: string | null = "no grant";
  const grantIds = store.recordedDocs("grant", events).filter((id) => {
    const g = store.readDoc<Grant>("grant", id, undefined, events);
    return g.workitem_ref.id === workitemId;
  });
  if (grantIds.length > 0) {
    const id = grantIds.at(-1)!;
    grant = store.readDoc<Grant>("grant", id, undefined, events);
    const proposal = grantProposalHash(grant);
    grant_confirmation =
      events.find(
        (e) =>
          e.type === "grant.confirmed" &&
          e.data["grant_id"] === id &&
          e.data["version"] === grant!.version &&
          e.data["grant_content_hash"] === proposal,
      ) ?? null;
    if (!grant_confirmation) {
      grant_invalid_reason = `grant ${id} v${grant.version} has no confirmation event bound to its content hash ${proposal.slice(0, 12)}`;
    } else if (grant_confirmation.data["workitem_version"] !== workitem.version) {
      grant_invalid_reason = `grant ${id} v${grant.version} was confirmed against WorkItem v${String(grant_confirmation.data["workitem_version"])}, but the WorkItem is now v${workitem.version}`;
    } else {
      grant_valid = true;
      grant_invalid_reason = null;
    }
  }

  // Runs.
  const runs: RunView[] = [];
  for (const e of events) {
    if (e.type !== "run.started") continue;
    const d = e.data;
    const runId = d["run_id"] as string;
    const pid = (d["pid"] as number | undefined) ?? null;
    const stateEvents = events.filter((x) => (x.type === "run.state" || x.type === "run.ended") && x.data["run_id"] === runId);
    const ended = stateEvents.find((x) => x.type === "run.ended") ?? null;
    const lastState = stateEvents.at(-1) ?? null;
    const alive = pid !== null && pidAlive(pid);
    let state: RunState;
    let reason: string | null = null;
    if (ended) {
      state = ended.data["state"] as RunState;
      reason = (ended.data["reason"] as string | undefined) ?? null;
    } else if (lastState) {
      state = lastState.data["state"] as RunState;
      reason = (lastState.data["reason"] as string | undefined) ?? null;
    } else if (alive) {
      state = "running";
    } else {
      state = "outcome-uncertain";
      reason = "process ended without recording an outcome";
    }
    const usage = (ended?.data["usage"] as RunView["usage"] | undefined) ?? {
      attempts_used: d["attempts_used"] as number,
      elapsed_seconds: "unknown",
      cost: "unknown",
    };
    runs.push({
      id: runId,
      task_ref: d["task_ref"] as string,
      generation: d["generation"] as number,
      executor_alias: d["executor_alias"] as string,
      state,
      reason,
      pid,
      process_alive: alive,
      session_ref: (d["session_ref"] as string | null | undefined) ?? null,
      context_pack_ref: (d["context_pack_ref"] as string | undefined) ?? null,
      usage,
      started_at: e.at,
      ended_at: ended?.at ?? null,
      origin: `event ${e.id}` + (ended ? `, ${ended.id}` : lastState ? `, ${lastState.id}` : ""),
    });
  }

  // Intents and outcomes.
  const intents: IntentView[] = [];
  for (const e of events) {
    if (e.type !== "intent.recorded") continue;
    const id = e.data["intent_id"] as string;
    // The last recorded outcome counts: `uncertain` may later become `reconciled` or `abandoned`.
    const out = events.findLast((x) => x.type === "intent.outcome" && x.data["intent_id"] === id) ?? null;
    intents.push({
      id,
      run_ref: e.data["run_id"] as string,
      operation: e.data["operation"] as Record<string, unknown>,
      authorization_ref: e.data["authorization_ref"] as { id: string; version: number },
      expected_effect: e.data["expected_effect"] as { artifacts: string[] },
      recorded_at: e.at,
      outcome: out
        ? { outcome: out.data["outcome"] as string, detail: (out.data["detail"] as Record<string, unknown>) ?? {}, at: out.at, origin: `event ${out.id}` }
        : null,
      origin: `event ${e.id}`,
    });
  }

  const evidence = events
    .filter((e) => e.type === "evidence.captured")
    .map((e) => ({ ...(e.data["evidence"] as Evidence), origin: `event ${e.id}` }))
    .filter((ev) => runs.some((r) => r.id === ev.run_ref) || ev.run_ref === "human");

  const decisions = store
    .recordedDocs("decision", events)
    .map((id) => store.readDoc<DecisionRequest>("decision", id, undefined, events))
    .filter((d) => d.workitem_ref.id === workitemId);
  const open_decisions = decisions.filter((d) => d.state === "open");

  const checkpoints = store
    .recordedDocs("checkpoint", events)
    .map((id) => store.readDoc<Checkpoint>("checkpoint", id, undefined, events))
    .filter((c) => c.workitem_ref.id === workitemId);

  const acceptedEvent = events.filter((e) => e.type === "acceptance.recorded" && e.data["workitem_id"] === workitemId).at(-1) ?? null;
  const accepted = acceptedEvent ? { event: acceptedEvent.id, acceptance_version: acceptedEvent.data["acceptance_version"] as number } : null;

  const context_entries = events
    .filter((e) => e.type === "context.added" && e.data["workitem_id"] === workitemId)
    .map((e) => ({ ...(e.data["entry"] as { kind: string; content: string; source: string; freshness: string; limits: string }), origin: `event ${e.id}` }));

  // Status, derived in priority order.
  const lastRun = runs.at(-1) ?? null;
  let status: DerivedStatus;
  let origin: string;
  if (accepted && accepted.acceptance_version === acceptance.version) {
    status = "accepted";
    origin = `event ${accepted.event}`;
  } else if (runs.some((r) => r.state === "outcome-uncertain")) {
    status = "outcome-uncertain";
    origin = runs.filter((r) => r.state === "outcome-uncertain").map((r) => r.origin).join("; ");
  } else if (open_decisions.length > 0) {
    status = "waiting-decision";
    origin = open_decisions.map((d) => `decision ${d.id} v${d.version}`).join("; ");
  } else if (runs.some((r) => r.state === "running" || r.state === "stopping")) {
    status = "running";
    origin = runs.filter((r) => r.state === "running" || r.state === "stopping").map((r) => r.origin).join("; ");
  } else if (lastRun?.state === "abandoned") {
    status = "abandoned";
    origin = lastRun.origin;
  } else if (lastRun?.state === "completed") {
    status = "executed";
    origin = lastRun.origin;
  } else if (lastRun?.state === "failed") {
    status = "failed";
    origin = lastRun.origin;
  } else if (grant_valid) {
    status = "granted";
    origin = `event ${grant_confirmation!.id}`;
  } else {
    status = "created";
    origin = `workitem ${workitem.id} v${workitem.version}`;
  }

  return {
    workitem,
    acceptance,
    task,
    grant,
    grant_confirmation,
    grant_valid,
    grant_invalid_reason,
    runs,
    intents,
    evidence,
    decisions,
    open_decisions,
    checkpoints,
    accepted,
    context_entries,
    status: { value: status, origin, freshness: `computed ${new Date().toISOString()} from ${events.length} events` },
    test_hooks_active: activeFaults(),
    events,
  };
}

export function latestGeneration(view: View, taskId: string): number {
  return view.runs.filter((r) => r.task_ref === taskId).reduce((m, r) => Math.max(m, r.generation), 0);
}

export function contextPackOf(store: Store, view: View, runId: string): (ContextPack & { version: number }) | null {
  const run = view.runs.find((r) => r.id === runId);
  if (!run?.context_pack_ref) return null;
  return store.readDoc<ContextPack>("contextpack", run.context_pack_ref, undefined, view.events);
}
