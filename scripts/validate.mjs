// scripts/validate.mjs: the declared D1 tooling exception.
//
// This is the only non-type code in keel M0. It checks the design skeleton (schemas,
// examples, the strict subset, bilingual docs, the D2/P1/D1 audit, the docs/13
// manifest and the P4 reference registry) and holds no product logic. P1: it never
// opens a file that may hold provider values or credentials; such a file is reported
// by name only.
//
// Usage: node scripts/validate.mjs [--only schemas,examples,strict,i18n,audit,manifest,references]
// Each check prints "<check>: <passed>/<total> <unit>" followed by its errors.
// Exit code: 0 ok, 1 when any selected check reports an error, 2 on usage errors.

import { readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import YAML from "yaml";
import ts from "typescript";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECKS = ["schemas", "examples", "strict", "i18n", "audit", "manifest", "references"];
const SCHEMA_BASE = "https://keel.invalid/schemas/";
const DRAFT = "https://json-schema.org/draft/2020-12/schema";
const FORMATS = ["yaml", "json", "jsonl", "json-array", "md-frontmatter"];
const MAP_FILE = "schemas/examples.map.json";
const MANIFEST_DOC = "docs/13-artifacts-schemas.md";
const REGISTRY = "docs/reference-projects.yaml";
const REGISTRY_DOCS = ["docs/00-mandate.md", "docs/16-sources-credits.md"];

// ---------- repository files ----------
const SKIP_DIRS = new Set([".git", "node_modules", "dist", "coverage", ".codegraph"]);
const IGNORED_FILE = /(^|\/)\.keel\/local\.yaml$/; // gitignored personal layer
// P1: basenames of files that may hold provider values or credentials. Never opened.
const NEVER_OPEN = [/^\.env(\..*)?$/, /^gateway\.json$/, /^\.credentials\.json$/, /^auth\.json$/, /^\.npmrc$/, /^\.netrc$/];
const neverOpen = (f) => NEVER_OPEN.some((re) => re.test(basename(f)));

function walk(dir, out) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, ent.name);
    if (ent.isDirectory() && !SKIP_DIRS.has(ent.name)) walk(abs, out);
    else if (ent.isFile()) out.push(relative(ROOT, abs).split(sep).join("/"));
  }
  return out;
}
const FILES = walk(ROOT, []).filter((f) => !IGNORED_FILE.test(f)).sort();
const FILE_SET = new Set(FILES);

function readBuf(file) {
  if (neverOpen(file)) throw new Error(`refusing to open ${file} (P1)`);
  return readFileSync(join(ROOT, file));
}
const read = (file) => readBuf(file).toString("utf8");
const lineOf = (text, index) => text.slice(0, index).split("\n").length;
// Runs fn; on a throw records "<prefix>: <message>" and returns undefined.
function attempt(errors, prefix, fn) {
  try { return fn(); } catch (e) { errors.push(`${prefix}: ${e.message}`); }
}

// ---------- schemas (one shared Ajv instance) ----------
let schemaCtx;
function loadSchemas() {
  if (schemaCtx) return schemaCtx;
  const ajv = new Ajv2020({ strict: true, allErrors: true, allowUnionTypes: true });
  addFormats(ajv);
  ajv.addKeyword({ keyword: "x-keel-strict-subset", metaSchema: { type: "boolean" } });
  ajv.addKeyword({ keyword: "x-keel-status", metaSchema: { enum: ["stable", "draft", "stub"] } });
  ajv.addKeyword({ keyword: "x-keel-milestone", metaSchema: { type: "string", pattern: "^M[0-9]+[a-z]?$" } });
  // Markdown artifacts: required level-2 headings (in order) and the frozen block markers.
  const strings = { type: "array", items: { type: "string", minLength: 1 }, uniqueItems: true };
  ajv.addKeyword({ keyword: "x-keel-sections", metaSchema: { ...strings, minItems: 1 } });
  ajv.addKeyword({ keyword: "x-keel-frozen-markers", metaSchema: { ...strings, minItems: 2, maxItems: 2 } });
  const files = FILES.filter((f) => /^schemas\/[^/]+\.schema\.json$/.test(f));
  const docs = new Map();
  const errors = [];
  for (const file of files) {
    const schema = attempt(errors, `${file}: invalid JSON`, () => JSON.parse(read(file)));
    if (!schema) continue;
    const want = SCHEMA_BASE + basename(file);
    if (schema.$schema !== DRAFT) errors.push(`${file}: $schema must be ${DRAFT}`);
    if (schema.$id !== want) errors.push(`${file}: $id must be ${want}`);
    else if (!ajv.validateSchema(schema)) errors.push(`${file}: meta-schema: ${ajv.errorsText(ajv.errors)}`);
    else if (attempt(errors, file, () => ajv.addSchema(schema))) docs.set(schema.$id, { file, schema });
  }
  let [compiled, defs] = [0, 0];
  for (const [id, { file, schema }] of docs) {
    const before = errors.length;
    attempt(errors, `${file}: compile`, () => ajv.getSchema(id));
    // Also compile every $defs entry, so unreferenced definitions are checked too.
    for (const name of Object.keys(schema.$defs ?? {})) {
      if (attempt(errors, `${file}#/$defs/${name}: compile`, () => ajv.getSchema(`${id}#/$defs/${name}`))) defs++;
    }
    if (errors.length === before) compiled++;
  }
  return (schemaCtx = { ajv, docs, files, compiled, defs, errors });
}

function checkSchemas() {
  const { files, compiled, defs, errors } = loadSchemas();
  return { passed: compiled, total: files.length, unit: `schema files compiled (${defs} $defs compiled)`, errors };
}

// ---------- examples ----------
function parseYaml(text) {
  const doc = YAML.parseDocument(text, { uniqueKeys: true, prettyErrors: true });
  if (doc.errors.length) throw new Error(doc.errors.map((e) => e.message).join("; "));
  return doc.toJS();
}

function parseInstances(file, format) {
  const text = read(file);
  if (format === "json") return [{ at: "", value: JSON.parse(text) }];
  if (format === "yaml") return [{ at: "", value: parseYaml(text) }];
  if (format === "md-frontmatter") {
    const m = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
    if (!m) throw new Error("no leading --- frontmatter block");
    return [{ at: " (frontmatter)", value: parseYaml(m[1]) }];
  }
  if (format === "json-array") {
    const arr = JSON.parse(text);
    if (!Array.isArray(arr)) throw new Error("expected a JSON array");
    return arr.map((value, i) => ({ at: `[${i}]`, value }));
  }
  const errs = []; // jsonl: one instance per non-empty line
  const rows = text.split(/\r?\n/).flatMap((l, i) => (l.trim() ? [{ at: `:${i + 1}`, value: attempt(errs, `line ${i + 1}`, () => JSON.parse(l)) }] : []));
  if (errs.length) throw new Error(errs.join("; "));
  return rows;
}

// md-frontmatter bodies: the root schema's "x-keel-sections" must appear as level-2 headings, in order,
// inside the "x-keel-frozen-markers" region when the schema declares one. Other headings may interleave.
function checkSections(file, schema) {
  const want = schema?.["x-keel-sections"];
  if (!Array.isArray(want)) return [];
  let lines = read(file).replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "").split(/\r?\n/);
  const markers = schema["x-keel-frozen-markers"];
  if (Array.isArray(markers)) {
    const at = markers.map((m) => lines.flatMap((l, i) => (l.trim() === m ? [i] : [])));
    if (at.some((hits) => hits.length !== 1) || at[0][0] > at[1][0]) {
      return [`${file}: needs the frozen markers once each, in order, on their own lines (${markers.join(" ... ")})`];
    }
    lines = lines.slice(at[0][0] + 1, at[1][0]);
  }
  const got = [];
  let fence = null;
  for (const line of lines) {
    const f = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (f) fence = fence === null ? f[1][0] : f[1][0] === fence ? null : fence;
    else if (fence === null && /^ {0,3}## /.test(line)) got.push(line.replace(/^ {0,3}## +/, "").replace(/[ #]+$/, ""));
  }
  let k = 0;
  for (const h of got) if (h === want[k]) k++;
  return k === want.length ? [] : [`${file}: level-2 section "${want[k]}" missing or out of order (x-keel-sections: ${want.join(", ")})`];
}

function checkExamples() {
  const { ajv, docs } = loadSchemas();
  const errors = [];
  const map = attempt(errors, MAP_FILE, () => JSON.parse(read(MAP_FILE)));
  if (!map) return { passed: 0, total: 0, unit: "entries valid", errors };
  const entries = Array.isArray(map.entries) ? map.entries : [];
  const okList = Array.isArray(map.unmapped_ok) ? map.unmapped_ok : [];
  if (entries !== map.entries || okList !== map.unmapped_ok) errors.push(`${MAP_FILE}: needs entries[] and unmapped_ok[]`);
  let passed = 0;
  entries.forEach((e, i) => {
    if (!e || typeof e.file !== "string" || typeof e.schema !== "string" || !FORMATS.includes(e.format)) {
      return void errors.push(`${MAP_FILE}: entries[${i}] needs file, schema and format (${FORMATS.join("|")})`);
    }
    if (!FILE_SET.has(e.file)) return void errors.push(`${e.file}: mapped but missing`);
    const validate = attempt(errors, `${e.file}: schema ${e.schema}`, () => ajv.getSchema(e.schema) ?? null);
    if (validate === null) errors.push(`${e.file}: schema not found: ${e.schema}`);
    const instances = validate && attempt(errors, `${e.file}: ${e.format} parse error`, () => parseInstances(e.file, e.format));
    if (!instances) return;
    const before = errors.length;
    for (const { at, value } of instances) {
      if (!validate(value)) errors.push(`${e.file}${at}: ${ajv.errorsText(validate.errors, { dataVar: "" })}`);
    }
    if (e.format === "md-frontmatter" && !e.schema.includes("#")) errors.push(...checkSections(e.file, docs.get(e.schema)?.schema));
    if (errors.length === before) passed++;
  });
  const mapped = new Set(entries.map((e) => e?.file));
  const ok = new Set();
  okList.forEach((u, i) => {
    if (typeof u?.file !== "string" || typeof u.reason !== "string" || !u.reason.trim()) {
      errors.push(`${MAP_FILE}: unmapped_ok[${i}] needs file and a non-empty reason`);
    } else if (!FILE_SET.has(u.file)) errors.push(`${u.file}: listed in unmapped_ok but missing`);
    else ok.add(u.file);
  });
  const data = FILES.filter((f) => /^(examples|test\/fixtures)\//.test(f) && /\.(ya?ml|json|jsonl)$/.test(f));
  for (const f of data) if (!mapped.has(f) && !ok.has(f)) errors.push(`${f}: neither mapped in ${MAP_FILE} nor listed in unmapped_ok`);
  const unit = `entries valid (${data.length} data files under examples/ and test/fixtures/, ${ok.size} unmapped_ok)`;
  return { passed, total: entries.length, unit, errors };
}

// ---------- strict subset (schemas with "x-keel-strict-subset": true) ----------
const STRICT_FORBIDDEN = ["oneOf", "not", "if", "then", "else", "patternProperties", "dependentSchemas", "unevaluatedProperties"];
const SUB_ONE = ["items", "additionalProperties", "contains", "propertyNames", "unevaluatedItems", "unevaluatedProperties", "not", "if", "then", "else"];
const SUB_ARR = ["allOf", "anyOf", "oneOf", "prefixItems"];
const SUB_MAP = ["properties", "patternProperties", "$defs", "dependentSchemas"];

function resolveRef(target, docs) {
  const [docId, pointer = ""] = target.split("#");
  const doc = docs.get(docId);
  let node = doc?.schema;
  for (const raw of pointer.split("/").slice(1)) {
    const key = decodeURIComponent(raw).replace(/~1/g, "/").replace(/~0/g, "~");
    node = node !== null && typeof node === "object" && key in node ? node[key] : undefined;
  }
  return node === undefined ? null : { node, where: `${doc.file}#${pointer}`, base: docId };
}

// Walks a schema node, and everything it reaches through $ref, collecting violations.
function walkStrict(node, where, base, docs, seen, errors) {
  if (node === null || typeof node !== "object" || Array.isArray(node)) return;
  for (const k of STRICT_FORBIDDEN) if (k in node) errors.add(`${where}: '${k}' is outside the strict subset`);
  if ([].concat(node.type ?? []).includes("object") || "properties" in node) {
    const props = Object.keys(node.properties ?? {});
    const req = Array.isArray(node.required) ? node.required : [];
    if (node.additionalProperties !== false) errors.add(`${where}: object needs additionalProperties: false`);
    if (req.length !== props.length || !props.every((p) => req.includes(p))) {
      errors.add(`${where}: required must list every property [${props.join(", ")}]`);
    }
  }
  if (typeof node.$ref === "string") {
    const target = new URL(node.$ref, base).href;
    const r = seen.has(target) ? undefined : resolveRef(target, docs);
    seen.add(target);
    if (r === null) errors.add(`${where}: unresolved $ref ${node.$ref}`);
    else if (r) walkStrict(r.node, r.where, r.base, docs, seen, errors);
  }
  const next = (sub, path) => walkStrict(sub, `${where}/${path}`, base, docs, seen, errors);
  for (const k of SUB_ONE) if (k in node) next(node[k], k);
  for (const k of SUB_ARR) if (Array.isArray(node[k])) node[k].forEach((s, i) => next(s, `${k}/${i}`));
  for (const k of SUB_MAP) for (const [n, s] of Object.entries(node[k] ?? {})) next(s, `${k}/${n}`);
}

function checkStrict() {
  const { docs } = loadSchemas();
  const errors = [];
  let [total, passed] = [0, 0];
  for (const [id, { file, schema }] of docs) {
    if (schema["x-keel-strict-subset"] !== true) continue;
    const found = new Set();
    walkStrict(schema, `${file}#`, id, docs, new Set([id]), found);
    total++;
    if (found.size === 0) passed++;
    errors.push(...found);
  }
  return { passed, total, unit: "strict-subset schemas clean", errors };
}

// ---------- i18n (English canonical <name>.md + <name>.zh-CN.md mirror) ----------
function headingLevels(text) {
  const levels = [];
  let fence = null;
  for (const line of text.split(/\r?\n/)) {
    const f = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (f) fence = fence === null ? f[1][0] : f[1][0] === fence ? null : fence;
    else if (fence === null && /^ {0,3}#{1,6}(\s|$)/.test(line)) levels.push(/#+/.exec(line)[0].length);
  }
  return levels;
}

// Human-facing docs (D5): everything under docs/, plus the root, runtimes/ and test/ READMEs.
const I18N_SCOPE = (f) => f.startsWith("docs/") || /^(?:runtimes\/|test\/)?README(\.zh-CN)?\.md$/.test(f);
function checkI18n() {
  const md = FILES.filter((f) => f.endsWith(".md") && I18N_SCOPE(f));
  const mirrors = new Set(md.filter((f) => f.endsWith(".zh-CN.md")));
  const english = md.filter((f) => !mirrors.has(f));
  const errors = [];
  let passed = 0;
  for (const f of english) {
    const mirror = f.replace(/\.md$/, ".zh-CN.md");
    if (!mirrors.delete(mirror)) { errors.push(`${f}: missing mirror ${mirror}`); continue; }
    const [a, b] = [headingLevels(read(f)), headingLevels(read(mirror))];
    let at = a.findIndex((lv, k) => lv !== b[k]);
    if (at === -1 && a.length !== b.length) at = a.length;
    if (at === -1) passed++;
    else errors.push(`${mirror}: heading levels differ from ${f} at heading ${at + 1} (en ${a[at] ?? "none"}, zh-CN ${b[at] ?? "none"}; ${a.length} vs ${b.length} headings)`);
  }
  for (const orphan of mirrors) errors.push(`${orphan}: no English canonical ${orphan.replace(/\.zh-CN\.md$/, ".md")}`);
  return { passed, total: english.length, unit: "docs mirrored with identical heading levels", errors };
}

// ---------- audit: D2 terms, P1 tokens/hosts/URLs, D1 purity ----------
// The D2 term list: none of these may appear in any repo file except this one. Multi-word terms match
// with any separator (space, hyphen, underscore) or none, case-insensitively, so spaced, hyphenated and
// camel-case spellings are caught too.
const D2_TERMS = [/\bECL\b/gi, /Engineering[\s_-]*Context[\s_-]*Ledger/gi, /\bmy[\s_-]*flow/gi, /code[\s_-]*index/gi,
  /context[\s_-]*package/gi, /declaration[\s_-]*block/gi, /spec[\s_-]*base/gi, /id@rev/gi, /eligib/gi];
const D2_EXEMPT = new Set(["package-lock.json", "scripts/validate.mjs"]);
const KEY_SHAPES = [/(?<![A-Za-z0-9_-])sk-(?!fake-keel-|ssh-|ecdsa-)[A-Za-z0-9_-]{8,}/g, /\bAKIA[0-9A-Z]{16}\b/g, /\bAIza[0-9A-Za-z_-]{35}/g,
  /\bgh[pousr]_[A-Za-z0-9]{36,}/g, /\bxox[abposr]-[A-Za-z0-9-]{10,}/g, /PRIVATE KEY-{5}/g];
// Provider API hosts, assembled from labels so that no host name appears literally here.
const PROVIDER_HOSTS = [
  ["api", "anthropic", "com"], ["api", "openai", "com"], ["generativelanguage", "googleapis", "com"],
  ["open", "bigmodel", "cn"], ["api", "z", "ai"], ["api", "moonshot", "cn"], ["api", "moonshot", "ai"],
  ["api", "kimi", "com"], ["dashscope", "aliyuncs", "com"], ["dashscope-intl", "aliyuncs", "com"],
].map((labels) => labels.join("."));
// Host = hostname characters; backslashes are dropped so escaped regex sources read as hosts.
const URL_HOST = /\bhttps?:\/\/([A-Za-z0-9.\\-]+)/gi;
const hostOk = (h) => /(^|\.)invalid$/.test(h) || /(^|\.)example\.(com|org|net)$/.test(h) || ["localhost", "127.0.0.1", "json-schema.org"].includes(h);
const urlExempt = (f) => f.startsWith("docs/") || /(^|\/)README[^/]*\.md$/.test(f) || f === "AGENTS.md" || f === "package-lock.json";

const SK = ts.SyntaxKind;
const TS_ALLOWED = new Set([SK.InterfaceDeclaration, SK.TypeAliasDeclaration, SK.EmptyStatement]);
const TS_LABELS = { [SK.EnumDeclaration]: "enum", [SK.VariableStatement]: "const/let/var", [SK.FunctionDeclaration]: "function", [SK.ClassDeclaration]: "class", [SK.ExpressionStatement]: "expression statement" };
// Returns why a top-level statement is not type-only, or null when it is allowed.
function tsViolation(s) {
  if (TS_ALLOWED.has(s.kind)) return null;
  if (s.kind === SK.ImportDeclaration) {
    const c = s.importClause;
    return c && (c.phaseModifier === SK.TypeKeyword || c.isTypeOnly === true) ? null : "value import (use `import type`)";
  }
  if (s.kind === SK.ExportDeclaration) {
    const empty = !s.moduleSpecifier && s.exportClause && ts.isNamedExports(s.exportClause) && s.exportClause.elements.length === 0;
    return s.isTypeOnly || empty ? null : "value export (use `export type`)";
  }
  return TS_LABELS[s.kind] ?? "statement that is not a type declaration";
}

function checkAudit() {
  const errors = [];
  const bad = new Set();
  const flag = (file, msg) => (bad.add(file), errors.push(`${file}: ${msg}`));
  let scanned = 0;
  for (const f of FILES) {
    if (neverOpen(f)) { flag(f, "P1: a file that may hold provider values or credentials is present (not opened); remove it"); continue; }
    if (!D2_EXEMPT.has(f)) for (const re of D2_TERMS) if (new RegExp(re.source, "i").test(f)) flag(f, `D2 term in path /${re.source}/`);
    const buf = readBuf(f);
    if (buf.includes(0)) continue; // binary
    scanned++;
    const text = buf.toString("utf8");
    const hits = (re, label) => [...text.matchAll(re)].forEach((m) => flag(f, `${label} at line ${lineOf(text, m.index)}`));
    if (!D2_EXEMPT.has(f)) for (const re of D2_TERMS) hits(re, `D2 term /${re.source}/`);
    for (const re of KEY_SHAPES) hits(re, `P1 key-shaped token /${re.source}/`);
    const lower = text.toLowerCase();
    for (const host of PROVIDER_HOSTS) if (lower.includes(host)) flag(f, `P1 provider API host at line ${lineOf(text, lower.indexOf(host))}`);
    if (urlExempt(f)) continue;
    for (const m of text.matchAll(URL_HOST)) {
      const host = m[1].replace(/\\/g, "").replace(/\.+$/, "").toLowerCase();
      if (!hostOk(host)) flag(f, `P1 URL host '${host}' is not a placeholder at line ${lineOf(text, m.index)}`);
    }
  }
  // D1: no bin, no runtime dependencies, type-only src.
  const pkg = attempt(errors, "package.json", () => JSON.parse(read("package.json"))) ?? {};
  if ("bin" in pkg) flag("package.json", 'D1: no "bin" in M0');
  if ("dependencies" in pkg) flag("package.json", 'D1: no "dependencies" in M0');
  const src = FILES.filter((f) => f.startsWith("src/"));
  let pure = 0;
  for (const f of src) {
    if (!f.endsWith(".ts")) { flag(f, "D1: src/ holds only .ts type files"); continue; }
    const sf = ts.createSourceFile(f, read(f), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const before = errors.length;
    for (const s of sf.statements) {
      const why = tsViolation(s);
      if (why) flag(f, `D1: ${why} at line ${sf.getLineAndCharacterOfPosition(s.getStart(sf)).line + 1}`);
    }
    if (errors.length === before) pure++;
  }
  const clean = scanned - [...bad].filter((f) => !neverOpen(f)).length;
  const unit = `files clean (D2 terms; P1 tokens, hosts, URLs; D1 package.json and ${pure}/${src.length} type-only src files)`;
  return { passed: Math.max(clean, 0), total: scanned, unit, errors };
}

// ---------- manifest (backticked paths in docs/13 table first cells) ----------
const globRe = (p) =>
  new RegExp(`^${p.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, "\0").replace(/\*/g, "[^/]*").replace(/\?/g, "[^/]").replace(/\0/g, ".*")}$`);

function checkManifest() {
  if (!FILE_SET.has(MANIFEST_DOC)) return { skipped: "docs/13 missing" };
  let text = read(MANIFEST_DOC);
  // Optional <!-- keel:manifest:start/end --> markers limit the manifest to the marked tables.
  const regions = [...text.matchAll(/<!--\s*keel:manifest:start\s*-->([\s\S]*?)<!--\s*keel:manifest:end\s*-->/g)];
  if (regions.length) text = regions.map((r) => r[1]).join("\n");
  const firstCells = text.split(/\r?\n/).filter((line) => /^\s*\|/.test(line)).map((line) => line.trim().slice(1).split("|")[0]);
  const listed = firstCells.flatMap((cell) => [...cell.matchAll(/`([^`]+)`/g)].map((m) => m[1].trim()));
  const errors = [];
  const matchers = listed.map((p) => ({ p, re: /[*?]/.test(p) ? globRe(p) : null }));
  for (const { p, re } of matchers) {
    const dir = `${p.replace(/\/$/, "")}/`;
    const exists = re ? FILES.some((f) => re.test(f)) : FILE_SET.has(p) || FILES.some((f) => f.startsWith(dir));
    if (!exists) errors.push(`${MANIFEST_DOC}: listed path does not exist: ${p}`);
  }
  const repoFiles = FILES.filter((f) => f !== "package-lock.json" && !f.endsWith(".zh-CN.md"));
  const uncovered = repoFiles.filter((f) => !matchers.some(({ p, re }) => (re ? re.test(f) : p === f)));
  for (const f of uncovered) errors.push(`${f}: not listed in ${MANIFEST_DOC}`);
  return { passed: repoFiles.length - uncovered.length, total: repoFiles.length, unit: `repo files listed (${listed.length} manifest paths)`, errors };
}

// ---------- references (P4 registry cross-referenced with the mandate and the credits) ----------
// The name looked up is the display_name, or the part before its parenthesis, as a case-sensitive substring.
const registryName = (p) => String(p?.display_name ?? "").split("(")[0].trim();

function checkReferences() {
  if (!FILE_SET.has(REGISTRY)) return { skipped: `${REGISTRY} missing` };
  const errors = [];
  const registry = attempt(errors, REGISTRY, () => parseYaml(read(REGISTRY)));
  const projects = Array.isArray(registry?.projects) ? registry.projects : [];
  if (registry && projects !== registry.projects) errors.push(`${REGISTRY}: needs projects[]`);
  const texts = REGISTRY_DOCS.map((d) => (FILE_SET.has(d) ? read(d) : null));
  let [total, passed] = [0, 0];
  projects.forEach((p, i) => {
    const where = `${REGISTRY}: projects[${i}] (${p?.id ?? "no id"})`;
    const clone = p?.local_clone;
    // Never opened: only the shape is checked, and it must leave the repository.
    if (clone !== null && !(typeof clone === "string" && clone.startsWith("../"))) {
      errors.push(`${where}: local_clone must be null or a relative path starting with ../`);
    }
    if (p?.named_by_owner !== true) return;
    total++;
    const name = registryName(p);
    const before = errors.length;
    if (!name) errors.push(`${where}: display_name is empty`);
    else REGISTRY_DOCS.forEach((d, k) => {
      if (texts[k] === null) errors.push(`${where}: ${d} missing, cannot cross-reference "${name}"`);
      else if (!texts[k].includes(name)) errors.push(`${where}: owner-named project "${name}" is not named in ${d}`);
    });
    if (errors.length === before) passed++;
  });
  return { passed, total, unit: "owner-named projects cross-referenced", errors };
}

// ---------- main ----------
const RUN = { schemas: checkSchemas, examples: checkExamples, strict: checkStrict, i18n: checkI18n, audit: checkAudit, manifest: checkManifest, references: checkReferences };
const argv = process.argv.slice(2);
const onlyArg = argv.length === 0 ? CHECKS.join(",") : argv[0] === "--only" && argv.length === 2 ? argv[1] : argv.length === 1 && argv[0].startsWith("--only=") ? argv[0].slice(7) : "";
const selected = onlyArg.split(",").map((s) => s.trim()).filter(Boolean);
if (selected.length === 0 || selected.some((c) => !CHECKS.includes(c))) {
  console.error(`usage: node scripts/validate.mjs [--only <comma list of ${CHECKS.join(",")}>]`);
  process.exit(2);
}

let failed = 0;
for (const name of CHECKS.filter((c) => selected.includes(c))) {
  const r = RUN[name]();
  const errors = [...new Set(r.errors ?? [])];
  const tail = errors.length ? ` - ${errors.length} error(s)` : "";
  console.log(r.skipped ? `${name}: skipped (${r.skipped})` : `${name}: ${r.passed}/${r.total} ${r.unit}${tail}`);
  for (const e of errors) console.log(`  x ${e}`);
  failed += errors.length;
}
console.log(failed ? `validate: FAILED with ${failed} error(s)` : "validate: ok");
process.exitCode = failed ? 1 : 0; // not process.exit(): let piped stdout flush
