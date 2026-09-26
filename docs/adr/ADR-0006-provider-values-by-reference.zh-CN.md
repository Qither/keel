# ADR-0006 按引用处理模型提供方取值

> 英文原文（规范版本）：[ADR-0006-provider-values-by-reference.md](ADR-0006-provider-values-by-reference.md)。本文是其简体中文镜像，两者不一致时以英文版为准。

## 状态

于 2026-09-25 接受。遵循所有者的常设偏好 P1；不记录模型名的选择按建议采纳（[17-open-decisions.zh-CN.md](../17-open-decisions.zh-CN.md)）。

## 背景

用户在自己的环境中设置每个模型提供方（provider）的端点、API 密钥和模型名，并通过多种协议连接（anthropic-messages、openai-chat、openai-responses、google）。keel 必须把席位（seat）路由到这些模型提供方，同时绝不把这些取值保存在它读取的文件、它写入的记录或任何对话记录中。

当模型调用失败时，自然的调试动作是打开模型提供方配置。这个动作对 keel 是禁止的，而能执行代码的席位仍可能通过读取用户的凭据或模型提供方文件去这样做。一条只说"keel 从不读取取值"的规则是不可验证的，因为 keel 必须解引用环境变量取值才能启动运行时（runtime）或从直连通道调用模型提供方。

## 决策

1. 以可检查的方式表述的不变量（invariant）：
   - keel 从不以任何模式打开保存模型提供方取值、运行时凭据或共享运行时设置的文件；
   - keel 只在内存中读取环境变量取值，而且只在恰好两个模块中：`src/providers/env-policy.ts`（在启动时构建子进程环境，并把 `KEEL_PROFILE_*` 名称映射为原生名称）和 `src/direct/client.ts`（在调用时解包来自 env-policy 的不透明句柄）；
   - keel 从不持久化、打印、记录日志、哈希取值，也从不把取值放进 argv；
   - 一项 CI 检查只允许这两个模块引用模型提供方的环境变量名或解包该句柄。
2. 已提交、经董事会（Board）批准的 `.keel/routing.yaml` 只保存名称：每个别名有一个来自通用枚举的协议、一个声明的模型家族（declared family）、一个认证模式（`env`、`runtime-login`、`runtime-profile`）、环境变量名称（默认为 `KEEL_PROFILE_<ALIAS>_BASE_URL`、`_API_KEY`、`_MODEL_FRONTIER` 等），以及一个修订号，当别名背后的模型改变时由用户递增。
3. 每个运行时描述符声明一个仅含名称的模型提供方路径集（主目录环境变量名、运行时凭据位置、用户全局配置、`.env*`）。keel 只用 stat 测试这些路径。
4. 暴露规则，不提供董事会确认的放行路径：只有当 `tool_env_exposure` 为 `scrubbed` 且 `tool_file_exposure` 为 `none` 或 `blocked` 时，才派发代码执行类席位；否则任务为 `blocked(runtime_unavailable)`。任何工具事件触及该路径集时，摄取即判定该运行失败。
5. 不记录具体模型名（`policy.record_model_names: false`）。记录保存别名、档位（tier）、声明的模型家族和修订。一项可选检查在内存中比较两个通道由运行时报告的模型 id，只持久化"same"（相同）或"different"（不同）。
6. 诊断通过 `keel doctor --section providers` 进行，它把变量名称打印为 SET 或 UNSET，把模型提供方路径打印为 PRESENT 或 ABSENT，并给出兼容性和暴露情况，从不打印任何取值。
7. 文档和测试只使用占位符：`https://provider.example.invalid/v1`、`<set-in-your-own-environment>`、伪造密钥 `sk-fake-keel-*`、伪造模型 `fake-frontier`、`fake-standard`、`fake-fast`，以及位于 `http://127.0.0.1:<port>` 的回环伪造服务。

## 后果

- 用户可以更换模型提供方，除已批准的别名修订外无需改动任何已提交文件。
- 模型家族由董事会声明，显示为"declared"（已声明），从不显示为"verified"（已验证）；keel 无法检查端点。
- 许多原生 Windows 路由无法承载代码执行类席位；这些席位落到环境清洗已验证的路由上，独立的席位操作系统账户在 M6 中评估（[17-open-decisions.zh-CN.md](../17-open-decisions.zh-CN.md)）。
- 只有在仅用环境变量的路由经探测验证之后，Codex 才服务自定义端点。
- 测试从不读取用户的环境或配置；测试框架在注入伪造服务之前会剥离模型提供方变量。
- 路由格式、兼容性表、按运行时的注入方式和 doctor 输出位于 [10-providers.zh-CN.md](../10-providers.zh-CN.md)；暴露面画像（exposure profile）及其局限位于 [14-trust-security.zh-CN.md](../14-trust-security.zh-CN.md)。

## 考虑过的备选方案

- **一个打开用户取值文件但从不打印它的密封读取器。** 否决：它仍然打开了该文件，其保证无法从外部验证，而且它需要为一个 keel 不得读取的文件提供 schema。
- **把取值存储在 keel 配置或由 keel 管理的操作系统钥匙串中。** 否决：取值属于用户，位于 keel 之外。
- **允许在已暴露路由上运行代码执行类席位的董事会确认。** 被 P1 否决。
- **默认记录运行时报告的模型名。** 否决：在 P1 下模型名属于模型提供方取值。
- **一个持有密钥的本地代理或路由器。** 否决：keel 不是 LLM 路由器或代理。

## 来源

- 所有者的常设偏好 P1，以及助手从不读取模型提供方配置的规则。
- [09-runtimes.zh-CN.md](../09-runtimes.zh-CN.md) 背后的跨运行时调研：各运行时的模型提供方协议和凭据位置。
- oh-my-codex：能力矩阵，被复用于暴露面画像。
- 合规评审轮次：模型提供方路径集、禁止读取规则、"provider 401 诱惑"场景。
- 参见 [16-sources-credits.zh-CN.md](../16-sources-credits.zh-CN.md)。
