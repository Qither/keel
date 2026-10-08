// `grant`: shows the WorkItem version, the proposed Grant content and its hash,
// then records the owner's confirmation when the owner retypes the hash prefix.
// Only a human at the terminal confirms; never an executor result, a document
// that claims approval, or a context entry.
// Source: HC-03 s2; HC-08 s1–s2; KP-03 supports-goal; OWNER 2026-10-08 (design 6.6).
import { createInterface } from "node:readline/promises";
import { UsageError, Waiting } from "../errors.js";
import { grantProposalHash } from "../derive.js";
import type { AllowedOperation, Budget, Grant, WorkItem } from "../model.js";
import { now, type Store } from "../store.js";

export interface GrantOptions {
  allow: string[];
  attempts: number;
  elapsed_seconds: number;
  approver: string | undefined;
  confirm: string | undefined;
  interactive: boolean;
}

export const DECISION_CLASSES = [
  "any operation outside allowed_operations",
  "any budget limit reached (attempts, elapsed_seconds)",
  "any ambiguity the executor reports",
];

function parseAllow(items: string[]): AllowedOperation[] {
  if (items.length === 0) throw new UsageError("at least one --allow <exec|write>:<pattern> is required");
  return items.map((raw) => {
    const i = raw.indexOf(":");
    const kind = i < 0 ? raw : raw.slice(0, i);
    const pattern = i < 0 ? "**" : raw.slice(i + 1);
    if (kind !== "exec" && kind !== "write") throw new UsageError(`unknown operation kind in --allow ${raw}`);
    if (!pattern) throw new UsageError(`empty pattern in --allow ${raw}`);
    return { kind, pattern };
  });
}

export async function grant(store: Store, workitemId: string, opts: GrantOptions): Promise<Record<string, unknown>> {
  store.assertConsistent();
  const wi = store.readDoc<WorkItem>("workitem", workitemId);
  if (!Number.isInteger(opts.attempts) || opts.attempts < 1) throw new UsageError("--attempts must be a positive integer");
  if (!Number.isFinite(opts.elapsed_seconds) || opts.elapsed_seconds <= 0) throw new UsageError("--elapsed-seconds must be positive");
  const budget: Budget = { attempts: opts.attempts, elapsed_seconds: opts.elapsed_seconds, cost: "unknown" };
  const proposal = {
    workitem_ref: { id: wi.id, version: wi.version },
    allowed_operations: parseAllow(opts.allow),
    budget,
    decision_classes: DECISION_CLASSES,
  };
  const hash = grantProposalHash(proposal);
  const shown = {
    workitem: { id: wi.id, version: wi.version, goal: wi.goal, scope: wi.scope },
    grant: proposal,
    grant_content_hash: hash,
    confirm_by: `retype the first 8 characters of the hash: ${hash.slice(0, 8)}`,
  };

  let typed = opts.confirm;
  let approver = opts.approver;
  if (!typed && opts.interactive) {
    process.stdout.write(JSON.stringify(shown, null, 2) + "\n");
    // Lines are read through the iterator, not `question`, so that piped input
    // (several lines arriving at once, then end of input) cannot lose an answer
    // or leave the process hanging; end of input before an answer is an abort.
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY) });
    const lines = rl[Symbol.asyncIterator]();
    const ask = async (question: string): Promise<string | null> => {
      process.stdout.write(question);
      const next = await lines.next();
      if (!process.stdin.isTTY) process.stdout.write("\n");
      return next.done ? null : next.value.trim();
    };
    try {
      const answer = await ask("Confirm by retyping the first 8 hash characters (empty to abort): ");
      if (answer === null) throw new Waiting("grant aborted: input ended before a confirmation was typed; nothing recorded", "HC-03 s2", shown);
      typed = answer;
      if (typed && (typed.length < 8 || !hash.startsWith(typed))) {
        throw new UsageError(`typed prefix ${JSON.stringify(typed)} does not match the shown hash ${hash.slice(0, 8)}…; nothing recorded`);
      }
      if (typed && !approver) {
        const name = await ask("Approver name (declared, not authenticated): ");
        approver = name || undefined;
      }
    } finally {
      rl.close();
    }
  }
  if (!typed) {
    throw new Waiting("grant waits for the owner's confirmation: rerun with --confirm <first 8 hash characters> --approver <name>", "HC-03 s2", shown);
  }
  if (typed.length < 8 || !hash.startsWith(typed)) {
    throw new UsageError(`typed prefix ${JSON.stringify(typed)} does not match the shown hash ${hash.slice(0, 8)}…; nothing recorded`);
  }
  if (!approver) throw new UsageError("--approver <name> is required with --confirm (the approver is declared, not authenticated)");

  const grantId = wi.grant_ref?.id ?? `grant-${wi.id}`;
  const at = now();
  return store.transaction((ap) => {
    const doc: Grant = {
      id: grantId,
      ...proposal,
      confirmed_by: approver,
      confirmed_at: at,
      confirmed_subject: { workitem_version: wi.version, grant_content_hash: hash },
    } as Grant;
    const ref = store.writeDoc("grant", grantId, doc, ap);
    ap("grant.confirmed", {
      grant_id: grantId,
      version: ref.version,
      workitem_id: wi.id,
      workitem_version: wi.version,
      grant_content_hash: hash,
      typed_prefix: typed,
      approver,
      confirmed_at: at,
      doc_hash: ref.hash,
    });
    return { grant_id: grantId, version: ref.version, grant_content_hash: hash, approver, confirmed_at: at, note: "the approver is declared, not authenticated" };
  });
}
