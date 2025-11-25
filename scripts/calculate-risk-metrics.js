require("dotenv").config();

const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const { join } = require("path");

function extractTextValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "";
    }

    const firstItem = value[0];
    if (firstItem && typeof firstItem === "object" && firstItem.text) {
      return firstItem.text;
    }

    if (typeof firstItem === "string") {
      return firstItem;
    }

    return String(firstItem);
  }

  if (typeof value === "object") {
    if (value.text) {
      return value.text;
    }
  }

  return String(value);
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const cleanValue = value.toString().replace(/[%,¥]/g, "").trim();
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : isFinite(parsed) ? parsed : 0;
  }

  if (Array.isArray(value) && value.length > 0) {
    return parseNumber(value[0]);
  }

  return 0;
}

function parseDate(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "string") {
    const dateStr = value.toString().trim();
    if (dateStr.includes("T") || dateStr.includes("-")) {
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? null : parsed.toISOString().split("T")[0];
    }

    if (dateStr.includes("/")) {
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        const parsed = new Date(year, month, day);
        return isNaN(parsed.getTime()) ? null : parsed.toISOString().split("T")[0];
      }
    }
  }

  if (typeof value === "number") {
    // 处理时间戳
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString().split("T")[0];
  }

  if (Array.isArray(value) && value.length > 0) {
    const firstItem = value[0];
    if (firstItem && typeof firstItem === "object" && firstItem.text) {
      return parseDate(firstItem.text);
    }
    return parseDate(value[0]);
  }

  return null;
}

// 计算最大回撤 MaxDrawdown = max((Px - Py) / Px)
function calculateMaxDrawdown(nvData) {
  // 需要至少5个数据点才能进行有意义的风险分析
  if (nvData.length < 5) return null;

  let maxDrawdown = 0;
  let peak = nvData[0].nav;

  for (let i = 1; i < nvData.length; i++) {
    const currentNav = nvData[i].nav;

    // 寻找历史最高点
    if (currentNav > peak) {
      peak = currentNav;
    }

    // 计算当前回撤: (Px - Py) / Px
    const drawdown = (peak - currentNav) / peak;

    // 找到最大回撤
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown * 100; // 转换为百分比
}

// 计算日收益率数组
function calculateDailyReturns(nvData) {
  if (nvData.length < 2) return [];

  const returns = [];
  for (let i = 1; i < nvData.length; i++) {
    const previousNav = nvData[i - 1].nav;
    const currentNav = nvData[i].nav;
    const dailyReturn = (currentNav - previousNav) / previousNav;
    returns.push(dailyReturn);
  }

  return returns;
}

// 计算波动率 σ = sqrt((1 / (n - 1)) * sum((ri - r_avg)^2))
function calculateVolatility(dailyReturns) {
  // 需要至少5个收益率数据点才能进行有意义的波动率计算
  if (dailyReturns.length < 5) return null;

  const n = dailyReturns.length;
  const mean = dailyReturns.reduce((sum, ret) => sum + ret, 0) / n;

  // 使用样本标准差公式，分母为 (n - 1)
  const variance = dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (n - 1);
  const dailyVolatility = Math.sqrt(variance);

  // 年化波动率（假设252个交易日）
  return dailyVolatility * Math.sqrt(252) * 100;
}

// 计算夏普比率 SharpeRatio = (E(Rp) - Rf) / σp
function calculateSharpeRatio(dailyReturns, volatility) {
  // 需要至少5个收益率数据点且波动率不为null
  if (dailyReturns.length < 5 || volatility === null || volatility === 0) return null;

  // E(Rp): 投资组合期望收益率（年化）
  const meanDailyReturn = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
  const expectedReturn = meanDailyReturn * 252; // 年化期望收益率

  // Rf: 无风险利率（假设为3%年化）
  const riskFreeRate = 0.03;

  // σp: 投资组合收益率标准差（年化波动率）
  const portfolioVolatility = volatility / 100;

  // SharpeRatio = (E(Rp) - Rf) / σp
  const sharpeRatio = (expectedReturn - riskFreeRate) / portfolioVolatility;

  return sharpeRatio;
}

function calculateRiskMetrics() {
  console.log("🔄 计算风险指标...\n");

  try {
    // 加载私募取数表数据
    const fetchDataPath = join(process.cwd(), "data", "lark-fetch-data.json");

    if (!fs.existsSync(fetchDataPath)) {
      console.error("❌ 未找到私募取数表数据文件");
      return;
    }

    const fetchData = JSON.parse(fs.readFileSync(fetchDataPath, "utf8"));
    console.log(`📊 加载了 ${fetchData.records.length} 条净值记录`);

    // 按基金分组数据
    const fundGroups = {};

    fetchData.records.forEach(record => {
      const fundName = extractTextValue(record.fields["基金名称"]);
      if (!fundName) return;

      if (!fundGroups[fundName]) {
        fundGroups[fundName] = [];
      }

      const navData = {
        date: parseDate(record.fields["净值日期"]),
        nav: parseNumber(record.fields["虚拟净值"]) || parseNumber(record.fields["单位净值"]) || parseNumber(record.fields["累计净值"])
      };

      // 只包含有效数据
      if (navData.date && navData.nav > 0) {
        fundGroups[fundName].push(navData);
      }
    });

    console.log(`📋 找到 ${Object.keys(fundGroups).length} 只基金的净值数据`);

    // 为每只基金计算风险指标
    const riskMetrics = {};

    Object.keys(fundGroups).forEach(fundName => {
      const nvData = fundGroups[fundName];

      if (nvData.length < 5) {
        console.warn(`⚠️  基金 "${fundName}" 只有 ${nvData.length} 个数据点，不足5个，跳过风险指标计算`);
        return;
      }

      // 按日期排序
      nvData.sort((a, b) => new Date(a.date) - new Date(b.date));

      // 计算风险指标
      const maxDrawdown = calculateMaxDrawdown(nvData);
      const dailyReturns = calculateDailyReturns(nvData);
      const volatility = calculateVolatility(dailyReturns);
      const sharpeRatio = calculateSharpeRatio(dailyReturns, volatility);

      // 只有当所有指标都能计算时才保存
      if (maxDrawdown !== null && volatility !== null && sharpeRatio !== null) {
        riskMetrics[fundName] = {
          max_drawdown: maxDrawdown,
          sharpe_ratio: sharpeRatio,
          volatility: volatility,
          data_points: nvData.length,
          date_range: `${nvData[0].date} ~ ${nvData[nvData.length - 1].date}`
        };

        console.log(`✅ ${fundName}: 最大回撤=${maxDrawdown.toFixed(2)}%, 夏普比率=${sharpeRatio.toFixed(2)}, 波动率=${volatility.toFixed(2)}% (${nvData.length}个数据点)`);
      } else {
        console.warn(`⚠️  基金 "${fundName}" 风险指标计算失败，数据不足`);
      }
    });

    // 更新数据库
    console.log("\n💾 更新数据库...");
    const dbPath = join(process.cwd(), "data", "funds.db");
    const db = new sqlite3.Database(dbPath);

    let updatedCount = 0;

    Object.keys(riskMetrics).forEach(fundName => {
      const metrics = riskMetrics[fundName];

      db.run(
        "UPDATE funds SET max_drawdown = ?, sharpe_ratio = ?, volatility = ? WHERE name = ?",
        [metrics.max_drawdown, metrics.sharpe_ratio, metrics.volatility, fundName],
        function(err) {
          if (err) {
            console.error(`❌ 更新基金 ${fundName} 失败:`, err.message);
          } else if (this.changes > 0) {
            updatedCount++;
          }
        }
      );
    });

    setTimeout(() => {
      console.log(`\n✅ 完成！更新了 ${updatedCount} 只基金的风险指标`);

      // 验证结果
      db.all("SELECT name, max_drawdown, sharpe_ratio, volatility FROM funds WHERE max_drawdown != 0 OR sharpe_ratio != 0 OR volatility != 0 LIMIT 10", (err, rows) => {
        if (err) {
          console.error("❌ 验证失败:", err.message);
        } else {
          console.log("\n📋 风险指标验证结果（前10条）:");
          rows.forEach(row => {
            console.log(`- ${row.name}: 最大回撤=${(row.max_drawdown || 0).toFixed(2)}%, 夏普比率=${(row.sharpe_ratio || 0).toFixed(2)}, 波动率=${(row.volatility || 0).toFixed(2)}%`);
          });
        }

        db.close();
      });
    }, 2000);

  } catch (error) {
    console.error("❌ 计算风险指标失败:", error.message);
  }
}

calculateRiskMetrics();
