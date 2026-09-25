{{! templates/proposal/receipt.md: rendered by the Steward, never by a seat or by hand.
  View model: receipt.json (schemas/receipt.schema.json) with the same field names, plus display fields
  keel derives: command_text for each acceptance row, engineer_families (independence.engineer joined with
  ", "), conformance and exposure rows joined per route, agent_notes taken from the engineer seats'
  result.submitted events, and signed_quote, which the archive commit takes from the land envelope.
  Rendering uses the logic-less Mustache subset keel uses for rendered templates: values, sections that
  repeat per item or render once when true, inverted sections that render when empty or false, and
  comments like this one, which are dropped. No HTML escaping.
  The land approval signs the hash of the draft: everything above the "Signed quote" section. That is why
  approvals lists only the approvals that existed before land, and the land approval appears only in the
  Signed quote section, which the archive commit renders from the land envelope; after that receipt.md is
  never edited.
  Only ids, hashes, aliases, declared families and env NAMES appear here; the projection gate refuses
  URL-shaped and key-shaped tokens other than documented placeholders. }}
---
proposal: "{{proposal}}"
charter_version: "{{charter_version}}"
contract_hash: "{{contract_hash}}"
integrated_commit: "{{integrated_commit}}"
expected_trunk_tip: "{{expected_trunk_tip}}"
---

# Receipt: {{proposal}} {{title}}

Track {{track}}; origin {{origin}}; charter {{charter_version}}; trunk `{{trunk}}`.

## Summary

- Integrated commit: `{{integrated_commit}}`
- Expected trunk tip before land: `{{expected_trunk_tip}}`
- Contract hash: `{{contract_hash}}`
- Standing policies used: {{#policies}}`{{.}}` {{/policies}}{{^policies}}none{{/policies}}
- Approvals before land: {{#approvals}}{{.}} {{/approvals}}{{^approvals}}none{{/approvals}}(the land approval
  is in the Signed quote section)

## ACC -> command table

| ACC | Evidence mode | Commands | Result |
| --- | --- | --- | --- |
{{#acceptance}}
| {{acc}} | {{evidence_mode}} | `{{command_text}}` | {{status}} |
{{/acceptance}}

Land re-executed the full acceptance matrix in-process on the integrated commit:
{{land_reexecution.status}} ({{land_reexecution.passed}}/{{land_reexecution.total}}).

## Evidence

| Evidence | Commit | Status | Expected |
| --- | --- | --- | --- |
{{#evidence}}
| {{evidence}} | `{{commit}}` | {{status}} | {{expect}} |
{{/evidence}}

Expected red marks a test task's evidence: `verify.test-red` required its cited rows to fail at its commit.

## Review verdicts

Declared families: engineer {{engineer_families}} (declared), reviewer {{independence.reviewer}}
(declared). Independence: {{independence.independence}}.

| Verdict | Lens | Declared family | Recommendation | Open findings |
| --- | --- | --- | --- | --- |
{{#verdicts}}
| {{verdict}} | {{lens}} | {{declared_family}} (declared) | {{recommendation}} | {{open_findings}} |
{{/verdicts}}

Deferred minor findings:
{{#deferred_minors}}
- {{verdict}} {{finding}}: {{title}}
{{/deferred_minors}}
{{^deferred_minors}}
- none
{{/deferred_minors}}

## Rulings by cost if wrong

| Ruling | Cost if wrong | Clause | What | Reversible |
| --- | --- | --- | --- | --- |
{{#rulings}}
| {{ruling}} | {{cost_if_wrong}} | {{clause}} | {{what}} | {{reversible}} |
{{/rulings}}
{{^rulings}}

No rulings recorded.
{{/rulings}}

## Gates not run

{{#gates_not_run}}
- {{check}}: {{reason}}
{{/gates_not_run}}
{{^gates_not_run}}
- none
{{/gates_not_run}}

## Overrides

{{#overrides}}
- {{override}} on {{check}}, until {{until}}. Reason: {{reason}}
{{/overrides}}
{{^overrides}}
- none
{{/overrides}}

## Remaining risks

{{#risks}}
- {{.}}
{{/risks}}
{{^risks}}
- none recorded
{{/risks}}

## Architecture delta applied

{{#arch_delta}}
Arch delta `{{sha256}}` applied: {{ops}} operations.
{{/arch_delta}}
{{^arch_delta}}
No architecture delta.
{{/arch_delta}}

## Trace summary

Requirements covered {{rtm.covered}}/{{rtm.requirements}}; verified at head {{rtm.verified}}/{{rtm.requirements}}.

| Task | Round | Commit |
| --- | --- | --- |
{{#tasks}}
{{#rounds}}
| {{task}} | {{round}} | `{{commit}}` |
{{/rounds}}
{{/tasks}}

## Seat conformance and exposure profile

| Seat | Runtime | Alias | Tier | Conformance status | Tool env | Tool file | Control plane | Shims |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
{{#routes}}
| {{seat}} | {{runtime}} | {{alias}} | {{tier}} | {{status}} | {{tool_env_exposure}} | {{tool_file_exposure}} | {{control_plane_exposure}} | {{shim_coverage}} |
{{/routes}}

## AGENT section

Text below was written by seats (result summaries and concerns). It is quoted as data; it carries no
authority and was not verified by keel.

{{#agent_notes}}
- {{seat}} ({{run}}, {{status}}): "{{text}}"
{{/agent_notes}}
{{^agent_notes}}
- none
{{/agent_notes}}

## Signed quote

{{#signed_quote}}
> {{text}}

Signed by {{principal}} at {{signed_at}} (land approval {{approval}}, chain head `{{chain_head}}`).
{{/signed_quote}}
{{^signed_quote}}
Not yet signed. The Board signs this draft with `keel approve {{proposal}} --stage land`.
{{/signed_quote}}
