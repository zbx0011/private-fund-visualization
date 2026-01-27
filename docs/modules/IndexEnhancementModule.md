# IndexEnhancementModule 基础池分析模块

> **最后更新**: 2026-01-21  
> **文件位置**: `src/components/modules/IndexEnhancementModule.tsx`  
> **API 端点**: `/api/index-enhancement`  
> **对应页面**: `/basic-pool` (基础池基金)

---

## 📋 功能概述

分析指数增强类产品的业绩表现，包括净值走势、超额收益、风险指标等。

---

## 📊 数据展示

### 图表
| 图表 | 说明 |
|------|------|
| 累计收益走势 | 多产品净值曲线对比，虚线为基准指数 |
| 超额收益走势 | 产品收益率 - 基准指数收益率 |

### 表格列
| 列名 | 说明 |
|------|------|
| 基金名称 | 产品短名称 (去除"私募证券投资基金"后缀) |
| 策略 | 300指增/500指增/1000指增/2000指增/量化选股 |
| 开始日期 | 产品首个净值日期 |
| 累计收益率 | 产品期间总收益 |
| 年化收益率 | 按日历天数折算的年化收益 |
| 累计超额 | 相对基准的累计超额收益 |
| 年化超额 | 相对基准的年化超额收益 |
| 最大回撤 | 历史最大回撤幅度 |
| 年化波动率 | 日收益率标准差 × √252 |
| 夏普比率 | (年化收益 - 2%) / 年化波动率 |
| 卡玛比率 | 年化收益 / 最大回撤 |
| 信息比率 | 年化超额 / 跟踪误差 |

---

## 🔌 数据源

### 主数据源: SQLite + 飞书
- **数据库表**: `basic_pool_history`
- **字段**: `fund_name`, `strategy`, `nav_date`, `cumulative_nav`, `unit_nav`
- **基准指数**: 从 `market_indices` 表获取

### 同步机制
- **API**: `/api/sync-basic-pool`
- **数据来源**: 飞书多维表格 (`tblx87kYtZf70vOf`)
- **同步脚本**: 点击"一键同步"按钮触发

---

## 📐 计算公式

```javascript
// 收益率 (归一化到起始日)
returnRate = (currentNav / startNav) - 1

// 年化收益率
years = calendarDays / 365
annualizedReturn = Math.pow(1 + cumulativeReturn, 1/years) - 1

// 超额收益 (对齐到产品首日)
excessReturn = fundReturn - (indexAtEnd - indexAtStart)

// 跟踪误差 (日超额收益率标准差 × √252)
trackingError = std(dailyExcessReturns) * Math.sqrt(252)

// 信息比率
informationRatio = annualizedExcess / trackingError
```

---

## 🔄 数据同步

### 同步逻辑 (2026-01-21 优化)
```typescript
// 使用事务批量插入，大幅提升速度
await db.run('BEGIN TRANSACTION')
for (record of records) {
    await db.run('INSERT OR IGNORE INTO basic_pool_history ...')
}
await db.run('COMMIT')
```

### 飞书表格配置
| 配置项 | 值 |
|--------|-----|
| APP_TOKEN | `MKTubHkUKa13gbs9WdNcQNvsn3f` |
| TABLE_ID | `tblx87kYtZf70vOf` |
| 表名 | 基础池产品-指增 |

### 飞书字段映射
| 飞书字段 | 数据库字段 |
|---------|-----------|
| 产品名称 / 基金名称 | `fund_name` |
| 策略 / 策略类型 | `strategy` |
| 日期 / 净值日期 | `nav_date` |
| 累计净值 / 累计单位净值 | `cumulative_nav` |
| 单位净值 | `unit_nav` |

---

## ⚠️ 已知问题与修复

### 2026-01-21 修复
1. **同步超时**: 原逐条插入导致 1700+ 条记录同步超时，改为事务批量插入
2. **数据不全**: 现已同步 11 只产品、3410+ 条历史记录
3. **API 筛选**: `index-enhancement` API 仅返回 `strategy IS NOT NULL AND strategy != ''` 的产品

---

## 🖥️ 交互功能

| 功能 | 说明 |
|------|------|
| 策略筛选 | 300指增/500指增/1000指增/2000指增/量化选股 |
| 时间范围 | 2025年 / 全部时间 |
| 视图切换 | 净值走势 / 超额收益 |
| 一键同步 | 从飞书拉取最新数据 |
| 点击产品 | 弹出单产品详情图 |

---

## 📁 相关文件

| 文件 | 说明 |
|------|------|
| `src/components/modules/IndexEnhancementModule.tsx` | 前端组件 |
| `src/app/api/index-enhancement/route.ts` | 数据查询 API |
| `src/app/api/sync-basic-pool/route.ts` | 飞书同步 API |
| `src/lib/lark-api.ts` | 飞书 API 客户端 |
| `scripts/manual_sync_lark_to_db.py` | 手动同步脚本 |
| `scripts/check_basic_pool_db.py` | 数据库检查脚本 |
