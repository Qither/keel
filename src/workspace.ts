// The workspace's revision store is git, used only through its command line.
// Source: OWNER 2026-10-08 (design 6.4); harness §3.2 (repository source at the
// identified revision is the authority for code content).
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { sha256 } from "./hash.js";
import { normalizePath } from "./glob.js";

function git(cwd: string, args: string[]): { ok: boolean; out: string } {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  return { ok: r.status === 0, out: (r.stdout ?? "").trim() };
}

/** The current source revision of a workspace, or a stated reason it is unknown. */
export function headRevision(workspace: string): string {
  const r = git(workspace, ["rev-parse", "HEAD"]);
  if (r.ok) return r.out;
  const inside = git(workspace, ["rev-parse", "--is-inside-work-tree"]);
  return inside.ok ? "unborn" : "no-revision-store";
}

/** Paths changed relative to the revision store (modified, added, untracked). */
export function changedPaths(workspace: string): string[] {
  const r = git(workspace, ["status", "--porcelain", "--untracked-files=all"]);
  if (!r.ok) return [];
  return r.out
    .split(/\r?\n/)
    .filter((l) => l.length > 3)
    .map((l) => normalizePath(l.slice(3).trim().replace(/^"|"$/g, "")));
}

export function artifactHash(workspace: string, relPath: string): string | null {
  const abs = join(workspace, relPath);
  if (!existsSync(abs)) return null;
  return sha256(readFileSync(abs));
}
