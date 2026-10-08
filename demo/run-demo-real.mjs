// P-07: the only place real agent command lines run. Registers profiles for
// the CLIs installed on this machine, probes each once, and performs one
// local-process → claude substitution on a task that writes one small file.
// Bound: at most six real invocations, elapsed_seconds 120 each, the owner's
// own logins, nothing from the owner's filesystem beyond the temporary
// workspace and the rendered context. Never part of `npm test` or CI.
// Source: SB-01 §2 (real-CLI exception as confirmed); OWNER 2026-10-09 (stage-b 6.1, 6.4).
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { platform, release, arch } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { makeContext, nodeStep, PRODUCT_ROOT, WRITE_HELLO } from "../test/cases.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "out", "real");
mkdirSync(outDir, { recursive: true });

const MAX_REAL_INVOCATIONS = 6;
let realInvocations = 0;

function which(name) {
  const r = spawnSync(process.platform === "win32" ? "where" : "which", [name], { encoding: "utf8" });
  if (r.status !== 0) return null;
  return r.stdout.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

/** Resolves the npm-installed codex to its JavaScript entry so it can be spawned without a shell. */
function codexEntry(paths) {
  for (const p of paths) {
    const dir = dirname(p);
    const js = join(dir, "node_modules", "@openai", "codex", "bin", "codex.js");
    if (existsSync(js)) return js;
  }
  return null;
}

const found = {
  claude: which("claude"),
  codex: which("codex"),
  opencode: which("opencode"),
};

const profiles = [];
if (found.claude) {
  profiles.push({
    alias: "claude",
    args: [
      "--program", found.claude.find((p) => /\.exe$/i.test(p)) ?? "claude",
      "--base-args", "-p", "--base-args=--output-format", "--base-args", "json", "--base-args=--permission-mode", "--base-args", "acceptEdits",
      "--prompt-via", "stdin",
      "--model-args=--model", "--model-args", "{model}",
      "--resume-args=--resume", "--resume-args", "{session}",
      "--version-args=--version",
      "--capability", "edit-files,resume-session,json-output,report-usage",
      "--identity-ref", "claude:login", "--channel", "cli-login",
      "--output-format", "json", "--session-field", "session_id", "--cost-field", "total_cost_usd", "--cost-unit", "USD", "--result-field", "result",
    ],
  });
}
if (found.codex) {
  const js = codexEntry(found.codex);
  profiles.push({
    alias: "codex",
    args: [
      "--program", js ? process.execPath : found.codex[0],
      ...(js ? ["--base-args", js] : []),
      "--base-args", "exec", "--base-args=--json", "--base-args=--skip-git-repo-check",
      "--prompt-via", "stdin",
      "--model-args", "-m", "--model-args", "{model}",
      ...(js ? ["--version-args", js] : []), "--version-args=--version",
      "--capability", "edit-files,json-output",
      "--identity-ref", "codex:login", "--channel", "cli-login",
      "--output-format", "json-lines", "--session-field", "thread_id",
    ],
  });
}
if (found.opencode) {
  profiles.push({
    alias: "opencode",
    args: [
      "--program", found.opencode.find((p) => /\.exe$/i.test(p)) ?? "opencode",
      "--base-args", "run", "--base-args=--format", "--base-args", "json",
      "--prompt-args", "{prompt}",
      "--model-args=--model", "--model-args", "{model}",
      "--resume-args=--session", "--resume-args", "{session}",
      "--version-args=--version",
      "--capability", "edit-files,resume-session,json-output",
      "--identity-ref", "opencode:login", "--channel", "cli-login",
      "--output-format", "json-lines", "--session-field", "sessionID",
    ],
  });
}

const transcript = {
  environment: {
    recorded_at: new Date().toISOString(),
    os: `${platform()} ${release()} ${arch()}`,
    node: process.version,
    product_commit: (() => { const r = spawnSync("git", ["rev-parse", "HEAD"], { cwd: PRODUCT_ROOT, encoding: "utf8" }); return r.status === 0 ? r.stdout.trim() : "unavailable"; })(),
    found,
    bound: { max_real_invocations: MAX_REAL_INVOCATIONS, elapsed_seconds: 120 },
  },
  commands: [],
  probes: {},
  substitution: null,
  real_invocations: 0,
  note: "every figure reported by a CLI (cost, session) is the CLI's own claim; redaction counts are limits on the retained output",
};

const ctx = makeContext({
  record: (r) => transcript.commands.push({ command: ["keel", ...r.args].join(" "), exit_status: r.code, stdout: r.stdout, stderr: r.stderr }),
});

try {
  for (const p of profiles) {
    const reg = ctx.keel(["executor", "register", "--alias", p.alias, "--kind", "agent-cli", ...p.args]);
    if (reg.code !== 0) {
      transcript.probes[p.alias] = { registered: false, error: reg.stdout || reg.stderr };
      continue;
    }
    if (realInvocations + 1 > MAX_REAL_INVOCATIONS) {
      transcript.probes[p.alias] = { registered: true, probed: false, reason: "invocation bound reached" };
      continue;
    }
    realInvocations += 1; // the no-op prompt; the local version command invokes no model
    const probe = ctx.keel(["executor", "probe", p.alias, "--timeout-seconds", "120"]);
    transcript.probes[p.alias] = { registered: true, probed: probe.code === 0, observation: probe.json };
    process.stdout.write(`${p.alias}: ${probe.code === 0 ? `identity_ok=${probe.json.identity_ok} version=${probe.json.version} session_seen=${probe.json.session_seen} cost_seen=${probe.json.cost_seen} redactions=${probe.json.redactions}` : "probe failed: " + (probe.json?.error ?? probe.stderr)}\n`);
  }

  // P-05-shaped substitution: generation 1 on local-process crashes after its effect; claude continues.
  const claudeOk = transcript.probes.claude?.observation?.identity_ok === true;
  if (claudeOk && realInvocations + 2 <= MAX_REAL_INVOCATIONS) {
    const spec = {
      goal: "demo:real — one file by the local process, one by claude",
      scope: "artifacts/",
      acceptance: {
        criteria: [
          { id: "c1", statement: "artifacts/hello.txt exists", required: true, evidence_mode: "artifact-exists", path: "artifacts/hello.txt" },
          { id: "c2", statement: "artifacts/note.txt exists", required: true, evidence_mode: "artifact-exists", path: "artifacts/note.txt" },
        ],
      },
      task: {
        steps: [
          nodeStep("s1", WRITE_HELLO, ["artifacts/hello.txt"]),
          { id: "s2", kind: "agent", argv: [], prompt: "Create the file artifacts/note.txt containing exactly one line: keel stage b real substitution. Do nothing else.", writes: ["artifacts/note.txt"] },
        ],
      },
    };
    const create = ctx.keel(["work", "create", "--spec", ctx.spec(spec)]);
    const base = ["grant", "--allow", "exec:node", "--allow", "write:artifacts/**", "--executor", "local-process", "--executor", "claude", "--attempts", "2", "--elapsed-seconds", "120"];
    const shown = ctx.keel(base);
    const confirmed = ctx.keel([...base, "--confirm", shown.json.detail.grant_content_hash.slice(0, 8), "--approver", "owner"]);
    const crashed = ctx.keel(["run", "--executor", "local-process", "--crash-after-effect", "s1"]);
    realInvocations += 1;
    const rec = ctx.keel(["recover", "--executor", "claude"]);
    const verify = ctx.keel(["verify"]);
    const show = ctx.keel(["show"]);
    transcript.substitution = {
      created: create.code === 0,
      granted: confirmed.code === 0,
      crashed_exit: crashed.code,
      recover_exit: rec.code,
      recover: rec.json,
      verify_verdict: verify.json?.verdict ?? null,
      runs: show.json?.runs ?? null,
      note_txt: existsSync(ctx.wsFile("artifacts/note.txt")) ? readFileSync(ctx.wsFile("artifacts/note.txt"), "utf8") : null,
    };
    process.stdout.write(`substitution: recover exit ${rec.code}; verify ${verify.json?.verdict}; note.txt ${transcript.substitution.note_txt ? "present" : "absent"}\n`);
  } else {
    transcript.substitution = { skipped: true, reason: claudeOk ? "invocation bound reached" : "claude probe did not report identity_ok" };
    process.stdout.write(`substitution skipped: ${transcript.substitution.reason}\n`);
  }
} finally {
  ctx.dispose();
}

transcript.real_invocations = realInvocations;
const text = JSON.stringify(transcript, null, 2) + "\n";
const hash = createHash("sha256").update(text).digest("hex");
writeFileSync(join(outDir, "transcript-real.json"), text);
writeFileSync(join(outDir, "transcript-real.sha256"), `${hash}  transcript-real.json\n`);
process.stdout.write(`${realInvocations} real invocation(s) (bound ${MAX_REAL_INVOCATIONS}); transcript sha256 ${hash}\n`);
