# 来源、致谢与许可证

> 英文原文（规范版本）：[16-sources-credits.md](16-sources-credits.md)。本文是其简体中文镜像，两者不一致时以英文版为准。

keel 借鉴的是思路，而不是依赖或文本（P3，KP-15）。本文档负责三项记录：每个借鉴的构造到一个允许来源的映射、每个参考项目的许可证，以及 M0 退出条件要求的两项审计，即 D2 来源审计和 ELv2 形态审计。各项原则在 [00-vision.zh-CN.md](00-vision.zh-CN.md) 中就地引用其来源；本文档是完整清单。参考项目登记表 [reference-projects.yaml](reference-projects.yaml) 记录的是审查了什么、何时审查（P4）；本文档记录的是采纳了什么。

当来源属于以下之一时，它是允许的：

- 开源项目，其思路由 keel 用自己的文字和代码重新实现；
- ELv2 或其他非 OSS 项目，仅用于思路：不使用其文本、代码、schema、提示词、模板或文件布局；
- 工具的公开文档，用于描述 keel 如何驱动该工具；
- 已发布的标准或文件格式（AGENTS.md、Agent Skills、C4、EARS、SCIP）；
- keel 自身的设计过程：相互竞争的蓝图提案、调研综述和评审轮次；
- 所有者的决策 D1–D7 和常设偏好 P1–P4，以 [00-mandate.zh-CN.md](00-mandate.zh-CN.md) 中的表述为准。

## 构造 → 允许来源映射

蓝图致谢中列出的每个思路都有一行。"在 keel 中的位置"一列给出产物或机制；其归属文档见 [README.zh-CN.md](README.zh-CN.md) 的单一归属表。

### 有本地克隆的参考项目

| keel 构造 | 在 keel 中的位置 | 来源 | 用途 |
| --- | --- | --- | --- |
| 以 id 为键并带基准指纹（`rev_hash`）的需求（requirement）增量 | `spec.delta.yaml`、`schemas/spec-delta.schema.json` | OpenSpec 增量规格（delta specs） | 思路，重新实现 |
| 按席位（seat）编译的简报（brief） | `keel brief`、`templates/prompts/brief.md.tmpl` | OpenSpec 运行时编译的指令封套 | 思路 |
| 每个智能体操作一份 JSON 契约 | `schemas/ack`、`result`、`verdict`、`api-envelope` schema；`keel api` | OpenSpec 单 JSON 智能体契约 | 思路 |
| 带所有权标记和锁文件的生成表面 | `keel sync`、`.keel/generated.lock.json` | OpenSpec 带 generatedBy 标记的适配器注册表 | 思路 |
| 热点文件的串行主干 | 波次（wave）调度器 | OpenSpec 串行主干（serial-spine）并行 | 思路 |
| 跨家族评审 | 带声明的模型家族（declared family）的评审席位 | OpenSpec 跨模型评审 | 思路 |
| 在决策边界内记录的裁定（ruling） | `keel api rule`、RL 记录 | OpenSpec"自主决定"（decided autonomously） | 思路 |
| 边的来源与置信度 | 每条架构边上的 `provenance` 枚举 | codegraph | 思路 |
| 影响面（impact）分析 | `keel arch impact`、IM 记录 | codegraph | 思路 |
| 新鲜度戳 | 简报新鲜度、`index_commit` 与 head 对比 | codegraph 新鲜度横幅 | 思路 |
| 不匹配时给出以成功为导向的指引 | ACK（复述确认）重试指引 | codegraph | 思路 |
| 集合差异重建检查 | 针对 `trace.db` 的 `keel audit --rebuild` | codegraph 集合差异重建 | 思路 |
| 回环 Host 和 Origin 检查 | `keel dashboard serve` | codegraph | 思路 |
| 针对下限模型的 A/B 运行 | 提示词与技能评估证据、行为一致性测评 | codegraph | 思路 |
| 保留操作表 | `org/reserved-actions.yaml` | codegraph 的 `AGENTS.md`：建立索引始终由用户决定，从不由智能体决定（某些操作只属于人类这一思路） | 思路 |
| 代码图后端 | 在声明约束下的 IndexProvider `codegraph` 后端 | codegraph | 可选的外部适配器，不内置 |
| 不调用模型的确定性核心 | Steward | edikt | 仅思路（ELv2） |
| 不借助模型解析的义务（obligation） | ADR `## Obligations`、`schemas/decision.schema.json` | edikt 确定性治理编译 | 仅思路（ELv2）；形态审计见下文 |
| 记入日志、失败时放行的钩子 | `keel hook`、钩子日志分母 | edikt | 仅思路（ELv2） |
| 可证伪的检查命令 | INV 和义务的 `check` 命令 | edikt | 仅思路（ELv2） |
| 会过期的豁免（override） | `keel approve --rule override --until …` | edikt | 仅思路（ELv2） |
| 上下文压缩后重新注入简报摘要 | `runtimes/hook-events.yaml` 中的规范压缩后事件 | keel-other (dcsg/keel) | 仅思路（ELv2）；机制不同，审计见下文 |
| 针对变更验收的修订案（amendment）记录 | AM 记录、修订案账本 | oh-my-claudecode 验收标准修订/取代账本 | 思路 |
| 决策提交尾注（trailer） | `Keel-*` 提交尾注、`Keel-Ruling` | oh-my-claudecode | 思路 |
| 带剩余风险登记的回执（receipt） | `templates/proposal/receipt.md` | oh-my-claudecode | 思路 |
| 带令牌的 CAS 认领（claim） | `refs/keel/claims/<P.Tn>` 只可创建的锁 | oh-my-claudecode 认领令牌 | 思路 |
| 适用于任何运行时上评审者的评审结论（verdict）文件契约 | `schemas/verdict.schema.json`、提交通道 | oh-my-claudecode | 思路 |
| 提示词摘要 | `PG-<sha12>`、`Keel-Prompt` 提交尾注 | oh-my-claudecode 提示词单一来源摘要 | 思路 |
| ACK 复述 | ACK id 集合差异比对 | oh-my-codex | 思路 |
| 作为类型化字段的非目标和决策边界 | 冻结意图（frozen intent）块；可自行决定与必须提问清单 | oh-my-codex | 思路 |
| 带回退阶梯的按事件钩子能力矩阵 | `runtimes/hook-events.yaml`；梯级（rung）A–D | oh-my-codex | 思路 |
| 能力锁文件 | 描述符 `verification_status`；`.keel/generated.lock.json` | oh-my-codex | 思路 |
| 双评审通道 | 声明的工程/评审模型家族对 | oh-my-codex | 思路 |
| 绑定到版本的同意 | 批准记录中对所展示内容版本的显式确认，附可选备注 | old-coder | 思路 |
| 绑定源状态、失败即关闭的证据（evidence） | `sourceStateBinding`（提交、树、匹配字段） | old-coder | 思路 |
| 带负对照、失败即关闭的检验关卡 | 每个检查都有负对照 | old-coder | 思路 |
| 盲验证者 | blind-diff 评审镜头（lens） | old-coder | 思路 |
| 诚实的"未运行的层" | `not_run` 状态；回执中列出未运行的门禁（gate） | old-coder | 思路 |
| 事件溯源的运行日志 | 带哈希链的账本（ledger） | OpenHands | 思路 |
| 脚本化模型的端到端测试 | 重放录制流的伪造运行时；回环伪造模型提供方 | OpenHands | 思路 |
| HUMAN/AGENT 回执拆分 | `receipt.md` 中的 AGENT 部分加上渲染出的落地批准部分 | OpenHands | 思路 |
| ACP 作为后续驱动 | Kimi Code ACP 驱动候选（M6） | OpenHands | 思路 |
| 批准后冻结意图 | `keel:frozen` 块、`contract_hash` | BMAD-METHOD | 思路 |
| 意图对齐审核者 | intent-alignment 评审镜头 | BMAD-METHOD Intent Alignment Auditor | 思路 |
| 意图缺口路由 | `intent_gap` 把提案退回到框定阶段 | BMAD-METHOD | 思路 |
| 覆盖映射 | 工单（work order）`covers` | BMAD-METHOD | 思路 |
| 单写者所有权 | 每个产物和字段一个写者 | BMAD-METHOD | 思路 |
| 带分诊和循环上限 5 的并行评审镜头 | 评审镜头集、TR 记录、修复轮次上限 | BMAD-METHOD | 思路 |
| 矩阵测试审计与验证缺口评审镜头 | verification-gap 评审镜头 | BMAD-METHOD | 思路 |
| 就绪度 PASS/CONCERNS/FAIL | plan 门禁的 `ready` 检查 | BMAD-METHOD | 思路 |
| 会话大小的规格 | 简报预算 | BMAD-METHOD | 思路 |
| 内容寻址的渲染快照 | `PG-<sha12>` | BMAD-METHOD | 思路 |
| 任务单 DAG | 工单 `after` 边 | BMAD-METHOD | 思路 |
| 分层配置 | `.keel/config.yaml` 加 `.keel/local.yaml` | BMAD-METHOD | 思路 |
| 作为数据的迁移 | 带数据迁移的版本化账本 schema | BMAD-METHOD | 思路 |
| 受管 AGENTS.md 块 | AGENTS.md 指针块 | BMAD-METHOD | 思路 |
| Web 包 | 梯级 D 粘贴流程 | BMAD-METHOD | 思路 |
| 人设 A/B 证据（issue #2675） | 用席位契约取代人设 | BMAD-METHOD | 设计选择的佐证 |
| 仪式棘轮 | 只升不降的轨道（track）棘轮 | superpowers | 思路 |
| 批准绑定所呈现的产物 | 批准记录中的产物哈希；确认后的重新哈希 | superpowers | 思路 |
| 全局约束、接口、评审重点 | 工单字段 | superpowers | 思路 |
| 带"出错代价"的裁定；停止类别 | `keel api rule`；四种停止类别 | superpowers | 思路 |
| 状态枚举与 BLOCKED 补救阶梯 | `resultStatus`；补救阶梯 | superpowers | 思路 |
| 按席位的档位（tier） | 档位 frontier、standard、fast | superpowers | 思路 |
| 一个评审者、两个评审结论；防引导 | 评审结论 `spec_verdict` 加 `recommendation`；控制者绊线 | superpowers | 思路 |
| 有界修复循环 | 修复轮次 1–5 | superpowers | 思路 |
| 任务完成纪律 | 完成意味着 keel 重新执行过的证据 | superpowers | 思路 |
| 绿色基线隔离 | 构建前的绿色基线证据 | superpowers | 思路 |
| 仅按来源清理 | 收尾只移除带 keel 来源标记的工作树（worktree）和引用 | superpowers | 思路 |
| 带无指导对照的一致性测评 | 行为一致性测评场景 | superpowers | 思路 |
| 只描述触发条件的技能描述 | 技能描述检查 | superpowers | 思路 |
| 要么引用、要么丢弃 | 审计评审镜头的引用；陷阱条目需要事故编号 | superpowers | 思路 |
| 裁剪评审层 | 没有测得产出的评审层会被裁剪 | superpowers | 思路 |
| Windows 经验 | 启动契约；使用副本而不是符号链接 | superpowers | 思路 |
| 目标（goal）溯源 | 简报的缘由链 | Paperclip | 思路 |
| 冲突即终局的原子检出 | 丢失的 CAS 认领以退出码 4 退出，且从不重试 | Paperclip | 思路 |
| 80% 警告、100% 停止的预算 | 预算事件、`--rule budget` | Paperclip | 思路 |
| 活性不变量（invariant） | 活性不变量与孤儿审计 | Paperclip | 思路 |
| 静止看门狗 | 静止审计（M8） | Paperclip | 思路 |
| 从不悄悄切换引擎 | `policy.no_silent_fallback` | Paperclip | 思路 |

### 其他项目与标准

| keel 构造 | 在 keel 中的位置 | 来源 | 用途 |
| --- | --- | --- | --- |
| 按提交的索引状态机 | IndexProvider `status(commit)` | Sourcegraph | 仅思路，公开文档 |
| 最近已索引祖先加差异覆盖 | 在 head 上的索引应答 | Sourcegraph | 仅思路，公开文档 |
| 代码智能 API 形态：定义、引用、搜索 | IndexProvider 方法 | Sourcegraph | 仅思路，公开文档 |
| 期望状态计划 | `keel arch plan`、战役计划 | Sourcegraph | 仅思路，公开文档 |
| 随时间变化的序列 | 架构序列点 | Sourcegraph Code Insights | 仅思路，公开文档 |
| 作为数据的所有权 | 架构元素（element）所有者标签 | Sourcegraph | 仅思路，公开文档 |
| 带点击穿透和变更流的自包含 HTML/SVG 架构视图 | 看板（dashboard）架构视图、架构元素对话框、变更流 | axumquant/arch-viewer | 思路；其捏造的边和 0–100 评分是反例 |
| 看板用的无头（headless）路由、查询缓存、表格和虚拟化列表 | React 适配层上的看板前端（[ADR-0009](adr/ADR-0009-tanstack-frontend.zh-CN.md)） | TanStack Router、Query、Table 和 Virtual；React | 库（MIT），在包构建时打包；开发依赖，从不作为运行时依赖 |
| 带冻结基线（baseline）的可执行边界规则 | `.keel/arch/rules.yaml`、`baseline.json` | dependency-cruiser, ArchUnit, import-linter | 思路 |
| C4 层级；Mermaid 和 `.c4` 导出 | `.keel/arch/model.yaml` 架构元素种类；导出 | LikeC4, Structurizr | 思路 |
| 来自标准索引格式的符号 id | IndexProvider `scip` 后端 | SCIP | 格式标准；可选导入 |
| 与 keel id 并列记录的稳定变更 id | 与 `Keel-Round` 并列的 jj change id | jj | 可选适配器（M7） |
| 操作日志与 evolog | 额外的保留操作检测来源；审计导出 | jj | 可选适配器（M7） |
| 一等公民的冲突 | 冲突成为解决任务 | jj | 思路 |
| Megamerge 预览 | 集成预览 | jj | 思路 |
| 按修订运行命令 | jj 后端中的 `jj run`；git 中的分离工作树 | jj | 可选适配器（M7） |
| 策略 revset | jj 后端策略检查 | jj | 可选适配器（M7） |
| 集成者作为唯一的主干写者 | 只有 Steward 执行落地 | jj-agentic-workflow (CodeAlive) | 思路 |
| 串行创建工作区 | 工作树在锁下串行创建 | jj-agentic-workflow (CodeAlive) | 思路 |
| 隐患清单 | M7 隐患套件 | jj-agentic-workflow (CodeAlive) | 思路 |
| 作为产物种类的类型化订阅者的角色 | 席位契约的输入和输出 | MetaGPT | 思路 |
| 必填的未决问题字段 | 意图中的"Open questions"；frame 门禁检查 | MetaGPT | 思路 |
| 带终局评审结论的有界成对评审循环 | 修复循环；`recommendation` 枚举 | ChatDev | 思路 |
| 哈希 id | Crockford base32 和内容寻址 id | Gas Town + Beads | 思路 |
| 预热命令 | 作为拉取通道的 `keel brief` | Gas Town + Beads | 思路 |
| 持久身份与临时会话 | 席位契约持久存在；运行是临时的 | Gas Town + Beads | 思路 |
| 验证合并后批次并对失败进行二分的合并队列 | 集成队列、预览二分、落地重新执行 | Gas Town Refinery | 思路 |
| 盖印在产物上的版本化宪法 | `charter_version` | GitHub Spec Kit | 思路 |
| 收敛与分析轮次 | frame 和 plan 门禁的一致性检查 | GitHub Spec Kit | 思路 |
| 文件不相交的并行标记 | 波次中两两不相交的 write_set | GitHub Spec Kit | 思路 |
| 带限定范围注入的标准索引 | 按 `applies_to` 选择的简报切片 | Agent OS | 思路 |
| 移除角色子智能体 | 席位记录其编码的假设 | Agent OS | 思路 |
| 只含指针的规范指令文件 | AGENTS.md 指针块；`CLAUDE.md` 桥接 | AGENTS.md 标准 | 标准 |
| 可移植的过程单元 | `skills/keel-*/SKILL.md` | Agent Skills | 标准 |
| LLM 经理式委派不可靠 | 不由模型路由工作（KP-04） | CrewAI；MAST 多智能体失败研究 | 反面教训 |
| 模拟工具与虚假成功 | 自检、重新执行、伪完成扫描 | claude-flow / ruflo | 反面教训 |
| Windows 进程启动中不使用 `shell:true` | 启动契约 | Node.js 安全公告 CVE-2024-27980 | 安全公告 |

### 仅公开文档

| keel 构造 | 在 keel 中的位置 | 来源 | 用途 |
| --- | --- | --- | --- |
| 指令文件、技能目录、智能体格式、钩子事件、无头与 schema 标志、退出码、信任模型、权限机制、模型提供方（provider）协议 | 按事实带 `verification_status` 的 `runtimes/*.yaml` | Claude Code、Codex CLI、Gemini CLI、Qwen Code、Kimi Code、opencode 和 Z.ai 文档 | 公开文档；尚未探测的事实标记为"待探测验证"（verify by probe） |
| EARS 需求陈述 | `spec.yaml` 需求陈述 | Kiro（公开文档） | 公开文档 |
| 需求、设计和任务三件套 | 意图与规格增量、架构增量、计划与工单 | Kiro（公开文档） | 公开文档 |
| Steering 包含模式 | 按 `applies_to` 限定义务范围 | Kiro（公开文档） | 公开文档 |
| AGENTS.md 始终被包含 | 指针块保持精简且始终加载 | Kiro（公开文档） | 公开文档 |
| 依赖图波次 | 由 `after` 边形成的波次 | Kiro（公开文档） | 公开文档 |
| Quick Spec | 常设策略（standing policy）从不自动批准模型起草的验收 | Kiro（公开文档） | 反面教训 |
| 记忆作为不可信数据 | [14-trust-security.zh-CN.md](14-trust-security.zh-CN.md) 中的不可信数据规则 | OpenHands（公开文档；本地克隆中没有，它保存的是 agent-canvas 前端） | 公开文档 |

### keel 自身的设计过程

| keel 构造 | 在 keel 中的位置 | 来源 | 用途 |
| --- | --- | --- | --- |
| 可插拔的 IndexProvider，默认 codegraph、可选 SCIP；派生数据被 git 忽略，声明数据被提交 | [ADR-0007](adr/ADR-0007-declared-vs-derived-architecture.zh-CN.md) | 架构可视化调研（对 Sourcegraph 和 arch-viewer 的综合） | 原创综合 |
| ACK id 集合差异比对；梯级 D；手册预算；Codex 仅用 openai-responses | [02-alignment.zh-CN.md](02-alignment.zh-CN.md), [09-runtimes.zh-CN.md](09-runtimes.zh-CN.md) | 蓝图提案 A | 原创 |
| 仅用环境变量名的模型提供方；活性（借鉴 Paperclip）；`derived_from` 过期检测；历史表现记录；临时索引快照；钩子事件表；ajv | [10-providers.zh-CN.md](10-providers.zh-CN.md), [03-lifecycle.zh-CN.md](03-lifecycle.zh-CN.md), [05-vcs.zh-CN.md](05-vcs.zh-CN.md) | 蓝图提案 B | 原创 |
| 位于 git 公共目录中的控制平面；RTM；修订案；降级（degraded）独立性；CAS 认领；Windows 启动契约；提示词哈希；里程碑顺序 | [ADR-0003](adr/ADR-0003-control-plane-in-git-common-dir.zh-CN.md), [04-trace-and-state.zh-CN.md](04-trace-and-state.zh-CN.md), [15-roadmap.zh-CN.md](15-roadmap.zh-CN.md) | 蓝图提案 C | 原创 |
| 模型提供方路径集、暴露规则、已批准的请求、红绿证明、纯 git 保留操作检测、非嵌套分支名、投影门禁 | [14-trust-security.zh-CN.md](14-trust-security.zh-CN.md), [05-vcs.zh-CN.md](05-vcs.zh-CN.md) | 合规、事实和一致性评审轮次；对齐评判 | 原创 |
| 显式确认批准：展示变更、确认、重新哈希、连同哈希、声明的批准人和本地时间一起记录；被绑定内容有任何变更即失效；只有 `keel approve` 能写记录 | [02-alignment.zh-CN.md](02-alignment.zh-CN.md), [ADR-0005](adr/ADR-0005-explicit-confirmation-approvals.zh-CN.md) | 所有者决策 D6 | 决策 |
| 仅名称的模型提供方配置；TanStack 看板；git 优先 | [ADR-0006](adr/ADR-0006-provider-values-by-reference.zh-CN.md), [ADR-0008](adr/ADR-0008-read-only-dashboard.zh-CN.md), [ADR-0009](adr/ADR-0009-tanstack-frontend.zh-CN.md), [ADR-0001](adr/ADR-0001-git-primary-jj-optional.zh-CN.md) | 所有者决策 P1、P2、D4 | 决策 |

## 外部项目

许可证读取自每个本地参考克隆的 `LICENSE` 文件，读取日期为 2026-09-25。没有本地克隆的项目在 M0 中未核实许可证；无论其许可证为何，keel 都把它们视为仅思路的来源，例外是 TanStack 和 React 这两个 npm 包家族：它们的许可证会在 M5 进入依赖清单之前从每个包中读取。[reference-projects.yaml](reference-projects.yaml) 是刷新纪律（P4）的机器可读参考项目登记表，保存每个项目的评审日期、HEAD、版本和结果。本表是它的人工摘要，并补充许可证依据。

| 项目 | 上游 | 本地克隆：版本、HEAD | 许可证 | 核实依据 | keel 如何使用 |
| --- | --- | --- | --- | --- | --- |
| OpenSpec | https://github.com/Fission-AI/OpenSpec | `@fission-ai/openspec` 1.12.0, `e062b95` | MIT | 本地 `LICENSE` | 思路；无 CLI 依赖 |
| codegraph | https://github.com/colbymchenry/codegraph | `@colbymchenry/codegraph` 1.6.0, `ba3c21e` | MIT | 本地 `LICENSE` | 思路；可选的外部后端，不内置 |
| edikt | https://github.com/diktahq/edikt | `5844fbb` | Elastic License 2.0 | 本地 `LICENSE` | 仅思路 |
| keel-other (dcsg/keel) | https://github.com/dcsg/keel | `54a48d5` | Elastic License 2.0 | 本地 `LICENSE` | 一个思路；反例 |
| oh-my-claudecode | https://github.com/Yeachan-Heo/oh-my-claudecode | `oh-my-claude-sisyphus` 5.3.0, `4820f5641` | MIT | 本地 `LICENSE` | 思路 |
| oh-my-codex | https://github.com/Yeachan-Heo/oh-my-codex | `oh-my-codex` 0.21.4, `304fb3b4` | MIT | 本地 `LICENSE` | 思路 |
| old-coder | https://github.com/AmazingAng/old-coder | `a0eb529` | MIT | 本地 `LICENSE` | 思路 |
| rtk | https://github.com/rtk-ai/rtk | `rtk` 0.49.0, `feac25d`（分支 `develop`） | Apache-2.0 | 本地 `LICENSE` | 思路；首轮评审见下文，尚未采纳任何构造 |
| OpenHands | https://github.com/OpenHands/OpenHands | `f7fb0c4b2` | MIT | 本地根目录 `LICENSE` | 思路 |
| BMAD-METHOD | https://github.com/bmad-code-org/BMAD-METHOD | `1b59caa7` | MIT，附 BMad 名称的商标声明 | 本地 `LICENSE` | 思路 |
| superpowers | https://github.com/obra/superpowers | `superpowers` 6.4.1, `5bf4e78` | MIT | 本地 `LICENSE` | 思路 |
| Paperclip | https://github.com/paperclipai/paperclip | `efce9356b` | MIT | 本地 `LICENSE` | 思路 |
| TanStack | https://github.com/TanStack | 无本地克隆；从 M5 起为 npm 包 | MIT | M5 之前不核实（届时读取每个包的 `LICENSE`） | 前端技术栈（P2，[ADR-0009](adr/ADR-0009-tanstack-frontend.zh-CN.md)）；开发依赖，打包进产物 |
| React | https://github.com/facebook/react | 无本地克隆；从 M5 起为 npm 包 | MIT | M5 之前不核实（届时读取每个包的 `LICENSE`） | TanStack 库运行所依托的适配层（[ADR-0009](adr/ADR-0009-tanstack-frontend.zh-CN.md)）；开发依赖，打包进产物 |
| Sourcegraph | https://github.com/sourcegraph（组织） | 无本地克隆 | 未核实；部分内容不开源 | n/a | 仅思路，公开文档 |
| axumquant/arch-viewer | https://github.com/axumquant/arch-viewer | 无本地克隆 | 未核实 | n/a | 思路；反例 |
| dependency-cruiser, ArchUnit, import-linter, LikeC4, Structurizr | n/a | 无本地克隆 | 未核实 | n/a | 思路 |
| SCIP | n/a | 无本地克隆 | 未核实 | n/a | 索引格式；可选导入用户自己的索引 |
| jj (Jujutsu), CodeAlive jj-agentic-workflow | n/a | 无本地克隆 | 未核实 | n/a | 思路；jj 是可选的外部工具（M7） |
| MetaGPT, ChatDev, CrewAI, Gas Town + Beads, GitHub Spec Kit, Agent OS, claude-flow / ruflo | n/a | 无本地克隆 | 未核实 | n/a | 思路与反面教训 |
| Kiro | n/a | 无本地克隆 | 专有产品 | n/a | 仅公开文档 |
| Claude Code, Codex CLI, Gemini CLI, Qwen Code, Kimi Code, opencode | n/a | 在 `runtimes/*.yaml` 中注明处为已安装的二进制程序 | 未核实 | n/a | 公开文档；作为用户自行安装的外部程序调用 |
| git | n/a | 系统安装 | 未核实 | n/a | keel 调用的外部工具（OpenSSH 只作为 git 的传输层使用，keel 自身从不使用它） |

这些短哈希是 2026-09-25 时各克隆的 HEAD，记录下来以便日后的读者了解当时审查的是哪个版本。

## rtk 首轮评审

rtk（rtk-ai/rtk）是一个位于编码智能体与 shell 之间的单一 Rust 二进制程序：一个工具调用前钩子把 `git status` 这样的命令改写为 `rtk git status`，rtk 运行真实命令并返回精简后的输出（只保留失败项、分组后的 lint 结果、目录树列表），在本地 SQLite 存储中记录改写前后的字节数，并打印收益报告。它不是一个工作流；它是一个输出预算层，外加面向十八种智能体集成的安装器。它对 keel 的价值在于其度量纪律、精简契约、钩子决策函数和 Windows 钩子卫生。

评审日期 2026-09-25，克隆 HEAD `feac25d`，分支 `develop`，版本 0.49.0（`Cargo.toml`；CHANGELOG 条目日期为 2026-09-11），许可证 Apache-2.0，读取自本地 `LICENSE`。证据路径相对于克隆根目录。rtk 自身不处理任何模型提供方凭据；评审没有打开任何 `.env*`、凭据或设置文件，克隆中的 `.rtk/` 和 `.claude/` 目录只按文件名列出（P1）。rtk 自己的存储会在用户数据目录下保留完整命令字符串 90 天、原始命令输出 30 天，这是 keel 的类型化字段白名单会拒绝的；下文任何涉及存储输出的思路都要在这一约束下理解。

| 思路 | 克隆中的证据 | keel 构造或缺口 | 分类 | 原因 |
| --- | --- | --- | --- | --- |
| 永不更差守卫：只有当精简后的渲染在同一估算器下不大于原始输出时才输出它，且调用方通过标志明确要求的细节（`--nocapture`、`ls -la`）从不精简 | `src/core/guard.rs`（模块文档、`never_worse`）；`tests/guard_integration_test.rs`；`CONTRIBUTING.md` 中关于正确性对节省、关于透明度的章节 | 简报预算（[02-alignment.zh-CN.md](02-alignment.zh-CN.md)）、评审包与修复循环的摘录（[11-verification.zh-CN.md](11-verification.zh-CN.md) 第 7 节）、证据输出摘要。keel 有最大尺寸规则，但没有"精简从不膨胀"的不变量，也没有对展示给席位的运行器输出的"要求的详细程度优先"规则 | 候选项目 | 一个函数加一个负对照，就能让每段摘录在同一预算下可证明地不比原始字节更差，标志规则则阻止 Steward 隐藏验收命令声明需要的输出（KP-04） |
| 只在有可运行、内容寻址召回路径时才截断：每段被截断的输出都给出一条以命令和内容的哈希为键的召回命令；存储逐字节保真，带 FIFO、单条和保留期上限；提示只承诺存储真正能返回的内容；被截断的运行存入空退出码，从不伪造 0 | `src/core/README.md`（输出恢复、截断上限）；`src/core/tee.rs`；`src/core/retriever.rs`（`content_hash`、`RetrieverConfig`）；`CHANGELOG.md` 0.49.0 的召回条目 | 证据记录携带输出摘要（[11-verification.zh-CN.md](11-verification.zh-CN.md) 第 2 节）但没有可取回的正文；评审包和修复轮次没有定义好的方式去拉取摘录背后的完整日志。缺口：一个以摘要为键、挂在现有动词或 `keel api context` 之后的证据输出存储，落在 KP-14 的表面预算之内，作为缓存对待、从不作为落地输入（KP-06） | 候选项目 | 它把字节预算变成席位可以据以行动的契约，而不是猜测或重跑。两条 keel 约束适用：存储的正文必须通过类型化字段白名单且模型提供方错误正文从不持久化（[14-trust-security.zh-CN.md](14-trust-security.zh-CN.md) T11），保留期要连同分母在 doctor 输出中说明 |
| 诚实的度量表述：每个缩减数字都标注为 shell 输出字节的份额，从不标注为账单的份额；token 数声明为 `bytes / 4` 估算；派生的美元字段说明它来自一个固定常数而不是测量；免责声明就放在表格本身上 | `README.md`（节省如何计算）；`docs/guide/resources/savings-explained.md`（节省链、如何阅读收益表）；`docs/TELEMETRY.md`（经济性与质量行） | KP-12 诚实视图与 DashboardModel（[08-dashboard.zh-CN.md](08-dashboard.zh-CN.md)）、80% 与 100% 的预算（[03-lifecycle.zh-CN.md](03-lifecycle.zh-CN.md)）、回执。keel 固定了分母，但没有规则要求每个数值度量都写明单位和来源，也没有规则禁止把比率的分母呈现为成本 | 候选项目 | keel 将展示来自报告方式各不相同的运行时的轮次、工具调用和成本数字；在每个聚合值旁加上 `measure_provenance` 标签（reported、estimated 或 derived）并在表上写明单位，是一个小的 schema 改动，却有很大的诚实收益 |
| 覆盖率来自关联后的决策日志而不是推断：每次钩子调用写入一行决策（时间戳、会话、工具调用 id、决策、改写后的命令、版本）；一个定义好的谓词作为分子；某个会话覆盖率偏低被解读为"该钩子对某个子智能体未生效" | `src/core/tracking.rs`（`HookOutcome`、`is_covered`、`hook_decisions` 表）；`CHANGELOG.md` 0.48.0 的 discover 条目；`docs/guide/analytics/discover.md`；`src/discover/provider.rs`（`tool_use_id`） | 带分母的钩子日志（KP-10；[12-cli-api-mcp.zh-CN.md](12-cli-api-mcp.zh-CN.md) 第 6 节）。改进：以运行时的工具调用 id 作为每行日志的键，并把它与 keel 从自己解析的事件流中接收的工具事件关联起来，于是覆盖率就是记入日志的结果除以看到的工具事件 | 候选项目 | 来自第二个独立来源的分母比钩子自己数自己更有力，也是发现钩子在梯级 B 或 C 上悄悄未加载的唯一办法。只适用于钩子载荷和事件流中都暴露工具调用 id 的运行时：Claude Code 有，其余待探测验证 |
| 单一决策函数与承重的门序：拒绝优先；命令替换和进程替换、指向文件的重定向以及 heredoc 因无法证明而被拒绝，而不是仅仅降级；只有明确的允许规则才会自动放行改写，"没有规则匹配"从不自动放行；复合命令的每一段都必须通过；权限分段器是三个分段器中最保守的一个；测试注入规则而不是读取本机 | `src/hooks/decision.rs`（模块文档、`decide_with_params`）；`src/hooks/permissions.rs`（`check_command_with_rules`）；`src/discover/README.md`（共享词法分析工具包）；`tests/hook_decision_protocol_test.rs`（`Sandbox`） | `keel hook` 中的保留操作守卫（`org/reserved-actions.yaml`；[09-runtimes.zh-CN.md](09-runtimes.zh-CN.md) 第 5 节指出 Bash 模式很弱）。缺口：模式没有声明的求值顺序，复合命令没有逐段规则，也没有 `unattestable` 这一日志结果 | 候选项目 | 尽力而为的预防（KP-16）不应被 `git status && git push` 或 `$(git push)` 攻破；门序、一个会警告并记入日志的 `unattestable` 结果，以及注入规则的测试风格，让 keel 对每种绕过形态都有一个一致性测评场景，而由引用快照和 `ls-remote` 完成的检测仍是保证所在 |
| 匹配前的模式归一化：剥离环境变量前缀和 `env`，归一化带路径的二进制名，剥离 git 全局选项（`-C`、`--git-dir=`），剥去已描述的进程包装器如 `timeout 300`，在未描述的包装器选项可能吞掉下一个词时放弃匹配，并按工具和子命令各用一套语法分类标志 | `src/discover/README.md`（逐段改写、环境前缀处理、进程包装器处理）；`src/core/README.md`（参数分词器）；`CHANGELOG.md` 0.49.0 的包装器剥离条目 | 保留操作 `patterns` 以及派发时对 argv 中绕过标志的拒绝（[09-runtimes.zh-CN.md](09-runtimes.zh-CN.md)）。今天 `git push` 是一个前缀形态，`env X=1 git push`、`/usr/bin/git -C . push` 或 `rtk git push` 都不会匹配它 | 候选项目 | 守卫、生成的拒绝规则和接收解析器都应匹配剥离并归一化后的命令，这样 `submit.reserved-op` 的检测就不依赖席位的拼写方式；新增一致性测评场景"被改写型钩子或 `timeout` 包装的保留操作仍会被检测到" |
| 钩子完整性哈希与仓库内提交配置的先信任后加载：一个 SHA-256 附属文件带五个明确状态（Verified、Tampered、NoBaseline、NotInstalled、OrphanedHash），并诚实地注明只读位不是安全边界；项目本地过滤器文件在其哈希被记录之前会被跳过，而不是带警告地加载，任何改动都要重新评审 | `src/hooks/integrity.rs`（模块文档、`store_hash`）；`src/hooks/trust.rs`（`check_trust_with_content`）；`src/hooks/README.md`（完整性验证） | 带所有权标记和 `.keel/generated.lock.json` 的生成表面（KP-14）；影响席位所读内容却未经董事会签名的手册覆盖层和运行时模板（[14-trust-security.zh-CN.md](14-trust-security.zh-CN.md) T10） | 候选项目 | 在全新克隆上，已签名的批准覆盖简报和计划，但一个未签名的已提交覆盖层或技能文件可被任何对 fork 有推送权限的人编辑；把它的哈希记入锁文件，并在 `keel sync` 重新认可之前拒绝（而非警告）从漂移的文件编译简报，是一项带类型化状态列表的检测保证（KP-16） |
| 分层、有预算、始终加载的指令文本：每个更高的感知级别都是逐字节的低一级加一段尾部；行数预算测试防止膨胀；没有钩子的智能体总是收到激活文本；明确列出每个级别都刻意省略的内容；从不指示模型回避、跳过或怀疑某条命令 | `AWARENESS_CONFIG.md`（原则、带钩子的智能体对仅规则的智能体、刻意省略、测试）；`hooks/rtk-awareness.md` 及其 `-high` 和 `-full` 同级文件；`docs/guide/getting-started/configuration.md` | 手册预算（[09-runtimes.zh-CN.md](09-runtimes.zh-CN.md)：受管 AGENTS.md 块 <= 8 KiB 并带来源行，陷阱条目只有带事故编号才收录，只描述触发条件的技能描述），梯级 A 到 D 上简报的拉取对推送 | 候选项目 | 让受管块的级别成为梯级的函数（带钩子的运行时只得到如何阅读 keel 输出和简报在哪里；梯级 C 和 D 的运行时得到告诉席位去拉取 `keel brief` 的激活文本），测试每个更高级别都是低一级的前缀扩展，并在模板中保留一份"刻意省略"清单。这条反规则与 keel 的立场一致：不信任是结构性的（重新执行），不是靠提示 |
| 依据使用分母校准上限：按过滤器统计省略次数对召回次数，点名被过度召回的过滤器以便提高其上限；上限是每个过滤器只绑定一次的具名类别；配置为 0 的上限表示只给摘要但仍带召回提示；上限从不被拒绝 | `docs/TELEMETRY.md`（质量行 `recall_stats`）；`CHANGELOG.md` 0.49.0 的过度召回过滤器条目；`src/core/truncate.rs`；`src/core/README.md`（截断上限） | 按运行时画像的简报字节预算（[02-alignment.zh-CN.md](02-alignment.zh-CN.md)）、评审包与修复循环的摘录尺寸（[11-verification.zh-CN.md](11-verification.zh-CN.md)）、doctor 分母。keel 没有从"评审者多久拉取一次完整日志"回到预算的反馈回路 | 候选项目 | M0 的预算是猜测；按评审包的各节记录展示与拉取次数，给 M3 一个用 KP-12 风格调校它们的分母，而每个渲染器只绑定一次的具名上限类别把数字集中在一处（KP-14） |
| 伪造框架的负对照：夹具的 stdout 中带有伪造的内层摘要（失败测试的输出内部嵌套一行"100% tests passed"、嵌套的起始行），解析器仍必须取真正的最终摘要和退出码 | `tests/fixtures/ctest_spoofed_framing_raw.txt`；`src/cmds/system/ctest_cmd.rs` 中的测试 `rejects_spoofed_framing_and_uses_the_final_summary` 和 `parallel_start_cluster_rejects_wrong_name_spoof` | `submit.fake-completion`、负对照最小集（[11-verification.zh-CN.md](11-verification.zh-CN.md) 第 8 节）、Steward 运行器中的 JUnit 行解析 | 候选项目 | keel 把证据绑定到退出码和 JUnit 行而不是文本，但一个 stdout 带伪造通过摘要的预置夹具能钉住"运行器从不从自由文本读取状态"，同时兼作面向席位摘录的提示词注入测试 |
| Windows 原生的钩子卫生：钩子是一个二进制子命令，不用 bash 或 jq；钩子 stdin 上的 UTF-8 BOM（见于 Windows 宿主）在解析前被剥离；stdin 上限 1 MiB；协议 JSON 通过单一写入器输出，因为杂散的 stdout 会悄悄禁用钩子；一个仅 Windows 的回归测试证明带引号的参数能完整到达 MSYS 子进程；钩子载荷的行尾在 CI 中被钉住 | `README.md`（Windows 章节）；`src/hooks/hook_cmd.rs`（`STDIN_CAP`、`read_stdin_limited`、BOM 处理）；`CHANGELOG.md` 0.47.0 的 BOM 条目和 0.49.0 的行尾条目；`tests/windows_child_quoting_test.rs`；`docs/guide/getting-started/supported-agents.md` | `keel hook <event> --runtime <id>`（[12-cli-api-mcp.zh-CN.md](12-cli-api-mcp.zh-CN.md) 第 6 节）、D3 原生 Windows、[ADR-0002](adr/ADR-0002-node-windows-native.zh-CN.md) 启动契约、`test/README.md` 中的一致性测评场景 | 候选项目 | 这正是 Node 钩子入口在 Windows 11 上会遇到的失败模式，每一条都是一行规则加一个测试：剥离开头的 BOM、限制 stdin、通过单一函数写协议输出、诊断信息只走 stderr、增加 windows-latest 的引号测试。各运行时的具体细节仍待探测验证，但模式本身不必 |
| 按错误路径逐一枚举的失败即放行退出契约，并公开列出已承认的缺口：二进制缺失、JSON 错误、改写失败、版本过旧和钩子崩溃都以 0 退出，使命令原样运行；不改写就意味着无输出（或在宿主要求 JSON 时输出 `{}`）；一个已知违规写在缺口标题之下 | `hooks/README.md`（退出码契约、待修复缺口、优雅降级）；`src/hooks/README.md`；`hooks/claude/rtk-rewrite.sh`（每个分支都以 0 退出） | KP-10（钩子失败即放行并记入日志）、`runtimes/hook-events.yaml` 的结果、[12-cli-api-mcp.zh-CN.md](12-cli-api-mcp.zh-CN.md) 第 6 节。keel 陈述了原则，但没有枚举各错误路径以及每条路径必须产生的日志代码 | 候选项目 | 一张枚举表（二进制缺失、载荷无法解析、日志写入失败、未知事件、运行时协议不匹配，各自对应退出码、stdout 内容和日志结果）把 KP-10 变成一致性测评场景，钩子文档中的已知缺口清单则是把 KP-16 的习惯用到 keel 自己的钩子上 |
| 单一注册表之上的轻薄按智能体委托，以及在钉住 `HOME`、`CLAUDE_CONFIG_DIR` 和 `XDG_*` 的沙箱中拉起真实二进制的钩子测试，使开发者自己的智能体设置永远无法改变测试答案 | `hooks/README.md`（范围：不按智能体重复任何过滤逻辑）；`tests/hook_decision_protocol_test.rs`（`Sandbox`）；`tests/hook_warning_scope_test.rs`（`isolating_env`） | 由清单生成的按运行时垫片和片段（KP-14）、`test/README.md` 的一致性测评框架、永不读取规则（AGENTS.md 内部规则） | 候选项目 | keel 的垫片已经很薄；可迁移的部分是测试规则：每个钩子和派发测试都运行真实 CLI，并把 `HOME`、`APPDATA`、`CLAUDE_CONFIG_DIR`、`CODEX_HOME`、`KIMI_CODE_HOME` 和 `XDG_*` 指向临时目录，这既是密闭性，也是一项 P1 卫生保证，值得写进 `test/README.md` |
| 提示词缓存推理：精简后的输出只写入转录一次，之后永不改变，于是缓存所匹配的稳定前缀得以保留；更小的工具结果也让缓存写入和读取更便宜（rtk 引用了模型提供方的倍率，并提供一个读取用户使用量文件的经济性视图） | `README.md`（工作原理）；`docs/guide/resources/troubleshooting.md`（提示词缓存问答）；`src/analytics/README.md` | 确定性的哈希简报（KP-01；[02-alignment.zh-CN.md](02-alignment.zh-CN.md)，其中带 `computed_at` 的头部位于哈希正文之外）、压缩后的简报重新注入、钩子的 `inject` 结果 | 候选项目 | keel 每轮注入的任何内容，除非简报改变，否则必须在各轮之间逐字节相同，且易变字段（`computed_at`、未变的 `head_commit`）必须留在注入文本之外，否则 keel 会自己破坏它想要缓存的前缀。定价倍率与具体模型提供方相关且未经核实，从不硬编码（P1、KP-12）；读取使用量文件被永不读取规则排除 |
| 纠正对挖掘：按时间顺序扫描会话，找出同一基础命令先失败后成功的成对记录，分类错误（未知标志、路径错误、缺少参数），评分置信度，去重合并成带出现次数的规则，然后自动写出一个智能体加载的规则文件 | `src/learn/README.md`（检测算法、目的） | 只有带事故编号才收录的手册陷阱条目（[09-runtimes.zh-CN.md](09-runtimes.zh-CN.md)）；keel 在接收时按运行解析的工具事件流 | 候选项目 | 检测的那一半很合适：接收已经看到一次运行的每个工具事件，因此一对先失败后成功的记录可以成为以运行 id 作为事故编号的候选陷阱条目，提交给董事会。自动写入的那一半是一次未签名的手册变更，所以 keel 只提议 |
| 会改写并自动放行的钩子：rtk 的完整性模块之所以存在，是因为其钩子绕过了宿主的权限提示；Codex 集成记载宿主不会解开 rtk 二进制的包装，因此被包装的变更类命令如 `git push` 失去了安全信号；Trae 集成刻意省略权限决策，把审批留给宿主 | `src/hooks/integrity.rs`（模块文档、SA-2025-RTK-001 F-01）；`hooks/codex/README.md`；`hooks/README.md`（按智能体的 JSON 格式、退出码契约） | KP-10（钩子警告，门禁决定）、`runtimes/hook-events.yaml` 的结果（allow、block、inject、error）、[14-trust-security.zh-CN.md](14-trust-security.zh-CN.md) T12。keel 从不输出 `updatedInput` 或 `permissionDecision: allow`；文档应明确写出这一点并说明原因 | 反面教训 | 改写工具输入会把钩子信任变成一道安全边界，随之需要哈希附属文件、篡改状态和逐宿主的协议差异，而且仍会削弱宿主自身对改写后命令的规则。暴露面画像要记录的共存隐患：rtk 读取项目和用户设置，而不读取 keel 的按运行设置文件，因此席位发出的 `git push` 被改写为 `rtk git push` 后会逃过按运行的拒绝规则 `Bash(git push*)`；keel 的检测仍能捕获它，但在这样的机器上不得宣称预防，doctor 可以把 PATH 上存在 `rtk` 作为提示记录，而 Claude Code 交给后续钩子的是原始输入还是更新后的输入待探测验证 |
| `rtk init -g` 就地编辑用户全局和共享的智能体配置：Claude Code `settings.json` 钩子、`RTK.md`、`GEMINI.md`、Codex `hooks.json` 外加 AGENTS.md 中的一行、opencode 插件、Factory、Trae、Vibe 和 Hermes 配置文件，并带 `.bak` 备份、Ask/Auto/Skip 修补模式、面向 CI 的 `--auto-patch` 标志、旧版迁移和自修复代码 | `src/hooks/README.md`（安装模式、修补模式行为、原子性与安全）；`src/hooks/init.rs`（`patch_settings_json_command`、`backup_and_atomic_write`、`migrate_old_hook_script`）；`src/hooks/hook_cmd.rs`（`heal_legacy_copilot_configs`） | [09-runtimes.zh-CN.md](09-runtimes.zh-CN.md)（keel 从不读取、写入或哈希共享或用户全局的运行时设置；`keel sync` 只打印片段）、[14-trust-security.zh-CN.md](14-trust-security.zh-CN.md) 的运行时配置层行、`org/reserved-actions.yaml`（今天没有编辑智能体配置的行） | 反面教训 | rtk 展示了拥有用户智能体配置的全部代价：数千行按智能体的修补、迁移、备份和自修复代码，逐宿主的协议漂移，以及一个随后需要自身完整性检查的钩子。keel 以片段为先的立场不变；rtk 的 Skip 模式（打印手动说明并成功退出）就是 keel 的默认行为。后果：一个候选的保留操作行 `change-agent-config`（模式如 `rtk init`、`claude config`、`claude mcp add`、`codex mcp`、`gemini extensions`，以及对各运行时设置路径的写入；由工具事件检测，尽力而为地预防；写路径能否用每个运行时的拒绝语法表达待探测验证） |
| 读取用户的转录、智能体设置和环境：discover、session、learn 和 cc-economics 读取解析出的 Claude 目录下的 Claude Code JSONL 转录；钩子和改写路径读取用户和项目的 `settings.json` 及 `.local` 变体（以及 Cursor、Gemini、Droid 设置）来加载权限规则；`rtk env` 打印截断到 100 个字符的环境变量值（文件开头未发现掩码处理；待核实） | `src/discover/provider.rs`（`ClaudeProvider::projects_dir`）；`src/hooks/permissions.rs`（`load_permission_rules`、`get_settings_paths`）；`src/cmds/system/env_cmd.rs` | 永不读取规则（AGENTS.md 内部规则；KP-13）、`submit.provider-path-events`（[09-runtimes.zh-CN.md](09-runtimes.zh-CN.md) 梯级表）、暴露面画像（KP-16） | 反面教训 | 三者都是 keel 自己绝不能做的事，而第三项是 keel 可以在检测侧补上的缺口：席位运行环境转储（`env`、`printenv`、`set`、`Get-ChildItem Env:`、`rtk env`）会把取值放进转录，因此接收应把这些命令形态标记为与模型提供方路径读取并列的暴露事件，声明为已检测，而非已预防 |
| 遥测：默认关闭，在 init 时明确选择加入，加盐的设备哈希，仅上报命令名称，提供擦除命令，端点和令牌在编译时注入从而在未设置时代码为死代码；然而 `DISCLAIMER.md` 却说指标默认收集，与 `README.md` 和 `docs/TELEMETRY.md` 矛盾 | `docs/TELEMETRY.md`（工作原理、数据处理、面向贡献者）；`src/core/telemetry.rs`；`DISCLAIMER.md` | keel 不附带遥测（[14-trust-security.zh-CN.md](14-trust-security.zh-CN.md) T15 把发送遥测的适配器视为威胁）；单一归属文档规则（[README.zh-CN.md](README.zh-CN.md)） | 不适用 | keel 自身不发起任何网络调用，因此没有可采纳之处。rtk 两份文档之间的偏差提醒我们 keel 的单一归属表和验证器为何存在 |

在所有者依据 P4（[00-mandate.zh-CN.md](00-mandate.zh-CN.md) 第 4.4 节）作出决定之前，不从 rtk 采纳任何东西。采纳一个候选项目会在上方的映射中新增一行以 rtk 为允许来源的构造、修改受影响的归属文档，并在 [reference-projects.yaml](reference-projects.yaml) 中追加一条评审记录。反面教训已经出现在下方的"刻意未采纳"表中。评审中的一条整理备注：rtk 的 README 在安装检查中仍显示一个较旧的版本字符串，这是一个过期的文档示例，不影响此处记录的许可证或 HEAD。

## 许可证说明

- **keel 本身**采用 MIT 许可证，"Copyright (c) 2026 Qither"（D7），见根目录 `LICENSE`。
- **MIT 来源。** keel 用自己的文字和代码重新实现思路。M0 中没有复制任何参考项目的源文本或代码，因此无需附带第三方声明。如果后续里程碑从某个 MIT 项目复制代码，该项目的版权和许可声明必须随副本一并保留，并且该复制必须记录在本文档中。
- **Apache-2.0 来源**（rtk）。M0 中仅思路；未复制任何代码。如果后续里程碑从 rtk 复制代码，Apache-2.0 的声明要求随之适用，并且该复制必须记录在本文档中。
- **打包进产物的前端库**（TanStack、React，从 M5 起）。MIT；在包构建时打包进看板文件，因此它们的版权和许可声明随打包产物一并保留。加入时扩展下方的依赖表（[ADR-0009](adr/ADR-0009-tanstack-frontend.zh-CN.md)）。
- **Elastic License 2.0 来源**（edikt、keel-other）。仅思路。不复制任何文本、代码、schema、提示词、模板或文件布局。下文的形态审计记录了对比结果。
- **非 OSS 和专有来源**（Sourcegraph 的非开源部分、Kiro）。仅公开文档；仅思路。
- **商标。** 提及 BMAD-METHOD 仅为致谢。keel 自己的命名中不使用任何 BMad 标识。
- **外部程序。** 运行时（runtime）CLI、codegraph、SCIP 索引器、jj 和 git 由用户安装，并作为独立进程调用。keel 不内置也不再分发其中任何一个，它们也都不是包依赖。
- **模型提供方套餐条款**属于用户。doctor 会提醒用户检查它们，但不对其作任何断言。

M0 中的包依赖仅用于开发，服务于 `scripts/validate.mjs` 和类型检查。它们的许可证于 2026-09-25 读取自 `node_modules` 中每个包的 `package.json`。从 M1 开始，`yaml` 和 `ajv`（及其配套的 `ajv-formats`）成为运行时依赖（[ADR-0002](adr/ADR-0002-node-windows-native.zh-CN.md)）。

| 包 | 版本 | 许可证 |
| --- | --- | --- |
| typescript | 6.0.3 | Apache-2.0 |
| @types/node | 22.20.4 | MIT |
| ajv | 8.20.0 | MIT |
| ajv-formats | 3.0.1 | MIT |
| yaml | 2.9.1 | ISC |

## D2 来源审计与 ELv2 形态审计记录

### D2 来源审计

D2 要求一个全新的、独立的设计。一个构造只能通过本文档开头列出的允许来源进入 keel。绝不能出现的名称是 `scripts/validate.mjs` 中的 D2 术语列表；该文件是唯一写有这些名称的地方。

方法：

1. **构造映射。** 蓝图中致谢的每个思路在上面的构造映射中都有一行，指明一个允许的来源。谱系无法追溯到允许来源的构造会被移除或重新推导。
2. **机械检查。** `node scripts/validate.mjs --only audit` 扫描除 `scripts/validate.mjs` 和 `package-lock.json` 之外的每个仓库文件及其路径，查找 D2 术语列表中的词，任何命中都会失败；多词术语不区分大小写，并以任意分隔符或无分隔符匹配（带空格、带连字符和驼峰写法都一样）。它是 `npm run validate` 和 `npm run check` 的一部分；CI 在推送到 `main` 以及每个拉取请求时，在 windows-latest 和 ubuntu-latest 上用 Node 22.13 和 24 运行 `npm run validate`。
3. **措辞。** 席位资格称为一致性测评状态（conformance status），取值为 verified、failed 和 unverified。

没有允许来源的构造均已移除。IndexProvider 端口和源状态绑定是依据上文致谢的来源（架构可视化调研、Sourcegraph、old-coder 以及 Gas Town Refinery 的思路）设计的。

记录：

| 日期 | 范围 | 检查 | 结果 |
| --- | --- | --- | --- |
| 2026-09-25 | 蓝图致谢 | 每个致谢的思路在构造映射中都有一行 | 完成 |
| 2026-09-25 | `docs/14`–`docs/17`、`docs/adr/ADR-0001` … `ADR-0008` | `node scripts/validate.mjs --only audit` | 这些文件中没有 D2 术语命中 |
| 2026-09-25 | `docs/00-mandate`、`ADR-0009`、`docs/reference-projects.yaml` | `node scripts/validate.mjs --only audit` | 通过：`audit: 250/250 files clean`（没有 D2 术语、密钥形态或模型提供方主机命中） |
| 每次 CI 运行 | 整个仓库 | `npm run validate`（包含审计检查） | 必须通过；失败的运行会阻塞 M0 退出 |

### ELv2 形态审计

该审计把 keel 中归功于 ELv2 项目的构造与原作的形态进行比较，以表明跨越过来的只有思路。之所以要求进行这项审计，是因为一次评审发现早期草稿以 ELv2 原作的名称命名了 keel 的 ADR 规则章节。

| 方面 | ELv2 项目 | keel | 结论 |
| --- | --- | --- | --- |
| ADR 规则所在位置 | edikt 在每个 ADR 的正文旁边用单独的 YAML 附属文件保存规则元数据，由模型驱动的提取器写入，并由编译步骤合并进治理规则文件 | 义务位于 ADR 正文的 `## Obligations` 下，由架构席位或产品席位编写并被确定性地解析；没有提取步骤，也没有附属文件 | 形态不同 |
| 章节标题 | edikt 编译后的治理使用"Directives"标题 | `## Obligations`；早期草稿的标题已在修订 r2 中改名 | 已解决 |
| 条目字段 | edikt 的条目带有规则文本以及验证、意图、夹具、执行和来源摘录元数据 | `id`（`ADR-<5>.O<n>`）、`level`（must、must_not、should）、`text`、`applies_to` glob、可选的 `check` | 重叠之处只是"规则有路径范围和检查命令"这一通用思路，ArchUnit、import-linter 和 dependency-cruiser 中也有。可以接受 |
| Schema | edikt 附带一个版本化的附属文件 JSON Schema | `schemas/decision.schema.json`，基于 keel 的通用 `$defs` 从零编写 | 无复制 |
| 不变量 id | edikt 自己仓库的治理使用以 `INV-` 为前缀的 id | 章程（charter）不变量 `INV-nn`，由董事会编号的 must/must_not 义务，带 `applies_to` 和可选检查 | 通用缩写；没有其他共享之处。可以接受 |
| 钩子 | 记入日志、失败时放行的钩子 | 单一的 `keel hook` 入口，记录类型化结果供 doctor 统计分母 | 仅思路 |
| 豁免 | 会过期的豁免 | 已批准的 `keel approve --rule override --until …` | 仅思路 |
| 压缩后重新注入 | keel-other 从 Claude Code 的 PostCompact 钩子重新注入其计划状态 | 简报摘要通过特定于运行时的事件重新注入（Claude Code 带 matcher `compact` 的 `SessionStart`、Gemini CLI `BeforeAgent` 附加上下文、Qwen Code `PostCompact`；待探测验证），并有一个一致性测评场景断言它会重新出现 | 仅思路；机制不同 |
| 受管块标记 | keel-other 用 `keel:start` 和 `keel:end` 标记其受管的 `CLAUDE.md` 块 | keel 受管的 AGENTS.md 块使用 `keel:managed:start` 和 `keel:managed:end` 标记（于 2026-09-25 在 `templates/runtime/AGENTS.block.md.tmpl` 中核对），源自 BMAD-METHOD 的受管块和 OpenSpec 的 generatedBy 标记。共享的词是产品名，而产品名是一项开放决策 | keel 模板不得使用 `keel:start`/`keel:end` 这一对 |
| 运行时范围 | keel-other 的约束执行循环仅支持 Claude | 多运行时，在每个梯级上都有 Steward 侧的保证 | 反例 |

2026-09-25 的结果：没有从 ELv2 项目复制任何文本、代码、schema、提示词或模板；一个标题已在修订 r2 中改名；上述标记规则适用于 keel 的模板。结论：通过。

## 刻意未采纳

| 未采纳 | 见于 | 原因 |
| --- | --- | --- |
| 以人设角色扮演作为组织抽象 | 许多多智能体框架；BMAD-METHOD 的人设 A/B 证据 | 席位是带类型化输出的契约；人设没有显示出测得的产出 |
| 由模型充当经理负责路由、认领、状态转换或判定"完成" | CrewAI、MAST 研究 | 不可靠；控制由代码完成（KP-04） |
| 模拟工具与虚假成功 | claude-flow / ruflo | 完成必须以重新执行的证据为准 |
| 捏造的架构边和 0–100 健康评分 | axumquant/arch-viewer | 每条边都带有来源；没有标量评分 |
| 仅支持 Claude 的约束执行循环 | keel-other | keel 必须在每个受支持的运行时上保持其保证 |
| 自动批准、由模型起草的验收 | Kiro Quick Spec | 常设策略从不批准模型起草的验收 |
| 以 OpenSpec CLI 作为依赖 | OpenSpec | P3：借鉴思路，而非依赖 |
| 角色子智能体 | Agent OS（已将其移除） | 改为由席位记录其编码的假设 |
| 运行 `codegraph init` 或 `install`，或在开启遥测时运行它 | codegraph | 这些操作会编辑智能体配置；keel 只使用索引和查询命令 |
| 用于模型提供方取值文件的密封读取器 | keel 的一份早期草稿 | 已被仅名称不变量取代（[ADR-0006](adr/ADR-0006-provider-values-by-reference.zh-CN.md)） |
| 席位通过钩子提交；回环提交端点 | 设计备选方案 | Steward 提交和按模式的提交通道（[ADR-0004](adr/ADR-0004-steward-commits-and-submit-channels.zh-CN.md)） |
| 带签名者列表、agent 检查和硬件密钥的 SSH 或 GPG 签名；可选的签名模式 | 设计备选方案 | 被所有者排除（D6）：它们防御的是 keel 并未被要求防御的同账户威胁，代价却落在日常路径上。批准是显式确认（[ADR-0005](adr/ADR-0005-explicit-confirmation-approvals.zh-CN.md)） |
| jj 作为主后端；为智能体使用 jj 辅助工作区 | jj | [ADR-0001](adr/ADR-0001-git-primary-jj-optional.zh-CN.md) |
| 用于构建者席位的 Codex `.codex/agents` 文件；已移除的 chat wire API | Codex CLI | 它们只定义可派生的子智能体；Codex 路由使用 openai-responses |
| 权限绕过标志（`--dangerously-*`、yolo 模式、把 Kimi Code `-p` 视为安全、`--dangerously-bypass-hook-trust`） | 运行时 CLI | 从不生成 |
| 自动冲突解决（`-X ours/theirs`） | git | 冲突成为任务 |
| 以标题文本作为需求身份；不带基准哈希的修改 | 规格驱动的工具 | id 加 `rev_hash` |
| Windows 上的符号链接技能或配置 | 若干工具 | keel 写入副本 |
| 看板中的 UI 套件、CSS 框架和从 CDN 加载的资源 | 常见的看板技术栈 | P2：只用 TanStack 无头（headless）库，内联打包，置于原生标记之上（[ADR-0009](adr/ADR-0009-tanstack-frontend.zh-CN.md)） |
| 改写工具输入或授予权限的钩子（`updatedInput`、`permissionDecision: allow`） | rtk | 钩子只警告并记入日志，由门禁决定（KP-10）。改写型钩子是命令注入途径，还会让改写后的命令躲过宿主自身的规则；见 rtk 首轮评审 |
| 就地修补用户全局或共享的智能体配置（带备份、迁移和自修复代码的安装器） | rtk `init -g` | `keel sync` 只打印片段，从不写入共享或用户全局的运行时设置（[09-runtimes.zh-CN.md](09-runtimes.zh-CN.md)） |
| 为分析或规则读取用户的智能体转录、智能体设置或环境变量值 | rtk `discover`、`session`、`learn`、`cc-economics`、`env`；rtk 钩子的权限规则加载 | 永不读取规则（AGENTS.md 内部规则，KP-13）；keel 依据 doctor 输出和自己解析的事件流诊断 |
| 始终加载的上下文膨胀和静默截断 | 大型指令文件；Codex 的 32 KiB 指令链上限 | 在 sync 时检查手册预算 |
| 针对单一模型调校的强迫式提示语气 | 单一厂商的提示词包 | 提示词通过跨家族的行为一致性测评检查 |
| 存储的展示状态 | 缓存徽章的看板 | 状态由账本事件计算得出 |
