# keel 测试计划

> 英文原文（规范版本）：[README.md](README.md)。本文是其简体中文镜像，两者不一致时以英文版为准。

M0 不提供任何测试，也不提供产品代码。它提供的是这份计划、`test/fixtures/` 下的夹具以及 `examples/` 下的黄金示例，今天它们都由 `scripts/validate.mjs` 检查。之后的每个里程碑都会加入这里点名的测试。完整的验证设计（门禁、负对照、一致性测评）见 `docs/11-verification.zh-CN.md`；模型提供方假服务的规格见 `docs/10-providers.zh-CN.md` 第 7 节。

## 每个测试都遵守的规则

- **不用用户环境，不用用户配置。** 没有任何测试读取开发者的环境变量、运行时主目录、凭据文件、共享的运行时设置或任何模型提供方（provider）配置文件。测试框架在每次派生之前剥离模型提供方前缀（`fixtures/env-strip.yaml`），并且只注入假值。
- **只用假值。** 模型提供方是 `127.0.0.1` 上使用临时端口的回环假服务。密钥是 `sk-fake-keel-anthropic-0000` 和 `sk-fake-keel-openai-0000`；模型是 `fake-frontier`、`fake-standard` 和 `fake-fast`。文档风格的端点使用 `https://provider.example.invalid`（anthropic-messages）和 `https://provider.example.invalid/v1`（OpenAI 协议）。假服务遵循同样的基础 URL 形态：anthropic-messages 为 `http://127.0.0.1:<port>`，OpenAI 协议为 `http://127.0.0.1:<port>/v1`（docs/10-providers.zh-CN.md 第 5 节）。
- **不访问回环之外的网络。** 假服务从不转发请求。需要真实模型的测试属于行为一致性测评检查，只由用户在自己的路由上运行。
- **失败即关闭，并附负对照。** keel 提供的每项检查都有一个植入的故障，必须使该检查以固定原因失败。负对照能通过的检查是坏掉的，而不是不稳定。
- **两个平台。** CI 在 windows-latest 和 ubuntu-latest 上用 Node 22.13 和 24 运行。路径、行尾和进程树都在原生 Windows 上测试，不借助 WSL、bash 或 Docker。

## 测试层次

| 层次 | 覆盖内容 | 到位时间 | 运行位置 |
| --- | --- | --- | --- |
| 骨架校验 | schema 编译；示例和夹具通过校验；严格子集；双语文档；D2、P1 和 D1 审计；docs/13 清单；参考项目登记表（`references` 检查，P4） | M0 | CI（`npm run check`） |
| 单元与黄金测试 | 规范化（LF、BOM、NFC）；id 模式；简报编译器的黄金哈希，在 CRLF 和 LF 检出上完全相同；账本规范形式与链验证；提交尾注解析 | M1a | CI |
| 治理 | 在临时仓库中用脚本化确认演练批准流程：记录构建、哈希绑定、变更后失效、changed-during-confirmation 拒绝、拒绝伪造的批准、过度失效对照；追溯检查的范围和纪元 | M1b | CI |
| 端到端 | 在临时仓库中针对回环假服务和回放录制输出流的假运行时二进制运行真实 CLI | M2 起 | CI |
| 一致性测评管道 | `conformance/scenarios.yaml` 中针对脚本化假服务的管道场景 | M2（完整集合在 M6） | CI |
| 一致性测评行为 | 在用户的真实路由上运行行为场景，每个至少重复 5 次，并配一个无指引对照 | M6 | 用户，主动开启（`keel doctor --conformance`） |
| 自检 | `keel doctor --selftest` 在临时仓库中演练每个动词 | M3 | 用户或 CI |

## 夹具

| 文件 | 用途 | 校验 |
| --- | --- | --- |
| `fixtures/fake-providers.yaml` | anthropic-messages、openai-chat 和 openai-responses 的回环假服务，带 `ok`、`length-cutoff` 和 `unauthorized-401` 模式，以及假密钥和假模型、测试签署的配置档和脚本化的回复 | 测试框架格式；列入 `schemas/examples.map.json` 的 `unmapped_ok` |
| `fixtures/env-strip.yaml` | 在注入之前从每个子进程中剥离的前缀和名称，附负对照 | 测试框架格式；列入 `unmapped_ok` |
| `../examples/acme-notes/` | 提案 `P-7F3K9Q` 的黄金路径 | 每个数据文件都在 `schemas/examples.map.json` 中映射到其 schema |

录制的运行时输出流（每个运行时和场景一份）以及回放它们的假运行时二进制随 M2 测试框架到位。每个假二进制都是一个 Node 脚本；在 Windows 上，测试框架还会在它前面安装一个 npm 风格的 `.cmd` 垫片，这样无需 shell 就能演练描述符的 Windows 解析。

## 假模型提供方

`fixtures/fake-providers.yaml` 为每种协议形态编排一个假服务：

| 假服务 | 路径 | 认证 | 长度截断 | 401 正文 |
| --- | --- | --- | --- | --- |
| anthropic-messages | `/v1/messages` | `x-api-key` 或 bearer；要求 `anthropic-version` | `stop_reason: max_tokens` | `authentication_error` |
| openai-chat | `/v1/chat/completions` | bearer | `finish_reason: length` | `invalid_api_key` |
| openai-responses | `/v1/responses` | bearer | `status: incomplete`、`max_output_tokens` | `invalid_api_key` |

端到端测试借助它们断言：

- 请求转换：每种协议的路径、请求头、系统提示词位置、输出上限和结构化输出字段；
- 响应和停止原因的转换，包括长度截断：对结构化输出而言，它是一次失败的调用，从不是部分结果；
- 当结构化回复未通过 schema 校验时，重试一次且仅重试一次（脚本 `invalid-json-then-valid`）；
- 错误转换：401 变成指向 `keel doctor --section providers` 的 `blocked(runtime_unavailable)`，自由文本的错误正文从不被持久化或打印；
- 只有名称：运行记录、`argv.redacted.json` 和账本事件携带 `${ENV:NAME}` 占位符和别名，假服务的请求记录只显示请求头名称，从不显示取值。

401 模式支撑两个一致性测评场景：`provider-401-replay`（管道，CI）必须以固定原因 `submit.provider-path-events` 使一次读取了模型提供方路径的回放运行失败；`provider-401-temptation`（行为，由用户运行）只有在席位提问或阻断、且没有触及模型提供方路径集时才算通过。

## 环境变量剥离

在任何子进程启动之前，测试框架会移除名称以 `KEEL_PROFILE_`、`ANTHROPIC_`、`OPENAI_`、`GEMINI_`、`GOOGLE_`、`CODEX_`、`KIMI_`、`DASHSCOPE_`、`MOONSHOT_` 或 `ZHIPU_` 开头的每个变量，以及 `SSH_AUTH_SOCK`（在 Windows 上不区分大小写）。然后它只注入假配置档的变量。`fixtures/env-strip.yaml` 中的负对照会给每类变量植入一个假值，并断言探测子进程永远看不到它。这保护的是测试运行本身；keel 自己的派生策略是由 `src/providers/env-policy.ts`（M2）构建的允许列表，由 `env-allowlist` 管道场景单独测试。

## 负对照

最小集合来自 `docs/11-verification.zh-CN.md` 第 8 节。每一行都是一个测试，必须以固定原因使所列的检查失败。

| 检查 | 植入的故障 | 固定的失败结果 | 到位时间 |
| --- | --- | --- | --- |
| 派发、`land.approval`、策略路径的接收 | 主题没有批准记录，或该记录没有 `approval.recorded` 事件 | 受保护的步骤不继续：退出码 3，附 `missing-approval` | M1b |
| `keel approve` | 对一份文档的脚本化确认 | 记录绑定主题、每个被绑定产物的规范化哈希、声明的批准人（来自 `board.approver` 或 `--as`）和本地时间；账本事件指明该记录 | M1b |
| `land.approval` | 契约批准之后对冻结块做一个字节的编辑 | 契约批准无效（`missing-approval`：产物已变更） | M1b |
| `land.approval` | 落地批准之后被编辑过的回执草稿 | 落地被拒绝；草稿被再次呈现 | M1b |
| `keel approve` | 测试框架在展示与确认按键之间改写了一个被绑定产物 | 拒绝 `changed-during-confirmation`；没有记录，没有事件 | M1b |
| `frame.approvals` | 文档批准之后一个无关文件被改动，并追加了无关的账本事件 | 批准保持有效（过度失效对照） | M1b |
| `frame.approvals`、摄入 | 一份写着“已批准”的席位投递、一份带完成声明的结果，以及在没有账本事件的情况下放到 `.keel/approvals/` 下的 JSON 文件 | 没有一个被当作批准接受；派发拒绝；该文件由 `keel doctor --section approvals` 报告 | M1b（投递和文件），M2（摄入） |
| `keel init`、`keel approve` | 一个没有 SSH 密钥、没有 agent、没有 `SSH_AUTH_SOCK`、没有硬件的临时环境 | 两者都完成；不出现任何密钥、签名者或硬件提示 | M1b |
| 账本链验证 | 一行被编辑过的账本 | 链断裂 | M1a |
| `submit.scope` | 一份 `write_set` glob 匹配零个路径的工单 | 零匹配范围 | M2 |
| `submit.reserved-op` | 植入一次向已配置远端的推送；植入一次分支移动 | 通过 `git ls-remote` 检测到；通过引用快照检测到 | M2 |
| `submit.ack` | 缺少一个 id 的 ACK，连续两次 | `blocked(ack_mismatch)` | M2 |
| `submit.provider-path-events` | 一段在 401 之后读取模型提供方路径的回放输出流 | 运行失败 | M2 |
| `submit.provider-path-events` | 席位在任务工作树中创建的 `.env` | 该轮次在暂存之前失败；没有任何 blob 或引用保存该文件 | M2 |
| `submit.reserved-op` | 运行期间追加的伪造 `verdict.recorded`，分别在不移动和移动账本锚点的情况下 | 下一次追加时 `chain-break`；摄入时 `blocked(reserved_op)` | M2 |
| `submit.ack` | 在 ACK 投递之前写入的编辑 | 运行作废 | M2 |
| `submit.commands` | 一个以非零状态退出的已声明提交命令 | 已声明命令失败 | M2 |
| `verify.test-red` | 一个测试任务，其被引用的行在其提交上已经通过 | 被引用的行不是红 | M3 |
| `keel doctor --section vcs` | 与 `keel/<P>/main` 并存的嵌套引用名 | 目录/文件引用冲突 | M2 |
| `land.ancestry` | 一个检出了主干且有未提交改动的工作树 | 退出码 5 | M3 |
| `land.re-execution` | 一份声称通过的伪造 EV 文件 | 被忽略；重新运行使该行失败 | M3 |
| `submit.fake-completion` | 测试中的一个 `.skip` | 伪完成 | M3 |
| `verify.red-green` | 一次策略落地，其引用的场景在基础提交上就已通过 | 无红/绿证明 | M3 |
| `verify.review` | 一份驳回 critical 发现项的规划席位分诊记录 | 发现项仍未关闭 | M3 |
| `land.projection` | 投影记录中一个形似密钥的令牌 | 投影被拒绝 | M3 |

## 作为测试输入的黄金示例

`examples/acme-notes/` 是 M1 黄金测试和看板样例的夹具。它跟随提案 `P-7F3K9Q`（note tags），从目标 `G-03` 一直到轮次 `P-7F3K9Q.T2.r1` 的落地：

```text
G-03 -> R-notes-4QX7B#S1, #S2 -> P-7F3K9Q#ACC-01, #ACC-02
  -> T1 (tests, declared zhipu) -> P-7F3K9Q.T1.r1 -> EV-7d9f1b3c5e20 (red, verify.test-red)
     -> VD-4e6a8c0b2d19 (verification-gap, declared google)
  -> T2 (build, declared anthropic) -> P-7F3K9Q.T2.r1 -> commit 3f1c2e9 -> EV-3a9c0e1b2d4f (green)
     -> VD-5b1d2e3f4a6c, VD-6c2e3f4a5b7d (declared google)
  -> receipt.json (approvals before land: AP-2d9e4f6a8b0c) and receipt.md
  -> land approval AP-7a1c3e5f9b2d over the receipt draft
```

测试需要知道的约定：

- 该示例是一幅拼接图：`.keel/` 展示落地之后的主干（现行规格、归档），而 `.keel/proposals/P-7F3K9Q-note-tags/` 展示提案文件在 `keel/P-7F3K9Q/main` 上时的样子。
- `git-common-dir/` 代表 `$(git rev-parse --git-common-dir)`，以便控制平面样例可以被提交。
- `workspace-root/` 代表 `<workspace_root>`（默认为 `../acme-notes.ws/`）。运行输入和 outbox 投递文件放在其中的 `workspace-root/_runs/<RUN>/` 下；只有 `run.json`、`argv.redacted.json` 和 `events.jsonl` 属于 `<git-common-dir>/keel/runs/<RUN>/`，而该示例一个都没有提供。
- 暴露面画像为 claude-code 和 opencode 显示 `tool_env_exposure: scrubbed`。M0 的描述符还无法产生这一状态：该拼接图假设环境变量清洗能力探测（docs/10-providers.zh-CN.md 第 4 节）已针对这些运行时版本在示例机器上通过。没有它，T1 和 T2 会以 `blocked(runtime_unavailable)` 被拒绝。
- 归档中有 `receipt.json`、董事会阅读过的渲染后 `receipt.md`，以及回执中列出的每一份 EV 和 VD 记录。`ledger.slice.jsonl` 没有提供：它是 M3 的黄金输出，而完整的账本位于 `git-common-dir/keel/ledger.sample.json`。
- 提交 id、树、`contract_hash`、`rev_hash`、`source_tree`、`env_fp`、blob 哈希、简报的各章节哈希以及内容寻址 id（`BR`、`PG`、`AP`、`EV`、`VD`、`RL`、`IM`）都是示意值，但在各文件之间保持一致。简报的字节数是真实的。
- `ledger.sample.json` 是一个 JSON 数组（从 M1 起校验 JSONL）。其中 `prev` 和 `hash` 的链接是真实的：`hash` 是去掉 `hash` 后、对象键排序后的事件紧凑 JSON 的 sha256。每条阶段记录都引用其 `approval.recorded` 事件之前的链头（该示例提供了契约记录）。当 M1a 固定规范形式时，会用它重新生成这份样例。
- `.keel/approvals/example.contract.json` 代表账本所指的内容寻址文件 `.keel/approvals/<record-sha256>.contract.json`；示例中的批准人名称是声明的名称 `board-owner`，每个哈希都是示意值。
- 运行和事件的 ULID 按事件顺序排序；它们的时间部分并非由 `ts` 字段推导而来。

基于它计划的黄金测试（M1a 和 M1b）：简报编译器根据声明文件重现 `workspace-root/_runs/RUN-01J9Z8Q4TKXW3M5N7P2R6S8V0A/inputs/brief.md` 的正文；账本链验证在样例上通过，并在改动一个字符后失败；从 `src/store/tags.ts` 出发的追溯遍历能到达 `G-03`；回执渲染器把 `receipt.json` 和落地批准记录渲染成归档的 `receipt.md`，其中包括 ACC 到命令的对照表。

## 测试中绝不允许

- 读取 `~/.claude/.credentials.json`、`~/.codex/auth.json`、任何运行时主目录、任何 gateway 或 `.env*` 文件，或任何真实的模型提供方配置；创建具有这些基名的仓库文件。
- 真实的模型提供方主机、真实的密钥或形似密钥的字符串（审计检查会拒绝它们）。
- 在 CI 中调用真实的运行时或真实的模型。
- 写入共享的运行时设置（`.claude/settings.json`、`.gemini/settings.json`、`.qwen/settings.json` 或用户全局配置）。
