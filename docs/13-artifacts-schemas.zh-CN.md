# 13 产物与 schema 参考

> 英文原文（规范版本）：[13-artifacts-schemas.md](13-artifacts-schemas.md)。本文是其简体中文镜像，两者不一致时以英文版为准。

本文档是各种布局及其相互映射的归属文档（home）：keel 在目标项目中创建什么、keel 包如何布局、哪个 schema 约束哪个产物以及哪个模板和示例对其进行说明、草稿与延后标记、以数据形式表达的迁移，以及 `scripts/validate.mjs` 覆盖哪些内容。第 3 节同时也是仓库清单：其中的表格列出 M0 骨架的每一个文件，`scripts/validate.mjs` 的 `manifest` 检查会强制执行这一点。

所有权规则、三个平面和账本（ledger）在 [04-trace-and-state.zh-CN.md](04-trace-and-state.zh-CN.md) 中说明；逐产物的单一写入者所有权见 [01-org-model.zh-CN.md](01-org-model.zh-CN.md)。本文档只给出位置和契约。

## 1. 目标项目布局

使用 keel 的项目包含的内容。路径相对于仓库根目录；`<P>` 是提案（proposal）id，例如 `P-7F3K9Q`，`<RUN>` 是运行 id，例如 `RUN-01J9Z8Q4TKXW3M5N7P2R6S8V0A`。

```text
<repo>/
  AGENTS.md                         managed keel pointer block (keel sync)
  CLAUDE.md                         @AGENTS.md bridge (keel sync)
  .agents/skills/keel-*/            skill copies (keel sync)
  .claude/skills/keel-*/            skill copies for claude-code (keel sync)
  .claude/agents/keel-<seat>.md     keel-owned agent files (keel sync)
  .opencode/agents/keel-<seat>.md   keel-owned agent files (keel sync)
  .keel/                            declared plane (committed)
    config.yaml  local.yaml (gitignored)  charter.md  goals.yaml  routing.yaml
    policies/  board/allowed_signers  signatures/  specs/  decisions/  arch/
    proposals/<P>-<slug>/           only on keel/<P>/main until land
    archive/<yyyy>/<P>-<slug>/      projections written by the archive commit
    generated.lock.json
<git-common-dir>/keel/              local control plane (never committed)
../<repo>.ws/                       workspace root: worktrees and run directories
```

| 路径 | 平面 | 格式 | 写入者 | schema |
| --- | --- | --- | --- | --- |
| `.keel/config.yaml`（+ `.keel/local.yaml`，已 gitignore） | 声明 | YAML，分层：先是包默认值，然后是团队，然后是个人；表深度合并，按 id 作键的数组整体替换，未知键视为错误 | 董事会（Board）（`local.yaml`：个人，绝不含机密） | `schemas/config.schema.json` |
| `.keel/charter.md` | 声明 | Markdown + YAML frontmatter | 董事会，签名 | `schemas/charter.schema.json` |
| `.keel/goals.yaml` | 声明 | YAML | 董事会，签名 | `schemas/goals.schema.json` |
| `.keel/routing.yaml` | 声明 | YAML，仅名称 | 董事会，签名；没有有效签名时派发会拒绝 | `schemas/routing.schema.json` |
| `.keel/policies/<name>.yaml` | 声明 | YAML | 董事会，签名 | `schemas/policy.schema.json` |
| `.keel/board/allowed_signers` | 声明 | OpenSSH allowed_signers | 董事会；变更由现有签名者签名 | 格式由 OpenSSH 确定（[14-trust-security.zh-CN.md](14-trust-security.zh-CN.md)） |
| `.keel/signatures/<blob-sha256>.<kind>.json` | 声明 | 带 ssh 签名的 JSON 分离式信封 | `keel approve`；一经签名即由 Steward 提交：提交到主干（文档、策略、回执）、`keel/<P>/main`（契约、计划、请求、裁定），或放入归档提交（落地） | `schemas/approval.schema.json` |
| `.keel/specs/<area>/spec.yaml` | 声明 | YAML | 仅由落地（land）归档提交写入 | `schemas/spec.schema.json` |
| `.keel/decisions/ADR-<5>-<slug>.md` | 声明 | Markdown + frontmatter + `## Obligations` | 在落地时晋升 | `schemas/decision.schema.json` |
| `.keel/arch/model.yaml`、`rules.yaml`、`baseline.json`、`series.jsonl` | 声明 | YAML、JSON、JSONL | 架构席位在落地时通过 `arch.delta` 写入；Steward 追加 series | `arch-model`、`arch-rules`、`arch-baseline`；`arch-report`（M4 桩） |
| `.keel/proposals/<P>-<slug>/proposal.yaml`、`intent.md`、`spec.delta.yaml`、`arch.delta.yaml`、`plan.yaml`、`workorders/T<n>.yaml`、`routing.snapshot.yaml`、`decisions/ADR-*.md` | 声明，仅在 `keel/<P>/main` 上 | 带 `keel:frozen` 标记的 YAML 和 Markdown | 每个文件一个所属席位（seat）；`routing.snapshot.yaml` 由 Steward 写入 | `proposal`、`intent`、`spec-delta`、`arch-delta`、`plan`、`workorder`、`routing-snapshot`、`decision` |
| `.keel/archive/<yyyy>/<P>-<slug>/`（提案文件、`ledger.slice.jsonl`、`evidence/`、`verdicts/`、`triage/`、`reports/`、`receipt.json`、`receipt.md`） | 声明 | 投影 | Steward（归档提交），经过投影门禁 | `ledger-event`、`evidence`、`verdict`、`triage`、`receipt` |
| `.keel/generated.lock.json` | 声明 | JSON | `keel sync` | `schemas/generated-lock.schema.json` |
| keel 自有的接入面（`AGENTS.md` 区块、`CLAUDE.md`、技能与智能体副本） | 声明 | 以 `keel:managed` 标记、generatedBy 和 sha256 生成 | `keel sync` | `schemas/generated-lock.schema.json`（锁文件） |
| `.git/keel/ledger/<yyyy-mm>.jsonl` | 控制 | 哈希链式 JSONL，在 O_EXCL 锁下单一写入者 | Steward | `schemas/ledger-event.schema.json` |
| `.git/keel/records/`（EV 缓存、VD、TR、IM）、`briefs/`、`runs/<RUN>/`、`conformance/`、`cache/`、`locks/` | 控制 | JSON、Markdown、`node:sqlite`（派生） | Steward | `evidence`、`verdict`、`triage`、`brief`、`run`、`conformance` |
| `<workspace_root>/_runs/<RUN>/inputs/`、`outbox/` | 工作区 | keel 自有的输入；O_EXCL JSON 投递文件（原始运行时输出流在内存中解析，从不写入） | Steward；席位通过 `keel api` 或 MCP 写入其发件箱 | `ack`、`result`、`verdict`、`triage`、`api-envelope` |
| `<workspace_root>/<P>.plan`、`<P>.T<n>`、`_verify/<sha7>` | 工作区 | git 工作树（worktree）；任务和验证工作树为稀疏检出（sparse checkout），不含 `/.keel/proposals/` | Steward | `schemas/claim.schema.json`（workspace 字段） |
| `refs/keel/claims/<P.Tn>`、`refs/keel/snap/<P.Tn>/<seq>` | VCS | 保存令牌的只创建型 CAS 锁 ref；影子快照 | Steward | `schemas/claim.schema.json` |
| 提交尾注（trailer） | VCS | `Keel-*` 尾注、`Not-tested` | Steward | `common.schema.json#/$defs/trailers` |
| 共享运行时设置（`.claude/settings.json`、`.gemini/settings.json`、`.qwen/settings.json`、用户全局配置） | 用户 | keel 从不读取、写入或哈希 | 用户 | 仅片段：`templates/runtime/*.snippet.tmpl` |
| `routing.yaml` 中指名的环境变量 | 用户 | 环境变量或密钥管理器 | 用户 | 仅名称：`examples/providers.env.example` |

包中的规范数据表（每个只有一个归属；TS 字面量类型、权限和 CLI 枚举自 M1 起由它们生成，`keel sync --check` 会捕获漂移（drift））：`org/reserved-actions.yaml`、`runtimes/hook-events.yaml`、`org/seats/reviewer.yaml` 中的评审镜头（lens）集，以及 `schemas/common.schema.json` 中的 id 正则 pattern 和共享枚举。

## 2. 包布局

```text
keel/
  README.md  README.zh-CN.md        bilingual summary, status, doc index
  AGENTS.md  CLAUDE.md              guide for agents developing keel
  LICENSE                           MIT, Copyright (c) 2026 Qither
  package.json  package-lock.json   @qither/keel; devDependencies only; no bin in M0
  tsconfig.json                     strict, NodeNext, ES2023, noEmit, include src
  .editorconfig .gitattributes .gitignore
  .github/workflows/ci.yml          windows-latest and ubuntu-latest, Node 22.13 and 24
  scripts/validate.mjs              the declared D1 tooling exception
  docs/                             design documents, each with a .zh-CN.md mirror; docs/adr/
  schemas/                          JSON Schema 2020-12 files and examples.map.json
  src/                              type-only TypeScript
  org/                              seat contracts, reserved actions, checkpoints
  config/                           keel.defaults.yaml
  conformance/                      scenarios.yaml
  runtimes/                         descriptors, hook-events.yaml, README.md
  skills/                           keel-{frame,design,plan,work,review}/SKILL.md
  templates/                        project/, proposal/, runtime/, prompts/
  examples/                         acme-notes golden path, providers.env.example, dashboard mock
  test/                             test plan and fixtures
```

自 M1 起的运行时依赖只有 `yaml` 和 `ajv`，不含原生插件（[adr/ADR-0002-node-windows-native.zh-CN.md](adr/ADR-0002-node-windows-native.zh-CN.md)）。在 M0 中它们是供 `scripts/validate.mjs` 使用的 devDependencies。

## 3. 产物 ↔ schema ↔ 模板/示例

下列表格是仓库清单。每行的第一个单元格列出仓库路径；它们合起来覆盖除 `package-lock.json`（仍然列出）和 `*.zh-CN.md` 镜像（与其英文规范文件列在一起）之外的每个文件。对于示例文件，`validate` 实际检查的绑定是 `schemas/examples.map.json`；这里的“示例”列指明预期的示例。

<!-- keel:manifest:start -->

### 根目录、工具与 CI

| 路径 | 类别 | 用途 |
| --- | --- | --- |
| `README.md`, `README.zh-CN.md` | 文档 | 双语概述、“仅设计与骨架”状态、文档索引 |
| `LICENSE` | 许可证 | MIT，Copyright (c) 2026 Qither |
| `package.json` | 配置 | `@qither/keel`，`type: module`，`engines.node >=22.13`，devDependencies `typescript`、`@types/node`、`ajv`、`ajv-formats`、`yaml`；scripts `typecheck`、`validate`、`check`；无 `bin`，无 `dependencies` |
| `package-lock.json` | 配置 | 锁文件，使 CI 可以运行 `npm ci` |
| `tsconfig.json` | 配置 | strict、NodeNext、ES2023、`noEmit`、`include: ["src"]` |
| `.gitignore` | 配置 | `node_modules`、`dist`、`coverage`、`**/.keel/local.yaml`、`.codegraph/` |
| `.gitattributes` | 配置 | `* text=auto eol=lf`；`*.cmd` 和 `*.ps1` 使用 CRLF |
| `.editorconfig` | 配置 | UTF-8、LF、2 个空格 |
| `AGENTS.md` | 文档 | 供开发 keel 的智能体使用的指南 |
| `CLAUDE.md` | 文档 | `@AGENTS.md` 桥接 |
| `.github/workflows/ci.yml` | 配置 | 在 windows-latest 和 ubuntu-latest 上以 Node 22.13 和 24 运行：`npm ci`、类型检查、validate |
| `scripts/validate.mjs` | 工具 | 声明的 D1 工具例外（第 6 节） |

### 设计文档

| 路径 | 归属内容 |
| --- | --- |
| `docs/README.md`, `docs/README.zh-CN.md` | 阅读顺序、文档索引、单一归属表 |
| `docs/00-vision.md`, `docs/00-vision.zh-CN.md` | 定位、需求映射、原则、术语表、端到端示例 |
| `docs/00a-owner-guide.md`, `docs/00a-owner-guide.zh-CN.md` | 所有者的单页指南 |
| `docs/01-org-model.md`, `docs/01-org-model.zh-CN.md` | 董事会、Steward、席位、所有权、升级、人员配置 |
| `docs/02-alignment.md`, `docs/02-alignment.zh-CN.md` | 对齐链、简报（brief）、ACK（复述确认）、批准、修订案（amendment）、裁定（ruling） |
| `docs/03-lifecycle.md`, `docs/03-lifecycle.zh-CN.md` | 轨道（track）、阶段、状态机、策略、活性、预算 |
| `docs/04-trace-and-state.md`, `docs/04-trace-and-state.zh-CN.md` | 平面、账本、id、提交尾注、追溯检查、RTM、投影 |
| `docs/05-vcs.md`, `docs/05-vcs.zh-CN.md` | Vcs 接口、git 机制、落地情形、保留操作、jj |
| `docs/06-parallelism.md`, `docs/06-parallelism.zh-CN.md` | 波次（wave）、认领（claim）、Windows 进程模型、集成 |
| `docs/07-architecture-intelligence.md`, `docs/07-architecture-intelligence.zh-CN.md` | 声明的与派生的架构、搜索、漂移、影响面（impact） |
| `docs/08-dashboard.md`, `docs/08-dashboard.zh-CN.md` | 只读的原生 HTML 看板（dashboard） |
| `docs/09-runtimes.md`, `docs/09-runtimes.zh-CN.md` | 生成接入面、描述符、进程派生契约、通道、梯级（rung）、一致性测评 |
| `docs/10-providers.md`, `docs/10-providers.zh-CN.md` | 仅存名称的模型提供方（provider）、暴露规则、协议、假服务 |
| `docs/11-verification.md`, `docs/11-verification.zh-CN.md` | 门禁（gate）目录、证据（evidence）、评审镜头、发现项（finding）裁决权 |
| `docs/12-cli-api-mcp.md`, `docs/12-cli-api-mcp.zh-CN.md` | 动词与模式、信封、退出码、api、MCP、钩子 |
| `docs/13-artifacts-schemas.md`, `docs/13-artifacts-schemas.zh-CN.md` | 本文档 |
| `docs/14-trust-security.md`, `docs/14-trust-security.zh-CN.md` | 威胁模型、签名卫生、暴露面画像（exposure profile）、局限 |
| `docs/15-roadmap.md`, `docs/15-roadmap.zh-CN.md` | M0 至 M8 及其退出条件 |
| `docs/16-sources-credits.md`, `docs/16-sources-credits.zh-CN.md` | 致谢、许可证、来源与形态审计 |
| `docs/17-open-decisions.md`, `docs/17-open-decisions.zh-CN.md` | 已采纳与待定的决策 |
| `docs/adr/ADR-0001-git-primary-jj-optional.md`, `docs/adr/ADR-0001-git-primary-jj-optional.zh-CN.md` | git 为主，jj 可选（D4） |
| `docs/adr/ADR-0002-node-windows-native.md`, `docs/adr/ADR-0002-node-windows-native.zh-CN.md` | Node 内置模块加 `yaml` 和 `ajv`；原生 Windows |
| `docs/adr/ADR-0003-control-plane-in-git-common-dir.md`, `docs/adr/ADR-0003-control-plane-in-git-common-dir.zh-CN.md` | 控制平面位置、哈希链、如实报告暴露面 |
| `docs/adr/ADR-0004-steward-commits-and-submit-channels.md`, `docs/adr/ADR-0004-steward-commits-and-submit-channels.zh-CN.md` | 席位从不提交；最终消息、MCP、发件箱 |
| `docs/adr/ADR-0005-signed-board-approvals.md`, `docs/adr/ADR-0005-signed-board-approvals.zh-CN.md` | `ssh-keygen -Y`、已提交的信封、agent 失败即关闭 |
| `docs/adr/ADR-0006-provider-values-by-reference.md`, `docs/adr/ADR-0006-provider-values-by-reference.zh-CN.md` | P1 不变量（invariant）与暴露规则 |
| `docs/adr/ADR-0007-declared-vs-derived-architecture.md`, `docs/adr/ADR-0007-declared-vs-derived-architecture.zh-CN.md` | keel YAML 模型加 IndexProvider 端口 |
| `docs/adr/ADR-0008-read-only-dashboard.md`, `docs/adr/ADR-0008-read-only-dashboard.zh-CN.md` | 没有第二条批准路径 |

### Schema

每个 schema 的 `$id` 都是 `https://keel.invalid/schemas/<name>.schema.json`。“约束对象”是该 schema 约束的产物；“模板”和“示例”指明用于说明的文件（如有）。

| 路径 | 约束对象 | 模板 | 示例 | 状态 |
| --- | --- | --- | --- | --- |
| `schemas/common.schema.json` | 共享 `$defs`：id 正则 pattern、共享枚举、哈希、尾注、新鲜度、源状态绑定 | 无 | `examples/acme-notes/commit-message.txt` 中的尾注 | stable |
| `schemas/examples.map.json` | 每个示例和夹具数据文件与 schema 的绑定（其本身不是 schema） | 无 | 无 | stable |
| `schemas/config.schema.json` | `.keel/config.yaml` 和 `.keel/local.yaml`（严格） | `templates/project/config.yaml` | `examples/acme-notes/.keel/config.yaml` | stable |
| `schemas/charter.schema.json` | 章程（charter）frontmatter 与 INV 义务（obligation） | `templates/project/charter.md` | `examples/acme-notes/.keel/charter.md` | stable |
| `schemas/goals.schema.json` | `.keel/goals.yaml` | `templates/project/goals.yaml` | `examples/acme-notes/.keel/goals.yaml` | stable |
| `schemas/routing.schema.json` | `.keel/routing.yaml`：配置档、席位、策略 | `templates/project/routing.yaml` | `examples/acme-notes/.keel/routing.yaml` | stable |
| `schemas/routing-snapshot.schema.json` | 每个提案的 `routing.snapshot.yaml`，在计划批准时签名 | 无（由 Steward 写入） | `examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/routing.snapshot.yaml` | stable |
| `schemas/policy.schema.json` | `.keel/policies/<name>.yaml` | `templates/project/policies/quick-patch.yaml` | `examples/acme-notes/.keel/policies/quick-patch.yaml` | stable |
| `schemas/seat.schema.json` | `org/seats/*.yaml`，包括执行类别、ACK id 集、评审镜头集、假设 | 无 | `org/seats/*.yaml` | stable |
| `schemas/reserved-actions.schema.json` | `org/reserved-actions.yaml` | 无 | `org/reserved-actions.yaml` | stable |
| `schemas/runtime-descriptor.schema.json` | `runtimes/<id>.yaml` | 无 | `runtimes/*.yaml` | stable |
| `schemas/hook-events.schema.json` | `runtimes/hook-events.yaml` | 无 | `runtimes/hook-events.yaml` | stable |
| `schemas/spec.schema.json` | `.keel/specs/<area>/spec.yaml` | 无（落地时写入） | `examples/acme-notes/.keel/specs/notes/spec.yaml` | stable |
| `schemas/spec-delta.schema.json` | `spec.delta.yaml`：按 id 的操作，带基础 `rev_hash` | `templates/proposal/spec.delta.yaml` | `examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/spec.delta.yaml` | stable |
| `schemas/decision.schema.json` | ADR frontmatter 与解析后的 `## Obligations` | `templates/proposal/decision.md` | `examples/acme-notes/.keel/decisions/ADR-7KQ2B-tag-storage.md` | stable |
| `schemas/arch-model.schema.json` | `.keel/arch/model.yaml` | `templates/project/arch-model.yaml` | `examples/acme-notes/.keel/arch/model.yaml` | stable |
| `schemas/arch-rules.schema.json` | `.keel/arch/rules.yaml` | `templates/project/arch-rules.yaml` | `examples/acme-notes/.keel/arch/rules.yaml` | stable |
| `schemas/arch-baseline.schema.json` | `.keel/arch/baseline.json` | 无 | 无 | stable |
| `schemas/arch-delta.schema.json` | `arch.delta.yaml` | `templates/proposal/arch.delta.yaml` | 无 | stable |
| `schemas/arch-report.schema.json` | 影响面、漂移与搜索报告，索引状态，序列点 | 无 | 无 | stub（M4） |
| `schemas/proposal.schema.json` | `proposal.yaml`（仅受理信号） | `templates/proposal/proposal.yaml` | `examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/proposal.yaml` | stable |
| `schemas/intent.schema.json` | `intent.md`：冻结章节、验收项（ACC）条目、契约哈希规则 | `templates/proposal/intent.md` | `examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/intent.md` | stable |
| `schemas/plan.schema.json` | `plan.yaml`（标准计划；战役（campaign）计划是 M8 桩） | `templates/proposal/plan.yaml` | `examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/plan.yaml` | stable |
| `schemas/workorder.schema.json` | `workorders/T<n>.yaml`：ACC 到命令的对照表、`frozen_tests`、`derived_from` | `templates/proposal/workorder.yaml` | `examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/workorders/T1.yaml`、`T2.yaml` | stable |
| `schemas/brief.schema.json` | 简报 JSON、章节哈希、ACK id 集 | `templates/prompts/brief.md.tmpl` | `examples/acme-notes/workspace-root/_runs/RUN-01J9Z8Q4TKXW3M5N7P2R6S8V0A/inputs/brief.md`（渲染后） | stable |
| `schemas/ack.schema.json` | ACK 载荷（OpenAI 严格子集） | 无 | `examples/acme-notes/workspace-root/_runs/RUN-01J9Z8Q4TKXW3M5N7P2R6S8V0A/outbox/0001-ack.json` | stable |
| `schemas/result.schema.json` | 席位结果，包括只读席位编写的提案文件（严格子集；按运行时内联或按路径传入） | 无 | `examples/acme-notes/workspace-root/_runs/RUN-01J9Z8Q4TKXW3M5N7P2R6S8V0A/outbox/0002-result.json` | stable |
| `schemas/verdict.schema.json` | 评审镜头的评审结论（verdict）（严格子集） | `templates/prompts/lens-*.md` | `examples/acme-notes/.keel/archive/2026/P-7F3K9Q-note-tags/verdicts/VD-5b1d2e3f4a6c.json` | stable |
| `schemas/triage.schema.json` | 规划席位的分诊记录 | 无 | 无 | stable |
| `schemas/evidence.schema.json` | EV 记录、源状态绑定、红/绿证明 | 无 | `examples/acme-notes/.keel/archive/2026/P-7F3K9Q-note-tags/evidence/EV-3a9c0e1b2d4f.json` | stable |
| `schemas/approval.schema.json` | 已签名信封（stage、doc、policy、request、rule、tofu），包括链头；裁定携带其预算上限或轨道变更 | `templates/project/signatures/README.md` | `examples/acme-notes/.keel/signatures/example.contract.json` | stable |
| `schemas/governance-record.schema.json` | 裁定（ruling）、修订案（amendment）和豁免（override）记录，降级（degraded）与未验证确认记录 | 无 | 无 | stable |
| `schemas/claim.schema.json` | 认领锁令牌与工作区 | 无 | 无 | stable |
| `schemas/ledger-event.schema.json` | 带 `prev`/`hash` 链的账本事件联合类型 | 无 | `examples/acme-notes/git-common-dir/keel/ledger.sample.json` | stable |
| `schemas/run.schema.json` | 运行记录、白名单事件、结果、暴露面画像 | 无 | 无 | stable |
| `schemas/receipt.schema.json` | `receipt.json` | `templates/proposal/receipt.md` | `examples/acme-notes/.keel/archive/2026/P-7F3K9Q-note-tags/receipt.json` | stable |
| `schemas/conformance.schema.json` | 链路与行为场景及其结果 | 无 | `conformance/scenarios.yaml` | stub（M6） |
| `schemas/generated-lock.schema.json` | `.keel/generated.lock.json` | 无 | 无 | stable |
| `schemas/api-envelope.schema.json` | CLI JSON 信封与诊断（[12-cli-api-mcp.zh-CN.md](12-cli-api-mcp.zh-CN.md)） | 无 | 无 | stable |

### 纯类型 TypeScript

| 路径 | 类型 | 状态 |
| --- | --- | --- |
| `src/index.ts` | 纯类型汇总导出（barrel） | M0 |
| `src/cli/commands.ts` | 16 个动词和 40 个模式的 `CommandSpec` 字面量联合类型、退出码 | M0 |
| `src/api/contract.ts` | `keel api` 操作类型、提交通道、信封 | M0 |
| `src/core/ids.ts` | 模板字面量 id 类型与共享枚举的字面量联合类型（正则 pattern 位于 `common.schema.json`） | M0 |
| `src/core/normalize.ts` | `NormalizationRule`、`HashInput` | M0 |
| `src/core/ledger.ts` | `LedgerEvent`、`ChainLink`、`Actor`、写入者与读取者接口 | M0 |
| `src/core/lifecycle.ts` | Track、状态、检查点阶段、`StopClass`、`BlockReason` | M0 |
| `src/core/brief.ts` | 简报 IR、`BriefSection`、`Freshness`、逐席位 ACK id 集 | M0 |
| `src/core/ack.ts` | `Ack`、`AckDiff` | M0 |
| `src/core/gates.ts` | `PhaseGate`、`CheckId`、`CheckResult`、`Readiness`（不含规则值） | M0 |
| `src/core/evidence.ts` | `EvidenceRecord`、`SourceStateBinding`、`RedGreenProof` | M0 |
| `src/core/governance.ts` | `SignedEnvelope`、`ChangeRequest`、`Approval`、`Amendment`、`Ruling`、`Override`、`StandingPolicy`、`Signer` | M0 |
| `src/core/trace-graph.ts` | 追溯节点与边、`RtmRow`、`TraceDriftKind` | M0 |
| `src/core/liveness.ts` | `LivenessHold`、`TrackRecord` | M0 |
| `src/org/seats.ts` | `SeatContract`、`ExecutionClass`、`Independence` | M0 |
| `src/vcs/vcs.ts` | `Vcs` 接口、`WorkspaceHandle`、`RefSnapshot`、`LandRequest` | M0 |
| `src/vcs/git.ts` | `GitBackend` 配置类型，以字面量类型表示的尾注键和 ref 命名空间 | M0 |
| `src/vcs/jj.ts` | `JjBackend` 特性标志 | stub（M7） |
| `src/runtime/descriptor.ts` | `RuntimeDescriptor`、`CapabilityMatrix`、`VerificationStatus` | M0 |
| `src/runtime/spawn.ts` | `WindowsResolution`、`PromptChannel`、`SubmitChannel`、`Cancellation`、`EnvAllowlist` | M0 |
| `src/runtime/exposure.ts` | `ExposureProfile`、`ProviderPathSet`（名称）、`ExposureRule` | M0 |
| `src/runtime/dispatch.ts` | `DispatchRequest`、`RunRecord`、`CanonicalRunEvent`、`Outcome` | M0 |
| `src/runtime/surfaces.ts` | `SurfaceAdapter`、`Snippet`、`GeneratedLock` | M0 |
| `src/runtime/hooks.ts` | 规范钩子事件类型 | M0 |
| `src/runtime/conformance.ts` | 场景种类、一致性测评状态（conformance status）（verified、failed、unverified） | M0 |
| `src/providers/routing.ts` | `ProviderProfile`（名称）、`AuthMode`、`DeclaredFamily`、兼容性 | M0 |
| `src/providers/env-policy.ts` | 仅 `OpaqueSecretHandle` 类型；常量在 M2 中加入；lint 允许的两个模块之一 | M0 |
| `src/providers/protocols.ts` | `ModelRequest`、`ModelResponse`、三种协议形态、`ProtocolTranslator` | M0 |
| `src/direct/client.ts` | 直连通道请求构建器类型；lint 允许的第二个模块 | stub（M6） |
| `src/arch/model.ts` | `ArchModel`、`ArchRule`、`Baseline`、`ArchDelta`、`TypedArchOp` | stub（M4） |
| `src/arch/index-provider.ts` | `IndexProvider` 端口：状态、搜索、定义、引用、依赖方 | stub（M4） |
| `src/arch/analysis.ts` | `Lifter`、`DriftFinding`、`ImpactReport`、`ChangeFeedItem`、`SeriesPoint` | stub（M4） |
| `src/dashboard/model.ts` | `DashboardModel` | stub（M5） |
| `src/mcp/tools.ts` | MCP 工具输入与输出类型 | M0 |

### 组织、配置与一致性测评数据

| 路径 | 内容 | schema |
| --- | --- | --- |
| `org/reserved-actions.yaml` | 规范的保留操作 | `schemas/reserved-actions.schema.json` |
| `org/checkpoints.yaml` | 检查点（checkpoint）阶段及每个阶段要求董事会阅读的内容 | M0 中无（固定的四阶段表） |
| `org/seats/product.yaml` | 产品席位契约 | `schemas/seat.schema.json` |
| `org/seats/architect.yaml` | 架构席位契约 | `schemas/seat.schema.json` |
| `org/seats/planner.yaml` | 规划席位契约 | `schemas/seat.schema.json` |
| `org/seats/engineer.yaml` | 工程席位契约 | `schemas/seat.schema.json` |
| `org/seats/reviewer.yaml` | 评审席位契约及唯一的评审镜头集表 | `schemas/seat.schema.json` |
| `config/keel.defaults.yaml` | 上限与阈值，各附理由；位于 `.keel/config.yaml` 之下的包默认值层 | `schemas/config.schema.json`（默认值层） |
| `conformance/scenarios.yaml` | 链路与行为场景，包括模型提供方 401 诱惑和压缩摘要 | `schemas/conformance.schema.json`（M6 桩） |

### 运行时描述符

| 路径 | 内容 |
| --- | --- |
| `runtimes/claude-code.yaml` | Claude Code 描述符 |
| `runtimes/codex.yaml` | Codex 描述符，附其探测清单（信任、`OPENAI_BASE_URL`、`windows.sandbox`） |
| `runtimes/gemini-cli.yaml` | Gemini CLI 描述符（未验证；`--policy` 探测） |
| `runtimes/qwen-code.yaml` | Qwen Code 描述符 |
| `runtimes/kimi-code.yaml` | Kimi Code 描述符（`bypass_equivalent`；验证前为梯级 D） |
| `runtimes/opencode.yaml` | opencode 描述符（GLM 与 Gemini 系列宿主） |
| `runtimes/direct.yaml` | keel 直连只读通道 |
| `runtimes/hook-events.yaml` | 规范钩子表：规范事件与原生事件、可阻断性 |
| `runtimes/README.md` | 带验证状态的能力矩阵，为读者渲染 |

所有描述符都依据 `schemas/runtime-descriptor.schema.json` 校验，`hook-events.yaml` 依据 `schemas/hook-events.schema.json` 校验；见 [09-runtimes.zh-CN.md](09-runtimes.zh-CN.md)。

### 技能

| 路径 | 席位 | 流程 |
| --- | --- | --- |
| `skills/keel-frame/SKILL.md` | product | 框定，包括 spike |
| `skills/keel-design/SKILL.md` | architect | 设计、架构增量、ADR 义务 |
| `skills/keel-plan/SKILL.md` | planner | 计划、工单（work order）、分诊 |
| `skills/keel-work/SKILL.md` | engineer | ACK、构建、提交 |
| `skills/keel-review/SKILL.md` | reviewer | 评审镜头与评审结论契约 |

### 模板

令牌约定。以 `.tmpl` 结尾的文件以及 `templates/proposal/receipt.md` 由 keel 用一个无逻辑的 Mustache 子集渲染：值、重复节与反向节以及注释，不做 HTML 转义。在 JSON 模板中，名称以 `_json` 结尾的令牌会被替换为一个 JSON 值并且不加引号写出；其他标量值按宿主格式转义。其余模板都是起始模板：keel 填入它认识的令牌，其余由董事会或所属席位替换。每个模板都在其头部注释中说明自己属于哪一类。简报模板用 `<!-- keel:brief:header -->` 标记其不参与哈希的头部，用 `<!-- keel:brief:body:start -->` 与 `<!-- keel:brief:body:end -->` 标记参与哈希的正文（哈希方式由 [02-alignment.zh-CN.md](02-alignment.zh-CN.md) 定义）。

| 路径 | 渲染为 | 约束依据 |
| --- | --- | --- |
| `templates/project/config.yaml` | `.keel/config.yaml` | `schemas/config.schema.json` |
| `templates/project/charter.md` | `.keel/charter.md` | `schemas/charter.schema.json` |
| `templates/project/goals.yaml` | `.keel/goals.yaml` | `schemas/goals.schema.json` |
| `templates/project/routing.yaml` | 带占位别名、声明的模型家族（declared family）和环境变量名称的 `.keel/routing.yaml` | `schemas/routing.schema.json` |
| `templates/project/policies/quick-patch.yaml` | 带红/绿与评审镜头谓词的常设策略（standing policy） | `schemas/policy.schema.json` |
| `templates/project/allowed_signers.example` | 董事会签名者格式 | OpenSSH allowed_signers |
| `templates/project/signatures/README.md` | 说明已提交信封的目录 | `schemas/approval.schema.json` |
| `templates/project/arch-model.yaml` | `.keel/arch/model.yaml` | `schemas/arch-model.schema.json` |
| `templates/project/arch-rules.yaml` | `.keel/arch/rules.yaml` | `schemas/arch-rules.schema.json` |
| `templates/proposal/proposal.yaml` | 提案受理信号 | `schemas/proposal.schema.json` |
| `templates/proposal/intent.md` | 带 ACC 的冻结意图（frozen intent） | `schemas/intent.schema.json` |
| `templates/proposal/spec.delta.yaml` | 规格增量 | `schemas/spec-delta.schema.json` |
| `templates/proposal/arch.delta.yaml` | 架构增量 | `schemas/arch-delta.schema.json` |
| `templates/proposal/plan.yaml` | 计划 | `schemas/plan.schema.json` |
| `templates/proposal/workorder.yaml` | 带 ACC 到命令对照表的工单 | `schemas/workorder.schema.json` |
| `templates/proposal/decision.md` | 带 `## Obligations` 的 ADR | `schemas/decision.schema.json` |
| `templates/proposal/answer.md` | spike 答复 | 无（纯文本） |
| `templates/proposal/receipt.md` | 回执（receipt）：AGENT 章节加渲染出的已签名引文 | `schemas/receipt.schema.json`（JSON 孪生文件） |
| `templates/runtime/AGENTS.block.md.tmpl` | 托管指针区块 | `schemas/generated-lock.schema.json`（锁条目） |
| `templates/runtime/CLAUDE.md.tmpl` | `@AGENTS.md` 桥接 | 锁条目 |
| `templates/runtime/claude-run-settings.json.tmpl` | 每次运行的钩子、允许的工具、拒绝规则 | keel 自有的每次运行文件 |
| `templates/runtime/claude-agent.md.tmpl` | 席位到 Claude 智能体文件 | 锁条目 |
| `templates/runtime/gemini-policy.toml.tmpl` | 每次运行的 `--policy` 文件 | keel 自有的每次运行文件 |
| `templates/runtime/kimi-agent.md.tmpl` | 每次运行的智能体文件：简报与工具允许列表 | keel 自有的每次运行文件 |
| `templates/runtime/opencode.json.tmpl` | 带 `{env:VAR}` 引用和拒绝规则的每次运行配置 | keel 自有的每次运行文件 |
| `templates/runtime/opencode-agent.md.tmpl` | 席位到 opencode 智能体文件 | 锁条目 |
| `templates/runtime/mcp.json.tmpl` | 每次运行的 MCP 注册 | keel 自有的每次运行文件 |
| `templates/runtime/claude-settings.snippet.tmpl` | 仅打印的项目设置片段 | keel 从不写入 |
| `templates/runtime/gemini-settings.snippet.tmpl` | 仅打印的片段 | keel 从不写入 |
| `templates/runtime/qwen-settings.snippet.tmpl` | 仅打印的片段 | keel 从不写入 |
| `templates/runtime/kimi-hooks.snippet.tmpl` | 仅打印的用户全局片段 | keel 从不写入 |
| `templates/prompts/brief.md.tmpl` | 唯一的简报模板 | `schemas/brief.schema.json`（JSON 形式） |
| `templates/prompts/lens-spec.md` | 框定阶段的 spec 评审镜头 | `schemas/verdict.schema.json` |
| `templates/prompts/lens-blind-diff.md` | blind-diff 评审镜头 | `schemas/verdict.schema.json` |
| `templates/prompts/lens-edge-case.md` | edge-case 评审镜头 | `schemas/verdict.schema.json` |
| `templates/prompts/lens-verification-gap.md` | verification-gap 评审镜头 | `schemas/verdict.schema.json` |
| `templates/prompts/lens-intent-alignment.md` | intent-alignment 评审镜头：仅冻结意图和 diff | `schemas/verdict.schema.json` |
| `templates/prompts/lens-architecture.md` | architecture 评审镜头 | `schemas/verdict.schema.json` |
| `templates/prompts/lens-audit.md` | audit 评审镜头：对照 diff 检查计划遵循情况与裁定 | `schemas/verdict.schema.json` |
| `templates/prompts/overlays/tier-fast.md` | 面向 fast 档位（tier）模型的更简短配方 | 无（提示词覆盖层） |

### 示例

黄金路径是虚构项目 acme-notes 中的提案 `P-7F3K9Q`（note tags）。`git-common-dir/` 代表 `<git-common-dir>`，以便控制平面样例可以被提交；`workspace-root/` 代表 `<workspace_root>`（默认为 `../acme-notes.ws/`），运行输入和 outbox 投递文件就放在那里。骨架清单曾把这些运行文件列在 `git-common-dir/keel/runs/` 下；它们改放在 `workspace-root/_runs/` 下，因为只有 `run.json`、`argv.redacted.json` 和 `events.jsonl` 属于控制平面。

| 路径 | 说明内容 | schema（格式） |
| --- | --- | --- |
| `examples/acme-notes/.keel/config.yaml` | 配置 | `config`（yaml） |
| `examples/acme-notes/.keel/charter.md` | 带 INV 的章程 1.0.0 版 | `charter`（md-frontmatter） |
| `examples/acme-notes/.keel/goals.yaml` | 目标 G-03 | `goals`（yaml） |
| `examples/acme-notes/.keel/routing.yaml` | 工程席位在 claude-code 上（env），评审席位在 opencode 上且声明的模型家族为 google，GLM 经由 opencode；仅名称 | `routing`（yaml） |
| `examples/acme-notes/.keel/policies/quick-patch.yaml` | 常设策略 | `policy`（yaml） |
| `examples/acme-notes/.keel/board/allowed_signers` | 一个假的占位签名者密钥 | OpenSSH 格式（未映射） |
| `examples/acme-notes/.keel/signatures/example.contract.json` | 带假签名的示意契约信封 | `approval`（json） |
| `examples/acme-notes/.keel/specs/notes/spec.yaml` | 需求（requirement）R-notes-4QX7B | `spec`（yaml） |
| `examples/acme-notes/.keel/decisions/ADR-7KQ2B-tag-storage.md` | 带 `## Obligations` 的 ADR | `decision`（md-frontmatter） |
| `examples/acme-notes/.keel/arch/model.yaml` | 架构元素（element） | `arch-model`（yaml） |
| `examples/acme-notes/.keel/arch/rules.yaml` | 分层以及一条禁止 web 依赖 store 的规则 | `arch-rules`（yaml） |
| `examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/proposal.yaml` | 受理信号，与 `keel/P-7F3K9Q/main` 上的一致 | `proposal`（yaml） |
| `examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/intent.md` | 带 ACC 的冻结意图 | `intent`（md-frontmatter） |
| `examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/spec.delta.yaml` | 带基础 `rev_hash` 的 MODIFIED | `spec-delta`（yaml） |
| `examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/plan.yaml` | 两个波次（wave） | `plan`（yaml） |
| `examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/workorders/T1.yaml` | 在不同家族上执行的测试先行任务 | `workorder`（yaml） |
| `examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/workorders/T2.yaml` | 带 `frozen_tests` 和 ACC 到命令对照表的构建任务 | `workorder`（yaml） |
| `examples/acme-notes/.keel/proposals/P-7F3K9Q-note-tags/routing.snapshot.yaml` | 路由快照 | `routing-snapshot`（yaml） |
| `examples/acme-notes/git-common-dir/keel/ledger.sample.json` | 以 JSON 数组表示的链式事件（自 M1 起校验 JSONL） | `ledger-event`（json-array） |
| `examples/acme-notes/workspace-root/_runs/RUN-01J9Z8Q4TKXW3M5N7P2R6S8V0A/inputs/brief.md` | 渲染后的简报；其哈希在 M1 黄金测试之前仅作示意 | 未映射（渲染后的 Markdown） |
| `examples/acme-notes/workspace-root/_runs/RUN-01J9Z8Q4TKXW3M5N7P2R6S8V0A/outbox/0001-ack.json` | 匹配的 ACK 投递文件 | `ack`（json） |
| `examples/acme-notes/workspace-root/_runs/RUN-01J9Z8Q4TKXW3M5N7P2R6S8V0A/outbox/0002-result.json` | 结果投递文件 | `result`（json） |
| `examples/acme-notes/.keel/archive/2026/P-7F3K9Q-note-tags/receipt.json` | 回执投影 | `receipt`（json） |
| `examples/acme-notes/.keel/archive/2026/P-7F3K9Q-note-tags/receipt.md` | 董事会阅读并签署的回执，由 `receipt.json` 渲染而成，其中的 Signed quote 一节取自落地信封 | 未映射（渲染后的 Markdown） |
| `examples/acme-notes/.keel/archive/2026/P-7F3K9Q-note-tags/verdicts/VD-*.json` | 回执中列出的每一份跨家族评审结论：spec、计划阶段的 verification-gap、测试任务的 verification-gap、blind-diff 以及构建阶段的 verification-gap | `verdict`（json） |
| `examples/acme-notes/.keel/archive/2026/P-7F3K9Q-note-tags/evidence/EV-*.json` | 带源状态绑定的运行器证据：测试任务为红（`verify.test-red`），构建任务为绿 | `evidence`（json） |
| `examples/acme-notes/commit-message.txt` | 展示全部尾注的 Steward 提交 | `common#/$defs/trailers`（示意文本） |
| `examples/providers.env.example` | 仅占位变量名称 | 未映射（名称列表） |
| `examples/dashboard/sample.html` | 静态原生 HTML 模型；M5 外壳与 CSS 延后 | 未映射（HTML） |

### 测试

| 路径 | 内容 | schema（格式） |
| --- | --- | --- |
| `test/README.md` | 测试计划：假件、环境变量剥离、录制的输出流、负对照 | 无 |
| `test/fixtures/fake-providers.yaml` | 回环的 anthropic-messages、openai-chat 和 openai-responses 假服务加一种 401 模式，`sk-fake-keel-*` 密钥 | 未映射：列入 `schemas/examples.map.json` 的 `unmapped_ok`（格式归 M2 测试框架所有） |
| `test/fixtures/env-strip.yaml` | 从子进程中剥离的环境变量前缀 | 未映射：列入 `schemas/examples.map.json` 的 `unmapped_ok`（格式归 M2 测试框架所有） |

<!-- keel:manifest:end -->

## 4. 草稿与延后标记

M0 为 M1 至 M3 的产物提供完整的 schema 和类型，并为 M4 及以后提供单行的延后桩（stub）。每个延后或未验证的项目都有标记，以便读者和 `validate` 能加以区分：

| 位置 | 标记 | 含义 |
| --- | --- | --- |
| JSON Schema 根或 `$defs` 条目 | `"x-keel-status"`：`"stable"`、`"draft"` 或 `"stub"` | `stub`：形态只是占位；在该里程碑之前不产出产物 |
| JSON Schema 根或 `$defs` 条目 | `"x-keel-milestone": "M4"`（M0 至 M8、M1a、M1b） | 使该 schema 成为现实的里程碑 |
| JSON Schema 根（Markdown 产物） | `"x-keel-sections"`（charter、decision、intent）与 `"x-keel-frozen-markers"`（intent） | 正文必需的二级标题（按顺序）以及冻结块标记；`validate` 会据此检查已映射的 Markdown 示例 |
| TypeScript 文件 | 开头 TSDoc `@packageDocumentation` 块中的 `@status deferred:M4` | 类型的存在只是为了固定名称；在该里程碑之前可以自由更改 |
| 运行时描述符字段 | `verification_status`：`unverified`、`documented`、`probed` 或 `verified` | 见 [09-runtimes.zh-CN.md](09-runtimes.zh-CN.md) 第 2 节 |
| 文档 | “verify by probe”（中文镜像中写作“待探测验证”） | 未经确认的运行时、CLI 或 jj 事实 |
| 文档 | “(M4)”、“from M3”（中文镜像中写作“（M4）”、“自 M3 起”） | 某项行为到来的里程碑 |

M0 中的延后项：

- 桩：`schemas/arch-report.schema.json` 和 `src/arch/*.ts`（M4），`src/dashboard/model.ts`（M5），`schemas/conformance.schema.json` 和 `src/direct/client.ts`（M6），`src/vcs/jj.ts`（M7），`schemas/plan.schema.json` 中的战役计划（M8）；
- 完全不提供：建议性的 git/jj 垫片和可选的 `commit-msg` 钩子（M2），以及看板（dashboard）HTML 外壳和 CSS（M5；M0 只有 `examples/dashboard/sample.html`）；
- 仅作示意：示例运行中的简报哈希（直到 M1 黄金测试）以及以 JSON 数组形式表示的账本样例（自 M1 起校验 JSONL）。

## 5. 以数据形式表达的迁移

schema 会演进；迁移是声明式数据，而绝不是改写历史的代码（“迁移即数据”的思路来自 BMAD-METHOD）。

- 每条带版本的记录都携带其 schema 版本：账本事件携带 `v`（见 [04-trace-and-state.zh-CN.md](04-trace-and-state.zh-CN.md)），JSON 信封携带 `v`，生成的文件在锁文件中携带其生成器版本。
- 一次迁移是一条数据记录，指明 `from` 和 `to` 版本、适用的 schema，以及一组字段操作（重命名、带默认值地添加、重映射某个枚举值、删除）。任何迁移都不运行任意代码。
- 账本行从不被改写，因为哈希链以及已签名信封中的链头会因此断裂。读取者在读取时使用迁移记录对旧事件进行向上转换。
- 董事会签过名的声明平面文件，通过产生新的字节和新的签名来迁移：Steward 提议迁移后的文件，董事会用 `keel approve --doc` 签名，然后由一次治理提交让它落地。旧签名对旧字节仍然有效。
- 派生数据（`.git/keel/cache/`、`trace.db`、索引）会被重建，从不迁移。
- M0 不提供任何迁移文件；M1 之后的第一次 schema 变更会引入迁移目录及其 schema。

## 6. validate 覆盖范围与 D1 工具例外

D1：M0 交付文档和骨架，不含产品逻辑，也没有 `bin`。唯一声明的工具例外是 `scripts/validate.mjs`。它检查骨架且不含产品逻辑；它从不打开可能保存模型提供方值或凭据的文件，只按名称报告此类文件。

```sh
npm run check                                    # typecheck + validate (what CI runs)
node scripts/validate.mjs                        # all checks
node scripts/validate.mjs --only schemas,examples,strict,i18n,audit,manifest
```

输出为 `<check>: <passed>/<total> <unit>`，后跟 `x <error>` 行；任何错误都以退出码 1 结束，参数错误以退出码 2 结束。

| 检查 | 覆盖 | 不覆盖 |
| --- | --- | --- |
| `schemas` | 在一个 Ajv 2020 实例（strict 模式，`ajv-formats`）中对每个 `schemas/*.schema.json` 及每个 `$defs` 条目做元校验并编译，因此跨文件的 `$ref` 必须能解析；检查 `$id` 和 `$schema` | 任何 schema 都无法表达的语义规则（例如契约哈希的计算） |
| `examples` | 按格式（`yaml`、`json`、`jsonl`、`json-array`、`md-frontmatter`）校验 `schemas/examples.map.json` 中的每个条目；`examples/` 和 `test/fixtures/` 下的每个 YAML/JSON/JSONL 文件都必须被映射，或附理由列入 `unmapped_ok`；有 schema 的包数据表（`org/reserved-actions.yaml`、`org/seats/*.yaml`、`runtimes/*.yaml`、`config/keel.defaults.yaml`、`conformance/scenarios.yaml`）也已映射并会被校验；已映射的 `md-frontmatter` 文件还必须按顺序带有其 schema `x-keel-sections` 中的二级标题（intent 须位于 `x-keel-frozen-markers` 区域内） | 这些标题之外的 Markdown 正文内容、HTML、`.txt`、`.example` 文件、渲染后的简报；M0 中没有 schema 的 `org/checkpoints.yaml` |
| `strict` | 标记为 `"x-keel-strict-subset": true` 的 schema（ack、result、verdict）及其经 `$ref` 触及的一切所遵循的 OpenAI 严格子集 | 超出该子集的模型提供方特定限制（逐端点待探测验证） |
| `i18n` | `docs/` 下的每个 `.md`、根目录 `README.md`、`runtimes/README.md` 以及 `test/README.md` 都有一个标题层级序列完全相同的 `.zh-CN.md` 镜像；没有孤立的镜像 | 翻译质量；其他 Markdown（模板、技能、智能体指南） |
| `audit` | D2 术语列表（在路径和内容中）、P1 密钥形态标记、真实的模型提供方 API 主机、`docs/**`、`README*.md` 和 `AGENTS.md` 之外的非占位 URL 主机、禁止的凭据文件名；D1：`package.json` 中没有 `bin` 和 `dependencies`，且每个 `src/` 文件都只含纯类型语句 | 含义：一个错误但只使用了允许词汇的设计也会通过 |
| `manifest` | 第 3 节标记表格中的每个路径都存在，并且除 `package-lock.json` 和 `*.zh-CN.md` 之外的每个仓库文件都被覆盖 | “用途”文本是否准确 |

`npm run typecheck`（`tsc --noEmit -p tsconfig.json`）覆盖 TypeScript：strict 模式、NodeNext 模块解析、`verbatimModuleSyntax` 和 `isolatedModules`。它与 `audit` 检查一起强制 `src/` 只包含 `import type`、`export type`、类型别名、接口、`export {}` 和注释。

M0 中按设计不在任何地方覆盖的内容：行为。没有产品代码可供测试；M1a 的退出条件（[15-roadmap.zh-CN.md](15-roadmap.zh-CN.md)）开启 [11-verification.zh-CN.md](11-verification.zh-CN.md) 中描述的可执行测试。
