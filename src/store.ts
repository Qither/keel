// The state directory: versioned, content-hashed documents and one append-only,
// hash-linked event log. Documents are authority for declared facts; the log is
// authority for what happened. Nothing else is read back as authority.
// Source: HC-04 s1–s2; HC-05 s1; OWNER 2026-10-08 (design 6.3); design 3.11.
import { randomBytes } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { AuthorityError } from "./errors.js";
import { canonicalJson, hashObject, sha256 } from "./hash.js";
import { withLock } from "./lock.js";
import { AUTHORITY_MAP, type AuthorityMap } from "./model.js";

export interface LogEvent {
  seq: number;
  id: string;
  at: string;
  type: string;
  data: Record<string, unknown>;
  prev: string | null;
  hash: string;
}

export interface DocRef {
  doc_type: string;
  id: string;
  version: number;
  hash: string;
}

export interface LogProblem {
  kind: "chain-break" | "document-mismatch" | "document-missing" | "unrecorded-document";
  location: string;
  detail: string;
}

export function newId(prefix: string): string {
  return `${prefix}-${randomBytes(4).toString("hex")}`;
}

export function now(): string {
  return new Date().toISOString();
}

export class Store {
  readonly logPath: string;
  readonly docsDir: string;
  readonly evidenceDir: string;
  readonly projectionsDir: string;

  private constructor(readonly stateDir: string) {
    this.logPath = join(stateDir, "events.jsonl");
    this.docsDir = join(stateDir, "docs");
    this.evidenceDir = join(stateDir, "evidence");
    this.projectionsDir = join(stateDir, "projections");
  }

  static exists(stateDir: string): boolean {
    return existsSync(join(stateDir, "events.jsonl"));
  }

  /** Opens an existing state directory, or creates one when `create` is set. */
  static open(stateDir: string, create = false): Store {
    const store = new Store(stateDir);
    if (!Store.exists(stateDir)) {
      if (!create) {
        throw new AuthorityError(
          `no state directory at ${stateDir}; run \`keel work create\` first`,
          "HC-04 s1",
        );
      }
      mkdirSync(store.docsDir, { recursive: true });
      mkdirSync(store.evidenceDir, { recursive: true });
      mkdirSync(store.projectionsDir, { recursive: true });
      const authority: AuthorityMap = { declared_at: now(), ...AUTHORITY_MAP };
      writeFileSync(join(stateDir, "authority.json"), canonicalJson(authority) + "\n");
      writeFileSync(store.logPath, "");
      store.appendUnlocked("log.opened", { authority_map_hash: hashObject(authority), product: "keel stage-a" });
    }
    return store;
  }

  authorityMap(): AuthorityMap {
    return JSON.parse(readFileSync(join(this.stateDir, "authority.json"), "utf8")) as AuthorityMap;
  }

  // ---- event log -------------------------------------------------------

  /** Reads every event and verifies the hash chain; a broken chain is an authority error. */
  events(): LogEvent[] {
    const { events, problems } = this.readLog();
    const breaks = problems.filter((p) => p.kind === "chain-break");
    if (breaks.length > 0) {
      throw new AuthorityError(`event log chain is broken at ${breaks[0]!.location}: ${breaks[0]!.detail}`, "HC-04 s2", breaks);
    }
    return events;
  }

  private readLog(): { events: LogEvent[]; problems: LogProblem[] } {
    const problems: LogProblem[] = [];
    const events: LogEvent[] = [];
    const text = existsSync(this.logPath) ? readFileSync(this.logPath, "utf8") : "";
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    let prev: string | null = null;
    let seq = 0;
    for (const [i, line] of lines.entries()) {
      let ev: LogEvent;
      try {
        ev = JSON.parse(line) as LogEvent;
      } catch {
        problems.push({ kind: "chain-break", location: `events.jsonl:${i + 1}`, detail: "line is not JSON" });
        break;
      }
      const { hash, ...body } = ev;
      const expected = hashObject(body);
      if (hash !== expected) {
        problems.push({ kind: "chain-break", location: `events.jsonl:${i + 1}`, detail: `event hash ${hash} does not match its content (${expected})` });
        break;
      }
      if (ev.prev !== prev) {
        problems.push({ kind: "chain-break", location: `events.jsonl:${i + 1}`, detail: `prev ${ev.prev} does not link to ${prev}` });
        break;
      }
      if (ev.seq !== seq + 1) {
        problems.push({ kind: "chain-break", location: `events.jsonl:${i + 1}`, detail: `seq ${ev.seq} is not ${seq + 1}` });
        break;
      }
      events.push(ev);
      prev = hash;
      seq = ev.seq;
    }
    return { events, problems };
  }

  private appendUnlocked(type: string, data: Record<string, unknown>): LogEvent {
    const events = this.events();
    const last = events.at(-1);
    const body = {
      seq: (last?.seq ?? 0) + 1,
      id: newId("ev"),
      at: now(),
      type,
      data,
      prev: last?.hash ?? null,
    };
    const ev: LogEvent = { ...body, hash: hashObject(body) };
    appendFileSync(this.logPath, JSON.stringify(ev) + "\n");
    return ev;
  }

  /** Appends one event under the state lock. Refuses when the log and documents disagree. */
  append(type: string, data: Record<string, unknown>): LogEvent {
    return withLock(this.stateDir, () => {
      this.assertConsistent();
      return this.appendUnlocked(type, data);
    });
  }

  /** Runs several writes under one lock; the callback receives an unlocked appender. */
  transaction<T>(fn: (append: (type: string, data: Record<string, unknown>) => LogEvent) => T): T {
    return withLock(this.stateDir, () => {
      this.assertConsistent();
      return fn((type, data) => this.appendUnlocked(type, data));
    });
  }

  // ---- documents -------------------------------------------------------

  private docPath(docType: string, id: string, version: number): string {
    return join(this.docsDir, docType, id, `v${version}.json`);
  }

  /** Document versions as the log recorded them (the only versions that exist as authority). */
  recordedVersions(docType: string, id: string, events = this.events()): DocRef[] {
    return events
      .filter((e) => e.type === "document.written" && e.data["doc_type"] === docType && e.data["id"] === id)
      .map((e) => e.data as unknown as DocRef);
  }

  recordedDocs(docType: string, events = this.events()): string[] {
    const ids = new Set<string>();
    for (const e of events) {
      if (e.type === "document.written" && e.data["doc_type"] === docType) ids.add(e.data["id"] as string);
    }
    return [...ids];
  }

  latestVersion(docType: string, id: string, events = this.events()): number {
    return this.recordedVersions(docType, id, events).reduce((m, r) => Math.max(m, r.version), 0);
  }

  /** Writes the next version of a document and records its hash in the log. */
  writeDoc<T extends object>(docType: string, id: string, body: T, append?: (type: string, data: Record<string, unknown>) => LogEvent): DocRef {
    const write = (ap: (type: string, data: Record<string, unknown>) => LogEvent): DocRef => {
      const version = this.latestVersion(docType, id) + 1;
      const content = { ...body, version } as T & { version: number };
      const hash = hashObject(content);
      const path = this.docPath(docType, id, version);
      mkdirSync(join(this.docsDir, docType, id), { recursive: true });
      writeFileSync(path, canonicalJson(content) + "\n");
      const ref: DocRef = { doc_type: docType, id, version, hash };
      ap("document.written", { ...ref });
      return ref;
    };
    if (append) return write(append);
    return this.transaction((ap) => write(ap));
  }

  /** Reads a recorded document version and verifies the file against the recorded hash. */
  readDoc<T>(docType: string, id: string, version?: number, events = this.events()): T & { version: number } {
    const recorded = this.recordedVersions(docType, id, events);
    const v = version ?? recorded.reduce((m, r) => Math.max(m, r.version), 0);
    const ref = recorded.find((r) => r.version === v);
    if (!ref) {
      throw new AuthorityError(`${docType} ${id} v${v} was never recorded in the event log`, "HC-04 s1", { docType, id, version: v });
    }
    const path = this.docPath(docType, id, v);
    if (!existsSync(path)) {
      throw new AuthorityError(`${docType} ${id} v${v} is recorded in the log but the document file is missing`, "HC-04 s1", { path });
    }
    const content = JSON.parse(readFileSync(path, "utf8")) as T & { version: number };
    const actual = hashObject(content);
    if (actual !== ref.hash) {
      throw new AuthorityError(
        `${docType} ${id} v${v} on disk (${actual.slice(0, 12)}) differs from the version the event log recorded (${ref.hash.slice(0, 12)})`,
        "HC-04 s2",
        { path, recorded: ref.hash, actual },
      );
    }
    return content;
  }

  // ---- consistency -----------------------------------------------------

  /** Full check of the log chain and of every recorded document against its file. */
  check(): LogProblem[] {
    const { events, problems } = this.readLog();
    const recorded = new Set<string>();
    for (const e of events) {
      if (e.type !== "document.written") continue;
      const ref = e.data as unknown as DocRef;
      const path = this.docPath(ref.doc_type, ref.id, ref.version);
      recorded.add(path);
      if (!existsSync(path)) {
        problems.push({ kind: "document-missing", location: path, detail: `recorded at event ${e.seq} but absent` });
        continue;
      }
      let actual: string;
      try {
        actual = hashObject(JSON.parse(readFileSync(path, "utf8")));
      } catch {
        problems.push({ kind: "document-mismatch", location: path, detail: "file is not JSON" });
        continue;
      }
      if (actual !== ref.hash) {
        problems.push({ kind: "document-mismatch", location: path, detail: `file hash ${actual.slice(0, 12)} differs from recorded ${ref.hash.slice(0, 12)} (event ${e.seq})` });
      }
    }
    if (existsSync(this.docsDir)) {
      for (const docType of readdirSync(this.docsDir)) {
        const typeDir = join(this.docsDir, docType);
        if (!statSync(typeDir).isDirectory()) continue;
        for (const id of readdirSync(typeDir)) {
          const idDir = join(typeDir, id);
          if (!statSync(idDir).isDirectory()) continue;
          for (const file of readdirSync(idDir)) {
            const path = join(idDir, file);
            if (!recorded.has(path)) {
              problems.push({ kind: "unrecorded-document", location: path, detail: "a document file no event recorded; it is not authority and is never read" });
            }
          }
        }
      }
    }
    return problems;
  }

  /** Writes are refused while the log and its documents disagree. */
  assertConsistent(): void {
    const blocking = this.check().filter((p) => p.kind !== "unrecorded-document");
    if (blocking.length > 0) {
      const first = blocking[0]!;
      throw new AuthorityError(`writes refused: ${first.kind} at ${first.location}: ${first.detail}`, "HC-04 s2", blocking);
    }
  }

  // ---- evidence payloads and projections --------------------------------

  writeBlob(runId: string, name: string, data: string | Uint8Array): { ref: string; sha256: string } {
    const dir = join(this.evidenceDir, runId);
    mkdirSync(dir, { recursive: true });
    const path = join(dir, name);
    writeFileSync(path, data);
    return { ref: `evidence/${runId}/${name}`, sha256: sha256(data) };
  }

  writeProjection(id: string, value: unknown): string {
    mkdirSync(this.projectionsDir, { recursive: true });
    const path = join(this.projectionsDir, `${id}.json`);
    writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
    return path;
  }
}
