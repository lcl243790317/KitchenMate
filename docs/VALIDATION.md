# 本地验收记录

环境：Windows / Node.js 24.19.0 / Chrome，2026-09-28。

| 检查 | 结果 |
| --- | --- |
| ESLint | 通过，无 warning / error |
| TypeScript `tsc --noEmit` | 通过 |
| Vitest 核心单元 + API integration | 44 项通过 |
| Live TheMealDB 测试 key 搜索与规范化 | 通过，返回 Spicy Arrabiata Penne / 52771 |
| Live 公网 DNS 固定 HTTPS 下载 | 通过 |
| Playwright 桌面闭环 | 通过：Pantry、刷新恢复、推荐、份量、购物清单、多计时器与完成 |
| Playwright 手机做菜闭环 | 通过：推荐、详情、份量、计时与下一步，详情和烹饪模式均无横向溢出 |
| Playwright 移动首页 / 深色模式 | 通过，390px 无横向溢出 |
| Playwright 桌面首页 / 本地降级 | 通过 |
| Next.js production build | 通过 |
| PostgreSQL SQL migration generation | 通过，11 张表；未执行实库迁移 |
| AI 真实模型输出 | 未执行，无 LLM key；已实现结构校验、重试与无 key 提示 |

普通测试默认跳过两个 live 测试，避免依赖网络。live 测试已单独启用执行并通过。真实 PostgreSQL、AI 账户和公网部署不属于本机已验证结果。
