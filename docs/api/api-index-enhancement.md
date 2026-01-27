# API: /api/index-enhancement 指增数据接口

> **最后更新**: 2026-01-21  
> **文件位置**: `src/app/api/index-enhancement/route.ts`

---

## 📋 接口说明

获取基础池指数增强产品的净值数据和基准指数。

---

## 🔌 请求

```http
GET /api/index-enhancement
```

---

## 📤 响应

```json
{
  "funds": [
    {
      "id": "聚宽中证1000增强6号私募证券投资基金",
      "name": "聚宽中证1000增强6号私募证券投资基金",
      "strategy": "1000指增",
      "history": [
        { "date": "2021-10-14", "cumulative_nav": 1.0, "unit_nav": 1.0 },
        ...
      ]
    },
    ...
  ],
  "indices": [
    { "date": "2024-01-02", "code": "000300.SH", "name": "沪深300", "close": 3456.78 },
    ...
  ]
}
```

---

## ⚙️ 内部逻辑

### 数据查询
```sql
-- 获取有策略标签的产品
SELECT DISTINCT fund_name, strategy
FROM basic_pool_history
WHERE strategy IS NOT NULL AND strategy != ''
ORDER BY fund_name

-- 获取每个产品的历史净值
SELECT nav_date as date, cumulative_nav, unit_nav
FROM basic_pool_history 
WHERE fund_name = ?
ORDER BY nav_date ASC
```

### 基准指数
- 从 `market_indices` 表获取，起始日期 `2024-01-01`

---

## 📁 相关文件

| 文件 | 说明 |
|------|------|
| `src/app/api/index-enhancement/route.ts` | API 路由 |
| `src/lib/database-server.ts` | 数据库操作 |
