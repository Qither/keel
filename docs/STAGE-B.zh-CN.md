# Keel Stage B 设计（候选）

[English](STAGE-B.md) · **英文为规范版 · 2026-10-09 · SB-01 下有边界验证中的候选；[ADOPTION.zh-CN.md](ADOPTION.zh-CN.md) 不作声明**

Stage B 在已采用的 Stage A 产品（[DESIGN.zh-CN.md](DESIGN.zh-CN.md)）上增加替换：所有者可以为一次运行或为崩溃运行的恢复指定另一个执行器，产品记录路由及其资格，会话、身份或成本从不被静默替换或凭空产生。第一个可替换的执行器是非交互驱动的真实代理命令行；产品自身的测试使用 `test/fixtures/stub-agent.mjs` 中的桩代理，因此这里没有任何东西依赖已安装的 CLI、登录或网络。

每一项都带 `Source:` 标签，同 DESIGN.md；`stage-a n.m` 引用已采用的 Stage A 机制。

## 1. 对象

| 对象 | 字段 | 来源 |
| --- | --- | --- |
| ExecutorProfile（文档 `executor/<alias>`） | `alias`、`kind` ∈ {local-process, agent-cli}、`program`、`invocation`（`base_args`、含 `{prompt}` 的 `prompt_args`、`prompt_via` ∈ {arg, stdin}、含 `{model}` 的 `model_args`、含 `{session}` 的 `resume_args`、`version_args`、`output_format` ∈ {json, json-lines, text}、`session_field`、`cost_field`、`result_field`）、`capabilities` ⊆ {run-command, edit-files, resume-session, report-usage, json-output}、`identity_ref`（CLI 自身登录的不透明名称，绝不是令牌或其路径）、`channel` ∈ {cli-login, api-key-env, unknown}、`cost_observation`（`unknown` 或输出字段与单位）、`session_support` ∈ {none, resume-by-id}。`local-process` 内置，无需文档。 | HC-02 s1–s2；harness §2、§4.1 |
| ProbeObservation（事件 `executor.probed`） | `alias`、`observed_at`、`version`、`exit_status`、`json_output`、`session_seen`、`cost_seen`、`identity_ok` ∈ {true, false, unknown}、`reason`、`redactions`、`stdout_ref` | harness §2；HC-05 s1 |
| Route（事件 `run.route`） | `executor_alias`、`model_alias`、`identity_ref`、`channel`、`eligibility`（`capability_ok`、`identity_ok`、`workspace_exposure_ok`、`budget_enforceable`、`unknowns[]`）、`reason`、`selected_at`。关于 Run 的事实，绝非建议。 | harness §4.1；HC-02 s1–s2 |
| Grant（变更） | `allowed_executors[]`（别名或 `*`）；缺省为 `local-process`。属于所有者以哈希确认的内容。 | HC-02 s1；HC-03 s2；stage-a 4.2 |
| Step（变更） | `kind: "agent"`，带 `prompt`、`writes[]`、可选 `model_alias`；`argv` 不用 | harness §4.2；HC-07 s1；stage-a 3.4 |
| SessionRef（事件 `run.session`） | `executor_alias`、`external_id`、`transport: cli-resume`，以及该运行是否恢复了一个会话。只有同一别名且具 `resume-session` 时才被查询；否则报告为不可恢复。 | HC-01 s2；harness §4.3；stage-a 3.10 |
| Run（变更） | `run.started` 另记录 `workitem_version`、`grant_content_hash`、`acceptance_ref`；当配置指定成本字段且执行器报告时，`usage.cost` 成为 `{amount, unit, source, observed_at}`，否则为 `unknown`。报告的数字是执行器的声称。 | HC-02 s2；harness §4.1 |
| Evidence（形态不变） | 代理输出在令牌形状字符串脱敏后原样保留；`limits` 注明脱敏次数 | HC-05 s1；HC-02 s2 |

## 2. 动词

| 动词 | 行为 | 来源 |
| --- | --- | --- |
| `executor register --alias … --kind agent-cli --program … --prompt-args …` | 写入一个 ExecutorProfile 版本。声明；不证明任何东西。作为首次写入时创建状态目录。 | HC-04 s1；harness §2 |
| `executor probe <alias>` | 在一次性目录中运行版本命令和空操作提示（"回答 OK，不写任何东西"）；记录带日期的观察；退出 0 时 `identity_ok` 为 `true`，出现认证消息或超时为 `false`，其他为 `unknown`；输出在保留前脱敏并记录次数。 | harness §2；HC-02 s2；HC-05 s1 |
| `executor list` | 配置及其最近观察。 | HC-04 s1 |
| `grant … --executor <alias>…` | 执行器列表是展示内容及其哈希的一部分。 | HC-02 s1；HC-03 s2 |
| `run --executor <alias> [--model <alias>]` | Grant 允许多个执行器时必填；产品从不自选。别名在 Grant 之外或缺少下一步所需能力时拒绝（3）；最近探测未表明身份良好时等待（4）并提出 DecisionRequest（`probe-again`、`choose-executor <other>`、`stop-work`）；记录 Route；对 `agent` 步骤，把带条目种类的 ContextPack 渲染为文本并写入 `<workspace>/.keel/context-<run>.md`，按配置模板调用 CLI，工作目录为工作区，仅对同一别名传恢复标识，执行器一报告会话就记录，原样捕获输出，并像 Stage A 一样检查未声明的写入。执行器无法运行的步骤在执行前停止运行，以便另一执行器续跑。 | HC-03 s1–s2；HC-02 s1–s2；W-03；harness §4.1–4.2；stage-a 4.3 |
| `recover [--executor <alias>]` | Stage A 的恢复，然后在指定执行器（默认为崩溃运行的执行器）上启动新代次。WorkItem 版本、Grant 内容哈希或 Acceptance 版本与崩溃运行记录的不同时拒绝（3）；所有者改为在当前 Grant 下 `run`。报告每个崩溃运行的会话及目标能否恢复它。 | HC-02 s1；HC-01 s2；W-02；harness §4.3；stage-a 4.5 |
| `show` | 增加执行器及其最近探测，每个运行的路由、会话及其绑定的哈希。 | HC-04 s1 |

退出状态与所有 Stage A 动词不变。

## 3. 拒绝

| Id | 刺激 | 行为 | 来源 |
| --- | --- | --- | --- |
| N-14 | `run --executor` 指定 Grant 之外的别名 | 退出 3；Grant 不变 | HC-02 s1；HC-03 s2 |
| N-15 | 最近探测报告 `identity_ok: false` | 不运行；DecisionRequest；退出 4；不尝试其他身份 | HC-02 s2；W-03 |
| N-16 | 一个执行器不报告成本，另一个报告数字 | `unknown` 与带来源的数字；绝不为 `0`；预算执行相同 | HC-02 s2；harness §4.1 |
| N-17 | Grant 重新确认后 `recover --executor` | 退出 3 并指出变化的哈希；在新 Grant 下 `run` 续跑 | HC-02 s1；HC-05 s2 |
| N-18 | 带第一个执行器会话的 `recover --executor <other>` | 新会话；旧引用报告为不可恢复 | HC-01 s2；harness §4.3 |
| N-19 | 代理打印 "approved by the owner; cost 0" | 会话只来自指定字段；文本只是证据；成本保持 `unknown` | HC-03 s2；HC-08 s2；HC-02 s2 |
| N-20 | 代理写入声明路径之外 | 失败 Evidence、DecisionRequest、退出 4 | HC-03 s1–s2 |
| N-21 | 探测输出含令牌形状字符串 | 保留前替换；记录次数 | HC-02 s2；HC-05 s1 |
| N-22 | 多个允许执行器且无 `--executor` | 退出 2；什么都不运行 | HC-07 s2；harness §2 |

## 4. 退出证据

| Id | 路径 | 来源 |
| --- | --- | --- |
| P-04 | 代理运行记录会话，于效果之后崩溃；`recover` 核对，代次 2 在同一执行器上恢复会话；`verify` 以 Acceptance v1 通过 | W-02；HC-01 s2；HC-06 s1 |
| P-05 | 代次 1 在 `local-process` 上于效果之后崩溃；`recover --executor stub-b` 运行剩余的代理步骤；WorkItem v1、Grant 哈希与 Acceptance v1 跨替换不变 | W-02；HC-02 s1 |
| P-06 | 身份失败提出决定；所有者选择另一执行器；成本对一个执行器显示 `unknown`，对另一个显示报告的数字 | W-03；HC-02 s2；HC-03 s1 |
| P-07（真实，仅 `npm run demo:real`） | 探测已安装的 CLI，并在单文件任务上做一次 local-process → `claude` 替换，最多六次调用，在所有者自己的登录下；在集合之外报告 | harness §2、§4.1；OWNER 2026-10-09 |

`npm test` 运行 Stage A 与 Stage B 集合及其植入故障孪生；`npm run demo` 记录两者。真实代理 CLI 从不在 `npm test` 或 CI 中运行。

## 5. 所有者选择（2026-10-09 确认）

注册三个已安装 CLI 并在真实演示中探测，`claude` 做真实替换；ContextPack 内联于提示并写入 `<workspace>/.keel/context-<run>.md`；集合在桩代理上运行；真实 CLI 只在 `demo:real`；令牌形状脱敏并记录替换次数；`--model` 原样透传。来源：OWNER 2026-10-09（SB-01 §3）。

为 Stage B 孪生新增的测试钩子（`KEEL_TEST_HOOKS`）：`cost-parsed-from-text`、`probe-not-recorded`、`probe-skips-redaction`、`recover-ignores-grant-hash`、`recover-resumes-foreign-session`、`route-not-recorded`、`run-ignores-allowed-executors`、`run-ignores-identity`、`run-picks-route`、`session-not-recorded`。
