// A single-writer lock for the state directory. Two product processes (for
// example `run` and `stop`) may append to the same event log; the lock keeps
// the hash chain linear.
// Source: HC-04 s2 (copies never silently become competing authorities).
import { closeSync, existsSync, openSync, readFileSync, rmSync, writeSync } from "node:fs";
import { join } from "node:path";

export function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return (err as NodeJS.ErrnoException).code === "EPERM";
  }
}

function sleep(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

export function withLock<T>(stateDir: string, fn: () => T): T {
  const path = join(stateDir, "lock");
  const deadline = Date.now() + 10_000;
  for (;;) {
    try {
      const fd = openSync(path, "wx");
      writeSync(fd, String(process.pid));
      closeSync(fd);
      break;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
      let holder = NaN;
      try {
        holder = Number(readFileSync(path, "utf8"));
      } catch {
        /* lock vanished between checks */
      }
      if (Number.isFinite(holder) && holder !== process.pid && !pidAlive(holder)) {
        try {
          rmSync(path);
        } catch {
          /* raced */
        }
        continue;
      }
      if (Date.now() > deadline) throw new Error(`state directory is locked by pid ${holder}`);
      sleep(25);
    }
  }
  try {
    return fn();
  } finally {
    if (existsSync(path)) rmSync(path, { force: true });
  }
}
