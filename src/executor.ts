// The Stage A executor: a local process that runs a Step's argv in the
// workspace. It is the simplest real executor; it needs no credentials and
// makes the crash scenario deterministic. A real agent CLI is Stage B.
// Source: OWNER 2026-10-08 (design 6.5); W-04; HC-02 s2.
import { spawn } from "node:child_process";
import type { Step } from "./model.js";

export const EXECUTOR_ALIAS = "local-process";

export interface StepResult {
  exit_status: number | null;
  signal: string | null;
  stdout: string;
  stderr: string;
  timed_out: boolean;
  elapsed_ms: number;
  pid: number | null;
  spawn_error: string | null;
}

export function execStep(step: Step, workspace: string, timeoutMs: number, onSpawn?: (pid: number) => void): Promise<StepResult> {
  return new Promise((resolve) => {
    const started = Date.now();
    const [program, ...args] = step.argv;
    if (!program) {
      resolve({ exit_status: null, signal: null, stdout: "", stderr: "step has an empty argv", timed_out: false, elapsed_ms: 0, pid: null, spawn_error: "empty argv" });
      return;
    }
    const child = spawn(program, args, { cwd: workspace, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    let stdout = "";
    let stderr = "";
    let timed_out = false;
    let spawn_error: string | null = null;
    child.stdout.on("data", (d: Buffer) => (stdout += d.toString("utf8")));
    child.stderr.on("data", (d: Buffer) => (stderr += d.toString("utf8")));
    if (child.pid && onSpawn) onSpawn(child.pid);
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
      });
    });
  });
}
