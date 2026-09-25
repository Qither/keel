# 来源、致谢与许可证

> 英文原文（规范版本）：[16-sources-credits.md](16-sources-credits.md)。本文是其简体中文镜像，两者不一致时以英文版为准。

keel 借鉴的是思路，而不是依赖或文本（P3，KP-15）。本文档负责三项记录：每个借鉴的构造到一个允许来源的映射、每个参考项目的许可证，以及 M0 退出条件要求的两项审计，即 D2 来源审计和 ELv2 形态审计。各项原则在 [00-vision.zh-CN.md](00-vision.zh-CN.md) 中就地引用其来源；本文档是完整清单。

当来源属于以下之一时，它是允许的：

- 开源项目，其思路由 keel 用自己的文字和代码重新实现；
- ELv2 或其他非 OSS 项目，仅用于思路：不使用其文本、代码、schema、提示词、模板或文件布局；
- 工具的公开文档，用于描述 keel 如何驱动该工具；
- 已发布的标准或文件格式（OpenSSH `allowed_signers`、AGENTS.md、Agent Skills、C4、EARS、SCIP）；
- keel 自身的设计过程：相互竞争的蓝图提案、调研综述和评审轮次；
- 所有者的决策 D1–D7 和常设偏好 P1–P3。

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
| 绑定到版本的可引述同意 | 批准信封中已签名的引述 | old-coder | 思路 |
| 绑定源状态、失败即关闭的证据（evidence） | `sourceStateBinding`（提交、树、匹配字段） | old-coder | 思路 |
| 带负对照、失败即关闭的检验关卡 | 每个检查都有负对照 | old-coder | 思路 |
| 盲验证者 | blind-diff 评审镜头（lens） | old-coder | 思路 |
| 诚实的"未运行的层" | `not_run` 状态；回执中列出未运行的门禁（gate） | old-coder | 思路 |
| 事件溯源的运行日志 | 带哈希链的账本（ledger） | OpenHands | 思路 |
| 脚本化模型的端到端测试 | 重放录制流的伪造运行时；回环伪造模型提供方 | OpenHands | 思路 |
| HUMAN/AGENT 回执拆分 | `receipt.md` 中的 AGENT 部分加上渲染出的已签名引述 | OpenHands | 思路 |
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
| 批准绑定所呈现的产物 | 批准信封中的产物哈希 | superpowers | 思路 |
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
| `ssh-keygen -Y sign/verify`、`allowed_signers`、FIDO2 `-sk` 密钥 | 董事会（Board）批准（[ADR-0005](adr/ADR-0005-signed-board-approvals.zh-CN.md)） | OpenSSH, git | 标准工具 |
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
| 模型提供方路径集、暴露规则、agent 密钥拒绝、已签名请求、红绿证明、纯 git 保留操作检测、非嵌套分支名、投影门禁 | [14-trust-security.zh-CN.md](14-trust-security.zh-CN.md), [05-vcs.zh-CN.md](05-vcs.zh-CN.md) | 合规、事实和一致性评审轮次；对齐评判 | 原创 |
| 仅名称的模型提供方配置；原生 HTML 看板；git 优先 | [ADR-0006](adr/ADR-0006-provider-values-by-reference.zh-CN.md), [ADR-0008](adr/ADR-0008-read-only-dashboard.zh-CN.md), [ADR-0001](adr/ADR-0001-git-primary-jj-optional.zh-CN.md) | 所有者决策 P1、P2、D4 | 决策 |

## 外部项目

许可证读取自每个本地参考克隆的 `LICENSE` 文件，读取日期为 2026-09-25。没有本地克隆的项目在 M0 中未核实许可证；无论其许可证为何，keel 都把它们视为仅思路的来源。

| 项目 | 上游 | 本地克隆：版本、HEAD | 许可证 | 核实依据 | keel 如何使用 |
| --- | --- | --- | --- | --- | --- |
| OpenSpec | https://github.com/Fission-AI/OpenSpec | `@fission-ai/openspec` 1.12.0, `e062b95` | MIT | 本地 `LICENSE` | 思路；无 CLI 依赖 |
| codegraph | https://github.com/colbymchenry/codegraph | `@colbymchenry/codegraph` 1.6.0, `ba3c21e` | MIT | 本地 `LICENSE` | 思路；可选的外部后端，不内置 |
| edikt | https://github.com/diktahq/edikt | `5844fbb` | Elastic License 2.0 | 本地 `LICENSE` | 仅思路 |
| keel-other (dcsg/keel) | https://github.com/dcsg/keel | `54a48d5` | Elastic License 2.0 | 本地 `LICENSE` | 一个思路；反例 |
| oh-my-claudecode | https://github.com/Yeachan-Heo/oh-my-claudecode | `oh-my-claude-sisyphus` 5.3.0, `4820f5641` | MIT | 本地 `LICENSE` | 思路 |
| oh-my-codex | https://github.com/Yeachan-Heo/oh-my-codex | `oh-my-codex` 0.21.4, `304fb3b4` | MIT | 本地 `LICENSE` | 思路 |
| old-coder | https://github.com/AmazingAng/old-coder | `a0eb529` | MIT | 本地 `LICENSE` | 思路 |
| OpenHands | https://github.com/OpenHands/OpenHands | `f7fb0c4b2` | MIT | 本地根目录 `LICENSE` | 思路 |
| BMAD-METHOD | https://github.com/bmad-code-org/BMAD-METHOD | `1b59caa7` | MIT，附 BMad 名称的商标声明 | 本地 `LICENSE` | 思路 |
| superpowers | https://github.com/obra/superpowers | `superpowers` 6.4.1, `5bf4e78` | MIT | 本地 `LICENSE` | 思路 |
| Paperclip | https://github.com/paperclipai/paperclip | `efce9356b` | MIT | 本地 `LICENSE` | 思路 |
| Sourcegraph | n/a | 无本地克隆 | 未核实；部分内容不开源 | n/a | 仅思路，公开文档 |
| axumquant/arch-viewer | n/a | 无本地克隆 | 未核实 | n/a | 思路；反例 |
| dependency-cruiser, ArchUnit, import-linter, LikeC4, Structurizr | n/a | 无本地克隆 | 未核实 | n/a | 思路 |
| SCIP | n/a | 无本地克隆 | 未核实 | n/a | 索引格式；可选导入用户自己的索引 |
| jj (Jujutsu), CodeAlive jj-agentic-workflow | n/a | 无本地克隆 | 未核实 | n/a | 思路；jj 是可选的外部工具（M7） |
| MetaGPT, ChatDev, CrewAI, Gas Town + Beads, GitHub Spec Kit, Agent OS, claude-flow / ruflo | n/a | 无本地克隆 | 未核实 | n/a | 思路与反面教训 |
| Kiro | n/a | 无本地克隆 | 专有产品 | n/a | 仅公开文档 |
| Claude Code, Codex CLI, Gemini CLI, Qwen Code, Kimi Code, opencode | n/a | 在 `runtimes/*.yaml` 中注明处为已安装的二进制程序 | 未核实 | n/a | 公开文档；作为用户自行安装的外部程序调用 |
| OpenSSH, git | n/a | 系统安装 | 未核实 | n/a | keel 调用的外部工具 |

这些短哈希是 2026-09-25 时各克隆的 HEAD，记录下来以便日后的读者了解当时审查的是哪个版本。

## 许可证说明

- **keel 本身**采用 MIT 许可证，"Copyright (c) 2026 Qither"（D7），见根目录 `LICENSE`。
- **MIT 来源。** keel 用自己的文字和代码重新实现思路。M0 中没有复制任何参考项目的源文本或代码，因此无需附带第三方声明。如果后续里程碑从某个 MIT 项目复制代码，该项目的版权和许可声明必须随副本一并保留，并且该复制必须记录在本文档中。
- **Elastic License 2.0 来源**（edikt、keel-other）。仅思路。不复制任何文本、代码、schema、提示词、模板或文件布局。下文的形态审计记录了对比结果。
- **非 OSS 和专有来源**（Sourcegraph 的非开源部分、Kiro）。仅公开文档；仅思路。
- **商标。** 提及 BMAD-METHOD 仅为致谢。keel 自己的命名中不使用任何 BMad 标识。
- **外部程序。** 运行时（runtime）CLI、codegraph、SCIP 索引器、jj、OpenSSH 和 git 由用户安装，并作为独立进程调用。keel 不内置也不再分发其中任何一个，它们也都不是包依赖。
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
| 豁免 | 会过期的豁免 | 已签名的 `keel approve --rule override --until …` | 仅思路 |
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
| 仅支持 Claude 的约束执行循环 | keel-other | keel 必须在六种技术栈上保持其保证 |
| 自动批准、由模型起草的验收 | Kiro Quick Spec | 常设策略从不批准模型起草的验收 |
| 以 OpenSpec CLI 作为依赖 | OpenSpec | P3：借鉴思路，而非依赖 |
| 角色子智能体 | Agent OS（已将其移除） | 改为由席位记录其编码的假设 |
| 运行 `codegraph init` 或 `install`，或在开启遥测时运行它 | codegraph | 这些操作会编辑智能体配置；keel 只使用索引和查询命令 |
| 用于模型提供方取值文件的密封读取器 | keel 的一份早期草稿 | 已被仅名称不变量取代（[ADR-0006](adr/ADR-0006-provider-values-by-reference.zh-CN.md)） |
| 席位通过钩子提交；回环提交端点 | 设计备选方案 | Steward 提交和按模式的提交通道（[ADR-0004](adr/ADR-0004-steward-commits-and-submit-channels.zh-CN.md)） |
| GPG 签名；仅 TTY 的批准 | 设计备选方案 | 遇到 agent 持有的密钥即失败关闭的 ssh 签名（[ADR-0005](adr/ADR-0005-signed-board-approvals.zh-CN.md)） |
| jj 作为主后端；为智能体使用 jj 辅助工作区 | jj | [ADR-0001](adr/ADR-0001-git-primary-jj-optional.zh-CN.md) |
| 用于构建者席位的 Codex `.codex/agents` 文件；已移除的 chat wire API | Codex CLI | 它们只定义可派生的子智能体；Codex 路由使用 openai-responses |
| 权限绕过标志（`--dangerously-*`、yolo 模式、把 Kimi Code `-p` 视为安全、`--dangerously-bypass-hook-trust`） | 运行时 CLI | 从不生成 |
| 自动冲突解决（`-X ours/theirs`） | git | 冲突成为任务 |
| 以标题文本作为需求身份；不带基准哈希的修改 | 规格驱动的工具 | id 加 `rev_hash` |
| Windows 上的符号链接技能或配置 | 若干工具 | keel 写入副本 |
| 看板中的前端框架或组件库 | 常见的看板技术栈 | P2（[ADR-0008](adr/ADR-0008-read-only-dashboard.zh-CN.md)） |
| 始终加载的上下文膨胀和静默截断 | 大型指令文件；Codex 的 32 KiB 指令链上限 | 在 sync 时检查手册预算 |
| 针对单一模型调校的强迫式提示语气 | 单一厂商的提示词包 | 提示词通过跨家族的行为一致性测评检查 |
| 存储的展示状态 | 缓存徽章的看板 | 状态由账本事件计算得出 |
