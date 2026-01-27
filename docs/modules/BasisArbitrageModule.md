# BasisArbitrageModule 基差套利模块

> **最后更新**: 2026-01-21  
> **文件位置**: `src/components/modules/BasisArbitrageModule.tsx`  
> **API 端点**: `/api/basis`

---

## 📋 功能概述

股指期货基差实时监控模块，展示 IH/IF/IC/IM 四个品种的基差、基差率和年化成本。

---

## 📊 数据展示

### 表格列
| 列名 | 字段 | 说明 |
|------|------|------|
| 品种 | `symbol` | IH/IF/IC/IM |
| 现货(点) | `spot` | 标的指数实时价格 |
| 期货(点) | `futures` | 次季合约实时价格 |
| 基差(点) | `basis` | 期货 - 现货 |
| 基差率 | `basisRate` | 基差 / 现货 × 100% |
| 年化成本 | `annualizedRate` | 基差率 / 到期天数 × 365 |
| 历史分位 | `percentile` | 当前年化成本在历史中的百分位 |

### 合约对应关系
| 品种 | 现货指数 | 期货合约 |
|------|---------|---------|
| IH | 上证50 (000016.SH) | IH次季 (IH + YY + MM) |
| IF | 沪深300 (000300.SH) | IF次季 |
| IC | 中证500 (000905.SH) | IC次季 |
| IM | 中证1000 (000852.SH) | IM次季 |

---

## 🔌 数据源

### 主数据源: RQData
- **API**: `rqdatac.current_snapshot()` 实时行情快照
- **认证**: License Key 配置在脚本中
- **刷新频率**: 5 分钟自动刷新

### 数据脚本
- **实时获取**: `scripts/fetch_basis_rqdata.py`
- **历史回填**: `scripts/backfill_basis_next_quarter_rqdata.py`

---

## 📐 计算公式

```python
# 基差 = 期货价格 - 现货价格
basis = futures_price - spot_price

# 基差率 = 基差 / 现货价格 × 100%
basis_rate = (basis / spot_price) * 100

# 年化成本 = 基差率 / 到期天数 × 365
annualized_rate = (basis_rate / days_to_expiry) * 365
```

---

## 🔄 合约切换逻辑

### IM02 定义 (次季合约 = Quarter+1)
```python
# 确定当前所在季度
quarterly_months = [(3, 6, 9, 12)]

# 找到当前季度的交割月
current_quarter_month = 下一个季度月

# 次季合约 = 当前季度 + 1 个季度的月份
# 例如: 1月 → 当季=3月 → 次季=6月 (IM2606)
```

### 交割日规则
- 交割日: 每月第三个周五
- 交割日之后自动切换到下一合约

---

## ⚠️ 已知问题与修复

### 2026-01-21 修复
1. **数据源切换**: 从 Wind (`get_price`) 切换到 RQData (`current_snapshot`)
2. **时间戳准确性**: 使用 K 线收盘时间 (15:00:00) 而非脚本执行时间
3. **Unicode 编码**: 所有 `print` 语句中的 `✓`/`✗` 替换为 `[OK]`/`[ERROR]`，避免 Windows GBK 控制台崩溃
4. **合约逻辑**: IM02 固定为"次季合约"(当前季度+1)

---

## 🖥️ 交互功能

| 功能 | 说明 |
|------|------|
| 时间范围切换 | 1周/1月/1年/全部 |
| 指标切换 | 基差率 / 年化成本 |
| 品种高亮 | 点击 IH/IF/IC/IM 按钮高亮对应曲线 |
| 自动刷新 | 每 5 分钟前端自动请求 `/api/basis` |

---

## 📁 相关文件

| 文件 | 说明 |
|------|------|
| `src/components/modules/BasisArbitrageModule.tsx` | 前端组件 |
| `src/app/api/basis/route.ts` | API 路由 |
| `scripts/fetch_basis_rqdata.py` | RQData 实时数据获取 |
| `scripts/backfill_basis_next_quarter_rqdata.py` | 历史数据回填 |
| `data/basis_data.json` | 数据存储文件 |
