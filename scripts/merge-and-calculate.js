require('dotenv').config();

const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { join } = require('path');

// 策略选项ID映射
const strategyOptionMapping = {
  'opteZ8clPp': '量化中性策略',
  'optAf8gJwT': '指数增强策略',
  'optBf2hKwU': 'CTA策略',
  'optCg3lLxV': '股票多头策略',
  'optDh4mMyW': '宏观策略',
  'optEi5nNzX': '套利策略',
  'optFj6oOaY': '债券策略',
  'optGk7pPbZ': '多策略',
  'optHl8qQcA': '管理期货',
  'optIm9rRdB': '市场中性',
  'optvE8Axra': 'index增强策略',
  'optztNchXY': '套利策略',
  'optA6mwCSf': '宏观策略',
  'optN5SM1ew': '股票多头策略',
  'optMJZQ4p5': '多策略',
  'optpdOvS5N': 'CTA策略',
  'optcXUA9c6': '套利策略',
  'optHhPUvUQ': '量化中性策略',
  'optC7xvukD': '债券策略'
};

function extractTextValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '';
    }

    const firstItem = value[0];
    if (firstItem && typeof firstItem === 'object' && firstItem.text) {
      return firstItem.text;
    }

    if (typeof firstItem === 'string') {
      return firstItem;
    }

    return String(firstItem);
  }

  if (typeof value === 'object') {
    if (value.text) {
      return value.text;
    }
  }

  return String(value);
}

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

function determineStatus(statusField) {
  if (!statusField || statusField === null || statusField === '') {
    return '正常';
  }

  const statusText = extractTextValue(statusField).toLowerCase();
  if (statusText.includes('已赎回') || statusText.includes('赎回')) {
    return '已赎回';
  }

  // 处理选项ID的情况
  if (Array.isArray(statusField) && statusField.length > 0) {
    const statusId = statusField[0];
    if (statusId === 'optFl1SLci') {
      return '已赎回';
    }
  }

  return '正常';
}

function mergeAndCalculate() {
  console.log('🔄 合并数据并计算收益率指标...\n');

  try {
    // 加载两个数据文件
    const profitDataPath = join(process.cwd(), 'data', 'lark-profit-data.json');
    const fetchDataPath = join(process.cwd(), 'data', 'lark-fetch-data.json');

    if (!fs.existsSync(profitDataPath)) {
      console.error('❌ 未找到私募盈亏一览表数据文件');
      return;
    }

    if (!fs.existsSync(fetchDataPath)) {
      console.error('❌ 未找到私募取数表数据文件');
      return;
    }

    const profitData = JSON.parse(fs.readFileSync(profitDataPath, 'utf8'));
    const fetchData = JSON.parse(fs.readFileSync(fetchDataPath, 'utf8'));

    console.log(`📊 私募盈亏一览表: ${profitData.records.length} 条记录`);
    console.log(`📊 私募取数表: ${fetchData.records.length} 条记录`);

    // 创建基金名称到数据的映射
    const profitMap = {};
    const fetchMap = {};

    // 处理私募盈亏一览表
    profitData.records.forEach(record => {
      const fundName = extractTextValue(record.fields['基金名称']) || extractTextValue(record.fields['产品名称']) || '';
      if (fundName) {
        profitMap[fundName] = {
          ...record.fields,
          sourceTable: 'profit'
        };
      }
    });

    // 处理私募取数表
    fetchData.records.forEach(record => {
      const fundName = extractTextValue(record.fields['基金名称']) || extractTextValue(record.fields['产品名称']) || '';
      if (fundName) {
        fetchMap[fundName] = {
          ...record.fields,
          sourceTable: 'fetch'
        };
      }
    });

    console.log(`📋 基金映射完成: 私募盈亏一览表(${Object.keys(profitMap).length}只), 私募取数表(${Object.keys(fetchMap).length}只)`);

    // 创建合并后的基金数据
    const mergedFunds = [];
    const allFundNames = new Set([...Object.keys(profitMap), ...Object.keys(fetchMap)]);

    allFundNames.forEach(fundName => {
      const profitData = profitMap[fundName];
      const fetchData = fetchMap[fundName];

      if (profitData) {
        const mergedFund = {
          record_id: profitData.record_id || `profit_${fundName}`,
          name: fundName,
          strategy: '',
          manager: extractTextValue(profitData['投资经理']) || '',
          latest_nav_date: parseDate(profitData['最新净值日期']),
          // 使用私募盈亏一览表的数据
          weekly_return: (parseNumber(profitData['本周收益率']) || 0) * 100,
          daily_return: 0, // 稍后用本日盈亏计算
          yearly_return: (parseNumber(profitData['本年收益率']) || 0) * 100,
          concentration: parseNumber(profitData['集中度']) || 0,
          cost: parseNumber(profitData['日均资金占用']) || 0,
          status: determineStatus(profitData['状态']),
          max_drawdown: 0,
          sharpe_ratio: 0,
          volatility: 0,
          establishment_date: null,
          scale: 0,
          source_table: 'merged'
        };

        // 从私募盈亏一览表获取策略
        if (profitData['策略类型'] && Array.isArray(profitData['策略类型']) && profitData['策略类型'].length > 0) {
          const optionId = profitData['策略类型'][0];
          if (typeof optionId === 'string' && strategyOptionMapping[optionId]) {
            mergedFund.strategy = strategyOptionMapping[optionId];
          }
        }

        mergedFunds.push(mergedFund);
      } else {
        console.warn(`⚠️  未找到基金 "${fundName}" 在私募盈亏一览表中`);
      }
    });

    // 计算本日收益率：使用私募盈亏一览表的"本日盈亏"÷"成本"×100%
    console.log('\n📊 计算本日收益率...');
    mergedFunds.forEach(fund => {
      // 使用私募盈亏一览表的本日盈亏来计算本日收益率
      const profitData = profitMap[fund.name];
      if (profitData) {
        const dailyIncome = parseNumber(profitData['本日盈亏']);
        const cost = parseNumber(profitData['日均资金占用']);
        if (cost > 0) {
          fund.daily_return = (dailyIncome / cost) * 100;
        }
      }
    });

    console.log(`\n📊 合并完成，共 ${mergedFunds.length} 只基金`);

    // 写入数据库
    const dbPath = join(process.cwd(), 'data', 'funds.db');
    const db = new sqlite3.Database(dbPath);

    // 清空数据库
    db.run('DELETE FROM funds', function(err) {
      if (err) {
        console.error('❌ 清空数据失败:', err.message);
        db.close();
        return;
      }

      console.log(`✅ 已清空 ${this.changes} 条旧记录`);

      let insertedCount = 0;
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO funds (
          record_id, name, strategy, manager, latest_nav_date,
          weekly_return, daily_return, yearly_return,
          concentration, cost, status,
          max_drawdown, sharpe_ratio, volatility,
          establishment_date, scale, source_table
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      mergedFunds.forEach(fund => {
        const data = [
          fund.record_id,
          fund.name,
          fund.strategy,
          fund.manager,
          fund.latest_nav_date,
          fund.weekly_return,
          fund.daily_return,
          fund.yearly_return,
          fund.concentration * 100, // 转换为百分比
          fund.cost,
          fund.status,
          fund.max_drawdown,
          fund.sharpe_ratio,
          fund.volatility,
          fund.establishment_date,
          fund.scale,
          fund.source_table
        ];

        stmt.run(data, (err) => {
          if (err) {
            console.error(`❌ 插入基金 ${fund.name} 失败:`, err.message);
          } else {
            insertedCount++;
          }
        });
      });

      stmt.finalize();

      setTimeout(() => {
        console.log(`\n✅ 完成！插入了 ${insertedCount} 条记录到数据库`);

        // 验证结果
        db.all('SELECT name, strategy, status, weekly_return, daily_return, yearly_return, cost FROM funds LIMIT 5', (err, rows) => {
          if (err) {
            console.error('❌ 验证失败:', err.message);
          } else {
            console.log('\n📋 验证结果（前5条）:');
            rows.forEach(row => {
              console.log(`- ${row.name}: ${row.strategy}, ${row.status}, 本周收益率=${(row.weekly_return / 100).toFixed(4)}%, 本日收益率=${(row.daily_return / 100).toFixed(4)}%, 本年收益率=${(row.yearly_return / 100).toFixed(4)}%, 成本=${row.cost.toFixed(0)}`);
            });
          }

          // 计算总计数据
          db.all('SELECT SUM(cost) as totalCost FROM funds', (err, rows) => {
            if (!err && rows.length > 0) {
              console.log(`\n💰 总成本: ¥${rows[0].totalCost.toLocaleString()}`);
            }
            db.close();
          });
        });
      }, 1000);

    });

  } catch (error) {
    console.error('❌ 合并数据失败:', error.message);
  }
}

mergeAndCalculate();