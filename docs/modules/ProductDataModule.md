# ProductDataModule 产品数据模块

> **最后更新**: 2026-01-26  
> **文件位置**: `src/components/modules/ProductDataModule.tsx`  
> **API 端点**: `/api/funds`  
> **对应页面**: `/products`

---

## 📋 功能概述

产品列表页面，展示所有基金产品的关键指标和业绩表现，支持搜索、排序和详情查看。

---

## 📊 数据展示

### 表格列
| 列名 | 字段 | 格式化 |
|------|------|--------|
| 序号 | - | 自增 |
| 基金名称 | `name` | 原样 |
| 策略 | `strategy` | 原样 |
| 状态 | `status` | 原样 |
| 投资经理 | `manager` | 原样 |
| 最新净值日期 | `latest_nav_date` | 日期格式 |
| 本日收益 | `daily_pnl` | 千分位 |
| 七天内收益率 | `weekly_return` | 百分比 |
| 本年收益 | `yearly_pnl` | 千分位 |
| 本年收益率 | `yearly_return` | 百分比 |
| 集中度 | `concentration` | 百分比 |
| 成本 | `cost_2026`/`cost_2025` | 金额格式 |
| 最大回撤 | `max_drawdown` | 百分比 |
| 夏普比率 | `sharpe_ratio` | 3位小数 |
| 波动率 | `volatility` | 百分比 |

---

## 🔌 数据源

### 主数据源: SQLite
- **数据库**: `data/funds.db`
- **主要表**: `funds`
- **API**: `/api/funds?year=XXXX`

---

## 📐 成本字段逻辑

```javascript
// 根据年份动态选择成本字段
if (selectedYear === 2026) {
    displayCost = fund.cost_2026 || fund.cost || 0
} else {
    displayCost = fund.cost_2025 || fund.cost || 0
}
```

> **来源说明**: `cost_2026/cost_2025` 来自飞书“私募其他字段原始数据”补充表同步。

---

## 📐 风险指标来源

- **最大回撤/夏普/波动率** 由脚本 `scripts/calculate-indicators.js` 基于 `fund_nav_history.cumulative_nav` 计算并写回 `funds` 表。
- **同步后需要重算**: 先同步净值，再执行指标计算脚本。

---

## 🖥️ 交互功能

| 功能 | 说明 |
|------|------|
| 搜索 | 按产品名称搜索 |
| 排序 | 点击表头排序 |
| 详情弹窗 | 点击行弹出收益曲线 |
| 年份切换 | 切换 2025/2026 年成本显示 |

---

## 📁 相关文件

| 文件 | 说明 |
|------|------|
| `src/components/modules/ProductDataModule.tsx` | 前端组件 |
| `src/app/api/funds/route.ts` | API 路由 |
| `src/components/ui/table.tsx` | 表格组件 |
