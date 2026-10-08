// Runs every cohort case as written, and once more with its fault-injected
// twin, which must fail. A twin that passes means the test cannot catch the
// regression it exists for.
import assert from "node:assert/strict";
import { test } from "node:test";
import { CASES, makeContext } from "./cases.mjs";

for (const c of CASES) {
  test(`[${c.id}] ${c.title} (${c.scenario})`, () => {
    const ctx = makeContext();
    try {
      c.run(ctx);
    } finally {
      ctx.dispose();
    }
  });

  test(`[${c.id}] twin with fault ${c.fault} must fail`, () => {
    const ctx = makeContext({ env: { KEEL_TEST_HOOKS: c.fault } });
    let failure = null;
    try {
      c.run(ctx);
    } catch (err) {
      failure = err;
    } finally {
      ctx.dispose();
    }
    assert.ok(failure, `the twin of ${c.id} passed with fault ${c.fault}; the test does not detect that fault`);
  });
}
