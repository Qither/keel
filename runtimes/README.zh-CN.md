# keel 运行时描述符

> 英文原文（规范版本）：[README.md](README.md)。本文是其简体中文镜像，两者不一致时以英文版为准。

本目录保存驱动派发的数据：每个运行时（runtime）一份描述符，以及规范的钩子（hook）表。设计、Windows 派生契约、降级梯级（rung）和完整的待探测验证清单见 [docs/09-runtimes.zh-CN.md](../docs/09-runtimes.zh-CN.md)；模型提供方（provider）路由、内存中注入和暴露规则见 [docs/10-providers.zh-CN.md](../docs/10-providers.zh-CN.md)。本页根据 YAML 为包的读者渲染能力矩阵。本页与某个描述符不一致时以描述符为准，`keel doctor --section runtimes` 会为已安装的版本打印同样的矩阵。

## 文件

| 文件 | 内容 | Schema |
| --- | --- | --- |
| `claude-code.yaml` | Claude Code | `schemas/runtime-descriptor.schema.json` |
| `codex.yaml` | Codex CLI，附带其探测清单（链接工作树上的信任、`OPENAI_BASE_URL` 环境变量路由、`windows.sandbox`） | `schemas/runtime-descriptor.schema.json` |
| `gemini-cli.yaml` | Gemini CLI（本地未安装；`--policy` 探测决定能否承担写入类席位） | `schemas/runtime-descriptor.schema.json` |
| `qwen-code.yaml` | Qwen Code | `schemas/runtime-descriptor.schema.json` |
| `kimi-code.yaml` | Kimi Code CLI（`bypass_equivalent: true`；在验证通过之前为梯级 D） | `schemas/runtime-descriptor.schema.json` |
| `opencode.yaml` | opencode，默认的 GLM 宿主，也是 Qwen、Kimi 和 Gemini 家族模型的厂商中立宿主 | `schemas/runtime-descriptor.schema.json` |
| `direct.yaml` | keel 自己的无工具直连通道（M6） | `schemas/runtime-descriptor.schema.json` |
| `hook-events.yaml` | 规范钩子事件、各运行时的原生名称、可阻断性 | `schemas/hook-events.schema.json` |

GLM 和 Gemini 家族模型是模型提供方家族（声明的模型家族 `zhipu` 和 `google`），不是运行时；它们通过上面的宿主接入 keel。

## 验证状态

描述符中的每一组事实都带有 `verification_status`：

- `documented`：厂商文档（对直连通道而言是 keel 自己的设计文档）写明了它；
- `probed`：在本地二进制上观察到（帮助文本、二进制中的字符串、一次空运行），但没有经过 keel 的一致性测评探测；
- `verified`：keel 自己的 doctor 探测在该二进制版本上通过；
- `unverified`：尚无证据。待探测验证。

只有 `verified` 的能力才能提升梯级，或在暴露面画像（exposure profile）中算作防止措施。在 doctor 探测于已安装版本上通过之前，每个描述符整体上都是 `unverified`。

## argv 占位符

`argv_template`、模式的 `argv`、`session.resume`、`session.fork`、`auth_argv` 以及 `env_toggles` 的值使用由派发器填充的 `{placeholders}`。恰好等于 `{mode_argv}`、`{budget_argv}`、`{session_argv}`、`{config_argv}` 或 `{auth_argv}` 的令牌会拼接进一组令牌；其他占位符在其所在令牌内部被替换。任何占位符都不会展开成端点、密钥或模型名称。

| 占位符 | 填入内容 |
| --- | --- |
| `{fixed_prompt}` | `prompt_channel.fixed_prompt`，一条固定的简短指令；从不是简报 |
| `{brief_path}` | `<run>/inputs/brief.md`，编译后的简报 |
| `{run_dir}` | 运行目录 `<workspace_root>/_runs/<RUN>/` |
| `{workspace}` | 任务或验证工作树（子进程的工作目录） |
| `{result_schema_path}` | `<run>/inputs/result.schema.json`，席位输出 schema 的副本（评审席位用 verdict schema） |
| `{result_schema_inline}` | 压缩成一个 argv 令牌的同一 schema（`schema_flag_takes: inline`） |
| `{allowed_tools}` | 由席位契约及其执行类别推导出的工具允许列表 |
| `{session_id}` | keel 铸造或从输出流中读到的会话 id |
| `{seat}` | 席位 id，例如 `engineer` |
| `{alias}` | 董事会批准的 `.keel/routing.yaml` 中的路由配置档别名 |
| `{runtime_profile}` | 路由配置档的 `runtime_profile.profile` 名称（在用户自己的运行时配置中定义的名称） |
| `{mode_argv}` | 所选模式的 `argv` |
| `{budget_argv}` | 描述符的预算标志加上工单的上限 |
| `{session_argv}` | `session.resume` 或 `session.fork` 令牌，或者为空 |
| `{config_argv}` | 只携带名称的 Codex `-c` 键 |
| `{auth_argv}` | 描述符中与路由配置档认证模式对应的 `auth_argv` 令牌（Codex）；该模式未列出时为空 |
| `{workspace_root}` | 所配置的 `workspace_root`；只用于 `provider_path_set` 条目 |

## 能力矩阵：调用

| 运行时 | 测试版本 | 二进制（Windows 解析） | 提示词通道 | 结构化输出 | `schema_flag_takes` | 会话 | git |
| --- | --- | --- | --- | --- | --- | --- | --- |
| claude-code | 2.1.259 | `claude`，npm-shim-to-script（unverified） | 文件 `--append-system-prompt-file`（documented） | native-schema `--json-schema`（documented） | inline | 恢复、分叉（documented） | 不需要 |
| codex | 0.154.0 | `codex`，npm-shim-to-script（unverified） | stdin（verified） | native-schema `--output-schema` 加 `-o`（documented） | path | 恢复（documented） | 需要 |
| gemini-cli | 未安装 | `gemini`，npm-shim-to-script（unverified） | stdin 加固定的 `-p`（unverified） | 最终消息（unverified） | none | 恢复（unverified） | 不需要 |
| qwen-code | 0.21.7 | `qwen`，npm-shim-to-script（unverified） | stdin 加固定的 `-p`（documented） | native-schema `--json-schema @path`（documented） | path | 恢复（documented） | 不需要 |
| kimi-code | 未安装（文档 2.1.0） | `kimi`，npm-shim-to-script（unverified） | 文件 `--agent-file` 加固定的 `-p`（unverified） | 最终消息（unverified） | none | 恢复（documented） | 不需要 |
| opencode | 1.18.18 | `opencode`，npm-shim-to-script（unverified） | 文件 `-f` 加位置参数消息（unverified） | outbox 或 MCP（documented） | none | 恢复、分叉（unverified） | 不需要 |
| direct | 未构建（M6） | keel 子进程（documented） | stdin（documented） | 请求体中的 native-schema（documented） | none | 无 | 不需要 |

每次派生都使用 `shell: false`；npm 的 `.cmd` 和 `.ps1` 垫片会被解析为 node 入口脚本或原生可执行文件（docs/09-runtimes.zh-CN.md 第 3 节）。

## 能力矩阵：约束执行

| 运行时 | 钩子投递 | 环境变量清洗 | 权限机制 | 信任（项目层） | 控制平面 | 等同绕过 |
| --- | --- | --- | --- | --- | --- | --- |
| claude-code | 每次运行的 settings，退出码 2 阻断（documented） | `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB`（候选），预期 unknown（unverified） | 带禁读规则的每次运行 settings（documented） | 始终加载（documented） | exposed | 否 |
| codex | 钩子探测通过之前无（unverified） | `shell_environment_policy`，预期 unknown（unverified） | 标志；没有禁读，读取不受限制（documented） | 仅受信任时（documented） | sandboxed（仅写入） | 否 |
| gemini-cli | 打印出的片段，退出码 2 阻断（unverified） | 未记录控制手段，预期 unknown（unverified） | 带禁读规则的每次运行 `--policy`（unverified） | 仅受信任时（unverified） | exposed | 否 |
| qwen-code | 打印出的片段，退出码 2 阻断（documented） | 未记录控制手段，预期 unknown（unverified） | 标志；只有工具排除，没有禁读（documented） | 仅受信任时（documented） | exposed | 否 |
| kimi-code | 用户全局片段，退出码 2 阻断（documented） | 未记录控制手段，预期 unknown（unverified） | agent-file 工具允许列表；拒绝规则只在用户自有的配置中（unverified） | 无（unverified） | exposed | 是 |
| opencode | 无；v1 不使用插件 API（documented） | 未记录控制手段，预期 unknown（unverified） | 带禁读规则的每次运行配置和智能体文件（documented） | 始终加载（unverified） | exposed | 否 |
| direct | 无（documented） | 没有工具子进程，scrubbed（documented） | 无；无工具（documented） | 无（documented） | sandboxed（无工具） | 否 |

可执行代码的席位只有在 `tool_env_exposure` 为 `scrubbed` 且 `tool_file_exposure` 为 `none` 或 `blocked` 时才会被派发。`scrubbed` 需要环境变量清洗能力探测在所安装版本上通过；描述符若指明了控制手段，探测时会加以应用（claude-code 和 codex 指明了候选项；其他运行时没有指明，因此只有当运行时自身就让模型提供方变量不进入工具子进程时，探测才会通过）。M0 中还没有任何探测通过，因此 M0 的描述符目前不让任何运行时承担工程席位；拒绝结果是附带 doctor 原因的 `blocked(runtime_unavailable)`，且没有任何裁定可以豁免它（docs/10-providers.zh-CN.md 第 4 节）。

## 模式、席位与梯级

| 运行时 | 模式 | 执行类别 | 提交通道 | 梯级 | 席位 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| claude-code | `plan` | read-only | final-message | A | product、architect、planner、reviewer | documented |
| claude-code | `accept-edits` | code-executing | outbox | A | engineer | documented |
| codex | `read-only` | read-only | final-message | C（钩子探测通过后为 A） | product、architect、planner、reviewer | documented |
| codex | `workspace-write` | code-executing | final-message | C（钩子探测通过后为 A） | engineer | documented |
| gemini-cli | `plan` | read-only | final-message | B | reviewer | unverified |
| gemini-cli | `auto-edit` | code-executing | outbox | B | 在 `--policy` 探测通过之前无 | unverified |
| qwen-code | `plan` | read-only | final-message | C（钩子探测通过后为 A 候选） | product、architect、planner、reviewer | documented |
| qwen-code | `auto-edit` | code-executing | final-message | C（钩子探测通过后为 A 候选） | engineer | documented |
| kimi-code | `print` | code-executing | outbox | D | 任何席位，由人运行 | documented |
| opencode | `read-only-agent` | read-only | mcp | C | product、architect、planner、reviewer | documented |
| opencode | `build-agent` | code-executing | outbox | C | engineer | documented |
| direct | `tool-less` | none | final-message | 位于阶梯之外（`rung: null`） | reviewer | documented |

原生 schema 输出是一项独立的能力：codex 和 qwen-code 在梯级 C 上保留它，但如果没有能在无头运行中加载的钩子，就没有任何东西能阻止在 ACK 之前的编辑。提交通道就是结果通道。各模式的 ACK 通道（例如只读席位使用预运行的最终消息）列在 docs/02-alignment.zh-CN.md 的“ACK 与提交通道”一节中。每个运行时都可以回退到梯级 D。

## 模型提供方

| 运行时 | 协议 | 认证模式 | 在内存中映射的原生名称 | 模型提供方路径集（仅名称；只做 stat，从不打开） |
| --- | --- | --- | --- | --- |
| claude-code | anthropic-messages | env、runtime-login | `ANTHROPIC_BASE_URL`、`ANTHROPIC_AUTH_TOKEN`、`ANTHROPIC_MODEL` | `CLAUDE_CONFIG_DIR`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`、`~/.claude.json`、`.claude/settings.json`、`.claude/settings.local.json`、`.env*` |
| codex | openai-responses | env（在其探测通过后）、runtime-profile、runtime-login | `OPENAI_BASE_URL`、`OPENAI_API_KEY` | `CODEX_HOME`、`~/.codex/auth.json`、`~/.codex/config.toml`、`~/.codex/`、`.codex/config.toml`、`.env*` |
| gemini-cli | google | env、runtime-login | `GEMINI_API_KEY`、`GEMINI_MODEL`（unverified） | `~/.gemini/`、`.gemini/settings.json`、`.gemini/.env`、`.env*` |
| qwen-code | openai-chat、anthropic-messages | env、runtime-login | `OPENAI_BASE_URL`、`OPENAI_API_KEY`、`OPENAI_MODEL`；`ANTHROPIC_BASE_URL`、`ANTHROPIC_API_KEY`、`ANTHROPIC_MODEL`（unverified） | `~/.qwen/`、`.qwen/settings.json`、`.qwen/.env`、`.env*` |
| kimi-code | anthropic-messages、openai-chat、openai-responses、google | runtime-profile、runtime-login | 无；用户的配置用 `api_key_env` 指明密钥变量 | `KIMI_CODE_HOME`、`~/.kimi-code/`、`.env*` |
| opencode | anthropic-messages、openai-chat、openai-responses | env | 无；每次运行的配置引用 `{env:KEEL_PROFILE_...}` 名称 | `~/.config/opencode/`、`~/.local/share/opencode/auth.json`、`opencode.json`、`.opencode/opencode.json`、`.env*` |
| direct | anthropic-messages、openai-chat、openai-responses | env | 无；一个不透明句柄到达请求构建器 | 无（无工具） |

除直连通道外，每个路径集还列出 `{workspace_root}/_runs/*/raw/`。keel 从不写出原始的运行时输出流；这一条目让其他工具留在那里的任何捕获都算作模型提供方路径。

不兼容的路由在解析时就以 `blocked(runtime_unavailable)` 被拒绝；没有回退。取值只存在于用户的环境中；示例使用占位符 `https://provider.example.invalid`（anthropic-messages）、`https://provider.example.invalid/v1`（OpenAI 协议）和 `<set-in-your-own-environment>`（docs/10-providers.zh-CN.md 第 5 节）。

## 预算标志与退出码

| 运行时 | 预算标志 | 退出码 |
| --- | --- | --- |
| claude-code | `--max-budget-usd`（documented）、`--max-turns`（unverified） | 0 completed、1 failed、143 killed（仅 POSIX） |
| codex | 无 | 0 completed、1 failed、143 killed（仅 POSIX） |
| gemini-cli | 无 | 0 completed、1 failed、42 input_error、53 turn_limit、143 killed（仅 POSIX） |
| qwen-code | `--max-session-turns`、`--max-wall-time`、`--max-tool-calls`（probed；0.21.7 中在 `--help` 里隐藏） | 0 completed、1 failed、42 input_error、53 turn_limit、55 budget、143 killed（仅 POSIX） |
| kimi-code | 无 | 0 completed、1 failed、143 killed（仅 POSIX） |
| opencode | 无 | 0 completed、1 failed、143 killed（仅 POSIX） |
| direct | 无 | 0 completed、1 failed、143 killed（仅 POSIX） |

在 Windows 上，结果 `killed` 来自 keel 自己的取消日志，而从不来自退出码（docs/06-parallelism.zh-CN.md）。

## 钩子事件

`keel hook <canonical event> --runtime <id>` 是唯一的入口；`hook-events.yaml` 是这一映射的唯一归属。钩子只告警，门禁做决定：每个钩子都失败时放行，并记录一个类型化的结果。opencode 和直连通道没有钩子条目。

| 规范事件 | claude-code | codex | gemini-cli | qwen-code | kimi-code |
| --- | --- | --- | --- | --- | --- |
| `session-start` | `SessionStart` [startup]（documented） | `SessionStart`（probed） | `SessionStart`（unverified） | `SessionStart`（documented） | `SessionStart` [startup]（documented） |
| `user-prompt-submit` | `UserPromptSubmit`，可阻断（documented） | `UserPromptSubmit`，可阻断（probed） | `BeforeAgent`，可阻断（unverified） | `UserPromptSubmit`，可阻断（documented） | `UserPromptSubmit`，可阻断（documented） |
| `pre-tool-use` | `PreToolUse`，可阻断（documented） | `PreToolUse`，可阻断（probed） | `BeforeTool`，可阻断（unverified） | `PreToolUse`，可阻断（documented） | `PreToolUse`，可阻断（documented） |
| `post-tool-use` | `PostToolUse`（documented） | `PostToolUse`（probed） | `AfterTool`（unverified） | `PostToolUse`（documented） | `PostToolUse`（documented） |
| `pre-compact` | `PreCompact`，可阻断（documented） | `PreCompact`（probed） | `PreCompress`（unverified） | `PreCompact`（documented） | `PreCompact`（documented） |
| `post-compact` | `SessionStart` [compact]（documented） | `PostCompact`（probed） | `BeforeAgent`，可阻断（unverified） | `PostCompact`（unverified） | `PostCompact`（documented） |
| `stop` | `Stop`，可阻断（documented） | `Stop`，可阻断（probed） | `AfterAgent`，可阻断（unverified） | `Stop`，可阻断（documented） | `Stop`，可阻断（documented） |
| `subagent-start` | `SubagentStart`（documented） | `SubagentStart`（probed） | 无 | `SubagentStart`（unverified） | `SubagentStart`（documented） |

对 codex 而言，`probed` 表示该事件名存在于 0.154.0 二进制中；每个事件能否阻断或注入，待探测验证。Claude Code 的 `PostCompact` 输出从不到达模型，因此压缩后的重新注入使用带 `compact` 匹配器的 `SessionStart`。Kimi 的 `PostCompact` 不由 keel 打印的片段注册；在探测表明其输出能到达模型之前，重新注入一直通过 `keel brief` 拉取。

## 未完成的探测

每个描述符的 `capability_probes` 列表就是它的待探测验证清单。在 M0 中：

| 运行时 | verified | documented | probed | unverified |
| --- | --- | --- | --- | --- |
| claude-code | 0 | 2 | 0 | 8 |
| codex | 1 | 1 | 0 | 8 |
| gemini-cli | 0 | 0 | 0 | 9 |
| qwen-code | 0 | 0 | 2 | 7 |
| kimi-code | 0 | 0 | 0 | 8 |
| opencode | 0 | 0 | 0 | 8 |
| direct | 0 | 0 | 0 | 3 |

在某项探测于已安装版本上通过之前，keel 采用 docs/09-runtimes.zh-CN.md 第 8 节中所列的保守做法（较低的梯级、拒绝的路由，或以拉取代替注入）；不假设任何未经验证的事实。
