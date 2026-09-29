# 实施前研究与选型

核查日期：2026-09-28。参考架构及用户体验，未复制下列项目的实现代码。

| 参考                                                                                                                                                                    | 已核查的许可证                                        | 借鉴与本项目决策                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| [Mealie](https://github.com/mealie-recipes/mealie) / [功能文档](https://mealie.io/documentation/getting-started/features/)                                              | AGPL-3.0                                              | URL 导入后保存规范化菜谱，展示与抓取解耦；我们独立实现安全下载、解析、校验三个阶段。                                            |
| [Tandoor Recipes](https://github.com/TandoorRecipes/recipes) / [导入文档](https://docs.tandoor.dev/features/import_export/)                                             | AGPL-3.0 + Commons Clause 销售限制，见项目 LICENSE.md | 参考食材、单位、数量独立建模；本站用 Ingredient ID + Alias，不直接比较展示字符串。                                              |
| [RecipeSage](https://github.com/julianpoy/RecipeSage)                                                                                                                   | 非商业 AGPL-3.0 / 商业另行许可                        | 参考收藏、导入、购物清单与厨房工作流。本站烹饪 UX 独立实现为单步大字界面、多计时器、Wake Lock。                                 |
| [recipe-scrapers/recipe-scrapers](https://github.com/recipe-scrapers/recipe-scrapers) / [LICENSE](https://github.com/recipe-scrapers/recipe-scrapers/blob/main/LICENSE) | MIT                                                   | 该地址当前为 TypeScript 项目，不是同名 Python 项目。研究其结构化数据与校验策略；本站使用 Cheerio 编写轻量解析器，未引入其代码。 |

支持 JSON-LD 中的数组、@graph、HowToSection；Microdata 后备；OpenGraph 只补充标题和图片，不把普通网页伪造为菜谱。抓取器不做站点反爬绕过、登录模拟或私有接口调用。

## 技术版本

通过 npm registry 安装当时稳定 dist-tag，锁定 Next.js 16.3.6、React 19.3.0、Tailwind 4.3.3、Zod 4.6.5、Drizzle 0.45.3。TypeScript 7.0.2 与 typescript-eslint 不兼容，改为稳定 6.0.3；ESLint 10 与 eslint-plugin-react 不兼容，使用 9.39.5。ESLint 9 已被 upstream 标为旧版；待 React 插件兼容后升级，不为追新引入损坏的检查工具。

没有使用需要 Node/Python 双运行时的解析服务。Next.js Route Handlers 在 Node runtime 内完成抓取及数据规范化；纯函数推荐不依赖 LLM。

## 外部数据

[TheMealDB 官方 API 文档](https://www.themealdb.com/api.php)提供搜索、食材过滤和详情接口。测试 key `1` 仅开发环境显式开启；生产用 `THEMEALDB_API_KEY`。免费 V1 不是任意多食材搜索引擎：本站分别查询最多 3 种食材，取最多 12 个唯一详情再自行匹配。API 可访问不等于所有图片与内容获得任意再分发许可；部署者需按用途确认其条款。

所有直接依赖的版本与 license 元数据见 [DEPENDENCIES.md](DEPENDENCIES.md)。外部菜谱及图片的权利与应用代码 MIT 许可证相互独立。
