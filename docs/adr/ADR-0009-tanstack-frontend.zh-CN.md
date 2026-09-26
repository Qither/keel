# ADR-0009 所有前端一律使用 TanStack

> 英文原文（规范版本）：[ADR-0009-tanstack-frontend.md](ADR-0009-tanstack-frontend.md)。本文是其简体中文镜像，两者不一致时以英文版为准。

## 状态

于 2026-09-25 接受。由所有者决定（P2，即 [00-mandate.zh-CN.md](../00-mandate.zh-CN.md) 中声明的第 7 条）。本 ADR 决定 keel 交付的每个前端的技术；[ADR-0008](ADR-0008-read-only-dashboard.zh-CN.md) 负责看板的只读规则、serve 边界和唯一批准路径。选择 React 适配器和预渲染按建议采纳，可以撤销（[17-open-decisions.zh-CN.md](../17-open-decisions.zh-CN.md)）。

## 背景

ADR-0008 遵循所有者早先的常设偏好，把看板（dashboard）定为原生 HTML 加手写 CSS 和大约 300 行原生 JavaScript。2026-09-25，所有者替换了这一偏好：凡 keel 有前端展示之处，必须使用 TanStack。看板（M5）是 keel 唯一已规划的前端，该规则也覆盖以后的任何前端。

不变的约束：

- 一个自包含的文件，可从磁盘打开，没有外部请求；
- 只读，只有一条批准路径（[ADR-0005](ADR-0005-explicit-confirmation-approvals.zh-CN.md)、ADR-0008）；
- CLI `--json`、MCP 工具和页面背后只有一个 DashboardModel；
- 诚实的视图：文字标签、可见分母、确定性的架构布局（KP-12）；
- keel 的运行时依赖面保持 [ADR-0002](ADR-0002-node-windows-native.zh-CN.md) 所列的样子；
- 原生 Windows 构建和 CI。

TanStack 是一族无头（headless）库（Router、Query、Table、Virtual、Form、Store），提供 React、Solid、Vue 和 Svelte 适配器，另有全栈框架 TanStack Start。无头意味着这些库管理状态和行为但不渲染任何东西；标记属于应用程序。

## 决策

1. keel 交付的每个前端都用 React 适配器上的 TanStack 库构建：TanStack Router 使用 hash history，使视图可被链接（`#/trace`）且页面在 `file://` 下仍能工作；八个视图始终都在树中，匹配的路由只在导航上设置 `aria-current`、滚动到该视图并携带查询参数状态（排序、过滤、选中的架构元素），从不挂载或卸载任何视图。TanStack Query 用于加载模型，在 build 模式下以嵌入的模型作为 `initialData`，在 serve 模式下按服务器推送事件（server-sent events）失效重取；build 模式下模型查询没有 fetch 函数、`staleTime: Infinity` 且禁用重新获取，因此页面不发出任何类型的请求，只有 serve 模式注册 `/api/model` 的获取器。TanStack Table 用于每个表格视图（RTM、门禁结果、能力矩阵与一致性测评矩阵、发现项）。TanStack Virtual 用于长列表（变更流、账本尾部、符号列表），每个列表都完整预渲染，Virtual 只在用户第一次滚动后接管。只读页面不需要 Form 和 Store，因此不使用。
2. 仅限无头。渲染出的标记保留 [08-dashboard.zh-CN.md](../08-dashboard.zh-CN.md) 的原生元素和无障碍规则：带 `caption` 和 `th scope` 的 `table`、`details` 和 `summary`、`dialog`、带可见分母的 `meter` 和 `progress`、原生输入控件、内联 SVG。CSS 仍是手写的自定义属性令牌，带浅色和深色取值，使用系统字体栈。不使用 UI 套件、CSS 框架、图标字体、Web 字体或 CDN。
3. 先预渲染，再水合（hydrate）。`keel dashboard build` 把 React 树渲染为静态 HTML，模型嵌入在一个 `<script type="application/json">` 块中，内联客户端打包产物，并写出一个文件。静态 HTML 在没有 JavaScript 时展示每个视图：八个视图始终都被渲染，预渲染与水合时一样，每个视图是一个 `id` 等于其路由路径的 `section`，因此片段可作为锚点工作；长列表完整预渲染。JavaScript 添加排序、过滤、搜索、叠加层、元素 dialog 和实时刷新。水合不得改变标记：M5 的一项黄金测试在一组固定位置（至少 `#/` 和一个深链接）水合并比较两棵树。
4. 打包，而非依赖。前端及其库在包构建时编译为两个自包含的打包产物，随 npm 包一起发布：一个供 keel 导入以进行预渲染的渲染打包产物，以及一个由 keel 内联的客户端打包产物。`react`、`react-dom` 和 `@tanstack/*` 包是 keel 的开发依赖，绝不出现在 `dependencies` 中，因此 [ADR-0002](ADR-0002-node-windows-native.zh-CN.md) 的运行时依赖列表不变，其他任何命令都不会加载前端代码。打包器在 M5 中选定，只在包构建时运行。
5. 确定性。相同的模型和 keel 版本产生逐字节相同的页面：锁定的 lockfile、打包产物中没有构建时间戳或随机 id、只来自模型的新鲜度戳。
6. serve 模式与 ADR-0008 相同：仅回环、Host 和 Origin 检查、`GET` 和 `HEAD`、`/api/model` 和服务器推送事件，没有写端点。Query 在事件到来时使模型失效。
7. 预算，在 M5 中检查：对 5,000 文件的夹具，页面低于 2 MB；内联 JavaScript 压缩后低于 600 KB（仅客户端打包产物；嵌入的模型 JSON 计入页面预算）；零外部请求；每个视图在没有 JavaScript 时可读。

## 后果

- 页面比原生设计多出几百 KB 的库代码，仍是低于 2 MB 预算的单个文件。
- 在 M5，一套构建工具链进入 keel 的开发依赖；运行时依赖不增加任何东西。
- 框架变动成为 keel 承担的风险（[15-roadmap.zh-CN.md](../15-roadmap.zh-CN.md) 中的 RK-15）。lockfile 锁定版本，库是无头的，模型与框架无关，因此迁移只触及 `src/dashboard/`。
- 预渲染加水合意味着两条渲染路径；验证两者一致的黄金测试，是保住"无 JavaScript 可读"保证所付出的代价。
- 静态样板 `examples/dashboard/sample.html` 在 M0 中保持手写。它示范了 TanStack 页面必须复现的标记和令牌规则。
- [17-open-decisions.zh-CN.md](../17-open-decisions.zh-CN.md) 记录 React 和预渲染为按建议采纳。

## 考虑过的备选方案

- **原生 HTML 加原生 JavaScript，不使用任何库。** 被 P2 否决，P2 要求每个前端展示都使用 TanStack。
- **Solid、Vue 或 Svelte 上的 TanStack。** React 适配器在 Router、Query、Table 和 Virtual 上最完整；如所有者偏好其他适配器，可以撤销。
- **TanStack Start。** 否决：全栈框架假定有服务器，而 keel 的页面必须能从磁盘打开，serve 模式只是可选的只读附加项。
- **在 TanStack 之上的 UI 套件或组件库。** 否决：标记必须保持原生（P2 和 KP-12 的无障碍规则）。
- **不做预渲染的纯客户端单页应用。** 否决：会失去"无 JavaScript 可读"的保证，以及浏览器在 `file://` 下阻止脚本时的诚实回退。
- **对 React 的运行时依赖。** 否决：与 ADR-0002 的依赖面相矛盾，而打包无需依赖即可得到同样的结果。

## 来源

- 所有者的声明（[00-mandate.zh-CN.md](../00-mandate.zh-CN.md)，第 7 条）。
- TanStack 公开文档：Router、Query、Table 和 Virtual、它们的适配器以及无头设计。
- [ADR-0008](ADR-0008-read-only-dashboard.zh-CN.md)：本 ADR 保留的一切。
- 参见 [16-sources-credits.zh-CN.md](../16-sources-credits.zh-CN.md)。
