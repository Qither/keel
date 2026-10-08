// The SA-01 cohort: P-01…P-03 and N-01…N-13, declared before any run. Each case
// is a function over a context; the test runner executes every case once as
// written and once with its fault-injected twin, which must fail. The demo
// script executes the same cases and records a transcript.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const PRODUCT_ROOT = resolve(here, "..");
export const CLI = join(PRODUCT_ROOT, "dist", "cli.js");

const sha256 = (s) => createHash("sha256").update(s).digest("hex");

/** A fresh context: temp dir, git workspace with one commit, empty state dir. */
export function makeContext({ env = {}, record = null } = {}) {
  const tmp = mkdtempSync(join(tmpdir(), "keel-stage-a-"));
  const ws = join(tmp, "ws");
  mkdirSync(ws);
  git(ws, ["init", "-q"]);
  writeFileSync(join(ws, "README.md"), "workspace\n");
  git(ws, ["add", "-A"]);
  git(ws, ["commit", "-q", "-m", "init"]);
  const stateDir = join(tmp, ".keel");
  const ctx = {
    tmp,
    ws,
    stateDir,
    env,
    /** Runs the product and parses its JSON output. */
    keel(args, opts = {}) {
      const argv = [CLI, ...args, "--state-dir", stateDir, "--json"];
      const r = spawnSync(process.execPath, argv, { cwd: tmp, encoding: "utf8", env: { ...process.env, ...env, ...(opts.env ?? {}) } });
      let json = null;
      try {
        json = JSON.parse(r.stdout);
      } catch {
        /* non-JSON output (for example after SIGKILL) */
      }
      const out = { args, code: r.status, signal: r.signal, stdout: r.stdout, stderr: r.stderr, json };
      if (record) record(out);
      return out;
    },
    spec(body) {
      const path = join(tmp, "work.json");
      writeFileSync(path, JSON.stringify({ workspace: ws, ...body }, null, 2));
      return path;
    },
    wsFile(rel) {
      return join(ws, rel);
    },
    readWs(rel) {
      return readFileSync(join(ws, rel), "utf8");
    },
    gitWs(args) {
      return git(ws, args);
    },
    dispose() {
      rmSync(tmp, { recursive: true, force: true });
    },
  };
  return ctx;
}

function git(cwd, args) {
  const r = spawnSync("git", ["-c", "user.name=keel-test", "-c", "user.email=keel-test@example.invalid", ...args], { cwd, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${r.stderr}`);
  return r.stdout.trim();
}

/** A Step that runs a Node one-liner in the workspace. */
export function nodeStep(id, code, writes = []) {
  return { id, kind: "exec", argv: ["node", "-e", code], writes };
}

export const WRITE_HELLO = "require('fs').mkdirSync('artifacts',{recursive:true});require('fs').writeFileSync('artifacts/hello.txt','hi')";
export const HELLO_SHA256 = sha256("hi");

export function helloCriteria() {
  return [
    { id: "c1", statement: "artifacts/hello.txt exists", required: true, evidence_mode: "artifact-exists", path: "artifacts/hello.txt" },
    { id: "c2", statement: "artifacts/hello.txt has the expected content", required: true, evidence_mode: "artifact-hash", path: "artifacts/hello.txt", sha256: HELLO_SHA256 },
  ];
}

export function createWork(ctx, { goal = "write hello", scope = "artifacts/", criteria = helloCriteria(), steps = [nodeStep("s1", WRITE_HELLO, ["artifacts/hello.txt"])] } = {}) {
  const r = ctx.keel(["work", "create", "--spec", ctx.spec({ goal, scope, acceptance: { criteria }, task: { steps } })]);
  assert.equal(r.code, 0, `work create: ${r.stdout}${r.stderr}`);
  return r.json;
}

export function confirmGrant(ctx, { allow = ["exec:node", "write:artifacts/**"], attempts = 3, elapsed = 60 } = {}) {
  const base = ["grant", ...allow.flatMap((a) => ["--allow", a]), "--attempts", String(attempts), "--elapsed-seconds", String(elapsed)];
  const shown = ctx.keel(base);
  assert.equal(shown.code, 4, `grant must wait for confirmation: ${shown.stdout}`);
  const hash = shown.json.detail.grant_content_hash;
  const confirmed = ctx.keel([...base, "--confirm", hash.slice(0, 8), "--approver", "owner"]);
  assert.equal(confirmed.code, 0, `grant confirm: ${confirmed.stdout}`);
  return confirmed.json;
}

function workitemId(ctx) {
  return ctx.keel(["show"]).json.workitem.id;
}

export const CASES = [
  {
    id: "P-01",
    title: "authorized task completes; acceptance bound to the artifact version",
    scenario: "W-01; HC-03 s1; HC-05 s1",
    fault: "evidence-not-captured",
    run(ctx) {
      createWork(ctx);
      confirmGrant(ctx);
      const run = ctx.keel(["run"]);
      assert.equal(run.code, 0, run.stdout);
      assert.equal(run.json.state, "completed");
      assert.equal(run.json.usage.cost, "unknown");
      const verify = ctx.keel(["verify"]);
      assert.equal(verify.code, 0, verify.stdout);
      assert.equal(verify.json.verdict, "accepted");
      assert.equal(verify.json.satisfied, 2);
      assert.equal(verify.json.total, 2);
      assert.equal(verify.json.criteria[1].status, "present");
      const accept = ctx.keel(["accept"]);
      assert.equal(accept.code, 0, accept.stdout);
      assert.equal(accept.json.acceptance_version, 1);
      assert.ok(accept.json.checkpoint_id);
      const show = ctx.keel(["show"]);
      assert.equal(show.json.status.value, "accepted");
      assert.equal(show.json.runs[0].generation, 1);
      const check = ctx.keel(["log", "check"]);
      assert.equal(check.code, 0);
      assert.equal(check.json.ok, true);
    },
  },
  {
    id: "P-02",
    title: "effect succeeds, product dies before recording; recovery reconciles and continues in generation 2",
    scenario: "W-04; HC-06 s1",
    fault: "recover-skips-reconcile",
    run(ctx) {
      createWork(ctx, { steps: [nodeStep("s1", WRITE_HELLO, ["artifacts/hello.txt"]), nodeStep("s2", "console.log('second step')")] });
      confirmGrant(ctx);
      const crashed = ctx.keel(["run", "--crash-after-effect", "s1"]);
      assert.notEqual(crashed.code, 0, "the product must have been killed");
      assert.ok(existsSync(ctx.wsFile("artifacts/hello.txt")), "the effect happened before the crash");
      const show1 = ctx.keel(["show"]);
      assert.equal(show1.json.status.value, "outcome-uncertain");
      assert.equal(show1.json.intents[0].outcome, "none recorded");
      const rec = ctx.keel(["recover"]);
      assert.equal(rec.code, 0, rec.stdout);
      assert.equal(rec.json.reconciliations.length, 1);
      assert.equal(rec.json.reconciliations[0].outcome, "reconciled");
      assert.equal(rec.json.reconciliations[0].artifacts[0].sha256, HELLO_SHA256);
      assert.equal(rec.json.new_run.generation, 2);
      assert.deepEqual(rec.json.new_run.steps_skipped_as_done, ["s1"]);
      assert.deepEqual(rec.json.new_run.steps_executed, ["s2"]);
      const verify = ctx.keel(["verify"]);
      assert.equal(verify.json.verdict, "accepted");
      const accept = ctx.keel(["accept"]);
      assert.equal(accept.code, 0, accept.stdout);
      const show2 = ctx.keel(["show"]);
      assert.equal(show2.json.status.value, "accepted");
      assert.equal(show2.json.runs.length, 2);
      assert.equal(show2.json.runs[0].state, "failed");
      assert.equal(show2.json.runs[0].superseded, true);
    },
  },
  {
    id: "P-03",
    title: "a research answer is accepted without a code change or a merge",
    scenario: "W-11 (narrowed); HC-01 s1; HC-05 s1",
    fault: "run-requires-code-change",
    run(ctx) {
      const before = ctx.gitWs(["rev-list", "--count", "HEAD"]);
      createWork(ctx, {
        goal: "answer: which revision store does Stage A use?",
        scope: "docs/",
        criteria: [{ id: "a1", statement: "docs/answer.md exists", required: true, evidence_mode: "artifact-exists", path: "docs/answer.md" }],
        steps: [nodeStep("write-answer", "require('fs').mkdirSync('docs',{recursive:true});require('fs').writeFileSync('docs/answer.md','git, through its command line (design 6.4)\\n')", ["docs/answer.md"])],
      });
      confirmGrant(ctx, { allow: ["exec:node", "write:docs/**"] });
      assert.equal(ctx.keel(["run"]).code, 0);
      const verify = ctx.keel(["verify"]);
      assert.equal(verify.json.verdict, "accepted");
      assert.equal(ctx.keel(["accept"]).code, 0);
      assert.equal(ctx.gitWs(["rev-list", "--count", "HEAD"]), before, "no commit or merge was made");
      assert.match(ctx.readWs("docs/answer.md"), /git/);
    },
  },
  {
    id: "N-01",
    title: "a lost session reference is reported; recovery proceeds from documents and the log",
    scenario: "HC-01 s2; W-02 (state half)",
    fault: "recover-trusts-session",
    run(ctx) {
      createWork(ctx);
      confirmGrant(ctx);
      ctx.keel(["run", "--crash-after-effect", "s1", "--session-ref", "executor-session:does-not-exist"]);
      const rec = ctx.keel(["recover"]);
      assert.equal(rec.code, 0, rec.stdout);
      assert.equal(rec.json.crashed_runs[0].session_ref, "executor-session:does-not-exist");
      assert.match(rec.json.crashed_runs[0].session_resolution, /^unresolved/);
      assert.equal(rec.json.new_run.generation, 2);
      assert.equal(ctx.keel(["verify"]).json.verdict, "accepted");
    },
  },
  {
    id: "N-02",
    title: "a hand-edited status projection has no effect; show recomputes from authority",
    scenario: "HC-04 s2",
    fault: "show-trusts-projection",
    run(ctx) {
      createWork(ctx);
      confirmGrant(ctx);
      assert.equal(ctx.keel(["run"]).code, 0);
      const first = ctx.keel(["show"]);
      assert.equal(first.json.status.value, "executed");
      const path = join(ctx.stateDir, "projections", `${first.json.workitem.id}.json`);
      const edited = JSON.parse(readFileSync(path, "utf8"));
      edited.status.value = "accepted";
      edited.accepted = { event: "forged", acceptance_version: 1 };
      writeFileSync(path, JSON.stringify(edited, null, 2));
      const second = ctx.keel(["show"]);
      assert.equal(second.json.status.value, "executed", "the edit must have no effect");
      assert.equal(second.json.accepted, null);
      assert.equal(ctx.keel(["log", "check"]).json.ok, true);
    },
  },
  {
    id: "N-03",
    title: "no cost observation stays unknown, never zero; budget is enforced by attempts and elapsed time",
    scenario: "HC-02 s2; W-03",
    fault: "cost-defaults-zero",
    run(ctx) {
      createWork(ctx);
      confirmGrant(ctx, { attempts: 1 });
      const run = ctx.keel(["run"]);
      assert.equal(run.code, 0);
      assert.equal(run.json.usage.cost, "unknown");
      const show = ctx.keel(["show"]);
      assert.equal(show.json.runs[0].usage.cost, "unknown");
      assert.equal(show.json.grant.budget.cost, "unknown");
      assert.doesNotMatch(show.stdout, /"cost":\s*0\b/);
      const again = ctx.keel(["run"]);
      assert.equal(again.code, 4, "attempts budget exhausted raises a decision");
      assert.match(again.json.error, /attempts budget exhausted/);
      const decisions = ctx.keel(["decide"]);
      assert.equal(decisions.json.open.length, 1);
      assert.match(decisions.json.open[0].facts.join(" "), /cost is unknown/);
    },
  },
  {
    id: "N-04",
    title: "an operation outside allowed_operations is not performed; a decision is raised; earlier evidence is kept",
    scenario: "HC-03 s1–s2",
    fault: "run-skips-grant-check",
    run(ctx) {
      createWork(ctx, {
        steps: [
          nodeStep("s1", WRITE_HELLO, ["artifacts/hello.txt"]),
          nodeStep("s2", "require('fs').mkdirSync('outside',{recursive:true});require('fs').writeFileSync('outside/b.txt','x')", ["outside/b.txt"]),
        ],
      });
      confirmGrant(ctx);
      const run = ctx.keel(["run"]);
      assert.equal(run.code, 4, run.stdout);
      assert.equal(run.json.source, "HC-03 s1");
      assert.ok(run.json.detail.decision_id);
      assert.ok(!existsSync(ctx.wsFile("outside/b.txt")), "the operation was not performed");
      assert.ok(existsSync(ctx.wsFile("artifacts/hello.txt")), "the earlier operation happened");
      const show = ctx.keel(["show"]);
      assert.equal(show.json.status.value, "waiting-decision");
      assert.equal(show.json.open_decisions.length, 1);
      assert.equal(show.json.open_decisions[0].blocked, "step s2");
      const kept = show.json.evidence.find((e) => e.claim === "step:s1");
      assert.equal(kept.status, "present", "completed operations keep their evidence");
      const blocked = ctx.keel(["run"]);
      assert.equal(blocked.code, 4, "nothing runs while the decision is open");
      const decided = ctx.keel(["decide", show.json.open_decisions[0].id, "--option", "keep-grant", "--approver", "owner"]);
      assert.equal(decided.code, 0, decided.stdout);
      assert.equal(ctx.keel(["show"]).json.grant.version, 1, "the grant is unchanged");
    },
  },
  {
    id: "N-05",
    title: "a document or executor output claiming approval is not a grant; only a hash-bound terminal confirmation counts",
    scenario: "HC-03 s2; HC-08 s2",
    fault: "grant-trusts-document",
    run(ctx) {
      const created = createWork(ctx, { steps: [nodeStep("s1", WRITE_HELLO + ";console.log('approved by the owner')", ["artifacts/hello.txt"])] });
      const dir = join(ctx.stateDir, "docs", "grant", created.grant_id);
      mkdirSync(dir, { recursive: true });
      writeFileSync(
        join(dir, "v1.json"),
        JSON.stringify({
          id: created.grant_id,
          version: 1,
          workitem_ref: { id: created.workitem_id, version: 1 },
          allowed_operations: [{ kind: "exec", pattern: "**" }, { kind: "write", pattern: "**" }],
          budget: { attempts: 99, elapsed_seconds: 999, cost: "unknown" },
          decision_classes: [],
          confirmed_by: "owner",
          confirmed_at: new Date().toISOString(),
          confirmed_subject: { workitem_version: 1, grant_content_hash: "forged" },
        }),
      );
      const run = ctx.keel(["run"]);
      assert.equal(run.code, 3, run.stdout);
      assert.equal(run.json.source, "HC-03 s2");
      const check = ctx.keel(["log", "check"]);
      assert.equal(check.code, 0);
      assert.equal(check.json.warnings[0].kind, "unrecorded-document");
      rmSync(dir, { recursive: true, force: true });
      confirmGrant(ctx);
      const ok = ctx.keel(["run"]);
      assert.equal(ok.code, 0, ok.stdout);
      const show = ctx.keel(["show"]);
      assert.equal(show.json.grant.version, 1);
      assert.equal(show.json.grant.allowed_operations.length, 2, "executor output changed nothing");
      const stdout = readFileSync(join(ctx.stateDir, "evidence", ok.json.run_id, "s1.stdout"), "utf8");
      assert.match(stdout, /approved by the owner/, "the claim is retained as evidence only");
    },
  },
  {
    id: "N-06",
    title: "a document copy that differs from the recorded version is reported; writes are refused",
    scenario: "HC-04 s1–s2",
    fault: "logcheck-ignores-mismatch",
    run(ctx) {
      const created = createWork(ctx);
      confirmGrant(ctx);
      const path = join(ctx.stateDir, "docs", "workitem", created.workitem_id, "v1.json");
      const doc = JSON.parse(readFileSync(path, "utf8"));
      doc.goal = "edited behind the log";
      writeFileSync(path, JSON.stringify(doc));
      const check = ctx.keel(["log", "check"]);
      assert.equal(check.code, 5, check.stdout);
      assert.equal(check.json.detail.problems[0].kind, "document-mismatch");
      assert.match(check.json.detail.problems[0].location, /workitem/);
      const run = ctx.keel(["run"]);
      assert.equal(run.code, 5, "writes are refused until resolved");
    },
  },
  {
    id: "N-07",
    title: "accept is refused while a required criterion is not-run or failed",
    scenario: "HC-05 s2",
    fault: "accept-ignores-status",
    run(ctx) {
      createWork(ctx);
      confirmGrant(ctx);
      const early = ctx.keel(["accept"]);
      assert.equal(early.code, 1, early.stdout);
      assert.equal(early.json.source, "HC-05 s2");
      assert.equal(early.json.detail.criteria[0].status, "not-run");
      createWorkFailing(ctx);
    },
  },
  {
    id: "N-08",
    title: "a summary that omits a failed evidence does not hide it; verify reads evidence",
    scenario: "HC-05 s2; W-07",
    fault: "verify-trusts-summary",
    run(ctx) {
      createWork(ctx, {
        criteria: [...helloCriteria(), { id: "c3", statement: "step s2 exits 0", required: true, evidence_mode: "command-exit-status", step: "s2" }],
        steps: [nodeStep("s1", WRITE_HELLO, ["artifacts/hello.txt"]), nodeStep("s2", "console.log('looks fine');process.exit(1)")],
      });
      confirmGrant(ctx);
      const run = ctx.keel(["run"]);
      assert.equal(run.code, 1, run.stdout);
      const summary = ctx.keel(["context", "add", "--kind", "summary", "--content", "run finished; all criteria satisfied", "--source", "middleware"]);
      assert.equal(summary.code, 0);
      const verify = ctx.keel(["verify"]);
      assert.equal(verify.code, 1);
      assert.equal(verify.json.verdict, "not accepted");
      const c3 = verify.json.criteria.find((c) => c.id === "c3");
      assert.equal(c3.status, "failed", "the failed check is reported, not the summary");
      const show = ctx.keel(["show"]);
      assert.equal(show.json.evidence.find((e) => e.claim === "step:s2").status, "failed");
      assert.equal(ctx.keel(["accept"]).code, 1);
    },
  },
  {
    id: "N-09",
    title: "recover refuses to retry while an intent has no reconciled outcome; abandonment is explicit",
    scenario: "HC-06 s1",
    fault: "recover-repeats-operation",
    run(ctx) {
      createWork(ctx, { steps: [nodeStep("s1", WRITE_HELLO, ["artifacts/declared-but-not-written.txt"])] });
      confirmGrant(ctx);
      ctx.keel(["run", "--crash-after-effect", "s1"]);
      const rec = ctx.keel(["recover"]);
      assert.equal(rec.code, 4, rec.stdout);
      assert.equal(rec.json.detail.reconciliations[0].outcome, "uncertain");
      const retry = ctx.keel(["recover", "--retry"]);
      assert.equal(retry.code, 3, retry.stdout);
      assert.equal(retry.json.source, "HC-06 s1");
      assert.equal(ctx.keel(["run"]).code, 3, "run is refused too");
      const abandon = ctx.keel(["recover", "--abandon"]);
      assert.equal(abandon.code, 0, abandon.stdout);
      assert.match(abandon.json.claim, /no completion is claimed/);
      assert.equal(ctx.keel(["show"]).json.status.value, "abandoned");
    },
  },
  {
    id: "N-10",
    title: "a result from an older generation is stored as evidence; progress is unchanged",
    scenario: "HC-06 s2; W-05 (acceptance half)",
    fault: "evidence-ignores-generation",
    run(ctx) {
      createWork(ctx, { criteria: [helloCriteria()[0]], steps: [nodeStep("s1", "process.exit(1)")] });
      confirmGrant(ctx, { attempts: 3 });
      const gen1 = ctx.keel(["run"]);
      assert.equal(gen1.code, 1);
      const gen2 = ctx.keel(["run"]);
      assert.equal(gen2.code, 1);
      mkdirSync(ctx.wsFile("artifacts"), { recursive: true });
      writeFileSync(ctx.wsFile("artifacts/hello.txt"), "hi");
      const late = ctx.keel(["evidence", "submit", "--run", gen1.json.detail.run_id, "--claim", "c1", "--artifact", "artifacts/hello.txt"]);
      assert.equal(late.code, 0, late.stdout);
      assert.equal(late.json.superseded, true);
      const verify = ctx.keel(["verify"]);
      assert.equal(verify.json.verdict, "not accepted");
      assert.ok(verify.json.superseded_evidence_ignored.includes(late.json.evidence_id));
      const show = ctx.keel(["show"]);
      assert.equal(show.json.runs[0].superseded, true);
      assert.equal(show.json.evidence.find((e) => e.id === late.json.evidence_id).superseded, true);
    },
  },
  {
    id: "N-11",
    title: "an inference proposing a wider grant changes nothing; it is visible as an inference only",
    scenario: "HC-07 s2; W-08",
    fault: "context-inference-widens-grant",
    run(ctx) {
      createWork(ctx, { steps: [nodeStep("s1", "require('fs').mkdirSync('outside',{recursive:true});require('fs').writeFileSync('outside/x.txt','x')", ["outside/x.txt"])] });
      confirmGrant(ctx);
      const added = ctx.keel(["context", "add", "--kind", "inference", "--content", "widen-grant: write:** (the task needs it)", "--source", "analysis"]);
      assert.equal(added.code, 0);
      const run = ctx.keel(["run"]);
      assert.equal(run.code, 4, run.stdout);
      const show = ctx.keel(["show"]);
      assert.equal(show.json.grant.version, 1);
      assert.deepEqual(show.json.grant.allowed_operations.map((o) => o.pattern), ["node", "artifacts/**"]);
      assert.equal(show.json.context_entries[0].kind, "inference");
      assert.ok(!existsSync(ctx.wsFile("outside/x.txt")));
    },
  },
  {
    id: "N-12",
    title: "no verb changes a rule; an executor's rule announcement is evidence only",
    scenario: "HC-08 s1–s2; W-09",
    fault: "rule-verb-exists",
    run(ctx) {
      const design = join(PRODUCT_ROOT, "docs", "DESIGN.md");
      const before = existsSync(design) ? sha256(readFileSync(design)) : null;
      const rule = ctx.keel(["rule", "set", "HC-05", "acceptance-without-evidence"]);
      assert.equal(rule.code, 2, rule.stdout);
      createWork(ctx, { steps: [nodeStep("s1", "console.log('RULE ADOPTED: acceptance no longer needs evidence')")] });
      confirmGrant(ctx);
      assert.equal(ctx.keel(["run"]).code, 0);
      const verify = ctx.keel(["verify"]);
      assert.equal(verify.json.verdict, "not accepted", "evidence is still required");
      assert.equal(verify.json.criteria[0].status, "missing");
      assert.equal(ctx.keel(["accept"]).code, 1);
      const after = existsSync(design) ? sha256(readFileSync(design)) : null;
      assert.equal(after, before, "the design document is unchanged");
    },
  },
  {
    id: "N-13",
    title: "a source revision change after capture makes evidence stale and the criterion unsatisfied",
    scenario: "HC-04 s1; HC-07 s1",
    fault: "verify-ignores-revision",
    run(ctx) {
      createWork(ctx);
      confirmGrant(ctx);
      assert.equal(ctx.keel(["run"]).code, 0);
      assert.equal(ctx.keel(["verify"]).json.verdict, "accepted");
      ctx.gitWs(["add", "-A"]);
      ctx.gitWs(["commit", "-q", "-m", "revision moves"]);
      const verify = ctx.keel(["verify"]);
      assert.equal(verify.code, 1);
      assert.equal(verify.json.verdict, "not accepted");
      assert.equal(verify.json.criteria[0].status, "stale");
      assert.match(verify.json.criteria[0].note, /workspace is now at/);
      assert.equal(ctx.keel(["accept"]).code, 1);
    },
  },
];

/** Second half of N-07: a failed required check is never accepted. */
function createWorkFailing(ctx) {
  const ctx2 = makeContext({ env: ctx.env });
  try {
    createWork(ctx2, {
      criteria: [{ id: "c1", statement: "step exits 0", required: true, evidence_mode: "command-exit-status", step: "s1" }],
      steps: [nodeStep("s1", "process.exit(1)")],
    });
    confirmGrant(ctx2);
    assert.equal(ctx2.keel(["run"]).code, 1);
    const accept = ctx2.keel(["accept"]);
    assert.equal(accept.code, 1, accept.stdout);
  } finally {
    ctx2.dispose();
  }
}
