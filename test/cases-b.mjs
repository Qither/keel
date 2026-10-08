// The SB-01 cohort: P-04…P-06 and N-14…N-22, declared before any run. Every
// case runs on the stub agent CLI in test/fixtures; no real agent CLI, no
// network, no credential. Same twin mechanism as the Stage A cohort.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { confirmGrant as confirmGrantA, createWork, helloCriteria, nodeStep, PRODUCT_ROOT, WRITE_HELLO } from "./cases.mjs";

export const STUB = resolve(PRODUCT_ROOT, "test", "fixtures", "stub-agent.mjs");

export function agentStep(id, prompt, writes = []) {
  return { id, kind: "agent", argv: [], prompt, writes };
}

export const WRITE_HELLO_PROMPT = 'write file artifacts/hello.txt with content "hi"';
export const WRITE_SECOND_PROMPT = 'write file artifacts/second.txt with content "second"';

/** Registers a stub executor profile under `alias`; `withCost` names the stub's cost field. */
export function registerStub(ctx, alias, { withCost = false } = {}) {
  const args = [
    "executor", "register",
    "--alias", alias,
    "--kind", "agent-cli",
    "--program", "node",
    "--base-args", STUB,
    "--prompt-args=--prompt", "--prompt-args", "{prompt}",
    "--resume-args=--resume", "--resume-args", "{session}",
    "--model-args=--model", "--model-args", "{model}",
    "--version-args", STUB, "--version-args=--version",
    "--capability", withCost ? "edit-files,resume-session,json-output,report-usage" : "edit-files,resume-session,json-output",
    "--identity-ref", `${alias}:login`,
    "--channel", "cli-login",
    "--output-format", "json-lines",
    "--session-field", "session_id",
    "--result-field", "result",
  ];
  if (withCost) args.push("--cost-field", "cost_usd", "--cost-unit", "USD");
  const r = ctx.keel(args);
  assert.equal(r.code, 0, `executor register ${alias}: ${r.stdout}${r.stderr}`);
  return r.json;
}

export function probeStub(ctx, alias, env = {}) {
  const r = ctx.keel(["executor", "probe", alias, "--timeout-seconds", "30"], { env });
  assert.equal(r.code, 0, `executor probe ${alias}: ${r.stdout}${r.stderr}`);
  return r.json;
}

/** Like the Stage A helper but with executor aliases on the Grant. */
export function confirmGrant(ctx, { allow = ["write:artifacts/**"], executors = [], attempts = 3, elapsed = 60 } = {}) {
  const base = ["grant", ...allow.flatMap((a) => ["--allow", a]), ...executors.flatMap((e) => ["--executor", e]), "--attempts", String(attempts), "--elapsed-seconds", String(elapsed)];
  const shown = ctx.keel(base);
  assert.equal(shown.code, 4, `grant must wait for confirmation: ${shown.stdout}`);
  const hash = shown.json.detail.grant_content_hash;
  const confirmed = ctx.keel([...base, "--confirm", hash.slice(0, 8), "--approver", "owner"]);
  assert.equal(confirmed.code, 0, `grant confirm: ${confirmed.stdout}`);
  return { ...confirmed.json, hash };
}

const twoAgentSteps = () => [agentStep("s1", WRITE_HELLO_PROMPT, ["artifacts/hello.txt"]), agentStep("s2", WRITE_SECOND_PROMPT, ["artifacts/second.txt"])];
const twoCriteria = () => [
  helloCriteria()[0],
  { id: "c2", statement: "artifacts/second.txt exists", required: true, evidence_mode: "artifact-exists", path: "artifacts/second.txt" },
];

export const CASES_B = [
  {
    id: "P-04",
    title: "session substitution: a crashed agent run is resumed by the same executor through the recorded session",
    scenario: "W-02; HC-01 s2; HC-06 s1",
    fault: "session-not-recorded",
    run(ctx) {
      registerStub(ctx, "stub-a");
      probeStub(ctx, "stub-a");
      createWork(ctx, { criteria: twoCriteria(), steps: twoAgentSteps() });
      confirmGrant(ctx, { executors: ["stub-a"] });
      const crashed = ctx.keel(["run", "--executor", "stub-a", "--crash-after-effect", "s1"]);
      assert.notEqual(crashed.code, 0);
      assert.ok(existsSync(ctx.wsFile("artifacts/hello.txt")));
      const show1 = ctx.keel(["show"]);
      assert.equal(show1.json.status.value, "outcome-uncertain");
      assert.ok(show1.json.runs[0].session, "the executor's session identifier was recorded on the run");
      const firstSession = show1.json.runs[0].session.external_id;
      assert.equal(show1.json.runs[0].route.executor_alias, "stub-a");
      const rec = ctx.keel(["recover"]);
      assert.equal(rec.code, 0, rec.stdout);
      assert.equal(rec.json.crashed_runs[0].session.resumable, true);
      assert.equal(rec.json.new_run.generation, 2);
      assert.equal(rec.json.new_run.executor, "stub-a");
      assert.equal(rec.json.new_run.session.resumed, true, "generation 2 resumed the recorded session");
      assert.equal(rec.json.new_run.session.external_id, firstSession);
      assert.deepEqual(rec.json.new_run.steps_executed, ["s2"]);
      const verify = ctx.keel(["verify"]);
      assert.equal(verify.json.verdict, "accepted");
      assert.equal(verify.json.acceptance_version, 1);
      assert.equal(ctx.keel(["accept"]).code, 0);
    },
  },
  {
    id: "P-05",
    title: "executor substitution: a local-process run crashes after its effect; the remaining agent step runs on a stub executor with WorkItem, Grant and Acceptance unchanged",
    scenario: "W-02; HC-02 s1",
    fault: "route-not-recorded",
    run(ctx) {
      registerStub(ctx, "stub-b");
      probeStub(ctx, "stub-b");
      createWork(ctx, { criteria: twoCriteria(), steps: [nodeStep("s1", WRITE_HELLO, ["artifacts/hello.txt"]), agentStep("s2", WRITE_SECOND_PROMPT, ["artifacts/second.txt"])] });
      const g = confirmGrant(ctx, { allow: ["exec:node", "write:artifacts/**"], executors: ["local-process", "stub-b"] });
      const crashed = ctx.keel(["run", "--executor", "local-process", "--crash-after-effect", "s1"]);
      assert.notEqual(crashed.code, 0);
      const rec = ctx.keel(["recover", "--executor", "stub-b"]);
      assert.equal(rec.code, 0, rec.stdout);
      assert.deepEqual(rec.json.continuity, { workitem_version: true, grant_content_hash: true, acceptance_version: true });
      assert.equal(rec.json.new_run.executor, "stub-b");
      assert.deepEqual(rec.json.new_run.steps_executed, ["s2"]);
      const show = ctx.keel(["show"]);
      assert.equal(show.json.runs.length, 2);
      assert.equal(show.json.runs[0].executor, "local-process");
      assert.equal(show.json.runs[1].executor, "stub-b");
      assert.ok(show.json.runs[1].route, "the route of the substituted run is recorded");
      assert.equal(show.json.runs[1].route.executor_alias, "stub-b");
      assert.equal(show.json.runs[1].route.eligibility.identity_ok, true);
      assert.equal(show.json.runs[0].grant_content_hash, g.hash);
      assert.equal(show.json.runs[1].grant_content_hash, g.hash);
      assert.equal(show.json.runs[1].acceptance_version, 1);
      assert.equal(show.json.workitem.version, 1);
      assert.equal(show.json.grant.version, 1);
      assert.equal(ctx.keel(["verify"]).json.verdict, "accepted");
    },
  },
  {
    id: "P-06",
    title: "identity failure then explicit choice; cost stays unknown unless the executor reports it",
    scenario: "W-03; HC-02 s2; HC-03 s1",
    fault: "probe-not-recorded",
    run(ctx) {
      registerStub(ctx, "stub-a");
      registerStub(ctx, "stub-b");
      registerStub(ctx, "stub-c", { withCost: true });
      const pa = probeStub(ctx, "stub-a", { STUB_AGENT_AUTH: "fail" });
      assert.equal(pa.identity_ok, false);
      probeStub(ctx, "stub-b");
      probeStub(ctx, "stub-c");
      createWork(ctx, { criteria: [helloCriteria()[0]], steps: [agentStep("s1", WRITE_HELLO_PROMPT, ["artifacts/hello.txt"])] });
      confirmGrant(ctx, { executors: ["stub-a", "stub-b", "stub-c"], attempts: 3 });
      const blocked = ctx.keel(["run", "--executor", "stub-a"]);
      assert.equal(blocked.code, 4, blocked.stdout);
      assert.equal(blocked.json.source, "HC-02 s2");
      const decisions = ctx.keel(["decide"]);
      const keys = decisions.json.open[0].options.map((o) => o.key);
      assert.ok(keys.includes("choose-executor stub-b"), keys.join(","));
      assert.ok(keys.includes("probe-again"));
      assert.equal(ctx.keel(["show"]).json.runs.length, 0, "no run started on a failed identity");
      const decided = ctx.keel(["decide", decisions.json.open[0].id, "--option", "choose-executor stub-b", "--approver", "owner"]);
      assert.equal(decided.code, 0, decided.stdout);
      const b = ctx.keel(["run", "--executor", "stub-b"], { env: { STUB_AGENT_EXIT: "1" } });
      assert.equal(b.code, 1, "stub-b exits 1 on purpose so a further attempt is needed");
      const c = ctx.keel(["run", "--executor", "stub-c"], { env: { STUB_AGENT_COST: "0.0123" } });
      assert.equal(c.code, 0, c.stdout);
      assert.equal(c.json.usage.cost.amount, 0.0123);
      assert.equal(c.json.usage.cost.unit, "USD");
      const show = ctx.keel(["show"]);
      assert.equal(show.json.runs[0].executor, "stub-b");
      assert.equal(show.json.runs[0].usage.cost, "unknown");
      assert.equal(show.json.runs[1].usage.cost.amount, 0.0123);
      assert.match(show.json.runs[1].usage.cost.source, /executor's own claim/);
      assert.equal(ctx.keel(["verify"]).json.verdict, "accepted");
    },
  },
  {
    id: "N-14",
    title: "an executor outside the Grant's allowed executors is refused; the Grant is unchanged",
    scenario: "HC-02 s1; HC-03 s2",
    fault: "run-ignores-allowed-executors",
    run(ctx) {
      registerStub(ctx, "stub-a");
      probeStub(ctx, "stub-a");
      createWork(ctx, { criteria: [helloCriteria()[0]], steps: [agentStep("s1", WRITE_HELLO_PROMPT, ["artifacts/hello.txt"])] });
      confirmGrant(ctx, { executors: ["local-process"] });
      const r = ctx.keel(["run", "--executor", "stub-a"]);
      assert.equal(r.code, 3, r.stdout);
      assert.equal(r.json.source, "HC-03 s2");
      const show = ctx.keel(["show"]);
      assert.equal(show.json.grant.version, 1);
      assert.equal(show.json.runs.length, 0);
      assert.ok(!existsSync(ctx.wsFile("artifacts/hello.txt")));
    },
  },
  {
    id: "N-15",
    title: "a failed identity never leads to a silent substitution; a decision is raised",
    scenario: "HC-02 s2; W-03",
    fault: "run-ignores-identity",
    run(ctx) {
      registerStub(ctx, "stub-a");
      const probe = probeStub(ctx, "stub-a", { STUB_AGENT_AUTH: "fail" });
      assert.equal(probe.identity_ok, false);
      assert.match(probe.reason, /authentication/);
      createWork(ctx, { criteria: [helloCriteria()[0]], steps: [agentStep("s1", WRITE_HELLO_PROMPT, ["artifacts/hello.txt"])] });
      confirmGrant(ctx, { executors: ["stub-a"] });
      const r = ctx.keel(["run", "--executor", "stub-a"]);
      assert.equal(r.code, 4, r.stdout);
      const open = ctx.keel(["decide"]).json.open;
      assert.equal(open.length, 1);
      const keys = open[0].options.map((o) => o.key);
      assert.deepEqual(keys, ["probe-again", "stop-work"], "no other executor is offered because the Grant allows none");
      const show = ctx.keel(["show"]);
      assert.equal(show.json.runs.length, 0);
      assert.equal(show.json.executors.find((e) => e.alias === "stub-a").last_probe.identity_ok, false);
      assert.ok(!existsSync(ctx.wsFile("artifacts/hello.txt")));
    },
  },
  {
    id: "N-16",
    title: "no cost observation stays unknown while a reported figure is shown with its source; neither is zero",
    scenario: "HC-02 s2; harness §4.1",
    fault: "cost-defaults-zero",
    run(ctx) {
      registerStub(ctx, "stub-b");
      registerStub(ctx, "stub-c", { withCost: true });
      probeStub(ctx, "stub-b");
      probeStub(ctx, "stub-c");
      createWork(ctx, { criteria: [helloCriteria()[0]], steps: [agentStep("s1", WRITE_HELLO_PROMPT, ["artifacts/hello.txt"])] });
      confirmGrant(ctx, { executors: ["stub-b", "stub-c"], attempts: 3 });
      const b = ctx.keel(["run", "--executor", "stub-b"], { env: { STUB_AGENT_EXIT: "1" } });
      assert.equal(b.code, 1);
      const c = ctx.keel(["run", "--executor", "stub-c"], { env: { STUB_AGENT_COST: "0.5" } });
      assert.equal(c.code, 0, c.stdout);
      const show = ctx.keel(["show"]);
      assert.equal(show.json.runs[0].usage.cost, "unknown");
      assert.equal(show.json.runs[1].usage.cost.amount, 0.5);
      assert.doesNotMatch(show.stdout, /"cost":\s*0\b/);
      assert.ok(show.json.runs[0].route.eligibility.unknowns.some((u) => /cost/.test(u)));
      assert.equal(show.json.runs[1].route.eligibility.budget_enforceable, true);
    },
  },
  {
    id: "N-17",
    title: "a substitution under a Grant that changed since the crashed run is refused",
    scenario: "HC-02 s1; HC-05 s2",
    fault: "recover-ignores-grant-hash",
    run(ctx) {
      registerStub(ctx, "stub-a");
      registerStub(ctx, "stub-b");
      probeStub(ctx, "stub-a");
      probeStub(ctx, "stub-b");
      createWork(ctx, { criteria: twoCriteria(), steps: twoAgentSteps() });
      confirmGrant(ctx, { executors: ["stub-a", "stub-b"], attempts: 3 });
      ctx.keel(["run", "--executor", "stub-a", "--crash-after-effect", "s1"]);
      const g2 = confirmGrant(ctx, { executors: ["stub-a", "stub-b"], attempts: 5 });
      assert.equal(g2.version, 2);
      const rec = ctx.keel(["recover", "--executor", "stub-b"]);
      assert.equal(rec.code, 3, rec.stdout);
      assert.equal(rec.json.source, "HC-02 s1");
      assert.equal(rec.json.detail.continuity.grant_content_hash, false);
      const show = ctx.keel(["show"]);
      assert.equal(show.json.runs[0].state, "failed", "the crashed run was reconciled and ended");
      assert.equal(show.json.runs.length, 1, "no new generation was started under the changed Grant");
      const again = ctx.keel(["run", "--executor", "stub-b"]);
      assert.equal(again.code, 0, "a plain run under the current Grant continues the remaining step");
      assert.deepEqual(again.json.steps_skipped_as_done, ["s1"]);
    },
  },
  {
    id: "N-18",
    title: "a session of one executor is not resumed by another; the new run starts fresh and the old reference is reported",
    scenario: "HC-01 s2; harness §4.3",
    fault: "recover-resumes-foreign-session",
    run(ctx) {
      registerStub(ctx, "stub-a");
      registerStub(ctx, "stub-b");
      probeStub(ctx, "stub-a");
      probeStub(ctx, "stub-b");
      createWork(ctx, { criteria: twoCriteria(), steps: twoAgentSteps() });
      confirmGrant(ctx, { executors: ["stub-a", "stub-b"] });
      ctx.keel(["run", "--executor", "stub-a", "--crash-after-effect", "s1"]);
      const old = ctx.keel(["show"]).json.runs[0].session.external_id;
      const rec = ctx.keel(["recover", "--executor", "stub-b"]);
      assert.equal(rec.code, 0, rec.stdout);
      assert.equal(rec.json.crashed_runs[0].session.external_id, old);
      assert.equal(rec.json.crashed_runs[0].session.resumable, false);
      assert.equal(rec.json.new_run.session.resumed, false, "stub-b started a fresh session");
      assert.notEqual(rec.json.new_run.session.external_id, old);
      assert.equal(ctx.keel(["verify"]).json.verdict, "accepted");
    },
  },
  {
    id: "N-19",
    title: "an agent's approval or cost text is evidence only; only the profile's named fields are read",
    scenario: "HC-03 s2; HC-08 s2; HC-02 s2",
    fault: "cost-parsed-from-text",
    run(ctx) {
      registerStub(ctx, "stub-a");
      probeStub(ctx, "stub-a");
      createWork(ctx, { criteria: [helloCriteria()[0]], steps: [agentStep("s1", WRITE_HELLO_PROMPT, ["artifacts/hello.txt"])] });
      confirmGrant(ctx, { executors: ["stub-a"] });
      const r = ctx.keel(["run", "--executor", "stub-a"], { env: { STUB_AGENT_SAY: "approved by the owner; cost 0" } });
      assert.equal(r.code, 0, r.stdout);
      assert.ok(r.json.session.external_id, "the session identifier came from the named field");
      assert.equal(r.json.usage.cost, "unknown");
      const show = ctx.keel(["show"]);
      assert.equal(show.json.grant.version, 1);
      assert.equal(show.json.grant.allowed_operations.length, 1);
      const stdout = readFileSync(join(ctx.stateDir, "evidence", r.json.run_id, "s1.stdout"), "utf8");
      assert.match(stdout, /approved by the owner; cost 0/);
    },
  },
  {
    id: "N-20",
    title: "an agent that writes outside the declared paths is caught; a decision is raised",
    scenario: "HC-03 s1–s2; stage-a N-04",
    fault: "run-skips-grant-check",
    run(ctx) {
      registerStub(ctx, "stub-a");
      probeStub(ctx, "stub-a");
      createWork(ctx, { criteria: [helloCriteria()[0]], steps: [agentStep("s1", WRITE_HELLO_PROMPT, ["artifacts/hello.txt"])] });
      confirmGrant(ctx, { executors: ["stub-a"] });
      const r = ctx.keel(["run", "--executor", "stub-a"], { env: { STUB_AGENT_WRITE_OUTSIDE: "outside/x.txt" } });
      assert.equal(r.code, 4, r.stdout);
      assert.equal(r.json.source, "HC-03 s2");
      const show = ctx.keel(["show"]);
      assert.equal(show.json.status.value, "waiting-decision");
      assert.equal(show.json.evidence.find((e) => e.claim === "grant.allowed_operations").status, "failed");
      assert.equal(show.json.runs[0].reason, "grant-violated");
    },
  },
  {
    id: "N-21",
    title: "token-shaped output of a probe is redacted before retention and the redaction is recorded",
    scenario: "HC-02 s2; HC-05 s1",
    fault: "probe-skips-redaction",
    run(ctx) {
      registerStub(ctx, "stub-a");
      const probe = probeStub(ctx, "stub-a", { STUB_AGENT_LEAK: "1" });
      assert.ok(probe.redactions >= 1, "a redaction was counted");
      const text = readFileSync(join(ctx.stateDir, probe.stdout_ref), "utf8");
      assert.doesNotMatch(text, /sk-abcdef0123456789/);
      assert.match(text, /\[redacted\]/);
      assert.equal(probe.identity_ok, true);
    },
  },
  {
    id: "N-22",
    title: "with several allowed executors and no --executor, run refuses rather than picking a route",
    scenario: "HC-07 s2; harness §2",
    fault: "run-picks-route",
    run(ctx) {
      registerStub(ctx, "stub-a");
      registerStub(ctx, "stub-b");
      probeStub(ctx, "stub-a");
      probeStub(ctx, "stub-b");
      createWork(ctx, { criteria: [helloCriteria()[0]], steps: [agentStep("s1", WRITE_HELLO_PROMPT, ["artifacts/hello.txt"])] });
      confirmGrant(ctx, { executors: ["stub-a", "stub-b"] });
      const r = ctx.keel(["run"]);
      assert.equal(r.code, 2, r.stdout);
      assert.equal(ctx.keel(["show"]).json.runs.length, 0);
      assert.ok(!existsSync(ctx.wsFile("artifacts/hello.txt")));
    },
  },
];

export { confirmGrantA };
