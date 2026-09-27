# 开放决策

> 英文原文（规范版本）：[17-open-decisions.md](17-open-decisions.md)。本文是其简体中文镜像，两者不一致时以英文版为准。

本文档跟踪提交给所有者的每一项设计决策，分为三组：所有者已解决的决策、按建议采纳的决策，以及仍然开放的决策。已采纳的决策是可逆的：更改它意味着重写其 ADR 或其归属文档，以及本清单；该更改的历史就是这些文件的 git 历史。开放决策会列出其选项、建议以及它阻塞的内容。keel 自身设计中的缺陷是 `docs/design-issues.yaml` 中带 `DI-nn` 编号的设计问题（[00-mandate.zh-CN.md](00-mandate.zh-CN.md) 第 5 节）；类别为 `mandate-conflict` 的问题，或其修正会翻转下表中某项决定的问题，连同其编号在本文档“仍然开放”下交给所有者。

keel 自身的设计 ADR（`docs/adr/ADR-0001` … `ADR-0009`）与 keel 为目标项目生成的 `ADR-<5>` id 是两个独立的序列。

## 由所有者解决

所有者的声明记录在 [00-mandate.zh-CN.md](00-mandate.zh-CN.md) 中，其优先顺序高于本文档和其他所有文件。

| 决策 | 决议 | 记录于 |
| --- | --- | --- |
| 许可证 | MIT，"Copyright (c) 2026 Qither"（D7）。如果专利授权很重要，备选方案是 Apache-2.0。 | `LICENSE`, [16-sources-credits.zh-CN.md](16-sources-credits.zh-CN.md) |
| 文档语言与中文字形 | 双语（D5）：英文规范版本在 `<name>.md` 中，简体中文镜像在 `<name>.zh-CN.md` 中，标题结构完全相同。标识符、文件名、schema、YAML、模板、技能和提示词只用英文。 | `scripts/validate.mjs` 中的 i18n 检查 |
| 人类批准机制 | 对所展示变更的显式确认，连同主题、产物哈希、声明的批准人和本地时间一起记录；已批准内容的任何变更都会使其失效；席位输出不能构成批准；没有 SSH、密钥、签名者列表、agent 检查、硬件或身份系统（D6）。SSH 与 GPG 签名以及可选的签名模式被否决。 | [ADR-0005](adr/ADR-0005-explicit-confirmation-approvals.zh-CN.md), [02-alignment.zh-CN.md](02-alignment.zh-CN.md), [14-trust-security.zh-CN.md](14-trust-security.zh-CN.md) |
| 版本控制策略 | git 为主且完全够用；jj 是 Vcs 接口背后的可选增强（D4）。 | [ADR-0001](adr/ADR-0001-git-primary-jj-optional.zh-CN.md) |
| 来源 | keel 是一个全新的、独立的设计（D2）。禁用的名称是 `scripts/validate.mjs` 中的 D2 术语列表。 | [16-sources-credits.zh-CN.md](16-sources-credits.zh-CN.md) |
| 技术栈 | Node ≥ 22.13 上的 TypeScript，原生 Windows，核心设计中不使用 tmux、WSL、Docker、bash 或 python（D3）。 | [ADR-0002](adr/ADR-0002-node-windows-native.zh-CN.md) |
| 前端技术栈 | React 上的 TanStack，以无头（headless）方式覆盖原生标记，预渲染并打包（P2）。不使用任何库的原生 HTML 加原生 JavaScript 被否决。 | [ADR-0009](adr/ADR-0009-tanstack-frontend.zh-CN.md), [08-dashboard.zh-CN.md](08-dashboard.zh-CN.md) |
| 参考项目集与模型列表 | rtk 加入参考项目列表，Kiro 只参考公开文档（R1）；OpenCode 加入模型列表（R3）；git 为主，jj 为可选增强（R4）。 | [00-mandate.zh-CN.md](00-mandate.zh-CN.md), [16-sources-credits.zh-CN.md](16-sources-credits.zh-CN.md) |
| 刷新纪律 | P4：00-mandate.zh-CN.md 第 4 节中的流程、参考项目登记表 `docs/reference-projects.yaml`，以及每个里程碑退出时的刷新评审。 | [00-mandate.zh-CN.md](00-mandate.zh-CN.md), [15-roadmap.zh-CN.md](15-roadmap.zh-CN.md) |
| 设计迭代纪律 | P5：00-mandate.zh-CN.md 第 5 节中的流程、带有 schema 和 `issues` 检查的登记表 `docs/design-issues.yaml`、从 M0 起每个里程碑退出时的设计问题门禁；已知缺陷在修正任何一个之前先作为开放问题登记在那里。 | [00-mandate.zh-CN.md](00-mandate.zh-CN.md), [15-roadmap.zh-CN.md](15-roadmap.zh-CN.md) |
| 模型提供方的值，条款 11（DI-01） | 设计问题 DI-01 的选项 1：条款 11 和 P1 行重述为 keel 从不打开保存模型提供方的值或凭据的文件或记录，从不持久化、打印、记录或哈希任何值，而在派生子进程时和直连通道调用时于进程内存中解引用具名环境变量是允许的；模型提供方不变量、KP-13 和 ADR-0006 是其可校验形式。按字面保留条款并删去别名映射与直连通道、由用户自有的启动器、推迟到 M2 这三项被否决。 | [00-mandate.zh-CN.md](00-mandate.zh-CN.md), [10-providers.zh-CN.md](10-providers.zh-CN.md), [ADR-0006](adr/ADR-0006-provider-values-by-reference.zh-CN.md) |
| 核心设计文档 | 所有者声明以 R1–R5、D1–D7、P1–P5 这些 id 逐字记录，其优先顺序高于其他所有文件。 | [00-mandate.zh-CN.md](00-mandate.zh-CN.md) |

M0 范围规则（D1：只有设计文档和骨架，`scripts/validate.mjs` 是唯一的工具例外）以及常设偏好 P1–P5 在 [00-mandate.zh-CN.md](00-mandate.zh-CN.md) 中陈述，并在 [00-vision.zh-CN.md](00-vision.zh-CN.md) 中映射。

## 按建议采纳（可逆，附 ADR）

这些来自蓝图的建议。所有者对本清单的确认是 M0 退出条件的一部分（[15-roadmap.zh-CN.md](15-roadmap.zh-CN.md)）。

| # | 决策 | 采纳的选项 | 未采纳的选项 | 记录于 |
| --- | --- | --- | --- | --- |
| 1 | feature 轨道（track）上何时需要计划批准 | 仅当波次（wave）宽度大于 1 或路由偏离已批准的路由时；在 system 轨道上始终需要。单一构建者的 feature 保持两次董事会介入。 | 仅在 system 上；在 feature 上始终需要 | [01-org-model.zh-CN.md](01-org-model.zh-CN.md), [03-lifecycle.zh-CN.md](03-lifecycle.zh-CN.md) |
| 2 | 常设快速补丁策略（standing policy）的谓词 | 最多 5 个文件、约 100 行代码；一个架构元素（element）或未映射的路径；不触及受保护的 glob、INV 或义务（obligation）；董事会批准的请求；红绿证明；`policy` 评审镜头集（lens set）。可撤销，列在回执（receipt）中，之后需进行回执确认。 | 更严格（最多 2 个文件）；不设常设策略 | [03-lifecycle.zh-CN.md](03-lifecycle.zh-CN.md), `templates/project/policies/quick-patch.yaml` |
| 3 | patch 轨道的落地（land）批准 | 在共享主干上需要落地批准；在单人仓库上使用已批准的落地策略加回执确认。 | 始终需要；从不需要 | [03-lifecycle.zh-CN.md](03-lifecycle.zh-CN.md) |
| 4 | 席位（seat）到控制平面的通道 | 按模式的提交通道：结构化最终消息、MCP `keel_submit`、发件箱。 | 回环端点 | [ADR-0004](adr/ADR-0004-steward-commits-and-submit-channels.zh-CN.md) |
| 5 | 谁来提交席位的工作 | Steward。 | 席位通过钩子提交 | [ADR-0004](adr/ADR-0004-steward-commits-and-submit-channels.zh-CN.md) |
| 6 | Kimi Code 的席位资格 | 在智能体文件工具白名单、静态禁止规则或 ACP 驱动经探测验证之前，停留在梯级（rung）D，因为 `-p` 等同于绕过。 | 允许 `-p` 构建者 | [09-runtimes.zh-CN.md](09-runtimes.zh-CN.md), `runtimes/kimi-code.yaml` |
| 7 | 默认索引后端 | 在声明约束下的 codegraph，加上 SCIP 导入。除架构检查外，索引对任何门禁（gate）都不是必需的。 | 仅 SCIP；内置 tree-sitter 索引器 | [ADR-0007](adr/ADR-0007-declared-vs-derived-architecture.zh-CN.md) |
| 8 | 记录具体模型名 | 默认关闭：记录只保存别名、档位（tier）、声明的模型家族（declared family）和修订。可选的内存内相同/不同检查不持久化任何东西。 | 同时记录运行时报告的模型名 | [ADR-0006](adr/ADR-0006-provider-values-by-reference.zh-CN.md) |
| 9 | Windows 上的分发 | 先发布 npm 包；在 M6 之后评估 Node 单一可执行应用。 | 仅 Node SEA；两者都有 | [ADR-0002](adr/ADR-0002-node-windows-native.zh-CN.md) |
| 10 | 本地控制平面的位置 | `$(git rev-parse --git-common-dir)/keel`，带哈希链，并如实报告暴露情况。 | 工作树中已提交的状态；以数据库作为真相存储 | [ADR-0003](adr/ADR-0003-control-plane-in-git-common-dir.zh-CN.md) |
| 11 | 看板（dashboard）的写能力 | 只读；董事会操作只以可复制的 `keel approve …` 命令出现。 | 看板中的批准按钮 | [ADR-0008](adr/ADR-0008-read-only-dashboard.zh-CN.md) |
| 12 | TanStack UI 适配器 | React（在 Router、Query、Table 和 Virtual 上的适配器覆盖最完整）。 | Solid、Vue 或 Svelte 适配器 | [ADR-0009](adr/ADR-0009-tanstack-frontend.zh-CN.md) |
| 13 | 看板（dashboard）的渲染与打包 | 构建时预渲染为静态 HTML，并在浏览器中水合（hydrate）；库在包构建时打包，绝不作为运行时依赖。 | 仅客户端的单页应用；对 React 的运行时依赖 | [ADR-0009](adr/ADR-0009-tanstack-frontend.zh-CN.md) |

## 真正开放

### 包名与 CLI 名

keel 与 dcsg/keel 同名，后者是一个无关的 ELv2 许可项目（在 [16-sources-credits.zh-CN.md](16-sources-credits.zh-CN.md) 中以 keel-other 之名致谢）。

- 选项：`@qither/keel`，命令为 `keel`，技能命名为 `keel-*`；改名；命令 `keelctl`。
- 建议：`@qither/keel`，命令为 `keel`，并在 README 中加入消歧说明。在首次发布前重新审视。
- 当前状态：`package.json` 以 `@qither/keel` 作为工作名称，设为 `private`，且没有 `bin`。
- 阻塞：M0 中不阻塞任何内容。M1a 添加 `bin` 时需要命令名，首次发布前需要最终名称。

### 没有已清洗路由的代码执行类席位

在原生 Windows 上，某个路由可能不提供仅用环境变量、已清洗且文件暴露已封闭的配置，因此运行 shell 或声明命令的席位无法派发到该路由上。

- 选项：以 `blocked(runtime_unavailable)` 拒绝，并在该路由上使用无工具或只读席位；可选的独立席位操作系统账户，即一个单独的本地用户（待探测验证（verify by probe）；M6）；在董事会确认后放行。
- 建议：默认拒绝。在 M6 中评估独立席位账户，作为达到 `tool_file_exposure: blocked` 和 `control_plane_exposure: sandboxed` 的途径。董事会确认选项与 P1 相矛盾，列出它只是为了完整性。
- 决定之前的行为：拒绝（[10-providers.zh-CN.md](10-providers.zh-CN.md)）。在 M0 中，这一拒绝适用于每条路由：`scrubbed` 需要环境变量清洗能力探测，而目前还没有任何探测通过。
- 阻塞：M6 中的独立账户事项。

### 针对自定义端点的 Codex 接线

Codex 只支持 openai-responses。它通过内置 provider 和 `OPENAI_BASE_URL` 连接自定义端点的路由尚未证明会被遵循（待探测验证）；运行时配置文件（runtime profile）会把 `base_url` 保存在一个席位可以读取的文件中。

- 选项：探测之后，使用仅环境变量的内置 provider 加 `OPENAI_BASE_URL`；对文件暴露为 blocked 的席位使用运行时配置文件（该文件保存 `base_url`）；仅通过环境变量使用官方端点。
- 建议：探测之后使用仅环境变量的方式。在此之前，Codex 只为文件暴露为 blocked 的席位服务自定义端点，自定义端点上的工程角色落到 claude-code、qwen-code 或 opencode，且每一个都须等到其环境变量清洗探测通过之后（[10-providers.zh-CN.md](10-providers.zh-CN.md) 第 4 节）。M0 中还没有任何探测通过，因此目前没有任何路由符合工程席位的条件。
- 阻塞：Codex 作为自定义端点上的工程席位宿主；探测在 M2 中进行。

### 多机协作

控制平面位于一个克隆的 git 公共目录中，推送是保留操作。

- 选项：v1 仅支持单机，其他机器看到已提交的批准记录和归档投影；每台机器一个账本引用；共享服务器。
- 建议：v1 仅支持单机；在 M8 之后重新审视。
- 阻塞：M8 之前不阻塞任何内容。针对共享远端的服务端保护建议见 [14-trust-security.zh-CN.md](14-trust-security.zh-CN.md)。
