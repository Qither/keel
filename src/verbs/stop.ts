// `stop`: requests cancellation of the running Run. Confirmed termination ends
// the Run as failed/stopped; unconfirmed termination within the stop window
// leaves the Run outcome-uncertain and visible until `recover` resolves it.
// Source: HC-06 s1; harness §4.3; design 4.4.
import { Refused } from "../errors.js";
import { pidAlive } from "../lock.js";
import { type Store } from "../store.js";
import { deriveView } from "../derive.js";

function sleep(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

export function stop(store: Store, workitemId: string, windowSeconds: number): Record<string, unknown> {
  store.assertConsistent();
  const view = deriveView(store, workitemId);
  const active = view.runs.find((r) => r.state === "running" || r.state === "stopping");
  if (!active) throw new Refused("stop refused: no run is in progress", "HC-06 s1");
  const spawned = view.events.filter((e) => e.type === "executor.spawned" && e.data["run_id"] === active.id).at(-1);
  const childPid = (spawned?.data["pid"] as number | undefined) ?? null;
  store.append("stop.requested", { run_id: active.id, product_pid: active.pid, executor_pid: childPid, window_seconds: windowSeconds });
  store.append("run.state", { run_id: active.id, state: "stopping", reason: "stop requested" });
  // Terminate the executor process; the product's own `run` process observes the exit and records it.
  // Only when no executor pid is known is the product process itself the target.
  const targets = (childPid !== null ? [childPid] : [active.pid]).filter((p): p is number => p !== null && p !== process.pid);
  for (const pid of targets) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      /* already gone */
    }
  }
  const deadline = Date.now() + windowSeconds * 1000;
  let confirmed = false;
  while (Date.now() < deadline) {
    const ended = store.events().some((e) => e.type === "run.ended" && e.data["run_id"] === active.id);
    if (ended) {
      confirmed = true;
      break;
    }
    if (targets.every((p) => !pidAlive(p))) {
      confirmed = true;
      // Give the product's own `run` process a moment to record the ending itself.
      const grace = Date.now() + 1500;
      while (Date.now() < grace && !store.events().some((e) => e.type === "run.ended" && e.data["run_id"] === active.id)) sleep(100);
      break;
    }
    sleep(100);
  }
  const alreadyEnded = store.events().some((e) => e.type === "run.ended" && e.data["run_id"] === active.id);
  if (confirmed && !alreadyEnded) {
    store.append("run.ended", { run_id: active.id, state: "failed", reason: "stopped", usage: active.usage });
  } else if (!confirmed) {
    store.append("run.state", { run_id: active.id, state: "outcome-uncertain", reason: `termination not confirmed within ${windowSeconds}s; pids ${targets.join(",")} may still be alive` });
  }
  return { run_id: active.id, termination_confirmed: confirmed, state: confirmed ? "failed (stopped)" : "outcome-uncertain", executor_pid: childPid, product_pid: active.pid };
}
