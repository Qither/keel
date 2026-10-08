// Test hooks. Each Stage A test has a fault-injected twin that must fail; the
// twin enables one named fault through KEEL_TEST_HOOKS. A fault is never active
// unless the variable names it, and `show` reports active hooks so that a
// transcript taken with hooks on is recognizable as such.
// Source: SA-01 §2 (every test has a fault-injected twin that would fail);
// HC-05 s1 (captured status stays distinguishable from a favorable summary).
export const FAULTS = [
  "accept-ignores-status",
  "context-inference-widens-grant",
  "cost-defaults-zero",
  "evidence-ignores-generation",
  "evidence-not-captured",
  "grant-trusts-document",
  "logcheck-ignores-mismatch",
  "recover-repeats-operation",
  "recover-skips-reconcile",
  "recover-trusts-session",
  "rule-verb-exists",
  "run-requires-code-change",
  "run-skips-grant-check",
  "show-trusts-projection",
  "verify-ignores-revision",
  "verify-trusts-summary",
] as const;

export type Fault = (typeof FAULTS)[number];

export function activeFaults(): Fault[] {
  const raw = process.env["KEEL_TEST_HOOKS"];
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is Fault => (FAULTS as readonly string[]).includes(s));
}

export function faultActive(name: Fault): boolean {
  return activeFaults().includes(name);
}
