// A stub agent command line for the Stage B cohort. It behaves like a
// non-interactive agent CLI: reads a prompt, writes the files the prompt
// declares, prints one JSON line with a session identifier, and takes its
// failure modes from environment variables set by the test. It makes no
// network call and knows no credential.
// Source: OWNER 2026-10-09 (stage-b 6.3); D-06 (tests must not depend on an installed CLI).
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";

const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};

if (args.includes("--version")) {
  process.stdout.write("stub-agent 1.0.0\n");
  process.exit(0);
}

if (process.env.STUB_AGENT_AUTH === "fail") {
  process.stderr.write("stub-agent: not logged in (authentication required)\n");
  process.exit(1);
}

const prompt = get("--prompt") ?? "";
const resume = get("--resume");
const model = get("--model") ?? "stub-default";
const out = { session_id: resume ?? `stub-${randomBytes(4).toString("hex")}`, resumed: Boolean(resume), model, result: "" };

const noop = /Reply with the single word OK/i.test(prompt);
const written = [];
if (!noop) {
  // Instruction form used by the cohort: write file <path> with content "<text>"
  const re = /write file ([^\s"]+) with content "([^"]*)"/g;
  let m;
  while ((m = re.exec(prompt)) !== null) {
    const rel = m[1];
    mkdirSync(dirname(join(process.cwd(), rel)), { recursive: true });
    writeFileSync(join(process.cwd(), rel), m[2] + "\n");
    written.push(rel);
  }
  if (process.env.STUB_AGENT_WRITE_OUTSIDE) {
    const rel = process.env.STUB_AGENT_WRITE_OUTSIDE;
    mkdirSync(dirname(join(process.cwd(), rel)), { recursive: true });
    writeFileSync(join(process.cwd(), rel), "outside\n");
    written.push(rel);
  }
}
out.result = noop ? "OK" : `wrote ${written.join(", ") || "nothing"}`;
if (process.env.STUB_AGENT_SAY) out.result += `; ${process.env.STUB_AGENT_SAY}`;
if (process.env.STUB_AGENT_LEAK) out.result += `; token sk-abcdef0123456789abcdef0123456789`;
if (process.env.STUB_AGENT_COST) out.cost_usd = Number(process.env.STUB_AGENT_COST);
process.stdout.write(JSON.stringify(out) + "\n");
process.exit(process.env.STUB_AGENT_EXIT ? Number(process.env.STUB_AGENT_EXIT) : 0);
