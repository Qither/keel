# Keel

[English](README.md) · **Stage A · 2026-10-08 · 英文为规范版 · 尚未发布**

Keel 是一个命令行控制面，服务于那些必须比对话、模型和碰巧执行它的厂商活得更久的工程工作。Stage A 覆盖一个工作单元：带一个 Task 和一个执行器的 WorkItem，及其授权、预算、持久状态、证据、停止与恢复路径。它从 Keel 宪法 v0.1.0 推导而来；[docs/DESIGN.zh-CN.md](docs/DESIGN.zh-CN.md) 中每个机制都注明来源。

Stage A 不调用模型、不使用凭据、不访问网络。执行器是一个本地进程；更丰富的执行器、替换、并发以及终端之外的任何界面属于后续阶段，此处不作声明。

## 安装与构建

需要 Node ≥ 22 且 `PATH` 中有 git。没有运行时依赖。

```bash
npm ci
npm run build
node dist/cli.js help
```

`npm test` 构建并运行 16 个集合案例及其 16 个植入故障孪生测试。`npm run demo` 运行该集合并写出 `demo/out/transcript.json`，含每条命令、退出状态、stdout、stderr 与环境，及其 sha256。

## 使用

1. 编写工作规格（JSON）。工作区必须是执行器可写入的 git 仓库。

   ```json
   {
     "goal": "write hello",
     "scope": "artifacts/",
     "workspace": "./ws",
     "acceptance": {
       "criteria": [
         { "id": "c1", "statement": "artifacts/hello.txt exists", "required": true, "evidence_mode": "artifact-exists", "path": "artifacts/hello.txt" }
       ]
     },
     "task": {
       "steps": [
         { "id": "s1", "kind": "exec", "argv": ["node", "-e", "require('fs').mkdirSync('artifacts',{recursive:true});require('fs').writeFileSync('artifacts/hello.txt','hi')"], "writes": ["artifacts/hello.txt"] }
       ]
     }
   }
   ```

   `evidence_mode` 取 `artifact-exists`（`path`）、`artifact-hash`（`path`、`sha256`）、`command-exit-status`（`step`，可选 `expected_status`）、`human-confirmation` 之一。

2. 创建 WorkItem，确认 Grant，运行，验证，验收：

   ```bash
   keel work create --spec work.json
   keel grant --allow exec:node --allow write:artifacts/** --attempts 3 --elapsed-seconds 60
   # 展示拟议 Grant 及其哈希，以 4 退出；重键哈希前 8 位以确认：
   keel grant --allow exec:node --allow write:artifacts/** --attempts 3 --elapsed-seconds 60 --confirm <8 位> --approver <你的姓名>
   keel run
   keel verify
   keel accept
   keel show
   keel log check
   ```

   每个动词都接受 `--json` 和 `--state-dir <dir>`（默认 `./.keel`）。只存在一个 WorkItem 时可省略其 id。

3. 出问题时：`keel stop` 请求取消；`keel recover` 在重复任何操作之前对照工作区核对被中断的运行，`keel recover --abandon` 记录明确放弃；`keel decide` 列出并处置步骤将超出 Grant 或预算时提出的决策请求；`keel context add` 为下一次运行记录事实、决定、推断或摘要；`keel evidence submit` 交付迟到结果或人工确认。

退出状态：`0` 完成 · `1` 检查或验收失败 · `2` 用法错误 · `3` 被规则拒绝（消息注明规则来源）· `4` 等待人类决定 · `5` 权威记录缺失或不一致。

## 状态

一切都在状态目录下：内容哈希的文档版本、一个哈希链接的只追加事件日志、执行器原始输出，以及一份从不读回的便利投影。哈希在规范 JSON 上计算，因此换行符无关紧要。见 [docs/DESIGN.zh-CN.md §2](docs/DESIGN.zh-CN.md#2-状态目录与权威)。

## 现状

Stage A 在研究主题 SA-01 下完成验证，并由所有者于 2026-10-09 采用；产品的合规声明以 [docs/ADOPTION.zh-CN.md](docs/ADOPTION.zh-CN.md) 为限。Stage B（会话、执行器与通道的替换）在 SB-01 下进行有边界验证，不作声明。公开发布是尚未作出的独立决定。许可证：在首次公开发布时选择。
