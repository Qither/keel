// Executes the SA-01 cohort (P-01…P-03, N-01…N-13) against the built product
// and writes a transcript: every command, its working directory, exit status,
// stdout and stderr, plus the environment and the product commit. The
// transcript and its sha256 are the evidence SA-01 asks for.
// Usage: npm run demo   (writes demo/out/transcript.json and transcript.sha256)
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { platform, release, arch } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CASES as CASES_A, makeContext, PRODUCT_ROOT } from "../test/cases.mjs";
import { CASES_B } from "../test/cases-b.mjs";

// Stage A (adopted) and Stage B (candidate under SB-01) cohorts, each counted in its own record.
const CASES = [...CASES_A, ...CASES_B];

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "out");
mkdirSync(outDir, { recursive: true });

function cmd(bin, args, cwd = PRODUCT_ROOT) {
  const r = spawnSync(bin, args, { cwd, encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : `unavailable (${r.stderr?.trim() || r.error?.message || "exit " + r.status})`;
}

const environment = {
  recorded_at: new Date().toISOString(),
  os: `${platform()} ${release()} ${arch()}`,
  node: process.version,
  git: cmd("git", ["--version"]),
  product_commit: cmd("git", ["rev-parse", "HEAD"]),
  product_tree_clean: cmd("git", ["status", "--porcelain"]) === "",
  product_root: PRODUCT_ROOT,
  test_hooks: process.env.KEEL_TEST_HOOKS ?? null,
};

const transcript = { environment, cases: [] };
let failures = 0;

for (const c of CASES) {
  const commands = [];
  const ctx = makeContext({
    record: (r) => {
      commands.push({
        command: ["keel", ...r.args].join(" "),
        cwd: ctx.tmp,
        exit_status: r.code,
        signal: r.signal,
        stdout: r.stdout,
        stderr: r.stderr,
      });
    },
  });
  let outcome = "pass";
  let error = null;
  try {
    c.run(ctx);
  } catch (err) {
    outcome = "fail";
    failures++;
    error = err.message;
  } finally {
    ctx.dispose();
  }
  transcript.cases.push({ id: c.id, title: c.title, scenario: c.scenario, outcome, error, commands });
  process.stdout.write(`${c.id} ${outcome}${error ? ": " + error.split("\n")[0] : ""}\n`);
}

transcript.summary = {
  cases_assigned: CASES.length,
  cases_passed: CASES.length - failures,
  cases_failed: failures,
  denominator_note: "every assigned case counts; nothing was excluded after the run",
};

const text = JSON.stringify(transcript, null, 2) + "\n";
const hash = createHash("sha256").update(text).digest("hex");
writeFileSync(join(outDir, "transcript.json"), text);
writeFileSync(join(outDir, "transcript.sha256"), `${hash}  transcript.json\n`);
process.stdout.write(`\n${transcript.summary.cases_passed}/${transcript.summary.cases_assigned} cases passed; transcript sha256 ${hash}\n`);
process.exitCode = failures === 0 ? 0 : 1;
