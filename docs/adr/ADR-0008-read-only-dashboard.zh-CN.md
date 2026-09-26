# ADR-0008 只读看板

> 英文原文（规范版本）：[ADR-0008-read-only-dashboard.md](ADR-0008-read-only-dashboard.md)。本文是其简体中文镜像，两者不一致时以英文版为准。

## 状态

于 2026-09-25 接受。只读运行按建议采纳，可通过重写本 ADR 撤销。看板的技术（React 上的 TanStack，无头覆盖原生标记，预渲染并打包）由 [ADR-0009](ADR-0009-tanstack-frontend.zh-CN.md) 决定；本 ADR 负责只读规则、serve 边界和唯一批准路径。

## 背景

董事会（Board）需要一个地方来查看目标、提案、追溯矩阵、架构、组织、证据、运行时健康状况和变更流。看板（dashboard）往往会长出操作按钮，而一个"批准"按钮会形成第二条批准路径，绕过 `keel approve`——董事会在那里查看变更并显式确认它（[ADR-0005](ADR-0005-explicit-confirmation-approvals.zh-CN.md)）。带写端点的本地 Web 服务器还会成为用户浏览器所加载的任何页面的攻击目标。

P2 要求使用 TanStack 库，无头覆盖原生 HTML 元素并配合手写 CSS，不使用 UI 套件、CDN 或 Web 字体（[ADR-0009](ADR-0009-tanstack-frontend.zh-CN.md)）。

## 决策

1. `keel dashboard build` 渲染一个自包含的 HTML 文件（默认 `.git/keel/cache/dashboard/index.html`，或 `--out`）。它使用与 `--json` 输出和 MCP 工具相同的 DashboardModel，因此看板从不自行计算状态或分母。
2. 技术：原生元素（header 和 nav、带 caption 和 scope 的表格、details 和 summary、dialog、带可见分母的 meter 和 progress、搜索输入框、fieldset 复选框、内联 SVG），以及使用自定义属性令牌实现浅色和深色主题、不使用 Web 字体的手写 CSS。页面在没有 JavaScript 的情况下也能完整阅读；最多约 300 行原生 JavaScript 用于添加过滤、搜索、叠加层和刷新。不使用框架、组件库或 CDN。
3. `keel dashboard serve` 是可选的：在 `127.0.0.1` 上使用临时端口的 `node:http`，检查 Host 和 Origin，提供只读的 `/api/model` 以及跟随账本（ledger）的服务器推送事件（server-sent events）。没有写端点。
4. 董事会操作只以可复制的 `keel approve …` 命令出现，由董事会在终端中运行。
5. 外壳和 CSS 在 M5 中编写；M0 只提供静态样板 `examples/dashboard/sample.html`。

## 后果

- 权威只有一条路径：在董事会终端上的显式确认。看板无法用于批准，即使是能访问回环服务器的页面也不行。
- serve 模式不需要认证，因为它不暴露任何写操作；Host 和 Origin 检查用于防范 DNS 重绑定读取。
- 董事会复制命令而不是点击按钮；这种摩擦是有意为之的。
- 对于 5k 文件的仓库，页面必须保持在 2 MB 以下，并渲染与 `--json` 黄金测试相同的状态和分母（M5 退出条件）。
- 视图、布局和无障碍规则位于 [08-dashboard.zh-CN.md](../08-dashboard.zh-CN.md)。

## 考虑过的备选方案

- **带批准和裁定按钮的 Web 应用。** 否决：它是 `keel approve` 展示并确认流程及其拒绝规则之外的第二条批准路径。
- **UI 套件、CSS 框架或 CDN。** 被 P2 否决；P2 所要求的无头（headless）TanStack 库在 [ADR-0009](ADR-0009-tanstack-frontend.zh-CN.md) 中决定。
- **托管的看板。** 否决：keel 以本地为先，不是托管服务。
- **只有 CLI 输出。** 否决：架构视图、追溯矩阵和董事会队列需要可视化概览；CLI 保留 `--json` 供脚本使用。

## 来源

- axumquant/arch-viewer：带点击穿透详情和变更流的自包含 HTML/SVG 视图。
- codegraph：回环 Host 和 Origin 检查。
- 所有者的常设偏好 P2（技术由 [ADR-0009](ADR-0009-tanstack-frontend.zh-CN.md) 决定）。
- 参见 [16-sources-credits.zh-CN.md](../16-sources-credits.zh-CN.md)。
