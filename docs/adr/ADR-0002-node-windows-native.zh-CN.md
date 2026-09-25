# ADR-0002 Node 与原生 Windows

> 英文原文（规范版本）：[ADR-0002-node-windows-native.md](ADR-0002-node-windows-native.md)。本文是其简体中文镜像，两者不一致时以英文版为准。

## 状态

于 2026-09-25 接受。由所有者决定（D3）。分发方式（先发布 npm 包）按建议采纳（[17-open-decisions.zh-CN.md](../17-open-decisions.zh-CN.md)）。

## 背景

所有者在原生 Windows 上工作，keel 必须能在那里运行，且核心设计中不使用 tmux、WSL、Docker、bash 或 python。keel 驱动的大多数智能体 CLI 是通过 npm 安装的 Node 程序，在 Windows 上 npm 会把 `.cmd` 和 `.ps1` shim 放到 PATH 上。Windows 带来了以 POSIX 为先的设计会忽略的约束：

- 通过 shell 以不可信参数启动 `.cmd` 存在命令注入风险（CVE-2024-27980），并且自该修复以来，Node 拒绝在没有 shell 的情况下启动 `.cmd` 文件；
- 命令行长度受限（通过 `cmd.exe` 为 8191 个字符，通过 `CreateProcess` 为 32767 个字符）；
- 没有 POSIX 信号：Node 的 `kill()` 总是强制的，不带 `/F` 的 `taskkill` 无法结束控制台进程，退出码 143 没有意义；
- 符号链接需要特权，路径可能超过 260 个字符，检出可能会转换换行符。

keel 还需要解析 YAML、校验 JSON Schema，并且必须在每个操作系统上以完全相同的方式对文本进行哈希。

## 决策

1. keel 用 TypeScript 编写，面向 Node ≥ 22.13，采用 ES 模块，开启 `strict` 类型检查。
2. 优先使用 Node 内置模块：`node:child_process`（`spawn`，`shell: false`）、`node:crypto`、`node:fs`、用于可选回环看板（dashboard）服务器的 `node:http`，以及用于派生 `trace.db` 的 `node:sqlite`（从 Node 22.13 起无需标志即可使用，但仍是实验性的：按 Node 版本待探测验证（verify by probe）；该数据库是派生的，始终可以重建）。
3. 运行时依赖仅限于 `yaml`（YAML 1.2 core schema）和 `ajv` 及其配套的 `ajv-formats`。不使用原生插件。在 M0 中它们是开发依赖，只供 `scripts/validate.mjs` 使用；`package.json` 没有 `dependencies`，也没有 `bin`（D1）。它们在 M1 中转为运行时依赖。
4. Windows 启动契约，是每个运行时（runtime）描述符的一部分：
   - 把 npm 的 `.cmd`/`.ps1` shim 解析为底层的 node 脚本或 `.exe`，从不以 `shell: true` 启动；
   - 通过 stdin 或文件传递提示词；argv 只携带固定的短字符串；
   - 依据白名单构建子进程环境（[10-providers.zh-CN.md](../10-providers.zh-CN.md)）；
   - 取消时先关闭 stdin，等待一段宽限期，然后执行 `taskkill /PID <pid> /T /F`；根据 keel 自己的取消日志记录"killed"；仅在 POSIX 上解释退出码 143；
   - 被强制终止的会话能否恢复，需按运行时待探测验证。
5. 哈希输入规范化为 LF、无 BOM、Unicode NFC，使黄金哈希在 Windows CRLF 检出和 Linux 上一致。
6. keel 写入副本，从不使用符号链接；它期望 `core.longpaths=true`；钩子和 shim 脚本以一个无扩展名的 sh 脚本、一个 `.cmd` 和一个 `.ps1` 的形式发布（M2）。
7. CI 在 windows-latest 和 ubuntu-latest 上用 Node 22.13 和 24 运行。
8. 分发首先采用 npm 包；在 M6 之后评估 Node 单一可执行应用。

## 后果

- 依赖面是两个包加上它们的配套包，安装时不需要编译器。
- Windows 是一等的 CI 目标，因此仅在 Windows 上出现的失败会在每次变更时暴露出来。
- 启动契约增加了按运行时的描述符字段（Windows 解析、提示词通道、退出码映射），这些字段必须经过探测并保持最新（[09-runtimes.zh-CN.md](../09-runtimes.zh-CN.md)）。
- 派生的追溯索引依赖一个实验性的内置模块；失去它只需付出重建的代价，绝不会丢失数据。
- keel 在核心中的任何地方都不能依赖 POSIX 工具（`flock`、bash、信号）；锁使用 `O_EXCL` 文件和 git CAS 引用。

## 考虑过的备选方案

- **Python 或 bash 编排层。** 被 D3 否决。
- **Go 或 Rust 单一二进制。** 否决：D3 选择了 TypeScript，智能体 CLI 生态基于 Node，而且以后仍可以通过 Node SEA 得到单一可执行文件。
- **用 tmux、WSL 或 Docker 做隔离和进程控制。** 被 D3 否决；进程控制改用启动契约，隔离的局限如实报告（[14-trust-security.zh-CN.md](../14-trust-security.zh-CN.md)）。
- **原生 SQLite 插件。** 否决：原生插件使 Windows 安装复杂化；追溯索引是派生的，`node:sqlite` 已足够。
- **以 Node SEA 作为首个分发方式。** 推迟到 M6 之后。

## 来源

- superpowers：Windows 经验（进程启动、符号链接、换行符）。
- [09-runtimes.zh-CN.md](../09-runtimes.zh-CN.md) 背后的运行时调研：各 CLI 的 npm shim 解析、argv 限制和退出码。
- Node.js 安全公告 CVE-2024-27980。
- 蓝图提案 B（ajv）和 C（Windows 启动契约）。
- 参见 [16-sources-credits.zh-CN.md](../16-sources-credits.zh-CN.md)。
