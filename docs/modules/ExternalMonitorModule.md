# ExternalMonitorModule 外部监控模块

> **最后更新**: 2026-01-21  
> **文件位置**: `src/components/modules/ExternalMonitorModule.tsx`  
> **API 端点**: `/api/monitor`  
> **对应页面**: `/monitor`

---

## 📋 功能概述

外部信息监控模块，整合来自外部数据源的市场信息和预警数据。

---

## 📊 数据展示

### 监控内容
| 监控项 | 来源 | 说明 |
|--------|------|------|
| 企业预警通 | 网页爬虫 | 私募基金相关预警信息 |
| 舆情监控 | API | 市场新闻和舆情 |
| 监管公告 | 网页爬虫 | 证监会/基金业协会公告 |

---

## 🔌 数据源

### 企业预警通
- **登录配置**: `.env` 中的 `QYYJT_USERNAME`/`QYYJT_PASSWORD`
- **脚本**: `scripts/scraper/` 目录下的爬虫脚本

---

## 📁 相关文件

| 文件 | 说明 |
|------|------|
| `src/components/modules/ExternalMonitorModule.tsx` | 前端组件 |
| `src/app/api/monitor/route.ts` | API 路由 |
| `scripts/scraper/qyyjt.py` | 企业预警通爬虫 |
