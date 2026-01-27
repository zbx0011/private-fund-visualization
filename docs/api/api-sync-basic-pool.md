# API: /api/sync-basic-pool 基础池同步接口

> **最后更新**: 2026-01-21  
> **文件位置**: `src/app/api/sync-basic-pool/route.ts`

---

## 📋 接口说明

从飞书多维表格同步基础池产品数据到本地数据库。

---

## 🔌 请求

```http
GET /api/sync-basic-pool
```

---

## 📤 响应

```json
{
  "success": true,
  "message": "同步成功",
  "recordsFetched": 1706,
  "inserted": 1205,
  "skipped": 1,
  "duplicatesRemoved": 0,
  "syncTime": "2025-01-21T15:30:00.000Z"
}
```

---

## ⚙️ 内部逻辑

### 飞书配置
| 配置项 | 值 |
|--------|-----|
| `APP_TOKEN` | `MKTubHkUKa13gbs9WdNcQNvsn3f` |
| `TABLE_ID` | `tblx87kYtZf70vOf` |
| 表名 | 基础池产品-指增 |

### 同步流程
```
1. 获取飞书 Access Token
2. 分页获取所有记录 (page_size=100)
3. 去重: DELETE 重复的 (fund_name, nav_date)
4. 事务批量插入: BEGIN → INSERT OR IGNORE → COMMIT
5. 返回统计信息
```

### 字段映射
| 飞书字段 | 数据库字段 |
|---------|-----------|
| 产品名称 / 基金名称 | `fund_name` |
| 策略 / 策略类型 | `strategy` |
| 日期 / 净值日期 | `nav_date` |
| 累计净值 | `cumulative_nav` |
| 单位净值 | `unit_nav` |

### 2026-01-21 优化
- **之前**: 逐条 `INSERT`，1700 条需要 60s+，导致超时
- **之后**: 使用 `BEGIN TRANSACTION ... COMMIT`，<1s 完成

---

## 📁 相关文件

| 文件 | 说明 |
|------|------|
| `src/app/api/sync-basic-pool/route.ts` | API 路由 |
| `src/lib/lark-api.ts` | 飞书 API 客户端 |
| `scripts/manual_sync_lark_to_db.py` | 手动同步脚本 |
