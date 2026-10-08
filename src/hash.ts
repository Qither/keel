// Content hashing. Hashes are computed over canonical JSON (sorted keys, no
// whitespace) so that file formatting and line endings never change a hash.
// Source: HC-04 s1 (derived views name their origin); design 6.3, 6.7.
import { createHash } from "node:crypto";

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const v = (value as Record<string, unknown>)[key];
      if (v !== undefined) out[key] = sortKeys(v);
    }
    return out;
  }
  return value;
}

export function sha256(data: string | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

export function hashObject(value: unknown): string {
  return sha256(canonicalJson(value));
}
