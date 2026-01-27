# API: /api/market-monitor 行情监控接口

> **最后更新**: 2026-01-21  
> **文件位置**: `src/app/api/market-monitor/route.ts`

---

## 📋 接口说明

获取全市场行情监控数据，包括风险因子、商品走势、波动率等。

---

## 🔌 请求

```http
GET /api/market-monitor
```

---

## 📤 响应

```json
{
  "data": {
    "risk_factors": [{ "date": "2025-01-20", "size": 0.05, "beta": -0.02, ... }],
    "market_trend": [{ "date": "...", "上证指数": 0.03, "沪深300": 0.02, ... }],
    "index_volatility_ts": [{ "date": "...", "000300.XSHG": 15.2, ... }],
    "commodity_trend": [{ "date": "...", "南华贵金属": 0.08, ... }],
    "commodity_volatility": [...],
    "basis_volatility": [...],
    "option_volatility": [...],
    "convertible_bond": [...]
  },
  "lastUpdate": "2025-01-21 10:30:00",
  "source": "rqdata"
}
```

---

## ⚙️ 内部逻辑

### 缓存机制
- **缓存时间**: 6 小时 (`CACHE_DURATION = 6 * 60 * 60 * 1000`)
- **存储文件**: `data/market_monitor_data.json`

### 脚本调用
```typescript
const { stdout, stderr } = await execAsync(
    'python scripts/fetch_market_monitor_rqdata.py',
    { timeout: 120000 }
)
```

---

## 📁 相关文件

| 文件 | 说明 |
|------|------|
| `src/app/api/market-monitor/route.ts` | API 路由 |
| `scripts/fetch_market_monitor_rqdata.py` | RQData 数据获取 |
| `data/market_monitor_data.json` | 数据存储 |
