// `executor register` writes an ExecutorProfile version (a declaration that
// proves nothing). `executor probe` runs the profile's version command and a
// no-op prompt in a throwaway directory and records a dated observation,
// redacting token-shaped strings before anything is retained.
// Source: HC-04 s1; harness §2; HC-02 s2; HC-05 s1; stage-b 4.1, 4.2.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { buildInvocation, parseOutput, runAgent } from "../agent.js";
import { UsageError } from "../errors.js";
import { faultActive } from "../faults.js";
import type { Capability, ExecutorProfile, Invocation, ProbeObservation } from "../model.js";
import { LOCAL_PROCESS_ALIAS } from "../model.js";
import { redact } from "../redact.js";
import { now, type Store } from "../store.js";
import { loadProfile } from "../route.js";

export interface RegisterOptions {
  alias: string | undefined;
  kind: string | undefined;
  program: string | undefined;
  capability: string[];
  identity_ref: string | undefined;
  channel: string | undefined;
  session_support: string | undefined;
  cost_field: string | undefined;
  cost_unit: string | undefined;
  base_args: string[];
  prompt_args: string[];
  model_args: string[];
  resume_args: string[];
  version_args: string[];
  output_format: string | undefined;
  session_field: string | undefined;
  result_field: string | undefined;
  prompt_via: string | undefined;
}

const CAPS: Capability[] = ["run-command", "edit-files", "resume-session", "report-usage", "json-output"];

export function executorRegister(store: Store, o: RegisterOptions): Record<string, unknown> {
  store.assertConsistent();
  if (!o.alias || !/^[a-z][a-z0-9-]{0,39}$/.test(o.alias)) throw new UsageError("--alias must be lowercase letters, digits and dashes");
  if (o.alias === LOCAL_PROCESS_ALIAS) throw new UsageError(`${LOCAL_PROCESS_ALIAS} is built in and cannot be registered`);
  if (o.kind !== "agent-cli") throw new UsageError("--kind must be agent-cli (local-process is built in)");
  if (!o.program) throw new UsageError("--program <command> is required");
  const capabilities = o.capability.flatMap((c) => c.split(",")).map((c) => c.trim()).filter(Boolean) as Capability[];
  for (const c of capabilities) if (!CAPS.includes(c)) throw new UsageError(`unknown capability ${c}; known: ${CAPS.join(", ")}`);
  const prompt_via = (o.prompt_via ?? "arg") as "arg" | "stdin";
  if (prompt_via !== "arg" && prompt_via !== "stdin") throw new UsageError("--prompt-via must be arg or stdin");
  if (prompt_via === "arg" && !o.prompt_args.some((a) => a.includes("{prompt}"))) throw new UsageError("--prompt-args must contain {prompt} (or use --prompt-via stdin)");
  if (o.model_args.length > 0 && !o.model_args.some((a) => a.includes("{model}"))) throw new UsageError("--model-args must contain {model}");
  if (o.resume_args.length > 0 && !o.resume_args.some((a) => a.includes("{session}"))) throw new UsageError("--resume-args must contain {session}");
  const session_support = (o.session_support ?? (o.resume_args.length > 0 ? "resume-by-id" : "none")) as ExecutorProfile["session_support"];
  if (session_support === "resume-by-id" && o.resume_args.length === 0) throw new UsageError("resume-by-id needs --resume-args");
  const output_format = (o.output_format ?? "json") as Invocation["output_format"];
  if (!["json", "json-lines", "text"].includes(output_format)) throw new UsageError("--output-format must be json, json-lines or text");
  const channel = (o.channel ?? "unknown") as ExecutorProfile["channel"];
  if (!["cli-login", "api-key-env", "unknown"].includes(channel)) throw new UsageError("--channel must be cli-login, api-key-env or unknown");
  const profile: ExecutorProfile = {
    alias: o.alias,
    kind: "agent-cli",
    program: o.program,
    invocation: {
      base_args: o.base_args,
      prompt_args: o.prompt_args,
      prompt_via,
      model_args: o.model_args,
      resume_args: o.resume_args,
      version_args: o.version_args.length > 0 ? o.version_args : ["--version"],
      output_format,
      session_field: o.session_field ?? null,
      cost_field: o.cost_field ?? null,
      result_field: o.result_field ?? null,
    },
    capabilities,
    identity_ref: o.identity_ref ?? `${o.alias}:login`,
    channel,
    cost_observation: o.cost_field ? { field: o.cost_field, unit: o.cost_unit ?? "unknown-unit" } : "unknown",
    session_support,
  };
  const ref = store.writeDoc("executor", o.alias, profile);
  store.append("executor.registered", { alias: o.alias, version: ref.version, doc_hash: ref.hash });
  return { alias: o.alias, version: ref.version, doc_hash: ref.hash, note: "a registration is a declaration; run `keel executor probe` for an observation" };
}

function runVersion(program: string, args: string[], cwd: string, timeoutMs: number): Promise<{ code: number | null; out: string; err: string; spawn_error: string | null }> {
  return new Promise((resolve) => {
    let out = "";
    let err = "";
    let spawn_error: string | null = null;
    const child = spawn(program, args, { cwd, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    child.stdout.on("data", (d: Buffer) => (out += d.toString("utf8")));
    child.stderr.on("data", (d: Buffer) => (err += d.toString("utf8")));
    const t = setTimeout(() => child.kill(), timeoutMs);
    child.on("error", (e) => (spawn_error = e.message));
    child.on("close", (code) => {
      clearTimeout(t);
      resolve({ code, out, err, spawn_error });
    });
  });
}

const AUTH_PATTERN = /not logged in|login|authenticat|unauthori[sz]ed|api key|credential|forbidden|401|403/i;

export async function executorProbe(store: Store, alias: string, timeoutSeconds: number): Promise<ProbeObservation> {
  store.assertConsistent();
  if (alias === LOCAL_PROCESS_ALIAS) throw new UsageError("local-process needs no probe");
  const profile = loadProfile(store, alias);
  if (!profile) throw new UsageError(`no ExecutorProfile named ${alias}`);
  const dir = mkdtempSync(join(tmpdir(), "keel-probe-"));
  const observation: ProbeObservation = {
    alias,
    observed_at: now(),
    version: null,
    exit_status: null,
    json_output: false,
    session_seen: false,
    cost_seen: false,
    identity_ok: "unknown",
    reason: "",
    redactions: 0,
    stdout_ref: null,
    stderr_ref: null,
  };
  try {
    const v = await runVersion(profile.program, profile.invocation.version_args, dir, Math.min(timeoutSeconds, 30) * 1000);
    if (v.spawn_error) {
      observation.reason = `program not runnable: ${v.spawn_error}`;
      observation.identity_ok = "unknown";
    } else {
      observation.version = v.out.trim().split(/\r?\n/)[0] ?? null;
      const inv = buildInvocation(profile, { prompt: "Reply with the single word OK and do not write any file." });
      const r = await runAgent(profile, inv, dir, timeoutSeconds * 1000);
      observation.exit_status = r.exit_status;
      const text = r.stdout + (r.stderr ? "\n--- stderr ---\n" + r.stderr : "");
      const red = faultActive("probe-skips-redaction") ? { text, redactions: 0 } : redact(text);
      observation.redactions = red.redactions;
      const blob = store.writeBlob(`probe-${alias}`, `${observation.observed_at.replace(/[:.]/g, "-")}.txt`, red.text);
      observation.stdout_ref = blob.ref;
      const parsed = parseOutput(profile.invocation, r.stdout);
      observation.json_output = parsed.json;
      observation.session_seen = parsed.session_id !== null;
      observation.cost_seen = parsed.cost !== null;
      if (r.timed_out) {
        observation.identity_ok = false;
        observation.reason = `no answer within ${timeoutSeconds}s`;
      } else if (r.exit_status === 0) {
        observation.identity_ok = true;
        observation.reason = "no-op prompt answered with exit 0";
      } else if (AUTH_PATTERN.test(r.stderr) || AUTH_PATTERN.test(r.stdout)) {
        observation.identity_ok = false;
        observation.reason = `exit ${r.exit_status} with an authentication message`;
      } else {
        observation.identity_ok = "unknown";
        observation.reason = `exit ${r.exit_status} without an authentication message`;
      }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  if (!faultActive("probe-not-recorded")) store.append("executor.probed", { alias, observation });
  return observation;
}

export function listExecutors(store: Store): Record<string, unknown>[] {
  const events = store.events();
  return [LOCAL_PROCESS_ALIAS, ...store.recordedDocs("executor", events)].map((alias) => {
    const p = loadProfile(store, alias, events)!;
    const probe = events.findLast((e) => e.type === "executor.probed" && e.data["alias"] === alias);
    return { alias, kind: p.kind, program: p.program, capabilities: p.capabilities, identity_ref: p.identity_ref, channel: p.channel, session_support: p.session_support, cost_observation: p.cost_observation, last_probe: probe ? probe.data["observation"] : null };
  });
}
