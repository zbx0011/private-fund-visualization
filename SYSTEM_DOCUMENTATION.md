# 私募基金可视化系统 - 技术文档

> **最后更新**: 2026-01-26
> **版本**: v1.1
> **重要**: 使用其他 IDE 打开项目时，请先阅读 [`docs/README.md`](./docs/README.md)

---

## 变更记录

- 2026-01-26：收益率曲线弹窗按累计净值变化展示（不使用 display_return）。

---

## 📖 文档索引

详细的模块和 API 文档请参阅 **[docs/](./docs/)** 目录：
- [模块文档](./docs/README.md#-模块文档列表)
- [API 文档](./docs/README.md#-api-文档)

---

## 📁 项目结构概览

```
private-fund-visualization/
├── src/
│   ├── app/                    # 页面路由
│   │   ├── api/                # API 端点 (16个)
│   │   ├── products/           # 产品数据页
│   │   ├── market-monitor/     # 行情监控页
│   │   ├── fof/                # FOF 分析页
│   │   ├── strategy/           # 策略分析页
│   │   └── ...
│   ├── components/
│   │   ├── modules/            # 核心业务模块 (15个)
│   │   ├── charts/             # 图表组件
│   │   └── ui/                 # UI 组件
│   └── lib/                    # 工具函数
├── scripts/                    # 数据同步脚本 (400+)
├── data/                       # 本地数据文件
│   ├── funds.db               # SQLite 数据库
│   ├── basis_data.json        # 基差数据
│   └── market_monitor_data.json # 市场监控数据
└── .env.local                  # 环境配置
```

---

## 🖥️ 页面与模块详解

### 1. 首页 - 综合概览 (`/`)

**对应模块**: `OverviewModule.tsx`

| 组件 | 说明 | 数据源 |
|------|------|--------|
| **统计卡片** | 产品总数、本月盈亏、年度收益、平均收益等 | `/api/funds` |
| **策略分布饼图** | 各策略类型的产品占比 | 计算自 `funds` 数据 |
| **本周净利润** | 当周盈亏排行 | `funds.daily_pnl` 字段 |
| **收益曲线图** | 按周聚合的累计收益走势 | `/api/yield-curve` |
| **年份切换** | 2025/2026 年份筛选 | 前端控制，传递给 API |

**交互逻辑**:
- 点击策略分布可筛选该策略的产品
- 收益曲线支持 1周/1月/3月/今年/全部 时间范围切换
- 年份切换会重新请求对应年份的数据

**计算公式**:
- **本月盈亏**: `SUM(daily_pnl)` where date in current month
- **年度收益率**: `(最新净值 / 年初净值 - 1) × 100%`
- **周收益**: 每周五作为截止日聚合该周内所有数据

---

### 2. 产品数据页 (`/products`)

**对应模块**: `ProductDataModule.tsx`

| 列名 | 字段 | 格式化方式 |
|------|------|-----------|
| 序号 | - | 自增 |
| 产品名称 | `name` | 原样显示 |
| 策略 | `strategy` | 原样显示 |
| 管理人 | `manager` | 原样显示 |
| 最新净值 | `cumulative_nav` | 4位小数 |
| 日盈亏 | `daily_pnl` | 千分位格式 ±颜色 |
| 今年收益 | `yearly_return` | 百分比 ±颜色 |
| 夏普比率 | `sharpe_ratio` | 2位小数 |
| 成本 | `cost_2026` / `cost_2025` | 金额格式 |

**数据源**: `/api/funds?year=XXXX`

**交互逻辑**:
- 点击任意行 → 弹出收益曲线弹窗 (`FundChartModal`)
- 弹窗展示该基金的历史净值走势

**成本字段逻辑**:
```javascript
// 根据选择的年份动态选择成本字段
if (selectedYear === 2026) {
    displayCost = fund.cost_2026 || fund.cost || 0
} else {
    displayCost = fund.cost_2025 || fund.cost || 0
}
```

---

### 3. 行情监控页 (`/market-monitor`)

**对应模块**: `MarketMonitorModule.tsx` + `BasisArbitrageModule.tsx`

#### 3.1 全市场图表 (上半部分)

| 图表 | ID | 数据来源 |
|------|-----|---------|
| 风险因子表现 | `risk_factors` | AkShare |
| 商品走势 | `commodity_trend` | AkShare (南华指数) |
| 指数时序波动率 | `index_volatility_ts` | AkShare |
| 金融期权波动率 | `option_volatility` | AkShare (ETF期权) |
| 商品波动率 | `commodity_volatility` | AkShare (南华指数) |
| 指数截面波动率 | `index_volatility_cs` | AkShare |
| 转债市场 | `convertible_bond` | AkShare (双低指数) |
| 大盘走势 | `market_trend` | AkShare (上证/深证/沪深300) |
| 基差时序波动率 | `basis_volatility` | AkShare |

**API 端点**: `/api/market-monitor`

**数据更新机制**:
- 缓存时间: **6小时**
- 自动触发: 当数据过期时，API 自动执行 `scripts/fetch_market_monitor_data.py`
- 数据存储: `data/market_monitor_data.json`
- **无需手动运行脚本**

**依赖**: 
- ✅ AkShare (互联网公开数据)
- ❌ 不依赖 Wind

---

#### 3.2 股指期货基差监控 (下半部分)

**对应模块**: `BasisArbitrageModule.tsx`  
**详细文档**: [BasisArbitrageModule.md](./docs/modules/BasisArbitrageModule.md)

| 品种 | 现货指数 | 期货合约 (次季) |
|------|---------|---------|
| IH (上证50) | 000016.SH | IH次季 (Quarter+1) |
| IF (沪深300) | 000300.SH | IF次季 |
| IC (中证500) | 000905.SH | IC次季 |
| IM (中证1000) | 000852.SH | IM次季 |

**API 端点**: `/api/basis`

**数据更新机制** (2026-01-21 更新):
- 缓存时间: **5分钟**
- 自动触发: 当数据过期时，API 自动执行 `scripts/fetch_basis_rqdata.py`
- 数据存储: `data/basis_data.json`
- **数据源**: RQData (`rq.current_snapshot` 实时快照)
- ⚠️ 已从 Wind 切换到 RQData，无需 Wind 终端

**计算公式**:
```python
# 基差 = 期货价格 - 现货价格
basis = futures_price - spot_price

# 基差率 = 基差 / 现货价格 × 100%
basis_rate = (basis / spot_price) * 100

# 年化成本 = 基差率 / 到期天数 × 365
annualized_rate = (basis / spot_price) * 365 / days_to_expiry * 100
```

**合约切换逻辑**:
- 系统自动检测当月合约是否已过交割日（每月第三个周五）
- 如果已过交割日，自动切换到下月合约
- 例：1月17日后，近月合约从 2601 切换为 2602

**界面功能**:
| 按钮/控件 | 功能 |
|-----------|------|
| 时间范围 (1周/1月/1年/全部) | 筛选图表显示的历史区间 |
| 指标切换 (基差率/年化成本) | 切换 Y 轴显示内容 |
| 品种按钮 (IH/IF/IC/IM) | 高亮显示对应曲线 |

---

### 4. 指增分析页 (`/strategy`)

**对应模块**: `IndexEnhancementModule.tsx`

**功能**: 分析指数增强类产品相对基准的超额收益

| 基准指数 | 代码 | 适用策略 |
|---------|------|---------|
| 沪深300 | 000300.SH | 500指增、300指增 |
| 中证500 | 000905.SH | 500指增 |
| 中证1000 | 000852.SH | 1000指增 |

**API 端点**: `/api/index-enhancement`

**计算公式**:
```javascript
// 超额收益 = 产品收益率 - 基准指数收益率
excessReturn = fundReturn - benchmarkReturn

// 收益率 = (当前净值 / 基准日净值 - 1) × 100%
returnRate = (currentNav / baseNav - 1) * 100
```

**交互逻辑**:
- 点击产品行 → 弹出单产品 vs 基准对比图
- 图表显示产品净值曲线和基准指数曲线

---

### 5. FOF 分析页 (`/fof`)

**对应模块**: `FOFModule.tsx`

**功能**: 分析 FOF 产品的底层持仓和收益归因

**API 端点**: `/api/fof`

---

## 🔌 API 端点详解

| 端点 | 方法 | 说明 | 数据源 |
|------|------|------|--------|
| `/api/funds` | GET | 获取所有基金数据 | SQLite |
| `/api/funds/[id]` | GET | 获取单只基金详情 | SQLite |
| `/api/yield-curve` | GET | 获取收益曲线数据 | SQLite |
| `/api/basis` | GET | 获取基差数据 | Wind + JSON |
| `/api/market-monitor` | GET | 获取市场监控数据 | AkShare + JSON |
| `/api/index-enhancement` | GET | 获取指增分析数据 | SQLite |
| `/api/fof` | GET | 获取 FOF 数据 | SQLite |
| `/api/sync` | POST | 触发飞书数据同步 | 飞书 API |
| `/api/lark-sync` | POST | 飞书多维表格同步 | 飞书 API |
| `/api/history` | GET | 获取历史净值数据 | SQLite |

---

## 📊 数据同步机制

### 飞书数据同步

**触发方式**: 
1. 页面刷新时检查最后同步时间
2. 手动点击"同步"按钮
3. 定时任务 (`scripts/schedule-sync.js`)

**同步脚本**: `scripts/sync-data.js`

**飞书表格配置** (`.env.local`):
```env
LARK_APP_ID=cli_xxxxx
LARK_APP_SECRET=xxxxx
LARK_APP_TOKEN=xxxxx
LARK_MAIN_TABLE=tblxxxxx
LARK_NAV_HISTORY_TABLE=tblxxxxx
LARK_PNL_TABLE=tblxxxxx
```

### Wind 数据同步

**适用场景**: 股指期货基差实时数据

**自动触发**: 访问 `/api/basis` 时，若数据超过 5 分钟自动更新

**手动触发**:
```bash
python scripts/fetch_basis_realtime.py
```

### AkShare 数据同步

**适用场景**: 市场监控图表 (风险因子、商品、指数等)

**自动触发**: 访问 `/api/market-monitor` 时，若数据超过 6 小时自动更新

**手动触发**:
```bash
python scripts/fetch_market_monitor_data.py
```

---

## 🗃️ 数据库结构 (SQLite)

### 主要表

| 表名 | 说明 | 关键字段 |
|------|------|---------|
| `funds` | 基金主表 | id, name, strategy, manager, cumulative_nav, daily_pnl, yearly_return |
| `fund_nav_history` | 净值历史 | fund_id, nav_date, unit_nav, cumulative_nav |
| `sync_logs` | 同步日志 | sync_time, status, records_count |
| `basis_latest` | 基差最新数据 | symbol, basis, basis_rate, annualized_rate |
| `market_indices` | 市场指数 | date, code, name, close |

### 关键字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `cumulative_nav` | REAL | 累计净值 |
| `unit_nav` | REAL | 单位净值 |
| `daily_pnl` | REAL | 当日盈亏 (元) |
| `yearly_return` | REAL | 年度收益率 (小数形式，如 0.15 = 15%) |
| `cost_2025` | REAL | 2025年成本 |
| `cost_2026` | REAL | 2026年成本 |
| `sharpe_ratio` | REAL | 夏普比率 |
| `max_drawdown` | REAL | 最大回撤 |

---

## ⚙️ 关键配置

### 环境变量 (`.env.local`)

```env
# 飞书配置
LARK_APP_ID=
LARK_APP_SECRET=
LARK_APP_TOKEN=

# 飞书表格ID
LARK_MAIN_TABLE=              # 主表 (产品信息)
LARK_NAV_HISTORY_TABLE=       # 净值历史表
LARK_PNL_TABLE=               # 盈亏表

# 站点配置 (可选)
NEXT_PUBLIC_SITE_URL=
```

### 缓存配置

| 数据类型 | 缓存时间 | 配置位置 |
|---------|---------|---------|
| 基差数据 | 5 分钟 | `src/app/api/basis/route.ts` |
| 市场监控 | 6 小时 | `src/app/api/market-monitor/route.ts` |
| 基金数据 | 无缓存 | 实时读取 SQLite |

---

## 🔧 常用脚本

| 脚本 | 用途 | 运行方式 |
|------|------|---------|
| `sync-data.js` | 从飞书同步全量数据 | `node scripts/sync-data.js` |
| `fetch_basis_realtime.py` | 获取 Wind 基差数据 | `python scripts/fetch_basis_realtime.py` |
| `fetch_market_monitor_data.py` | 获取 AkShare 市场数据 | `python scripts/fetch_market_monitor_data.py` |
| `fill_missing_basis.py` | 补充缺失的基差历史 | `python scripts/fill_missing_basis.py` |
| `recalc-metrics.js` | 重新计算风险指标 | `node scripts/recalc-metrics.js` |
| `init-database.js` | 初始化数据库结构 | `node scripts/init-database.js` |

---

## 🚀 启动项目

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build
npm run start
```

**注意事项**:
1. 首次运行需确保 `.env.local` 配置正确
2. Wind 相关功能需要 Wind 终端后台运行
3. 飞书同步需要正确配置 API 凭证

---

## 📝 更新日志

### 2026-01-26
- **[飞书同步]** 历史净值只使用“累计净值”，不再使用“虚拟净值”
- **[同步脚本]** `scripts/sync-data.js` 增加补充表同步，写入 `cost_2026/cost_2025`
- **[风控指标]** 波动率/夏普计算改为基于累计净值序列
- **[策略字段]** 增加全局选项映射，避免策略落库为 `opt*` 原始 ID

### 2026-01-21
- **[基差模块]** 数据源从 Wind 切换到 RQData (`rq.current_snapshot`)
- **[基差模块]** 修复合约逻辑，IM02 定义为"次季合约" (Quarter+1)
- **[基差模块]** 修复时间戳，使用 K 线收盘时间 (15:00:00)
- **[基差模块]** 修复 Windows Unicode 编码错误 (`✓`→`[OK]`)
- **[行情监控]** 修复脚本 Unicode 编码错误，恢复自动更新
- **[基础池同步]** 优化为事务批量插入，解决 1700+ 条超时问题
- **[文档]** 新增 `docs/` 目录，包含各模块和 API 详细文档

### 2026-01-19
- 修复基差监控合约切换逻辑 (交割日后自动切换下月)
- 修复基差历史数据不更新问题
- 添加市场监控自动更新机制
- 增加 API 执行超时时间 (60s → 120s)

---

## 🔧 文档维护规则

1. **任何代码修改必须同步更新对应的 .md 文档**
2. **使用其他 IDE 打开项目时，请先阅读 `docs/README.md`**
3. **每个模块文档应包含**: 功能说明、数据源、API 依赖、计算公式、交互逻辑、已知问题

---

*文档由系统自动生成，如有疑问请联系开发者。*
