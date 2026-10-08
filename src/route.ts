// Route selection and eligibility. The owner names the executor; the product
// checks that the Grant allows it, that its capabilities cover the steps, and
// what its last probe observed. The product never picks a route on its own.
// Source: harness §4.1; harness §2; HC-02 s1–s2; HC-03 s2; HC-07 s2; stage-b 3.2, 4.4.
import { Refused, UsageError, Waiting } from "./errors.js";
import { faultActive } from "./faults.js";
import { LOCAL_PROCESS_ALIAS, type Capability, type ExecutorProfile, type Grant, type ProbeObservation, type Route, type Step } from "./model.js";
import { now, type LogEvent, type Store } from "./store.js";

export const LOCAL_PROCESS_PROFILE: ExecutorProfile = {
  alias: LOCAL_PROCESS_ALIAS,
  kind: "local-process",
  program: "(step argv)",
  invocation: { base_args: [], prompt_args: [], model_args: [], resume_args: [], version_args: [], output_format: "text", session_field: null, cost_field: null, result_field: null },
  capabilities: ["run-command"],
  identity_ref: "none",
  channel: "unknown",
  cost_observation: "unknown",
  session_support: "none",
};

export function allowedExecutors(grant: Grant): string[] {
  return grant.allowed_executors && grant.allowed_executors.length > 0 ? grant.allowed_executors : [LOCAL_PROCESS_ALIAS];
}

export function loadProfile(store: Store, alias: string, events?: LogEvent[]): ExecutorProfile | null {
  if (alias === LOCAL_PROCESS_ALIAS) return LOCAL_PROCESS_PROFILE;
  const evs = events ?? store.events();
  if (!store.recordedDocs("executor", evs).includes(alias)) return null;
  return store.readDoc<ExecutorProfile>("executor", alias, undefined, evs);
}

export function lastProbe(alias: string, events: LogEvent[]): ProbeObservation | null {
  const e = events.findLast((x) => x.type === "executor.probed" && x.data["alias"] === alias);
  return e ? (e.data["observation"] as ProbeObservation) : null;
}

export function requiredCapabilities(steps: Step[]): Capability[] {
  const caps = new Set<Capability>();
  for (const s of steps) {
    if (s.kind === "agent") caps.add("edit-files");
    else caps.add("run-command");
  }
  return [...caps];
}

/**
 * Resolves the executor for a run. `requested` is the owner's `--executor`;
 * when the Grant allows exactly one executor it is the default.
 */
export function resolveExecutorAlias(grant: Grant, requested: string | undefined): string {
  const allowed = allowedExecutors(grant);
  if (requested) return requested;
  if (allowed.length === 1 && allowed[0] !== "*") return allowed[0]!;
  if (faultActive("run-picks-route")) return allowed[0] === "*" ? LOCAL_PROCESS_ALIAS : allowed[0]!;
  throw new UsageError(`--executor <alias> is required: the Grant allows ${allowed.join(", ")} and the product never picks a route on its own`);
}

/** Computes the Route and refuses or waits as the design requires. */
export function computeRoute(store: Store, grant: Grant, alias: string, steps: Step[], modelAlias: string | undefined, events: LogEvent[]): { route: Route; profile: ExecutorProfile } {
  const allowed = allowedExecutors(grant);
  if (!allowed.includes("*") && !allowed.includes(alias) && !faultActive("run-ignores-allowed-executors")) {
    throw new Refused(`run refused: executor ${alias} is not in the Grant's allowed executors (${allowed.join(", ")}); a new Grant version is the only path`, "HC-03 s2", { alias, allowed });
  }
  const profile = loadProfile(store, alias, events);
  if (!profile) throw new Refused(`run refused: no ExecutorProfile named ${alias}; register it with \`keel executor register\``, "HC-04 s1", { alias });
  // Eligibility is judged for the next step; a later step of another kind stops the run before it is
  // performed (run.ts) so that another executor can take over. Source: HC-02 s1; stage-b 4.4, P-05.
  const required = requiredCapabilities(steps.slice(0, 1));
  const missing = required.filter((c) => !profile.capabilities.includes(c));
  if (missing.length > 0) {
    throw new Refused(`run refused: executor ${alias} lacks the capability ${missing.join(", ")} the next step needs`, "HC-02 s1", { alias, missing });
  }
  const unknowns: string[] = [];
  const later = requiredCapabilities(steps.slice(1)).filter((c) => !profile.capabilities.includes(c));
  if (later.length > 0) unknowns.push(`capability: a later step needs ${later.join(", ")}, which ${alias} lacks; the run will stop there for another executor`);
  let identity_ok: boolean | "unknown" = true;
  if (profile.kind === "agent-cli") {
    const probe = lastProbe(alias, events);
    if (!probe) {
      identity_ok = "unknown";
      unknowns.push(`identity: no probe recorded for ${alias}`);
    } else {
      identity_ok = probe.identity_ok;
      if (identity_ok !== true) unknowns.push(`identity: last probe at ${probe.observed_at} reported ${String(identity_ok)} (${probe.reason})`);
    }
    if (profile.cost_observation === "unknown") unknowns.push("cost: the executor reports no cost observation");
  } else {
    unknowns.push("cost: the local-process executor reports no cost observation");
  }
  const route: Route = {
    executor_alias: alias,
    model_alias: modelAlias ?? "executor-default",
    identity_ref: profile.identity_ref,
    channel: profile.channel,
    eligibility: { capability_ok: true, identity_ok, workspace_exposure_ok: true, budget_enforceable: true, unknowns },
    reason: `named by the owner (--executor ${alias}); allowed by Grant; capabilities ${required.join(", ")} present`,
    selected_at: now(),
  };
  return { route, profile };
}

/** Raises the identity decision request when a route's identity is not known to be good. */
export function identityDecision(route: Route, allowed: string[]): { blocked: string; facts: string[]; options: { key: string; description: string }[]; release_path: string } | null {
  if (route.eligibility.identity_ok === true || faultActive("run-ignores-identity")) return null;
  const others = allowed.filter((a) => a !== route.executor_alias && a !== "*");
  return {
    blocked: `starting a run on executor ${route.executor_alias}`,
    facts: [
      `executor ${route.executor_alias} (identity ${route.identity_ref}, channel ${route.channel}) has identity_ok = ${String(route.eligibility.identity_ok)}`,
      ...route.eligibility.unknowns,
      "the product does not substitute another identity or channel on its own",
    ],
    options: [
      { key: "probe-again", description: `run \`keel executor probe ${route.executor_alias}\` after fixing the login, then run again` },
      ...others.map((a) => ({ key: `choose-executor ${a}`, description: `run with --executor ${a} (allowed by the Grant)` })),
      { key: "stop-work", description: "leave the WorkItem as it is" },
    ],
    release_path: "keel decide <id> --option probe-again|choose-executor <alias>|stop-work",
  };
}

export { Waiting };
