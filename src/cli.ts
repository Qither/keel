#!/usr/bin/env node
// The `keel` command line. Every verb takes `--json`; exit statuses are the
// product's convention: 0 done, 1 check failed, 2 usage, 3 refused by a rule,
// 4 waiting on a human decision, 5 authority missing or inconsistent.
// Source: OWNER 2026-10-08 (design 6.2, 6.8); design 4.
import { resolve } from "node:path";
import { EXIT, KeelError, UsageError } from "./errors.js";
import { activeFaults, faultActive } from "./faults.js";
import { Store } from "./store.js";
import { accept } from "./verbs/accept.js";
import { resolveWorkItem } from "./verbs/common.js";
import { contextAdd } from "./verbs/context.js";
import { decide, listDecisions } from "./verbs/decide.js";
import { evidenceSubmit } from "./verbs/evidence.js";
import { executorProbe, executorRegister, listExecutors } from "./verbs/executor.js";
import { grant } from "./verbs/grant.js";
import { logCheck } from "./verbs/logcheck.js";
import { recover } from "./verbs/recover.js";
import { run } from "./verbs/run.js";
import { show } from "./verbs/show.js";
import { stop } from "./verbs/stop.js";
import { verifyView } from "./verbs/verify.js";
import { workCreate } from "./verbs/work.js";

interface Args {
  positional: string[];
  flags: Map<string, string[]>;
}

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  const flags = new Map<string, string[]>();
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      const key = eq < 0 ? a.slice(2) : a.slice(2, eq);
      let value: string | undefined = eq < 0 ? undefined : a.slice(eq + 1);
      if (value === undefined && i + 1 < argv.length && !argv[i + 1]!.startsWith("--")) value = argv[++i];
      const list = flags.get(key) ?? [];
      list.push(value ?? "true");
      flags.set(key, list);
    } else {
      positional.push(a);
    }
  }
  return { positional, flags };
}

function str(args: Args, key: string): string | undefined {
  const v = args.flags.get(key);
  return v?.at(-1);
}
function bool(args: Args, key: string): boolean {
  return args.flags.has(key);
}
function num(args: Args, key: string, fallback: number): number {
  const v = str(args, key);
  if (v === undefined) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new UsageError(`--${key} must be a number`);
  return n;
}

const USAGE = `keel — Stage A control plane for one unit of work

  keel work create --spec <file.json> [--state-dir <dir>]
  keel grant [<workitem>] --allow <exec|write>:<pattern>... [--executor <alias>|*]... --attempts <n> --elapsed-seconds <s>
             [--confirm <first 8 hash chars> --approver <name>] [--prompt]
  keel run [<workitem>] [--executor <alias>] [--model <alias>] [--session-ref <ref>]
  keel stop [<workitem>] [--window-seconds <s>]
  keel recover [<workitem>] [--executor <alias>] [--retry] [--abandon]
  keel executor register --alias <a> --kind agent-cli --program <cmd> --prompt-args <arg>... [--base-args ...]
             [--model-args ...] [--resume-args ...] [--version-args ...] [--capability <c,...>]
             [--identity-ref <r>] [--channel cli-login|api-key-env|unknown] [--output-format json|json-lines|text]
             [--session-field <f>] [--cost-field <f> --cost-unit <u>] [--result-field <f>]
  keel executor probe <alias> [--timeout-seconds <s>]
  keel executor list
  keel decide [<decision> --option <key> --approver <name>]
  keel verify [<workitem>]
  keel accept [<workitem>]
  keel show [<workitem>]
  keel log check
  keel context add [<workitem>] --kind <fact|decision|inference|summary> --content <text> [--source <s>] [--limits <l>]
  keel evidence submit [<workitem>] --claim <criterion> (--run <run> --artifact <path> | --human --approver <name>)

Global: --state-dir <dir> (default ./.keel), --json
Exit: 0 done · 1 check failed · 2 usage · 3 refused by a rule · 4 waiting on a decision · 5 authority missing/inconsistent`;

function render(value: unknown, indent = ""): string {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value
      .map((v) => {
        const body = render(v, indent + "  ");
        return `\n${indent}- ${body.replace(/^\n\s*/, "")}`;
      })
      .join("");
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `\n${indent}${k}: ${render(v, indent + "  ")}`)
      .join("");
  }
  return String(value);
}

function emit(result: unknown, json: boolean): void {
  if (json) process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  else process.stdout.write(render(result).replace(/^\n/, "") + "\n");
}

async function main(argv: string[]): Promise<number> {
  const args = parseArgs(argv);
  const json = bool(args, "json");
  const stateDir = resolve(str(args, "state-dir") ?? ".keel");
  const [verb, sub, ...rest] = args.positional;
  if (!verb || verb === "help" || bool(args, "help")) {
    process.stdout.write(USAGE + "\n");
    return verb ? EXIT.DONE : EXIT.USAGE;
  }
  if (activeFaults().length > 0) process.stderr.write(`warning: test hooks active: ${activeFaults().join(",")}\n`);

  try {
    let result: unknown;
    switch (verb) {
      case "work": {
        if (sub !== "create") throw new UsageError("usage: keel work create --spec <file>");
        const spec = str(args, "spec");
        if (!spec) throw new UsageError("--spec <file.json> is required");
        result = workCreate(stateDir, resolve(spec));
        break;
      }
      case "grant": {
        const store = Store.open(stateDir);
        const wi = resolveWorkItem(store, sub);
        result = await grant(store, wi, {
          allow: args.flags.get("allow") ?? [],
          executors: args.flags.get("executor") ?? [],
          attempts: num(args, "attempts", 1),
          elapsed_seconds: num(args, "elapsed-seconds", 60),
          approver: str(args, "approver"),
          confirm: str(args, "confirm"),
          interactive: (Boolean(process.stdin.isTTY) || bool(args, "prompt")) && !json,
        });
        break;
      }
      case "run": {
        const store = Store.open(stateDir);
        const wi = resolveWorkItem(store, sub);
        result = await run(store, wi, {
          session_ref: str(args, "session-ref"),
          crash_after_effect: str(args, "crash-after-effect"),
          executor: str(args, "executor"),
          model: str(args, "model"),
          resume_session: undefined,
        });
        break;
      }
      case "stop": {
        const store = Store.open(stateDir);
        result = stop(store, resolveWorkItem(store, sub), num(args, "window-seconds", 5));
        break;
      }
      case "recover": {
        const store = Store.open(stateDir);
        result = await recover(store, resolveWorkItem(store, sub), {
          retry: bool(args, "retry"),
          abandon: bool(args, "abandon"),
          session_ref: str(args, "session-ref"),
          executor: str(args, "executor"),
          model: str(args, "model"),
        });
        break;
      }
      case "decide": {
        const store = Store.open(stateDir);
        if (!sub) {
          result = listDecisions(store);
        } else {
          const option = str(args, "option");
          if (!option) throw new UsageError("--option <key> is required");
          result = decide(store, sub, option, str(args, "approver"));
        }
        break;
      }
      case "verify": {
        const store = Store.open(stateDir);
        const { result: v } = verifyView(store, resolveWorkItem(store, sub));
        emit(v, json);
        return v.verdict === "accepted" ? EXIT.DONE : EXIT.CHECK_FAILED;
      }
      case "accept": {
        const store = Store.open(stateDir);
        result = accept(store, resolveWorkItem(store, sub));
        break;
      }
      case "show": {
        const store = Store.open(stateDir);
        result = show(store, resolveWorkItem(store, sub));
        break;
      }
      case "log": {
        if (sub !== "check") throw new UsageError("usage: keel log check");
        result = logCheck(Store.open(stateDir));
        break;
      }
      case "context": {
        if (sub !== "add") throw new UsageError("usage: keel context add [<workitem>] --kind <k> --content <c>");
        const store = Store.open(stateDir);
        result = contextAdd(store, resolveWorkItem(store, rest[0]), str(args, "kind") ?? "", str(args, "content") ?? "", str(args, "source"), str(args, "limits"));
        break;
      }
      case "evidence": {
        if (sub !== "submit") throw new UsageError("usage: keel evidence submit [<workitem>] --claim <c> ...");
        const store = Store.open(stateDir);
        result = evidenceSubmit(store, resolveWorkItem(store, rest[0]), {
          run: str(args, "run"),
          claim: str(args, "claim") ?? "",
          artifact: str(args, "artifact"),
          human: bool(args, "human"),
          approver: str(args, "approver"),
        });
        break;
      }
      case "executor": {
        // Stage B (SB-01). Source: HC-02 s1–s2; harness §2; stage-b 4.1, 4.2.
        // A registration may be the first write into a state directory.
        const store = Store.open(stateDir, sub === "register");
        if (sub === "register") {
          result = executorRegister(store, {
            alias: str(args, "alias"),
            kind: str(args, "kind"),
            program: str(args, "program"),
            capability: args.flags.get("capability") ?? [],
            identity_ref: str(args, "identity-ref"),
            channel: str(args, "channel"),
            session_support: str(args, "session-support"),
            cost_field: str(args, "cost-field"),
            cost_unit: str(args, "cost-unit"),
            base_args: args.flags.get("base-args") ?? [],
            prompt_args: args.flags.get("prompt-args") ?? [],
            model_args: args.flags.get("model-args") ?? [],
            resume_args: args.flags.get("resume-args") ?? [],
            version_args: args.flags.get("version-args") ?? [],
            output_format: str(args, "output-format"),
            session_field: str(args, "session-field"),
            result_field: str(args, "result-field"),
            prompt_via: str(args, "prompt-via"),
          });
        } else if (sub === "probe") {
          const alias = rest[0];
          if (!alias) throw new UsageError("usage: keel executor probe <alias>");
          result = await executorProbe(store, alias, num(args, "timeout-seconds", 60));
        } else if (sub === "list") {
          result = listExecutors(store);
        } else {
          throw new UsageError("usage: keel executor register|probe|list");
        }
        break;
      }
      case "rule": {
        // N-12: no verb changes a rule of the product. Source: HC-08 s1–s2; W-09.
        if (faultActive("rule-verb-exists")) {
          result = { rule: rest.join(" "), adopted: true };
          break;
        }
        throw new UsageError("no such verb: rules of the product change only through the owner's decision recorded in version history, never through a command");
      }
      default:
        throw new UsageError(`unknown verb ${verb}\n\n${USAGE}`);
    }
    emit(result, json);
    return EXIT.DONE;
  } catch (err) {
    if (err instanceof KeelError) {
      const payload = { error: err.message, exit: err.exit, source: err.source ?? null, detail: err.detail ?? null };
      if (json) process.stdout.write(JSON.stringify(payload, null, 2) + "\n");
      else process.stderr.write(`${err.message}${err.source ? `  [${err.source}]` : ""}\n`);
      return err.exit;
    }
    process.stderr.write(`keel: ${(err as Error).stack ?? String(err)}\n`);
    return EXIT.AUTHORITY;
  }
}

// Until main settles, the exit code is 5: a command that never resolves must not look like success.
process.exitCode = EXIT.AUTHORITY;
main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (err) => {
    process.stderr.write(`keel: ${(err as Error).stack ?? String(err)}\n`);
    process.exitCode = EXIT.AUTHORITY;
  },
);
