# OverviewModule 首页概览模块

> **最后更新**: 2026-01-26  
> **文件位置**: `src/components/modules/OverviewModule.tsx`  
> **API 端点**: `/api/funds`, `/api/yield-curve`  
> **对应页面**: `/` (首页)

---

## 📋 功能概述

系统首页，展示基金产品的整体业绩概览、策略分布、本周盈亏排行和累计收益曲线。

---

## 📊 数据展示

### 统计卡片
| 卡片 | 数据来源 | 计算方式 |
|------|---------|---------|
| 总规模 | `/api/funds` | 按年份取 `cost_2026/cost_2025`，回退 `cost/daily_capital_usage` |
| 今日收益 | `/api/funds` | `SUM(daily_pnl)` (排除已赎回) |
| 七天内收益率 | `/api/funds` | `SUM(weekly_return * cost) / 总规模` |
| 本年收益率 | `/api/funds/yearly-return` | `SUM(yearly_return * cost) / 总规模` |

### 策略分布饼图
| 策略类型 | 说明 |
|---------|------|
| 指数增强 | 300/500/1000/2000指增 |
| 量化多头 | 量化选股策略 |
| 量化对冲 | 市场中性策略 |
| CTA | 期货趋势策略 |
| 套利 | 基差/跨期套利等 |

### 本周净利润排行
- **数据来源**: `funds` 表的 `daily_pnl` 字段
- **排序**: 按本周累计盈亏金额降序
- **显示**: 前 10 名盈利产品

### 收益曲线
- **数据来源**: `/api/yield-curve`
- **聚合方式**: 按周聚合 (每周五截止)
- **时间范围**: 1周/1月/3月/今年/全部

---

## 🔌 数据源

### 主数据源: SQLite
- **数据库**: `data/funds.db`
- **主要表**: `funds`, `fund_nav_history`

### 飞书同步
- **触发**: 页面刷新时检查同步时间
- **手动**: 点击同步按钮

---

## 📐 计算公式

```javascript
// 总规模 (按年份优先 cost_2026 / cost_2025)
totalAssets = SUM(cost_YYYY || cost || daily_capital_usage)

// 今日收益
todayReturn = SUM(daily_pnl)  // 排除已赎回

// 七天内收益率
weeklyReturn = SUM(weekly_return * cost) / totalAssets

// 本年收益率
annualReturn = SUM(yearly_return * cost) / totalAssets
```

---

## 🖥️ 交互功能

| 功能 | 说明 |
|------|------|
| 年份切换 | 2025/2026 年切换 |
| 策略筛选 | 点击饼图筛选对应策略 |
| 时间范围 | 收益曲线支持多时间范围 |
| 产品跳转 | 点击排行榜产品跳转详情 |

---

## 📁 相关文件

| 文件 | 说明 |
|------|------|
| `src/components/modules/OverviewModule.tsx` | 前端组件 |
| `src/app/api/funds/route.ts` | 基金数据 API |
| `src/app/api/yield-curve/route.ts` | 收益曲线 API |
| `src/lib/database-server.ts` | 数据库操作封装 |
