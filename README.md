# KitchenMate · 今天吃什么

无需注册、打开就能用的私人厨房工具。选食材，找菜谱，按步骤做饭；厨房、收藏、购物清单和导入菜谱保存在当前设备。

线上地址：https://kitchenmate-production.up.railway.app/
源代码：https://github.com/lcl243790317/KitchenMate

## 当前功能

- 约 700 种食材，覆盖 37 类，优先照顾中文家庭厨房。中文别名与常见英文名统一匹配，生抽与老抽等不同食材保留区别。
- 82 道独立编写的本地菜谱，含快手菜、家常菜、主食和中西常见菜。发现页也可主动搜索 TheMealDB 在线菜谱，来源会明确标注。无 API key 时本地菜谱照常使用。
- 根据现有食材、缺少食材、临期食材和已知库存数量推荐；支持时间、菜系、难度等筛选、份量换算及购物清单。
- 做饭模式提供大字步骤、多个独立计时器、进度恢复和 Wake Lock（浏览器支持时）。
- 网页导入支持公开 HTTPS 菜谱页中的 Schema.org Recipe JSON-LD 或 Microdata。导入页面有操作教程、本站保证成功的示例、经实测的外站示例及保存前预览。外站可能改变结构或拒绝读取；KitchenMate 不绕过登录、付费墙和访问限制。
- IndexedDB 保存厨房、收藏、购物清单、导入菜谱和做饭进度；localStorage 保存主题与写入保护记录。首次打开新版自动迁移 kitchenmate-v1，旧记录不会删除。可在“我的厨房”导出 JSON 备份、预览并恢复。
- Service Worker 缓存已访问页面和静态资源。首次使用及在线菜谱请求仍需联网；离线内容取决于此前缓存过的页面。

## 运行与验证

需要 Node.js 22+，建议 24。使用仓库的 pnpm-lock.yaml。

    pnpm install --frozen-lockfile
    pnpm dev

打开 http://localhost:3000。部署前验证：

    pnpm lint
    pnpm typecheck
    pnpm test
    pnpm build
    pnpm test:e2e

端到端测试使用本机 Chrome，并要求开发服务器运行在 http://127.0.0.1:3000。外站导入实测需要联网，按需执行：

    $env:LIVE_IMPORT_TESTS='true'
    pnpm exec vitest run tests/live-import.test.ts --reporter verbose

## 配置

核心功能不需要数据库或密钥。复制 .env.example 到 .env.local 可启用可选能力。

| 变量 | 用途 |
| --- | --- |
| THEMEALDB_API_KEY | TheMealDB 正式在线搜索密钥 |
| THEMEALDB_USE_TEST_KEY | 仅本地开发可用官方测试 key |
| DATABASE_URL | 可选 PostgreSQL 公共菜谱缓存；不保存个人厨房数据 |
| ENABLE_AI_RECIPE_GENERATION | 默认关闭，明确设为 true 且配置密钥时才启用可选 AI |
| LLM_API_KEY / LLM_BASE_URL / LLM_MODEL | 可选 AI 服务配置 |
| AI_REQUESTS_PER_IP_PER_DAY / AI_REQUESTS_GLOBAL_PER_DAY | AI 每日每客户端及全站额度 |

AI 与在线来源只在用户主动操作时请求。URL 导入强制外部 HTTPS、公共 IP、逐跳 DNS 校验、限时限长和同源 POST 检查；本站示例由固定路径解析，不经过外网请求。限流是进程内预算，扩展到多实例时需共享限流服务。

## 代码结构

app/ 是真实 Next.js 页面与 API；data/ingredients/、data/recipes/ 是经 Zod 校验的内容；lib/ingredients.ts、lib/matching.ts、lib/recipe-parser.ts 负责食材、匹配和导入；features/cooking/、features/import/、features/recipes/ 承载独立功能。公开本地菜谱详情由服务端渲染，厨房、发现、购物、导入、详情和做饭页面按需加载。lib/storage/device.ts 管理 IndexedDB、旧版迁移和备份。

Provider 接口与 Aggregator 保持统一 Recipe 模型。LocalRecipeProvider 始终可用，TheMealDBProvider 需要合法密钥，ExternalUrlImportProvider 由用户提交 URL 时触发；XiachufangProvider 是禁用占位，没有使用私有接口。AI 默认关闭，生成结果不混入本地菜谱。

本地菜谱文字原创；外部菜谱、图片、商标版权属于相应来源。项目代码采用 MIT，研究与依赖说明在 docs/。
