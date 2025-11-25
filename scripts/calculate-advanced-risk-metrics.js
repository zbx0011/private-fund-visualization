require('dotenv').config();

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// 解析数值
function parseNumber(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  if (typeof value === 'number') {
    return isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const cleanValue = value.toString().replace(/[%,¥]/g, '').trim();
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : (isFinite(parsed) ? parsed : 0);
  }

  if (Array.isArray(value) && value.length > 0) {
    return parseNumber(value[0]);
  }

  return 0;
}

// 解析日期
function parseDate(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'string') {
    const dateStr = value.toString().trim();
    if (dateStr.includes('T') || dateStr.includes('-')) {
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
    }

    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        const parsed = new Date(year, month, day);
        return isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
      }
    }
  }

  if (typeof value === 'number') {
    if (value > 40000 && value < 60000) {
      const excelEpoch = new Date(1900, 0, 1);
      const daysOffset = value - 2;
      const jsDate = new Date(excelEpoch.getTime() + daysOffset * 24 * 60 * 60 * 1000);
      return jsDate.toISOString().split('T')[0];
    }
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
  }

  if (Array.isArray(value) && value.length > 0) {
    const firstItem = value[0];
    if (firstItem && typeof firstItem === 'object' && firstItem.text) {
      return parseDate(firstItem.text);
    }
    return parseDate(value[0]);
  }

  return null;
}

// 从历史净值数据计算收益率
function calculateReturnsFromNav(navRecords) {
  if (!navRecords || navRecords.length < 2) return [];

  // 按日期排序
  navRecords.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const returns = [];
  for (let i = 1; i < navRecords.length; i++) {
    const prevNav = navRecords[i - 1].nav;
    const currentNav = navRecords[i].nav;

    if (prevNav > 0 && currentNav > 0) {
      const dailyReturn = (currentNav - prevNav) / prevNav;
      returns.push({
        date: navRecords[i].date,
        return: dailyReturn
      });
    }
  }

  return returns;
}

// 计算最大回撤
function calculateMaxDrawdown(navRecords) {
  if (!navRecords || navRecords.length < 2) return 0;

  // 按日期排序
  navRecords.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let maxDrawdown = 0;
  let peak = navRecords[0].nav;

  for (const record of navRecords) {
    if (record.nav > peak) {
      peak = record.nav;
    }
    const drawdown = (peak - record.nav) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
}

// 计算夏普比率 (年化)
function calculateSharpeRatio(returns, riskFreeRate = 0.03) {
  if (!returns || returns.length < 2) return 0;

  const dailyReturns = returns.map(r => r.return);
  const meanReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (dailyReturns.length - 1);
  const volatility = Math.sqrt(variance);

  // 年化夏普比率
  const annualizedReturn = meanReturn * 252; // 假设252个交易日
  const annualizedVolatility = volatility * Math.sqrt(252);

  return annualizedVolatility > 0 ? (annualizedReturn - riskFreeRate) / annualizedVolatility : 0;
}

// 计算波动率 (年化)
function calculateVolatility(returns) {
  if (!returns || returns.length < 2) return 0;

  const dailyReturns = returns.map(r => r.return);
  const meanReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (dailyReturns.length - 1);

  // 年化波动率
  return Math.sqrt(variance) * Math.sqrt(252);
}

// 从私募取数表数据中提取净值历史
function extractNavHistoryFromLarkData(fundName, larkData) {
  const navRecords = [];

  if (!larkData || !larkData.records) return navRecords;

  // 查找该基金的所有记录
  const fundRecords = larkData.records.filter(record => {
    const name = record.fields['基金名称'] || record.fields['产品名称'] || '';
    if (Array.isArray(name)) {
      return name.includes(fundName);
    }
    return name === fundName;
  });

  // 从每条记录中提取净值和日期
  fundRecords.forEach(record => {
    const nav = parseNumber(record.fields['单位净值'] || record.fields['最新净值']);
    const date = parseDate(record.fields['净值日期'] || record.fields['最新净值日期']);

    if (nav > 0 && date) {
      navRecords.push({
        date: date,
        nav: nav
      });
    }
  });

  return navRecords;
}

function calculateAdvancedRiskMetrics() {
  console.log('🔄 计算高级风险指标（基于真实历史数据）...\n');

  try {
    // 加载私募取数表数据
    const dataPath = path.join(process.cwd(), 'data', 'lark-fetch-data.json');
    if (!fs.existsSync(dataPath)) {
      console.error('❌ 未找到私募取数表数据文件，请先同步数据');
      return;
    }

    const rawData = fs.readFileSync(dataPath, 'utf8');
    const larkData = JSON.parse(rawData);
    console.log(`📊 加载了 ${larkData.records.length} 条私募取数表记录`);

    const dbPath = path.join(process.cwd(), 'data', 'funds.db');
    const db = new sqlite3.Database(dbPath);

    db.all('SELECT record_id, name FROM funds', (err, funds) => {
      if (err) {
        console.error('❌ 获取基金数据失败:', err.message);
        db.close();
        return;
      }

      console.log(`📈 处理 ${funds.length} 只基金的风险指标计算`);

      let processedCount = 0;
      const stmt = db.prepare('UPDATE funds SET max_drawdown = ?, sharpe_ratio = ?, volatility = ? WHERE record_id = ?');

      funds.forEach((fund, index) => {
        try {
          // 从私募取数表提取净值历史
          const navHistory = extractNavHistoryFromLarkData(fund.name, larkData);

          if (navHistory.length < 2) {
            console.log(`⚠️  ${fund.name}: 净值数据不足 (${navHistory.length} 条)，跳过计算`);
            // 设置默认值
            stmt.run([0, 0, 0, fund.record_id]);
          } else {
            // 计算收益率序列
            const returns = calculateReturnsFromNav(navHistory);

            // 计算风险指标
            const maxDrawdown = calculateMaxDrawdown(navHistory);
            const sharpeRatio = calculateSharpeRatio(returns);
            const volatility = calculateVolatility(returns);

            // 确保数值是有限的
            const safeMaxDrawdown = isFinite(maxDrawdown) ? maxDrawdown : 0;
            const safeSharpeRatio = isFinite(sharpeRatio) ? sharpeRatio : 0;
            const safeVolatility = isFinite(volatility) ? volatility : 0;

            stmt.run([safeMaxDrawdown, safeSharpeRatio, safeVolatility, fund.record_id], (err) => {
              if (err) {
                console.error(`❌ 更新基金 ${fund.name} 失败:`, err.message);
              } else {
                processedCount++;
                if (processedCount <= 10) {
                  console.log(`✅ ${fund.name}: 最大回撤=${(safeMaxDrawdown * 100).toFixed(2)}%, 夏普比率=${safeSharpeRatio.toFixed(2)}, 波动率=${(safeVolatility * 100).toFixed(2)}% (基于${navHistory.length}个净值点)`);
                }
              }

              // 最后一条记录处理完成
              if (index === funds.length - 1) {
                stmt.finalize();

                setTimeout(() => {
                  console.log(`\n✅ 完成！更新了 ${processedCount} 条基金的风险指标`);

                  // 验证更新结果
                  db.all('SELECT name, max_drawdown, sharpe_ratio, volatility FROM funds WHERE max_drawdown > 0 OR sharpe_ratio > 0 OR volatility > 0 LIMIT 10', (err, rows) => {
                    if (err) {
                      console.error('❌ 验证失败:', err.message);
                    } else {
                      console.log('\n📋 更新后的风险指标（前10条有数据的）:');
                      rows.forEach(row => {
                        console.log(`- ${row.name}: 最大回撤=${(row.max_drawdown * 100).toFixed(2)}%, 夏普比率=${row.sharpe_ratio.toFixed(2)}, 波动率=${(row.volatility * 100).toFixed(2)}%`);
                      });
                    }

                    db.close();
                  });
                }, 100);
              }
            });
          }

        } catch (error) {
          console.error(`❌ 处理基金 ${fund.name} 失败:`, error.message);

          // 如果出错，也要继续处理下一只基金
          if (index === funds.length - 1) {
            stmt.finalize();
            db.close();
          }
        }
      });
    });

  } catch (error) {
    console.error('❌ 处理数据失败:', error.message);
  }
}

// 运行计算
calculateAdvancedRiskMetrics();