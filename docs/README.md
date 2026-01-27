# 文档目录 (Documentation Index)

> **最后更新**: 2026-01-21  
> **重要提示**: **在使用其他 IDE 打开本项目时，请首先阅读此目录和相关模块文档！**

---

## 📚 模块文档列表

| 模块 | 文档 | 说明 |
|------|-----|------|
| **总览** | [SYSTEM_DOCUMENTATION.md](../SYSTEM_DOCUMENTATION.md) | 系统整体架构文档 |
| **首页概览** | [OverviewModule.md](./modules/OverviewModule.md) | 首页统计卡片、策略分布、收益曲线 |
| **基差套利** | [BasisArbitrageModule.md](./modules/BasisArbitrageModule.md) | 股指期货基差监控 |
| **基础池分析** | [IndexEnhancementModule.md](./modules/IndexEnhancementModule.md) | 指数增强产品分析 |
| **行情监控** | [MarketMonitorModule.md](./modules/MarketMonitorModule.md) | 全市场行情图表 |
| **外部监控** | [ExternalMonitorModule.md](./modules/ExternalMonitorModule.md) | 外部数据监控 |
| **FOF 分析** | [FOFModule.md](./modules/FOFModule.md) | FOF 持仓与归因 |
| **产品数据** | [ProductDataModule.md](./modules/ProductDataModule.md) | 产品列表与详情 |
| **AI 分析** | [AIAnalysisModule.md](./modules/AIAnalysisModule.md) | AI 驱动的分析功能 |

---

## 🔌 API 文档

| API | 文档 | 说明 |
|-----|-----|------|
| **基差数据** | [api-basis.md](./api/api-basis.md) | `/api/basis` 端点 |
| **行情监控** | [api-market-monitor.md](./api/api-market-monitor.md) | `/api/market-monitor` 端点 |
| **指增数据** | [api-index-enhancement.md](./api/api-index-enhancement.md) | `/api/index-enhancement` 端点 |
| **基础池同步** | [api-sync-basic-pool.md](./api/api-sync-basic-pool.md) | `/api/sync-basic-pool` 端点 |

---

## 📝 更新日志

### 2026-01-21
- **基差模块**: 从 Wind 切换到 RQData 数据源，使用 `rq.current_snapshot` 获取实时数据
- **基差模块**: 修复合约逻辑，IM02 定义为"次季合约"(Quarter+1)
- **基差模块**: 修复 Windows 控制台 Unicode 编码错误 (`UnicodeEncodeError`)
- **行情监控**: 修复脚本 Unicode 编码错误，恢复自动更新功能
- **基础池同步**: 优化为事务批量插入，解决 1700+ 条记录同步超时问题

---

## 🔧 文档维护规则

1. **任何代码修改必须同步更新对应的 .md 文档**
2. **使用其他 IDE 打开项目时，请先阅读 `docs/README.md`**
3. **每个模块文档应包含**: 功能说明、数据源、API 依赖、计算公式、交互逻辑、已知问题
