# KitchenMate · 今天吃什么

选出手头有的食材，找到真实来源的菜谱。

KitchenMate does not invent recipe instructions.
KitchenMate 不自行生成做菜步骤。正式推荐的菜谱必须能够追溯到真实来源。

[在线使用](https://kitchenmate-production.up.railway.app/) · [GitHub](https://github.com/lcl243790317/KitchenMate)

## Phase 3.1

- Pantry 默认展示 86 种常用食材（顶部 24 种），使用 9 个高层分类；主动搜索仍可查询完整 703 种词库。
- `/recipes` 全部教程独立于厨房食材，支持搜索、来源/类别筛选、每批 24 道及 URL 搜索词。
- 703 种食材，546 项英文名，支持中文别名、英文菜谱写法以及经过限定的具体食材 → 通用食材匹配。
- 365 份 HowToCook 开放授权原文教程，5 条外站来源链接记录。来源、验证时间和原始链接清晰可见；缺失字段不猜测，公式用量按原文显示。
- 选择食材即可推荐：现在就能做、只差一样、只差两样、最匹配、快手菜。基础调料低权重，购物清单保留菜谱用量。
- URL 导入支持公开 HTTPS 网页中的 Recipe JSON-LD / Microdata，保存到当前设备。六个外站示例实测记录见 docs/IMPORT_VERIFICATION.json。本站示例明确标记为测试夹具。
- 做菜模式、大字步骤、来源链接、已有源计时数据的计时器、进度恢复和 Wake Lock。只有可验证的完整教程能进入做菜模式。
- IndexedDB v4、JSON 备份 v3（兼容 v2）、最近浏览、收藏、购物清单和深色模式。旧选中食材自动转换为 ingredientId；旧收藏和导入快照保留，无来源快照隐藏但可备份。
- PWA 缓存已访问页面与静态文件，旧缓存升级时清理；首次访问、外站请求及在线搜索仍需网络。
- AI 菜谱生成业务、接口和配置已删除。无账号、无登录，不需要数据库或密钥即可完整使用可信目录。

## 运行与验证

需要 Node.js 24、pnpm 11.19.0。

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm lint
pnpm exec next typegen
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm test:smoke
pnpm recipes:validate
pnpm recipes:coverage
pnpm recipes:audit
```

Chrome E2E 默认访问 http://127.0.0.1:3000。设置 PLAYWRIGHT_BASE_URL 可指定服务器。离线测试需要生产构建，并设置 OFFLINE_TESTS=true。外部验证不在普通 CI 中执行；手动 / 每月 GitHub workflow 或 PowerShell：

```powershell
$env:LIVE_RECIPE_VERIFICATION='true'
$env:RECIPE_VERIFY_LIMIT='20'
pnpm recipes:verify
pnpm recipes:verify-imports
```

## 可选配置

THEMEALDB_API_KEY 必须是合法生产 supporter key；未配置时 UI 明确提示禁用。生产环境拒绝测试 key 1。THEMEALDB_USE_TEST_KEY 仅用于主动启用开发测试。DATABASE_URL 可选，仅供公共菜谱缓存，不存个人食材与导入数据。

导入保留同源校验、公共 IP 校验、逐跳 DNS 检查、请求超时及大小限制，不绕过网站访问限制。来源失败不会阻塞静态目录。

## 数据与架构

- data/verified-recipes/：来源快照、许可证、校验清单和正式目录。
- lib/verified-recipes.ts：菜谱、食材反向索引和来源索引。
- lib/recipe-trust.ts：所有展示与做菜入口的可信度门槛。
- lib/ingredients.ts / lib/matching.ts：别名及单向父级匹配。
- data/ingredients/pantry-primary.json：常用选择清单，与完整词库独立。
- data/recipe-search-aliases.json：明确菜名搜索别名。
- docs/VALIDATION.md：Phase 3.1 实际验收记录。
- lib/storage/device.ts：数据迁移、备份与做菜进度。
- features/：按需加载的功能视图。
- docs/RECIPE_SOURCES.md：授权依据、数据方法及限制。
- docs/LEGACY_RECIPE_AUDIT.md：原 82 道逐项处理记录。
- docs/RECIPE_COVERAGE.md：覆盖率和未覆盖食材。

HowToCook 文本按 The Unlicense 使用，原始内容和许可证随快照保留。外站 SOURCE_LINKED 记录不分发其完整教程或图片；用户导入仅存在设备中。项目代码采用 MIT。
