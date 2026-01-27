# API: /api/basis 基差数据接口

> **最后更新**: 2026-01-21  
> **文件位置**: `src/app/api/basis/route.ts`

---

## 📋 接口说明

获取股指期货 (IH/IF/IC/IM) 的实时基差数据和历史走势。

---

## 🔌 请求

```http
GET /api/basis
GET /api/basis?refresh=true
```

### 参数
| 参数 | 类型 | 说明 |
|------|------|------|
| `refresh` | boolean | 强制刷新数据 (可选) |

---

## 📤 响应

```json
{
  "basisData": {
    "IH": { "spot": 2850.5, "futures": 2835.2, "basis": -15.3, ... },
    "IF": { ... },
    "IC": { ... },
    "IM": { ... }
  },
  "history": {
    "IH": [{ "date": "2025-01-20", "basisRate": -0.53, "annualizedRate": -3.2 }, ...],
    ...
  },
  "lastUpdate": "2025-01-21 15:00:00",
  "contractMonths": { "nearMonth": "2501", "farMonth": "2503" }
}
```

---

## ⚙️ 内部逻辑

### 数据流
```
请求 → 检查缓存 (5分钟) → 过期则执行脚本 → 读取 JSON → 返回
```

### 脚本调用
```typescript
const { stdout, stderr } = await execAsync(
    'python scripts/fetch_basis_rqdata.py',
    { timeout: 60000 }
)
```

### 数据源优先级
1. **RQData** (主): `scripts/fetch_basis_rqdata.py`
2. **Wind** (备用): `scripts/fetch_basis_realtime.py`

---

## 📁 相关文件

| 文件 | 说明 |
|------|------|
| `src/app/api/basis/route.ts` | API 路由 |
| `scripts/fetch_basis_rqdata.py` | RQData 数据获取 |
| `data/basis_data.json` | 数据存储 |
