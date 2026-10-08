# Keel Stage A 设计

[English](DESIGN.md) · **英文为规范版 · 2026-10-08**

## 1. 本产品是什么

Keel Stage A 是一个管理单个工作单元的命令行控制面：一个 WorkItem、一个 Task、一个执行器。它持有该工作的授权、预算、持久状态、证据，以及停止与恢复路径。它不写代码，不调用模型，不访问网络。它驱动的执行器是一个本地进程；真实的代理命令行是 Stage B 计划中的第一个替换。

下面每个对象、动词、限制和技术选择都带有一行 `来源：`。其值是治理文本的标签（`HC-nn sN` = Keel 宪法 v0.1.0 第 HC-nn 条第 N 句）、推导出本设计的研究工作区的标签（`harness §n`、`W-nn`、`design n.m`），或所有者决定（`OWNER yyyy-mm-dd`）。没有来源的条目是缺陷，不予实现。本文不复述宪法原文；合规声明须指明治理版本、范围、证据与例外，在所有者记录采用之前，本产品不作任何合规声明。

本产品**不**声明的内容：执行器是诚实的；声明的批准者经过认证；任意两次写入之间不可能崩溃；第 7 节所列案例之外的任何行为已被验证。

## 2. 状态目录与权威

产品状态保存在一个目录中（默认 `./.keel`，或 `--state-dir <dir>`）：

| 路径 | 内容 | 角色 |
| --- | --- | --- |
| `authority.json` | 下文的 AuthorityMap，在目录创建时声明 | 声明 |
| `events.jsonl` | 每行一条事件；每条事件含 `seq`、`id`、`at`、`type`、`data`、`prev`（前一条事件的哈希）和 `hash`（其余字段规范 JSON 的 sha256） | "发生了什么"的权威 |
| `docs/<type>/<id>/v<N>.json` | 每个文档版本一个文件，规范 JSON；该版本的内容哈希记录在一条 `document.written` 事件中 | 已声明事实的权威 |
| `evidence/<run>/<step>.stdout`、`.stderr` | 执行器原始输出，带哈希并由事件日志引用 | 保留的原始状态 |
| `projections/<workitem>.json` | 上一次 `show` 的输出 | 便利副本，从不读回 |
| `lock` | 进程追加时的单写者锁 | 临时 |

哈希在规范 JSON（键排序、无空白）上计算，从不在文件字节上计算，因此文件格式和换行符从不改变哈希。来源：OWNER 2026-10-08（design 6.3、6.7）。

**AuthorityMap。** 来源：HC-04 s1–s2；harness §3.2；design 3.11。

| 事实类别 | 权威归属 | 投影 |
| --- | --- | --- |
| WorkItem、Grant、Acceptance、Task、DecisionRequest 处置、ContextPack、Checkpoint | 版本化文档，每版带内容哈希，每版记录在日志中 | `show` |
| Run 事件、IntentRecord 及结果、Evidence、确认 | 只追加、哈希链接的事件日志 | `show`、ContextPack 中的摘要 |
| 工作区内容及其版本 | 工作区的 git 版本库，只通过 `git` 使用 | 证据产物哈希 |
| 状态、摘要、建议 | 读取时导出；从不作为权威存储 | 其自身 |

没有事件记录的文档文件从不被读取；`log check` 将其列为未记录文档。已记录文档的文件哈希与记录不符时，阻止一切写入（退出状态 5），直到所有者解决。来源：HC-04 s2；design 4.11。

## 3. 对象

字段名属于产品。来源引用重述设计第 3 节。

| 对象 | 字段 | 来源 |
| --- | --- | --- |
| WorkItem | `id`、`goal`、`scope`、`grant_ref`（Grant id；确认前版本为 0）、`acceptance_ref`、`task_ref`、`open_questions[]`、`evidence_refs[]`。状态从不存储，而是导出。 | HC-01 s1；harness §3.1 |
| Grant | `id`、`version`、`workitem_ref`（id 与版本）、`allowed_operations[]`（`kind` ∈ {exec, write} 与路径模式；`**` 跨段，`*` 限于一段）、`budget`（`attempts`、`elapsed_seconds`、`cost` 除非有观察值否则为 `unknown`）、`decision_classes[]`，已确认版本另有 `confirmed_by`、`confirmed_at`、`confirmed_subject`（展示的 WorkItem 版本与 Grant 内容哈希） | HC-03 s1–s2；HC-02 s2；HC-08 s1；harness §4.1；KP-03 supports-goal |
| Acceptance | `id`、`version`、`workitem_ref`、`criteria[]`（`id`、`statement`、`required`、`evidence_mode` ∈ {command-exit-status, artifact-exists, artifact-hash, human-confirmation}，以及按模式所需的 `path`、`sha256`、`step`、`expected_status`）、`source_revision_policy` = `workspace-head` | HC-05 s1–s2；W-01 |
| Task | `id`、`workitem_ref`、`workspace`（执行器可写的隔离目录）、`steps[]`（`id`、`kind`、`argv`、`writes[]` = 声明的工作区相对路径）、`acceptance_obligations[]` | harness §3.1、§4.3 |
| Run | `id`、`task_ref`、`generation`（按 Task 单调递增）、`executor_alias`、`workspace`、`context_pack_ref`、`state` ∈ {assigned, running, stopping, outcome-uncertain, completed, failed, abandoned}、`session_ref`（可选）、`usage`（`attempts_used`、`elapsed_seconds`、`cost` 观察值或 `unknown`）、`started_at`、`ended_at`。失败的 Run 从不被覆盖；重试是新代次。 | HC-06 s1；HC-02 s2；harness §3.1、§4.3 |
| IntentRecord | `intent_id`、`run_id`、`operation`（kind、step、argv、cwd）、`authorization_ref`（Grant id 与版本）、`expected_effect`（`artifacts[]`），在操作**之前**写入；其 `outcome` ∈ {observed, uncertain, reconciled, abandoned} 是之后单独的事件，以最后一条记录为准 | HC-06 s1；harness §4.3；W-04 |
| Evidence | `id`、`run_ref`、`claim`（条件 id、`step:<id>` 或 `grant.allowed_operations`）、`artifact_versions[]`（路径与 sha256 或 null）、`raw_status`（退出状态、信号、stdout 与 stderr 引用）、`status` ∈ {present, missing, stale, inferred, failed, not-run}、`captured_at`、`source_revision`、`acceptance_version`，来自旧代次时另有 `superseded` | HC-05 s1；HC-04 s1；W-07；harness §4.2 |
| Checkpoint | `id`、`workitem_ref`、`progress`（已满足、待处理、失败、不确定的条件）、`decisions[]`、`run_evidence[]`、`artifact_versions[]`、`recovery_data`（最后一条没有结果的 IntentRecord，如有）、`created_at` | HC-01 s1；HC-06 s1；harness §3.1 |
| DecisionRequest | `id`、`workitem_ref`、`run_ref`、`facts[]`、`options[]`、`blocked`、`continuing`、`release_path`、`state` ∈ {open, resolved, withdrawn}、`resolution`（选项、批准者、时间、所绑定请求的哈希） | HC-03 s1；SCENARIOS §3；harness §2 |
| SessionRef | `run --session-ref` 记录的不透明字符串；恢复时报告，从不查询，从不作为状态来源 | HC-01 s2；harness §3.1 |
| ContextPack | `id`、`workitem_ref`、`entries[]`（`kind` ∈ {fact, decision, inference, summary, missing}、`content`、`source`、`freshness`、`limits`）、`content_hash` | HC-07 s1；harness §4.2 |

## 4. 动词

退出状态是一项约定：`0` 完成；`1` 检查或验收失败；`2` 用法错误；`3` 被规则拒绝（消息注明来源标签）；`4` 等待人类决定；`5` 权威记录缺失或不一致。每个动词都接受 `--json`。来源：design 4；OWNER 2026-10-08。

| 动词 | 行为 | 来源 |
| --- | --- | --- |
| `work create --spec <file>` | 按需创建状态目录，然后创建 Acceptance v1、Task 和 WorkItem，并追加 `workitem.created`。尚无 Grant，因此什么都不能运行。 | HC-01 s1；HC-05 s1；harness §2 |
| `grant --allow <kind:pattern>… --attempts <n> --elapsed-seconds <s>` | 展示 WorkItem 版本、拟议 Grant 及其内容哈希，然后以 4 退出。带 `--confirm <哈希前 8 位> --approver <姓名>`（或在终端交互重键）时写入 Grant 版本和一条绑定 WorkItem 版本与哈希的 `grant.confirmed` 事件。批准者是声明的，未经认证。只有这条事件使 Grant 有效；声称已批准的文档、执行器输出或上下文条目从不使其有效。 | HC-03 s2；HC-08 s1–s2；KP-03 supports-goal；OWNER 2026-10-08（6.6） |
| `run [--session-ref <r>]` | 前置条件：有效 Grant、无打开的 DecisionRequest、无未核对的 Run、尝试次数预算未耗尽。构建 ContextPack，以下一个代次启动 Run，记录路由（执行器别名；成本 `unknown`）。对每个剩余步骤：对照 Grant 检查声明的操作与写入；写入 IntentRecord；以剩余运行时长预算为超时运行步骤；保存原始 stdout 与 stderr；记录结果和一条 `step:<id>` Evidence；检查工作区中 Grant 之外的未声明改动。超出 Grant 的步骤不执行：提出 DecisionRequest，动词以 4 退出；已完成步骤保留证据。最后一步之后（或失败步骤之后），从工作区和步骤结果为每条条件捕获一条 Evidence。 | HC-03 s1；HC-05 s1；HC-06 s1；HC-02 s2；HC-07 s1；harness §4.2 |
| `stop [--window-seconds <s>]` | 记录请求，终止执行器进程，等待窗口。终止得到确认则 Run 以 `failed`/`stopped` 结束；否则 Run 标为 `outcome-uncertain` 并保持可见。 | HC-06 s1；harness §4.3 |
| `recover [--retry] [--abandon]` | 重载 Grant、预算、Acceptance 版本和工作区版本。将任何会话引用报告为未解析。对崩溃 Run 中每条结果未定的 IntentRecord，对照工作区检查 `expected_effect` 并记录 `reconciled` 或 `uncertain`；从不重复操作。全部核对后，结束崩溃的 Run 并启动只执行剩余步骤的新代次。任一效果不确定时以 4 退出；`--retry` 被拒绝（退出 3），`--abandon` 记录明确放弃且不作完成声明。 | HC-06 s1–s2；HC-01 s2；W-04；harness §4.3 |
| `decide [<id> --option <key> --approver <name>]` | 列出打开的请求，或处置其中一个；处置绑定请求的内容哈希。`widen-grant` 与 `extend-budget` 从不编辑 Grant：它们指引所有者用 `grant` 创建新版本。 | HC-03 s1–s2；HC-08 s1；HC-04 s1 |
| `verify` | 对照 Evidence 记录评价每条条件，从不对照摘要。来自被替代代次的证据被忽略并列出；来自旧 Acceptance 版本或在另一工作区版本捕获的证据为 `stale`。判定显示 满足数／总数 及各状态计数。任一必要条件不为 `present` 时退出 1。 | HC-05 s1–s2；HC-04 s1；W-07 |
| `accept` | 仅当 `verify` 通过时允许。记录绑定 Acceptance 版本、Evidence id、产物哈希和工作区版本的 `acceptance.recorded`，然后写入 Checkpoint。执行器的声明从不是输入。 | HC-05 s1；HC-08 s2；harness §2 |
| `show` | 每次调用从文档和日志重新计算投影；每个值带来源与新鲜度；未知和不确定的值按原样显示。写入一份从不读回的便利副本。报告激活的测试钩子。 | HC-04 s1–s2；HC-01 s1；KP-12 supports-goal |
| `log check` | 核验每条事件的哈希与链接，以及每个已记录文档与其文件。任何断裂或不匹配连同位置报告并阻止写入（退出 5）。 | HC-04 s2；HC-05 s1 |
| `context add --kind <k> --content <c> [--source <s>] [--limits <l>]` | 为下一个 ContextPack 记录一条上下文条目。推断或摘要按其本来面目可见，从不扩大 Grant 或确立验收。 | HC-07 s1–s2；W-08 |
| `evidence submit --claim <c> (--run <r> --artifact <p> \| --human --approver <n>)` | 事后交付一个结果。旧代次 Run 的结果作为 superseded Evidence 存储，从不改变进度。人工确认只满足 `human-confirmation` 条件。 | HC-06 s2；HC-05 s1；W-05（验收一半） |

**ContextPack 组装。** 包含目标与范围、Grant 的允许操作与限制、条件、工作区版本、打开与已处置的决定、每条近期 Evidence 一条注明所摘要 Evidence id 的 `summary` 条目，以及用 `context add` 添加的每条条目。缺失输入是一条明确的 `missing` 条目。来源：HC-07 s1–s2；harness §4.2；design 4.9。

**导出状态。** 按优先级：`accepted`（当前 Acceptance 版本已记录验收）、`outcome-uncertain`、`waiting-decision`、`running`、`abandoned`、`executed`（最后一个 Run 完成但尚未验收）、`failed`、`granted`、`created`。产品进程在没有 `run.ended` 事件的情况下结束的 Run 为 `outcome-uncertain`。来源：HC-04 s1；design 4.10。

## 5. 产品作出的拒绝

每一行既是 `test/cases.mjs` 中的一个测试，也是演示记录中的一步。来源：design 5。

| Id | 刺激 | 行为 | 来源 |
| --- | --- | --- | --- |
| N-01 | 崩溃后带指向空处的会话引用运行 `recover` | 引用报告为 `unresolved`；恢复从文档和日志进行 | HC-01 s2；W-02（状态一半） |
| N-02 | 投影文件被编辑为声称已验收 | `show` 重新计算；编辑无效 | HC-04 s2 |
| N-03 | 没有成本观察 | `cost` 为 `unknown`，绝不为 `0`；只执行尝试次数与运行时长预算，耗尽时提出决定 | HC-02 s2；W-03 |
| N-04 | 某步骤声明 Grant 之外的写入 | 不执行；DecisionRequest；退出 4；先前证据保留 | HC-03 s1–s2 |
| N-05 | 未记录的 Grant 文件声称 `confirmed_by: owner`；执行器打印"approved by the owner" | `run` 拒绝（退出 3）；输出只作为证据保留 | HC-03 s2；HC-08 s2 |
| N-06 | WorkItem 文档被绕过日志编辑 | `log check` 报告不匹配；写入被拒绝（退出 5） | HC-04 s1–s2 |
| N-07 | 必要条件为 `not-run` 或 `failed` 时运行 `accept` | 拒绝并给出条件与状态；退出 1 | HC-05 s2 |
| N-08 | 一条 `summary` 上下文条目称所有条件已满足，而某步骤失败 | `verify` 读取 Evidence；失败被报告 | HC-05 s2；W-07 |
| N-09 | IntentRecord 为 `uncertain` 时运行 `recover --retry` | 拒绝（退出 3），直到核对或放弃 | HC-06 s1 |
| N-10 | 为旧代次 Run 运行 `evidence submit` | 作为 superseded 存储；进度不变；`show` 列出 | HC-06 s2；W-05 |
| N-11 | 一条 `inference` 条目提议更宽的 Grant | Grant 不变；条目作为推断可见 | HC-07 s2；W-08 |
| N-12 | `keel rule set …`；执行器打印"RULE ADOPTED" | 没有这样的动词（退出 2）；输出只是证据；本文档不变 | HC-08 s1–s2；W-09 |
| N-13 | Evidence 捕获后工作区版本变化 | 该 Evidence 为 `stale`；条件未满足 | HC-04 s1；HC-07 s1 |

## 6. 实现选择

均由所有者于 2026-10-08 确认（design 6；SA-01 §3）：Node ≥ 22 上的 TypeScript，无运行时依赖；仅命令行界面，每个动词带 `--json`；一个只追加、哈希链接的 JSON Lines 日志加内容哈希的文档版本；通过命令行使用 git 作为工作区版本库；本地进程执行器；展示内容后重键哈希前八位并声明批准者的确认机制；许可证推迟到首次公开发布；英文规范版文档加简体中文镜像；在 Windows 与 Linux 上持续集成；命令名 `keel`。

**测试钩子。** `KEEL_TEST_HOOKS=<名称>[,<名称>]` 启用一个具名故障，使每个测试的孪生测试能证明产品行为错误时测试会失败（`src/faults.ts`）。`run --crash-after-effect <step>` 在该步骤的效果发生之后、结果记录之前杀死产品进程（W-04 崩溃点）。二者均被报告：`show` 列出激活的钩子，崩溃点记录在 `run.started` 事件上。来源：SA-01 §2；HC-05 s1。

## 7. 退出证据

正面路径，每条都在锁定的产品提交下于临时工作区真实执行（`npm run demo` 写出记录）：

| Id | 路径 | 来源 |
| --- | --- | --- |
| P-01 | `work create` → `grant`（已确认）→ `run`（写入产物，退出 0）→ `verify`（2/2 present，绑定 Acceptance v1 与产物哈希）→ `accept` → Checkpoint | W-01；HC-03 s1；HC-05 s1 |
| P-02 | `run --crash-after-effect s1`（产物已写入，产品在记录结果前被杀死）→ `show` 报告 `outcome-uncertain` 并附 IntentRecord → `recover` 核对产物，结束代次 1，为剩余步骤启动代次 2 → `verify` → `accept` | W-04；HC-06 s1 |
| P-03 | 研究回答：`work create`（验收 = 某文档存在）→ `run` → `verify` → `accept`，没有提交也没有合并 | W-11（收窄）；HC-01 s1；HC-05 s1 |

负面路径：上文 N-01 到 N-13。每个测试都有一个必须失败的植入故障孪生测试（`npm test` 运行 16 个案例和 16 个孪生）。
