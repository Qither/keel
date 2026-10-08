// Creates a scratch workspace and a work spec under demo/out/sample/ so the
// product can be tried by hand without typing JSON on the command line.
// Usage: node demo/make-sample.mjs   then follow the printed commands.
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "out", "sample");
const ws = join(root, "ws");
// Clear the contents rather than the directory itself: on Windows a directory
// that is some shell's current directory cannot be removed.
mkdirSync(root, { recursive: true });
for (const entry of readdirSync(root)) rmSync(join(root, entry), { recursive: true, force: true });
mkdirSync(ws, { recursive: true });

const git = (args) => {
  const r = spawnSync("git", ["-c", "user.name=keel-sample", "-c", "user.email=sample@example.invalid", ...args], { cwd: ws, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
};
git(["init", "-q"]);
writeFileSync(join(ws, "README.md"), "sample workspace\n");
git(["add", "-A"]);
git(["commit", "-q", "-m", "init"]);

const spec = {
  goal: "write artifacts/hello.txt in the sample workspace",
  scope: "artifacts/",
  workspace: ws,
  acceptance: {
    criteria: [
      { id: "c1", statement: "artifacts/hello.txt exists", required: true, evidence_mode: "artifact-exists", path: "artifacts/hello.txt" },
      // The exit-status criterion names s2, not s1: after `run --crash-after-effect s1` the
      // product dies before s1's status is recorded, so a criterion on s1 could only be `inferred`.
      { id: "c2", statement: "step s2 exits 0", required: true, evidence_mode: "command-exit-status", step: "s2" },
    ],
  },
  task: {
    steps: [
      { id: "s1", kind: "exec", argv: ["node", "-e", "require('fs').mkdirSync('artifacts',{recursive:true});require('fs').writeFileSync('artifacts/hello.txt','hello from keel\\n')"], writes: ["artifacts/hello.txt"] },
      { id: "s2", kind: "exec", argv: ["node", "-e", "console.log('second step done')"], writes: [] },
    ],
  },
};
writeFileSync(join(root, "work.json"), JSON.stringify(spec, null, 2) + "\n");

// A second spec whose step steps outside the grant, to see a decision request.
const outside = { ...spec, goal: "try to write outside the granted paths", task: { steps: [spec.task.steps[0], { id: "s2", kind: "exec", argv: ["node", "-e", "require('fs').mkdirSync('outside',{recursive:true});require('fs').writeFileSync('outside/x.txt','x')"], writes: ["outside/x.txt"] }] } };
writeFileSync(join(root, "work-outside.json"), JSON.stringify(outside, null, 2) + "\n");

// Stage B sample: a task with one local step and one agent step, for the stub agent executor.
const stub = resolve(here, "..", "test", "fixtures", "stub-agent.mjs");
const agentSpec = {
  ...spec,
  goal: "one file by the local process, one by the stub agent",
  acceptance: {
    criteria: [
      spec.acceptance.criteria[0],
      { id: "c2", statement: "artifacts/note.txt exists", required: true, evidence_mode: "artifact-exists", path: "artifacts/note.txt" },
    ],
  },
  task: {
    steps: [
      spec.task.steps[0],
      { id: "s2", kind: "agent", argv: [], prompt: 'write file artifacts/note.txt with content "from the stub agent"', writes: ["artifacts/note.txt"] },
    ],
  },
};
writeFileSync(join(root, "work-agent.json"), JSON.stringify(agentSpec, null, 2) + "\n");
writeFileSync(
  join(root, "register-stub.txt"),
  [
    "node ../../../dist/cli.js executor register --alias stub --kind agent-cli --program node",
    `  --base-args "${stub}"`,
    "  --prompt-args=--prompt --prompt-args {prompt}",
    "  --resume-args=--resume --resume-args {session}",
    "  --model-args=--model --model-args {model}",
    `  --version-args "${stub}" --version-args=--version`,
    "  --capability edit-files,resume-session,json-output",
    "  --output-format json-lines --session-field session_id --result-field result",
    "  --identity-ref stub:login --channel cli-login",
  ].join("\n") + "\n",
);

process.stdout.write(`sample ready under ${root}

  cd "${root}"
  node ../../../dist/cli.js work create --spec work.json
  node ../../../dist/cli.js grant --allow exec:node --allow write:artifacts/** --attempts 3 --elapsed-seconds 60

Stage B (stub agent executor): see register-stub.txt for the register command, then
  node ../../../dist/cli.js executor probe stub
  node ../../../dist/cli.js work create --spec work-agent.json
  node ../../../dist/cli.js grant --allow exec:node --allow write:artifacts/** --executor local-process --executor stub --attempts 3 --elapsed-seconds 60
  node ../../../dist/cli.js run --executor local-process      # stops before s2: local-process cannot run an agent step
  node ../../../dist/cli.js run --executor stub               # continues with s2
`);
