# AIAnalysisModule AI分析模块

> **最后更新**: 2026-01-21  
> **文件位置**: `src/components/modules/AIAnalysisModule.tsx`  
> **API 端点**: `/api/product-analysis`  
> **对应页面**: `/ai-analysis`

---

## 📋 功能概述

AI 驱动的产品分析模块，利用大语言模型对基金业绩进行智能分析和建议生成。

---

## 📊 功能列表

### 分析类型
| 分析项 | 说明 |
|--------|------|
| 业绩分析 | 对产品历史业绩进行智能解读 |
| 风险评估 | 识别潜在风险因素 |
| 对比分析 | 与同类产品横向对比 |
| 市场归因 | 分析业绩来源 (Alpha/Beta) |

---

## 🔌 数据源

### AI 模型
- **模型**: GPT-4 / Claude 等大语言模型
- **API**: 通过后端代理调用
- **输入**: 产品净值历史、市场数据、基准指数

---

## 📁 相关文件

| 文件 | 说明 |
|------|------|
| `src/components/modules/AIAnalysisModule.tsx` | 前端组件 |
| `src/app/api/product-analysis/route.ts` | API 路由 |
