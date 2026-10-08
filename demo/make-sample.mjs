// Creates a scratch workspace and a work spec under demo/out/sample/ so the
// product can be tried by hand without typing JSON on the command line.
// Usage: node demo/make-sample.mjs   then follow the printed commands.
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "out", "sample");
const ws = join(root, "ws");
rmSync(root, { recursive: true, force: true });
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
      { id: "c2", statement: "step s1 exits 0", required: true, evidence_mode: "command-exit-status", step: "s1" },
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

process.stdout.write(`sample ready under ${root}

  cd "${root}"
  node ../../../dist/cli.js work create --spec work.json
  node ../../../dist/cli.js grant --allow exec:node --allow write:artifacts/** --attempts 3 --elapsed-seconds 60
`);
