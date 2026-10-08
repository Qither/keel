// `verify`: evaluates every Acceptance criterion against Evidence records,
// never against summaries. Missing, failed, not-run, inferred and stale
// evidence are reported as such; the verdict shows its denominator.
// Source: HC-05 s1–s2; HC-04 s1; W-07; design 4.7.
import { faultActive } from "../faults.js";
import type { EvidenceStatus } from "../model.js";
import { type Store } from "../store.js";
import { deriveView, type View } from "../derive.js";
import { headRevision } from "../workspace.js";

export interface CriterionVerdict {
  id: string;
  statement: string;
  required: boolean;
  evidence_mode: string;
  status: EvidenceStatus;
  evidence_id: string | null;
  evidence_origin: string | null;
  captured_at: string | null;
  source_revision: string | null;
  acceptance_version: number | null;
  note: string | null;
}

export interface VerifyResult {
  workitem_id: string;
  acceptance_version: number;
  current_revision: string;
  verdict: "accepted" | "not accepted";
  satisfied: number;
  total: number;
  required_total: number;
  by_status: Record<string, number>;
  criteria: CriterionVerdict[];
  superseded_evidence_ignored: string[];
}

export function computeVerify(store: Store, workitemId: string, view = deriveView(store, workitemId)): VerifyResult {
  const acceptance = view.acceptance;
  const current = headRevision(view.task.workspace);
  const superseded: string[] = [];
  const criteria: CriterionVerdict[] = acceptance.criteria.map((c) => {
    const candidates = view.evidence.filter((e) => {
      if (e.claim !== c.id) return false;
      if (e.superseded && !faultActive("evidence-ignores-generation")) {
        superseded.push(e.id);
        return false;
      }
      return true;
    });
    const latest = candidates.at(-1);
    if (!latest) {
      return { id: c.id, statement: c.statement, required: c.required, evidence_mode: c.evidence_mode, status: "not-run", evidence_id: null, evidence_origin: null, captured_at: null, source_revision: null, acceptance_version: null, note: "no evidence record exists for this criterion" };
    }
    let status: EvidenceStatus = latest.status;
    let note: string | null = null;
    if (latest.acceptance_version !== acceptance.version) {
      status = "stale";
      note = `evidence belongs to acceptance v${latest.acceptance_version}; current is v${acceptance.version}`;
    } else if (status === "present" && latest.source_revision !== current && !faultActive("verify-ignores-revision")) {
      status = "stale";
      note = `evidence captured at revision ${latest.source_revision}; workspace is now at ${current}`;
    }
    return { id: c.id, statement: c.statement, required: c.required, evidence_mode: c.evidence_mode, status, evidence_id: latest.id, evidence_origin: latest.origin, captured_at: latest.captured_at, source_revision: latest.source_revision, acceptance_version: latest.acceptance_version, note };
  });

  if (faultActive("verify-trusts-summary") && view.context_entries.some((e) => e.kind === "summary" && /all criteria satisfied/i.test(e.content))) {
    for (const c of criteria) {
      c.status = "present";
      c.note = "FAULT verify-trusts-summary";
    }
  }

  const by_status: Record<string, number> = {};
  for (const c of criteria) by_status[c.status] = (by_status[c.status] ?? 0) + 1;
  const satisfied = criteria.filter((c) => c.status === "present").length;
  const requiredOk = criteria.filter((c) => c.required).every((c) => c.status === "present");
  return {
    workitem_id: workitemId,
    acceptance_version: acceptance.version,
    current_revision: current,
    verdict: requiredOk ? "accepted" : "not accepted",
    satisfied,
    total: criteria.length,
    required_total: criteria.filter((c) => c.required).length,
    by_status,
    criteria,
    superseded_evidence_ignored: [...new Set(superseded)],
  };
}

export function verifyView(store: Store, workitemId: string): { result: VerifyResult; view: View } {
  const view = deriveView(store, workitemId);
  return { result: computeVerify(store, workitemId, view), view };
}
