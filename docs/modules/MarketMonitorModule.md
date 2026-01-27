# MarketMonitorModule 行情监控模块

> **最后更新**: 2026-01-21  
> **文件位置**: `src/components/modules/MarketMonitorModule.tsx`  
> **API 端点**: `/api/market-monitor`  
> **对应页面**: `/market-monitor`

---

## 📋 功能概述

全市场行情监控，展示风险因子、商品走势、波动率、转债等多维度市场数据。

---

## 📊 数据展示

### 图表列表
| 图表 ID | 名称 | 数据来源 |
|---------|------|----------|
| `risk_factors` | 风险因子表现 | RQData (指数收益率) |
| `market_trend` | 大盘走势 | RQData (主要指数) |
| `index_volatility_ts` | 指数时序波动率 | RQData (计算) |
| `index_volatility_cs` | 指数截面波动率 | RQData |
| `commodity_trend` | 商品走势 | RQData (期货主力) |
| `commodity_volatility` | 商品波动率 | RQData (计算) |
| `basis_volatility` | 基差时序波动率 | RQData (股指期货) |
| `option_volatility` | 金融期权波动率 | RQData (ETF历史波动率) |
| `convertible_bond` | 转债市场 | AkShare (集思录) |

### 风险因子映射
| 因子 | 代理指数 | 代码 |
|------|---------|------|
| size (规模) | 上证50 | 000016.XSHG |
| beta (市场) | 沪深300 | 000300.XSHG |
| momentum (动量) | 中证1000 | 000852.XSHG |
| residual_volatility | 中证500 | 000905.XSHG |
| non_linear_size | 创业板指 | 399006.XSHE |
| book_to_price_ratio | 中证红利 | 000922.XSHG |
| liquidity | 中证全指 | 000985.XSHG |
| earnings_yield | 中证消费 | 000932.XSHG |
| growth | 创业板50 | 399673.XSHE |

---

## 🔌 数据源

### 主数据源: RQData
- **API**: `rqdatac.get_price()` 历史行情
- **脚本**: `scripts/fetch_market_monitor_rqdata.py`
- **备用**: AkShare (转债数据)

### 缓存机制
- **缓存时间**: 6 小时
- **存储文件**: `data/market_monitor_data.json`
- **自动刷新**: 访问 API 时检测过期自动更新

---

## 📐 计算公式

```python
# 归一化收益率 (基于起始日)
return_rate = (close / start_close) - 1

# 滚动波动率 (20日)
rolling_std = returns.rolling(20).std()
annualized_volatility = rolling_std * sqrt(252) * 100
```

---

## ⚠️ 已知问题与修复

### 2026-01-21 修复
1. **Unicode 编码错误**: 脚本中的 `✓`/`✗`/`✅`/`❌`/`📊`/`⚠️` 等符号导致 Windows GBK 控制台崩溃
2. **修复方案**: 全部替换为 ASCII 字符 `[OK]`/`[ERROR]`/`[DATA]`/`[WARN]`
3. **自动更新恢复**: 修复后 API 可正常执行脚本并更新数据

---

## 🖥️ 交互功能

| 功能 | 说明 |
|------|------|
| 图表网格 | 3×3 自适应布局 |
| 时间范围 | 图表内置时间轴 |
| 最后更新时间 | 显示数据刷新时间戳 |

---

## 📁 相关文件

| 文件 | 说明 |
|------|------|
| `src/components/modules/MarketMonitorModule.tsx` | 前端组件 |
| `src/app/api/market-monitor/route.ts` | API 路由 |
| `scripts/fetch_market_monitor_rqdata.py` | RQData 数据获取 (主) |
| `scripts/fetch_market_monitor_data.py` | AkShare 数据获取 (备用) |
| `data/market_monitor_data.json` | 数据存储文件 |
