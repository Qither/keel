# keel

[English（规范版本）](README.md) | [文档](docs/README.zh-CN.md) | 你是董事会所有者？请从 [docs/00a-owner-guide.zh-CN.md](docs/00a-owner-guide.zh-CN.md) 开始

keel 是一个本地优先的 TypeScript/Node CLI 设计，用于在普通 git 之上运营一家由不同厂商的 AI 编码智能体组成、受契约约束的小型公司。人类董事会（Board）掌握全部权力。keel 的核心称为 Steward，它是确定性的，从不调用模型。至多五个 LLM 席位（seat）——产品、架构、规划、工程、评审席位（product、architect、planner、engineer、reviewer）——只产出类型化的产物，别无其他。

对每一行已落地（land）的代码，keel 的设计目标是能够回答：

- 它服务于哪个目标（goal）和需求（requirement）；
- 由哪个席位、运行时（runtime）和声明的模型家族（declared family）产出；
- 来自哪份逐字节一致的简报（brief）；
- 由 keel 亲自重新执行的哪些证据（evidence）证明；
- 受哪个架构元素（element）和哪些规则约束；
- 由哪位人类在查看了哪些内容之后批准。

这一答案必须在任一受支持的运行时上成立（Claude Code、Codex、Gemini CLI、Qwen Code、Kimi Code、opencode，以及经由宿主运行时或 keel 直连通道接入的 GLM 家族和 Gemini 家族模型），在普通 git 上成立，并在 Windows 上原生成立。

## 状态：M0 设计 + 骨架

本仓库处于 M0 里程碑。它包含一套设计文档和一个仓库骨架，不包含任何作为产品运行的东西：

- `docs/` 中的设计文档，keel 自身的 ADR 位于 `docs/adr/`；
- `schemas/` 中覆盖每种产物的 JSON Schema；
- `src/` 中的纯类型 TypeScript（没有值、没有函数、没有 `bin`）；
- `org/`、`config/` 和 `conformance/` 中的席位契约与规范表；
- `runtimes/` 中逐项事实标注验证状态的运行时描述符；
- `skills/` 和 `templates/` 中的技能、模板与提示词；
- `examples/acme-notes/` 中的一个黄金示例项目，以及 `test/fixtures/` 中的测试夹具。

唯一声明的工具例外是 `scripts/validate.mjs`，它检查骨架本身。目前还没有 `keel` 可执行文件；文档中出现的命令是设计好的接口。从 M1a 到 M8 的路线图及各里程碑的退出标准见 [docs/15-roadmap.zh-CN.md](docs/15-roadmap.zh-CN.md)。所有文档都由之派生的所有者声明，连同编号 R1–R5、D1–D7 和 P1–P4，位于 [docs/00-mandate.zh-CN.md](docs/00-mandate.zh-CN.md)。

## 一屏看懂 keel 做什么

- **编译的意图。** 章程（charter）、目标、EARS 需求、ADR 义务（obligation）以及提案（proposal）的冻结意图（frozen intent），被编译成每个席位、每个主题一份带哈希的简报。见 [docs/02-alignment.zh-CN.md](docs/02-alignment.zh-CN.md)。
- **经过检查的理解。** 每个席位在第一次编辑之前都要对其简报做 ACK（复述确认）；keel 将 ACK 中的编号集与简报做差异比对，席位在提交时还要再次回显简报哈希。
- **显式确认的权力。** 董事会的批准是董事会在查看了具体变更之后给出的一次确认；keel 连同产物哈希、声明的批准人和时间一起记录它，已批准内容的任何变更都会使其失效。席位输出永远不能产生批准，也不涉及任何密钥、签名者列表或硬件。见 [docs/02-alignment.zh-CN.md](docs/02-alignment.zh-CN.md)。
- **重新执行的证据。** 落地时，Steward 在集成后的提交上重新运行完整的验收矩阵。证据文件只是缓存，`not_run` 永远不等于 `pass`。见 [docs/11-verification.zh-CN.md](docs/11-verification.zh-CN.md)。
- **跨家族评审。** 由一个声明的模型家族与工程席位不同的评审席位来评审工作，其发现项（finding）具有权威性。
- **可追溯性。** Steward 所做的提交带有提交尾注（trailer），追溯检查会拒绝范围内任何无法回溯到已批准需求和目标的提交。见 [docs/04-trace-and-state.zh-CN.md](docs/04-trace-and-state.zh-CN.md)。
- **架构智能。** 一个声明式的 C4 风格模型，与通过 IndexProvider 端口租用的代码图谱相结合，提供搜索、影响面（impact）、漂移（drift）、归属和变更流。见 [docs/07-architecture-intelligence.zh-CN.md](docs/07-architecture-intelligence.zh-CN.md)。
- **git 优先。** 仅用 git 就足够；jj 是可选的加速器。见 [docs/05-vcs.zh-CN.md](docs/05-vcs.zh-CN.md)。
- **模型提供方的值留在你手里。** keel 只存储环境变量名，从不打开任何保存模型提供方（provider）值或运行时凭据的文件。见 [docs/10-providers.zh-CN.md](docs/10-providers.zh-CN.md)。

keel 不是什么（智能体运行时、LLM 路由器、沙箱、托管服务……）列在 [docs/00-vision.zh-CN.md](docs/00-vision.zh-CN.md) 中。

## 仓库地图

| 路径 | 内容 |
| --- | --- |
| `docs/` | 设计文档：根文档是 [docs/00-mandate.zh-CN.md](docs/00-mandate.zh-CN.md)；从 [docs/README.zh-CN.md](docs/README.zh-CN.md) 开始，其中有阅读顺序和单一归属表；`docs/reference-projects.yaml` 是参考项目登记表（P4） |
| `docs/adr/` | keel 自身的架构决策记录（从 ADR-0001 起） |
| `schemas/` | JSON Schema（draft 2020-12）；`common.schema.json` 是编号模式和共享枚举的唯一归属 |
| `src/` | 与 schema 和接口相对应的纯类型 TypeScript；M0 中没有运行时代码 |
| `org/` | 席位契约（`org/seats/*.yaml`）、保留操作、检查点阶段 |
| `config/` | 包默认值：上限与阈值，每项都附有理由 |
| `conformance/` | 管道（plumbing）与行为两类一致性测评场景 |
| `runtimes/` | 每个运行时一份描述符、规范的钩子事件表以及能力矩阵 |
| `skills/` | 五个可移植的席位流程（`keel-frame`、`keel-design`、`keel-plan`、`keel-work`、`keel-review`） |
| `templates/` | 项目、提案、运行时和提示词模板，包括各评审镜头（lens） |
| `examples/` | 黄金示例项目 `acme-notes`、仅含变量名的模型提供方环境变量示例、静态看板样稿 |
| `test/` | 测试计划和夹具（回环地址上的伪模型提供方、环境变量剥离） |
| `scripts/validate.mjs` | 声明的 M0 工具例外：schema、示例、严格子集、双语文档、审计、清单和参考项目登记表检查 |
| `AGENTS.md`、`CLAUDE.md` | 面向开发 keel 本身的智能体的指引 |

完整且经过检查的文件列表，是 [docs/13-artifacts-schemas.zh-CN.md](docs/13-artifacts-schemas.zh-CN.md) 中的清单（manifest）。

## 检查骨架

需要 Node >= 22.13。

```sh
npm ci
npm run check                                  # typecheck + validate, as CI runs it
node scripts/validate.mjs --only audit         # one check
node scripts/validate.mjs --only schemas,examples,strict,i18n,audit,manifest,references
```

CI 在 windows-latest 和 ubuntu-latest 上，以 Node 22.13 和 24 运行相同的命令。

## 名称说明：并非 dcsg/keel

本项目与 dcsg/keel 无关，后者是另一个采用 ELv2 许可、同样使用 keel 这一名称的智能体工作流。本项目从中借鉴了一个想法（在上下文压缩后重新注入上下文），已在 [docs/16-sources-credits.zh-CN.md](docs/16-sources-credits.zh-CN.md) 中致谢，且未从中复制任何文本或代码。包名为 `@qither/keel`；CLI 名称 `keel` 将在首次发布之前重新审视（[docs/17-open-decisions.zh-CN.md](docs/17-open-decisions.zh-CN.md)）。

## 语言

英文版为规范版本。每份面向人的文档（`docs/` 下的全部文档、本 README、`runtimes/README.md` 和 `test/README.md`）都有一个名为 `<name>.zh-CN.md` 的简体中文镜像，标题结构相同；`scripts/validate.mjs` 中的 i18n 检查会强制执行这一点。标识符、文件名、schema、YAML、模板、技能和提示词只使用英文。

## 许可证

MIT。Copyright (c) 2026 Qither。见 [LICENSE](LICENSE)。
