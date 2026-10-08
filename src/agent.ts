// The agent-CLI executor: builds an invocation from an ExecutorProfile's
// argument templates, runs it in the workspace, and reads the session
// identifier and cost the CLI reports. It never passes a credential and never
// reads one; the CLI uses its own login.
// Source: HC-02 s1–s2; harness §4.1; stage-b 3.1, 3.5, 3.6, 4.4.
import { spawn } from "node:child_process";
import type { ExecutorProfile, Invocation } from "./model.js";

export interface AgentInvocation {
  program: string;
  argv: string[];
  /** The argv with the prompt replaced by a placeholder, for records and logs. */
  argv_for_record: string[];
  /** Text written to the CLI's standard input (when the profile says `prompt_via: stdin`). */
  stdin: string | null;
}

function fill(template: string[], key: string, value: string): string[] {
  return template.map((a) => a.split(`{${key}}`).join(value));
}

export function buildInvocation(profile: ExecutorProfile, opts: { prompt: string; model?: string | undefined; session?: string | undefined }): AgentInvocation {
  const inv = profile.invocation;
  const args: string[] = [...inv.base_args];
  const rec: string[] = [...inv.base_args];
  const viaStdin = inv.prompt_via === "stdin";
  if (viaStdin) {
    args.push(...inv.prompt_args);
    rec.push(...inv.prompt_args, `<prompt ${opts.prompt.length} chars on stdin>`);
  } else {
    args.push(...fill(inv.prompt_args, "prompt", opts.prompt));
    rec.push(...fill(inv.prompt_args, "prompt", `<prompt ${opts.prompt.length} chars>`));
  }
  if (opts.model && inv.model_args.length > 0) {
    args.push(...fill(inv.model_args, "model", opts.model));
    rec.push(...fill(inv.model_args, "model", opts.model));
  }
  if (opts.session && inv.resume_args.length > 0) {
    args.push(...fill(inv.resume_args, "session", opts.session));
    rec.push(...fill(inv.resume_args, "session", opts.session));
  }
  return { program: profile.program, argv: args, argv_for_record: rec, stdin: viaStdin ? opts.prompt : null };
}

export interface AgentResult {
  exit_status: number | null;
  signal: string | null;
  stdout: string;
  stderr: string;
  timed_out: boolean;
  elapsed_ms: number;
  pid: number | null;
  spawn_error: string | null;
  parsed: ParsedOutput;
}

export interface ParsedOutput {
  json: boolean;
  session_id: string | null;
  cost: number | null;
  result: string | null;
  resumed: boolean | null;
}

/** Reads the last JSON value on stdout (or every line for json-lines) and picks the profile's named fields. */
export function parseOutput(inv: Invocation, stdout: string): ParsedOutput {
  const out: ParsedOutput = { json: false, session_id: null, cost: null, result: null, resumed: null };
  if (inv.output_format === "text") {
    out.result = stdout.trim() || null;
    return out;
  }
  const candidates: unknown[] = [];
  if (inv.output_format === "json-lines") {
    for (const line of stdout.split(/\r?\n/)) {
      const t = line.trim();
      if (!t.startsWith("{")) continue;
      try {
        candidates.push(JSON.parse(t));
      } catch {
        /* not JSON */
      }
    }
  } else {
    const t = stdout.trim();
    const start = t.lastIndexOf("\n{");
    const slice = start >= 0 ? t.slice(start + 1) : t;
    try {
      candidates.push(JSON.parse(slice));
    } catch {
      try {
        candidates.push(JSON.parse(t));
      } catch {
        /* not JSON */
      }
    }
  }
  const pick = (field: string | null): unknown => {
    if (!field) return undefined;
    for (let i = candidates.length - 1; i >= 0; i--) {
      const c = candidates[i];
      if (c && typeof c === "object" && field in (c as Record<string, unknown>)) return (c as Record<string, unknown>)[field];
    }
    return undefined;
  };
  out.json = candidates.length > 0;
  const s = pick(inv.session_field);
  if (typeof s === "string" && s.length > 0) out.session_id = s;
  const c = pick(inv.cost_field);
  if (typeof c === "number" && Number.isFinite(c)) out.cost = c;
  const r = pick(inv.result_field);
  if (typeof r === "string") out.result = r;
  const resumed = pick("resumed");
  if (typeof resumed === "boolean") out.resumed = resumed;
  return out;
}

export function runAgent(profile: ExecutorProfile, invocation: AgentInvocation, workspace: string, timeoutMs: number, onSpawn?: (pid: number) => void): Promise<AgentResult> {
  return new Promise((resolve) => {
    const started = Date.now();
    let stdout = "";
    let stderr = "";
    let timed_out = false;
    let spawn_error: string | null = null;
    const child = invocation.stdin === null
      ? spawn(invocation.program, invocation.argv, { cwd: workspace, stdio: ["ignore", "pipe", "pipe"], windowsHide: true })
      : spawn(invocation.program, invocation.argv, { cwd: workspace, stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
    child.stdout.on("data", (d: Buffer) => (stdout += d.toString("utf8")));
    child.stderr.on("data", (d: Buffer) => (stderr += d.toString("utf8")));
    if (child.pid && onSpawn) onSpawn(child.pid);
    if (invocation.stdin !== null && child.stdin) {
      child.stdin.on("error", () => {
        /* the CLI closed its input early; its exit status tells the story */
      });
      child.stdin.end(invocation.stdin);
    }
    const timer = setTimeout(() => {
      timed_out = true;
      child.kill();
    }, timeoutMs);
    child.on("error", (err) => {
      spawn_error = err.message;
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({
        exit_status: code,
        signal: signal ?? null,
        stdout,
        stderr,
        timed_out,
        elapsed_ms: Date.now() - started,
        pid: child.pid ?? null,
        spawn_error,
        parsed: parseOutput(profile.invocation, stdout),
      });
    });
  });
}
