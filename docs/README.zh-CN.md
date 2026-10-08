# keel 文档

> 英文原文（规范版本）：[README.md](README.md)。本文是其简体中文镜像，两者不一致时以英文版为准。

这是 keel 设计文档的入口。它为每类读者给出阅读顺序，给出文档索引，并给出单一归属表：每个概念只在一份文档中解释，其他文档都链接到这个归属文档，而不是重复叙述。所有文档都由 [00-mandate.zh-CN.md](00-mandate.zh-CN.md) 派生，它是所有者声明：任何文档与之不一致时，错的是该文档。

所有文档描述的都是 M0 设计。keel 在 M0 中不提供任何可执行文件；`keel run` 之类的命令是设计好的接口，其规格见 [12-cli-api-mcp.zh-CN.md](12-cli-api-mcp.zh-CN.md)。

## 阅读顺序

### 所有者（董事会成员）

1. [00-mandate.zh-CN.md](00-mandate.zh-CN.md)：你授权的纲领（区分直接引文、重述与翻译）、其他所有文档使用的编号 R1–R5、D1–D7、P1–P5，以及会请你参与的刷新纪律和设计迭代纪律。
2. [00a-owner-guide.zh-CN.md](00a-owner-guide.zh-CN.md)：初始设置、五个日常命令、每种轨道需要你确认的次数、每个检查点（checkpoint）要读什么，以及工作受阻时去哪里看。
3. [17-open-decisions.zh-CN.md](17-open-decisions.zh-CN.md)：你需要为 M0 退出而确认的“按建议采纳”清单，以及仍然待定的决策。
4. [00-vision.zh-CN.md](00-vision.zh-CN.md)：起初读定位和术语表就足够了。
5. [01-org-model.zh-CN.md](01-org-model.zh-CN.md)：董事会（Board）、Steward 和每个席位（seat）可以做什么、不可以做什么。
6. [03-lifecycle.zh-CN.md](03-lifecycle.zh-CN.md)：轨道（track）、阶段和状态机。
7. [11-verification.zh-CN.md](11-verification.zh-CN.md) 第 2、5、6 节：证据与 `not_run`、声明的独立性与一致性测评状态，以及发现项的裁决权，这正是落地检查点要你判断的内容。
8. [14-trust-security.zh-CN.md](14-trust-security.zh-CN.md)：keel 能阻止什么、只能检测什么，以及一条批准记录能证明什么。
9. [10-providers.zh-CN.md](10-providers.zh-CN.md)：如何只用名称接入你自己的模型端点，值只在派生子进程时于进程内存中解引用，从不持久化。

### keel 的实现者

先读 [00-mandate.zh-CN.md](00-mandate.zh-CN.md)，然后按编号顺序阅读：[00](00-vision.zh-CN.md)、[01](01-org-model.zh-CN.md)、[02](02-alignment.zh-CN.md)、[03](03-lifecycle.zh-CN.md)、[04](04-trace-and-state.zh-CN.md)、[05](05-vcs.zh-CN.md)、[06](06-parallelism.zh-CN.md)、[07](07-architecture-intelligence.zh-CN.md)、[08](08-dashboard.zh-CN.md)、[09](09-runtimes.zh-CN.md)、[10](10-providers.zh-CN.md)、[11](11-verification.zh-CN.md)、[12](12-cli-api-mcp.zh-CN.md)、[13](13-artifacts-schemas.zh-CN.md)、[14](14-trust-security.zh-CN.md)、[15](15-roadmap.zh-CN.md)、[16](16-sources-credits.zh-CN.md)、[17](17-open-decisions.zh-CN.md)，然后阅读 [adr/](adr/) 中的 ADR。阅读时请始终打开 [13-artifacts-schemas.zh-CN.md](13-artifacts-schemas.zh-CN.md)，它是从产物到 schema、模板和示例的映射；同时打开作为产品审阅登记表（P4）的 `reference-projects.yaml` 和作为设计问题登记表（P5）的 `design-issues.yaml`。

### 添加运行时或模型提供方家族

[09-runtimes.zh-CN.md](09-runtimes.zh-CN.md)、[10-providers.zh-CN.md](10-providers.zh-CN.md)、[02-alignment.zh-CN.md](02-alignment.zh-CN.md) 中的“ACK 与提交通道”一节、[05-vcs.zh-CN.md](05-vcs.zh-CN.md) 中的保留操作表，以及 [14-trust-security.zh-CN.md](14-trust-security.zh-CN.md) 中的暴露面画像（exposure profile）。

## 文档索引

| 文档 | 范围 |
| --- | --- |
| [00-mandate.zh-CN.md](00-mandate.zh-CN.md) | 所有者授权的纲领及引文与重述边界、约束性需求编号、优先顺序与修订规则、刷新纪律（P4）、设计迭代纪律（P5） |
| [00-vision.zh-CN.md](00-vision.zh-CN.md) | 定位与非目标、设计如何满足纲领、原则 KP-01 到 KP-16、术语表、端到端示例 |
| [00a-owner-guide.zh-CN.md](00a-owner-guide.zh-CN.md) | 面向董事会的一页指南 |
| [01-org-model.zh-CN.md](01-org-model.zh-CN.md) | 董事会、Steward 模块、五份席位契约、归属、升级、各轨道的人员配置 |
| [02-alignment.zh-CN.md](02-alignment.zh-CN.md) | 对齐链 L0 到 L11、简报编译器、ACK 与提交通道、批准、修订案、裁定 |
| [03-lifecycle.zh-CN.md](03-lifecycle.zh-CN.md) | 轨道与棘轮、阶段 0 到 6、patch 轨道与策略路径、状态机、活性、预算 |
| [04-trace-and-state.zh-CN.md](04-trace-and-state.zh-CN.md) | 三个平面、哈希链式账本、编号表、提交尾注、追溯检查、RTM、投影、脱敏 |
| [05-vcs.zh-CN.md](05-vcs.zh-CN.md) | Vcs 接口、分支命名、工作树、Steward 提交、落地情形、保留操作、jj |
| [06-parallelism.zh-CN.md](06-parallelism.zh-CN.md) | 波次、认领与租约、Windows 进程模型、冲突、集成队列 |
| [07-architecture-intelligence.zh-CN.md](07-architecture-intelligence.zh-CN.md) | 声明模型、IndexProvider、搜索、漂移、影响面、架构元素页面、变更流 |
| [08-dashboard.zh-CN.md](08-dashboard.zh-CN.md) | 只读看板（dashboard）：TanStack、在原生标记之上无头（headless）、预渲染 |
| [09-runtimes.zh-CN.md](09-runtimes.zh-CN.md) | 规范来源与生成的接口面、描述符、拉起契约、梯级 A 到 D、一致性测评 |
| [10-providers.zh-CN.md](10-providers.zh-CN.md) | 仅含名称的模型提供方配置、暴露规则、协议、doctor 输出、回环伪提供方 |
| [11-verification.zh-CN.md](11-verification.zh-CN.md) | 门禁目录、证据与重新执行、测试独立性、评审镜头、发现项裁决权、修复循环 |
| [12-cli-api-mcp.zh-CN.md](12-cli-api-mcp.zh-CN.md) | 16 个动词、JSON 信封、退出码、`keel api`、MCP 工具、`keel hook` |
| [13-artifacts-schemas.zh-CN.md](13-artifacts-schemas.zh-CN.md) | 目标项目与包的布局、产物到 schema 的映射、清单、validate 覆盖范围 |
| [14-trust-security.zh-CN.md](14-trust-security.zh-CN.md) | 威胁模型、批准记录能证明什么、暴露面画像与已知局限、不可信数据 |
| [15-roadmap.zh-CN.md](15-roadmap.zh-CN.md) | 里程碑 M0 到 M8 及其退出标准、风险、度量 |
| [16-sources-credits.zh-CN.md](16-sources-credits.zh-CN.md) | 构件到来源的映射、许可证、D2 出处审计、ELv2 形态审计 |
| [17-open-decisions.zh-CN.md](17-open-decisions.zh-CN.md) | 所有者已解决的决策、按建议采纳的决策，以及仍然开放的决策 |
| [adr/](adr/) | keel 自身的 ADR，ADR-0001 到 ADR-0009 |

## 单一归属表

每一行指出一个概念以及拥有它的那一份文档。当某个概念发生变化时，修改其归属文档，并检查链接到它的那些文档。

| 概念 | 归属 |
| --- | --- |
| 所有者授权的纲领及引文与重述边界，以及 R1–R5、D1–D7、P1–P5 的约束性表述 | [00-mandate.zh-CN.md](00-mandate.zh-CN.md) |
| 声明、原则、归属文档、ADR 与数据文件之间的优先顺序；修订规则 | [00-mandate.zh-CN.md](00-mandate.zh-CN.md) |
| 刷新纪律（P4）：锁定来源版本的产品审阅、覆盖、Lab 维护归属、所有者决定与护栏 | [00-mandate.zh-CN.md](00-mandate.zh-CN.md) |
| 设计迭代纪律（P5）：何时运行、设计问题登记表（问题、顺序图、走查矩阵）、流程、向所有者提出的问题、护栏 | [00-mandate.zh-CN.md](00-mandate.zh-CN.md) |
| 定位、主张与非目标 | [00-vision.zh-CN.md](00-vision.zh-CN.md) |
| 需求映射：设计如何满足 R1–R5、D1–D7、P1–P5 | [00-vision.zh-CN.md](00-vision.zh-CN.md) |
| 原则 KP-01 到 KP-16 及其来源 | [00-vision.zh-CN.md](00-vision.zh-CN.md) |
| 术语表（每个术语和编号前缀的一行定义） | [00-vision.zh-CN.md](00-vision.zh-CN.md) |
| 从目标到一行代码的端到端示例 | [00-vision.zh-CN.md](00-vision.zh-CN.md) |
| 所有者的日常命令与演练 | [00a-owner-guide.zh-CN.md](00a-owner-guide.zh-CN.md) |
| 每个检查点要读什么 | [00a-owner-guide.zh-CN.md](00a-owner-guide.zh-CN.md) |
| 工作受阻时去哪里看 | [00a-owner-guide.zh-CN.md](00a-owner-guide.zh-CN.md) |
| 组织即数据；派发时的路由解析 | [01-org-model.zh-CN.md](01-org-model.zh-CN.md) |
| 董事会的身份与权力；检查点阶段（contract、plan、land、receipt） | [01-org-model.zh-CN.md](01-org-model.zh-CN.md) |
| 董事会裁定（`--rule answer`、`budget`、`track`、`override`、`dismiss`、`degraded`、`unverified`、`abandon`） | [01-org-model.zh-CN.md](01-org-model.zh-CN.md) |
| Steward 模块（compiler、dispatcher、runner、integrator、cartographer、auditor） | [01-org-model.zh-CN.md](01-org-model.zh-CN.md) |
| 席位契约、执行等级、按席位的 ACK 编号集、默认档位 | [01-org-model.zh-CN.md](01-org-model.zh-CN.md)（数据：`org/seats/*.yaml`） |
| 产物与字段的单写者归属 | [01-org-model.zh-CN.md](01-org-model.zh-CN.md) |
| 升级路径、提问路由、四类停止类别、BLOCKED 补救阶梯 | [01-org-model.zh-CN.md](01-org-model.zh-CN.md) |
| 各轨道的人员配置与席位数量；keel 为何不使用人设 | [01-org-model.zh-CN.md](01-org-model.zh-CN.md) |
| 对齐链 L0 到 L11 与优先顺序 | [02-alignment.zh-CN.md](02-alignment.zh-CN.md) |
| 简报编译器、规范化与哈希、下发通道、提示词来源（PG） | [02-alignment.zh-CN.md](02-alignment.zh-CN.md) |
| 按运行时和模式划分的 ACK 机制与提交通道 | [02-alignment.zh-CN.md](02-alignment.zh-CN.md) |
| 提交时重新编译与过期传播（`derived_from`） | [02-alignment.zh-CN.md](02-alignment.zh-CN.md) |
| 批准流程（展示、确认、重新哈希、记录）、批准记录、每种批准绑定什么、门禁检查、批准失效；请求记录；席位不可调用的动词 | [02-alignment.zh-CN.md](02-alignment.zh-CN.md) |
| 修订案 | [02-alignment.zh-CN.md](02-alignment.zh-CN.md) |
| 决策边界与席位裁定 | [02-alignment.zh-CN.md](02-alignment.zh-CN.md) |
| 哪些对齐机制位于 Steward 侧、并在每个梯级上都成立 | [02-alignment.zh-CN.md](02-alignment.zh-CN.md) |
| 轨道、轨道信号、只升不降的棘轮及其无索引回退 | [03-lifecycle.zh-CN.md](03-lifecycle.zh-CN.md) |
| 阶段 0 到 6 | [03-lifecycle.zh-CN.md](03-lifecycle.zh-CN.md) |
| patch 轨道与策略路径 | [03-lifecycle.zh-CN.md](03-lifecycle.zh-CN.md) |
| 提案与任务状态机；阻塞原因 | [03-lifecycle.zh-CN.md](03-lifecycle.zh-CN.md) |
| 常设策略及其限制；回执确认 | [03-lifecycle.zh-CN.md](03-lifecycle.zh-CN.md) |
| 活性不变量与静止 | [03-lifecycle.zh-CN.md](03-lifecycle.zh-CN.md) |
| 预算与预算裁定 | [03-lifecycle.zh-CN.md](03-lifecycle.zh-CN.md) |
| 三个平面（声明平面、VCS 内嵌平面、控制平面） | [04-trace-and-state.zh-CN.md](04-trace-and-state.zh-CN.md) |
| 哈希链式账本、事件信封、单写者锁 | [04-trace-and-state.zh-CN.md](04-trace-and-state.zh-CN.md) |
| 编号方案表（模式只存在于 `schemas/common.schema.json` 中） | [04-trace-and-state.zh-CN.md](04-trace-and-state.zh-CN.md) |
| Steward 提交、提交尾注、治理提交 | [04-trace-and-state.zh-CN.md](04-trace-and-state.zh-CN.md) |
| 追溯检查的范围与纪元（`trace.since`）；RTM；追溯漂移类别 | [04-trace-and-state.zh-CN.md](04-trace-and-state.zh-CN.md) |
| 归档投影与投影门禁；脱敏与字段白名单 | [04-trace-and-state.zh-CN.md](04-trace-and-state.zh-CN.md) |
| Vcs 接口、后端选择、git 最低要求 | [05-vcs.zh-CN.md](05-vcs.zh-CN.md) |
| 分支命名、稀疏工作树、Steward 提交机制、落地情形 | [05-vcs.zh-CN.md](05-vcs.zh-CN.md) |
| 保留操作：引用快照、`ls-remote`、环境加固、shim、按运行时的阻止与检测 | [05-vcs.zh-CN.md](05-vcs.zh-CN.md) |
| jj 后端以及 git/jj 对等表 | [05-vcs.zh-CN.md](05-vcs.zh-CN.md) |
| 波次、认领与租约、取消、冲突预测、集成队列 | [06-parallelism.zh-CN.md](06-parallelism.zh-CN.md) |
| 声明式架构模型、IndexProvider 端口、搜索、漂移、未知策略、影响面、架构元素页面、变更流 | [07-architecture-intelligence.zh-CN.md](07-architecture-intelligence.zh-CN.md) |
| 看板技术规则（TanStack、无头（headless）、预渲染、打包产物、预算）、视图、布局与 serve 边界 | [08-dashboard.zh-CN.md](08-dashboard.zh-CN.md) |
| 规范来源、生成的接口面（`keel sync`）、手册预算 | [09-runtimes.zh-CN.md](09-runtimes.zh-CN.md) |
| 运行时描述符、验证状态、Windows 拉起契约、提示词通道 | [09-runtimes.zh-CN.md](09-runtimes.zh-CN.md) |
| 按运行时的权限、信任与拒绝读取规则；梯级 A 到 D 以及每个梯级能阻止或只能检测什么 | [09-runtimes.zh-CN.md](09-runtimes.zh-CN.md) |
| GLM 家族与 Gemini 家族的托管方式；待探测验证列表 | [09-runtimes.zh-CN.md](09-runtimes.zh-CN.md) |
| 一致性测评检查（管道场景与行为场景） | [09-runtimes.zh-CN.md](09-runtimes.zh-CN.md) |
| 模型提供方不变量、`routing.yaml`、声明的模型家族、兼容性、内存内注入 | [10-providers.zh-CN.md](10-providers.zh-CN.md) |
| 可执行代码席位的暴露规则；协议；`doctor` 的模型提供方输出；回环伪提供方 | [10-providers.zh-CN.md](10-providers.zh-CN.md) |
| 门禁目录（五道阶段门禁及其具名检查） | [11-verification.zh-CN.md](11-verification.zh-CN.md) |
| 源状态绑定、证据、落地重跑 | [11-verification.zh-CN.md](11-verification.zh-CN.md) |
| 测试独立性与红前/绿后证明 | [11-verification.zh-CN.md](11-verification.zh-CN.md) |
| 评审镜头与镜头集；声明的独立性；作为门禁输入的一致性测评状态 | [11-verification.zh-CN.md](11-verification.zh-CN.md)（镜头集：`org/seats/reviewer.yaml`） |
| 发现项裁决权、分诊记录、修复循环、负对照、keel 自身的测试 | [11-verification.zh-CN.md](11-verification.zh-CN.md) |
| CLI 动词与模式、JSON 信封、退出码、`keel api`、MCP 工具、`keel hook` | [12-cli-api-mcp.zh-CN.md](12-cli-api-mcp.zh-CN.md) |
| 目标项目布局、包布局、产物到 schema 的映射、草稿标记、迁移、清单 | [13-artifacts-schemas.zh-CN.md](13-artifacts-schemas.zh-CN.md) |
| 威胁模型、批准记录能证明什么与不能证明什么、暴露面画像与已知局限、不可信数据、分支保护 | [14-trust-security.zh-CN.md](14-trust-security.zh-CN.md) |
| 里程碑与退出标准、风险、度量 | [15-roadmap.zh-CN.md](15-roadmap.zh-CN.md) |
| 致谢、许可证、D2 出处审计、ELv2 形态审计、有意未采纳的想法 | [16-sources-credits.zh-CN.md](16-sources-credits.zh-CN.md) |
| 已解决、已采纳和仍开放的决策 | [17-open-decisions.zh-CN.md](17-open-decisions.zh-CN.md) |

规范数据表是文件，而不是文档。文档负责解释它们；文件保存具体的值：

| 表 | 文件 |
| --- | --- |
| 编号模式与共享枚举 | `schemas/common.schema.json` |
| 保留操作 | `org/reserved-actions.yaml` |
| 检查点阶段及每个阶段要求董事会阅读的内容 | `org/checkpoints.yaml` |
| 席位契约 | `org/seats/*.yaml` |
| 镜头集 | `org/seats/reviewer.yaml` |
| 规范钩子事件及其可阻断性 | `runtimes/hook-events.yaml` |
| 上限与阈值，每项都附有理由 | `config/keel.defaults.yaml` |
| 一致性测评场景 | `conformance/scenarios.yaml` |
| 产品参考审阅与搜寻记录 | `docs/reference-projects.yaml` |
| 设计问题、顺序图、走查矩阵与走查历史 | `docs/design-issues.yaml` |

## 本文档集使用的约定

- **verify by probe（待探测验证）**标记一条尚未在目标版本上确认的运行时、CLI 或 jj 事实。在 YAML 中，同样的状态写作 `verification_status: unverified | documented | probed | verified`。尚未完成的探测列表位于 [09-runtimes.zh-CN.md](09-runtimes.zh-CN.md)。
- **只用占位符。** 示例使用 `https://provider.example.invalid`（anthropic-messages）或 `https://provider.example.invalid/v1`（OpenAI 协议）、`<set-in-your-own-environment>` 以及以 `sk-fake-keel-` 开头的伪密钥。没有任何文档写出真实的模型提供方主机或真实的密钥。
- **编号**遵循 `schemas/common.schema.json` 中的模式，例如 `P-7F3K9Q`、`R-notes-4QX7B`、`G-03`、`BR-9e4c1a7b2d05`。编号表位于 [04-trace-and-state.zh-CN.md](04-trace-and-state.zh-CN.md)。
- **术语**是固定的：Board（董事会）、Steward、seat（席位：product、architect、planner、engineer、reviewer）、track（轨道：spike、patch、feature、system）、tier（档位：frontier、standard、fast）、brief（简报）、ACK（复述确认）、work order（工单）、lens（评审镜头）、receipt（回执）、rung A 到 D（梯级）、exposure profile（暴露面画像）、declared family（声明的模型家族）。[00-vision.zh-CN.md](00-vision.zh-CN.md) 中的术语表对每一个都有定义。
- **不得出现的术语**只在一处列出，即 `scripts/validate.mjs` 中的 D2 术语列表，文档中不再重复。
- **双语。** 每份文档 `<name>.md` 都是英文且为规范版本；`<name>.zh-CN.md` 是其简体中文镜像，标题层级序列完全相同。术语表固定了每个术语的中文译法。
