// Redaction of token-shaped strings before executor output is retained as
// evidence. The count of replacements is recorded as a limit on the evidence.
// Source: HC-02 s2 (shared state holds only permitted references); HC-05 s1
// (redacted payloads are noted, never presented as complete); OWNER 2026-10-09 (stage-b 6.5).
const PATTERNS: RegExp[] = [
  /\bsk-[A-Za-z0-9_-]{16,}\b/g,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g,
  /\bxox[abpr]-[A-Za-z0-9-]{10,}\b/g,
  /\bAKIA[A-Z0-9]{16}\b/g,
  /\b(?:token|key|secret|authorization|bearer)\b[^\n]{0,20}?([A-Za-z0-9+/=_-]{32,})/gi,
];

export function redact(text: string): { text: string; redactions: number } {
  let redactions = 0;
  let out = text;
  for (const re of PATTERNS) {
    out = out.replace(re, (match: string, group?: string) => {
      redactions++;
      if (group && re.source.startsWith("\\b(?:token")) return match.replace(group, "[redacted]");
      return "[redacted]";
    });
  }
  return { text: out, redactions };
}
