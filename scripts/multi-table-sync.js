require('dotenv').config();

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// 策略映射
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
  'optvE8Axra': '指数增强策略',
  'optztNchXY': '套利策略',
  'optA6mwCSf': '宏观策略',
  'optN5SM1ew': '股票多头策略',
  'optMJZQ4p5': '多策略',
  'optpdOvS5N': 'CTA策略',
  'optcXUA9c6': '套利策略',
  'optHhPUvUQ': '量化中性策略',
  'optC7xvukD': '债券策略'
};

// 数据处理函数
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

  return '正常';
}

function mergeTableData(fetchData, profitData, otherData, fofExclusionList) {
  const fofSet = new Set(fofExclusionList);
  const mergedData = {};

  // 主数据来自私募取数表
  fetchData.forEach(record => {
    const fundName = extractTextValue(record.fields['基金名称']) || extractTextValue(record.fields['产品名称']) || '';
    if (fundName && !fofSet.has(fundName)) {
      mergedData[fundName] = {
        ...record.fields,
        sourceTable: 'fetch'
      };
    }
  });

  // 补充私募盈亏一览表字段数据
  profitData.forEach(record => {
    const fundName = extractTextValue(record.fields['基金名称']) || extractTextValue(record.fields['产品名称']) || '';
    if (fundName && mergedData[fundName] && !fofSet.has(fundName)) {
      // 补充缺失的字段
      Object.keys(record.fields).forEach(key => {
        if (!mergedData[fundName][key]) {
          mergedData[fundName][key] = record.fields[key];
        }
      });
    }
  });

  // 补充私募其他字段原始数据
  otherData.forEach(record => {
    const fundName = extractTextValue(record.fields['基金名称']) || extractTextValue(record.fields['产品名称']) || '';
    if (fundName && mergedData[fundName] && !fofSet.has(fundName)) {
      // 补充缺失的字段
      Object.keys(record.fields).forEach(key => {
        if (!mergedData[fundName][key]) {
          mergedData[fundName][key] = record.fields[key];
        }
      });
    }
  });

  return Object.values(mergedData);
}

function insertMultiTableData() {
  console.log('🔄 多表格数据合并与插入...\n');

  try {
    // 加载多个表格的数据文件
    const fetchDataPath = path.join(process.cwd(), 'data', 'lark-fetch-data.json');
    const profitDataPath = path.join(process.cwd(), 'data', 'lark-profit-data.json');
    const otherDataPath = path.join(process.cwd(), 'data', 'lark-other-data.json');
    const fofDataPath = path.join(process.cwd(), 'data', 'lark-fof-data.json');

    let fetchData = [];
    let profitData = [];
    let otherData = [];
    let fofData = [];

    // 主数据源：私募取数表
    if (fs.existsSync(fetchDataPath)) {
      const rawData = fs.readFileSync(fetchDataPath, 'utf8');
      const parsed = JSON.parse(rawData);
      fetchData = parsed.records || [];
      console.log(`📊 加载私募取数表（主数据源）: ${fetchData.length} 条记录`);
    }

    // 补充数据：私募盈亏一览表
    if (fs.existsSync(profitDataPath)) {
      const rawData = fs.readFileSync(profitDataPath, 'utf8');
      const parsed = JSON.parse(rawData);
      profitData = parsed.records || [];
      console.log(`📊 加载私募盈亏一览表（补充字段）: ${profitData.length} 条记录`);
    }

    // 补充数据：私募其他字段原始数据
    if (fs.existsSync(otherDataPath)) {
      const rawData = fs.readFileSync(otherDataPath, 'utf8');
      const parsed = JSON.parse(rawData);
      otherData = parsed.records || [];
      console.log(`📊 加载私募其他字段原始数据（补充字段）: ${otherData.length} 条记录`);
    }

    // 排除数据：第一创业FOF
    if (fs.existsSync(fofDataPath)) {
      const rawData = fs.readFileSync(fofDataPath, 'utf8');
      const parsed = JSON.parse(rawData);
      fofData = parsed.records || [];
      console.log(`📊 加载第一创业FOF: ${fofData.length} 条记录（用于排除）`);
    }

    // 获取需要排除的FOF基金名称列表
    const fofExclusionList = fofData.map(record =>
      extractTextValue(record.fields['基金名称']) || extractTextValue(record.fields['产品名称'])
    ).filter(name => name);

    // 合并数据（主数据源为私募取数表）
    const mergedRecords = mergeTableData(fetchData, profitData, otherData, fofExclusionList);
    console.log(`📊 合并后有效记录: ${mergedRecords.length} 条`);

    const dbPath = path.join(process.cwd(), 'data', 'funds.db');
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

      // 处理合并后的记录
      mergedRecords.forEach((record, index) => {
        try {
          const fields = record;

          // 直接使用飞书提供的收益率数据
          const weeklyReturn = parseNumber(fields['本周收益率']);
          const yearlyReturn = parseNumber(fields['本年收益率']);

          // 本日收益率计算
          const dailyProfit = parseNumber(fields['本日盈亏']);
          const cost = parseNumber(fields['日均资金占用']);
          const calculatedDailyReturn = cost !== 0 ? dailyProfit / cost : 0;
          const dailyReturn = parseNumber(fields['本日收益率']) || calculatedDailyReturn;

          // 确保所有数值都是有限的
          const safeWeeklyReturn = isFinite(weeklyReturn) ? weeklyReturn : 0;
          const safeDailyReturn = isFinite(dailyReturn) ? dailyReturn : 0;
          const safeYearlyReturn = isFinite(yearlyReturn) ? yearlyReturn : 0;
          const safeCost = isFinite(cost) ? cost : 0;

          // 集中度处理
          const concentration = parseNumber(fields['集中度']);
          const safeConcentration = isFinite(concentration) ? concentration : 0;

          // 策略类型处理
          const strategy = extractTextValue(fields['策略类型']);
          let mappedStrategy = strategy;

          if (fields['策略类型'] && Array.isArray(fields['策略类型']) && fields['策略类型'].length > 0) {
            const optionId = fields['策略类型'][0];
            if (typeof optionId === 'string' && strategyOptionMapping[optionId]) {
              mappedStrategy = strategyOptionMapping[optionId];
            }
          }

          const data = [
            record.record_id || record.id,
            extractTextValue(fields['基金名称']) || extractTextValue(fields['产品名称']) || '',
            mappedStrategy,
            extractTextValue(fields['投资经理']) || '',
            parseDate(fields['最新净值日期']),
            safeWeeklyReturn,
            safeDailyReturn,
            safeYearlyReturn,
            safeConcentration,
            safeCost,
            determineStatus(fields['状态']),
            0, // max_drawdown
            0, // sharpe_ratio
            0, // volatility
            parseDate(fields['成立日期']),
            isFinite(parseNumber(fields['当前规模'])) ? parseNumber(fields['当前规模']) : 0,
            'multi-table'
          ];

          stmt.run(data, (err) => {
            if (err) {
              console.error(`❌ 插入记录失败 ${data[1]}:`, err.message);
            } else {
              insertedCount++;
              if (insertedCount <= 5) {
                console.log(`✅ 插入记录: ${data[1]} (策略: ${data[2]}, 投资经理: ${data[3]}, 本年收益率: ${(data[7] * 100).toFixed(2)}%)`);
              }
            }
          });

        } catch (recordError) {
          console.error(`❌ 处理记录失败 ${index}:`, recordError.message);
        }
      });

      stmt.finalize();

      // 等待所有插入完成
      setTimeout(() => {
        console.log(`\n✅ 完成！插入了 ${insertedCount} 条记录`);

        // 验证数据
        db.all('SELECT COUNT(*) as count FROM funds', (err, row) => {
          if (err) {
            console.error('❌ 统计记录数失败:', err.message);
          } else {
            console.log(`📈 数据库总记录数: ${row.count}`);
          }

          // 检查一些示例数据
          db.all('SELECT name, weekly_return, yearly_return, concentration, cost, status FROM funds LIMIT 5', (err, rows) => {
            if (err) {
              console.error('❌ 查询示例数据失败:', err.message);
            } else {
              console.log('\n📋 前5条记录:');
              rows.forEach(row => {
                console.log(`- ${row.name}: 本周收益率=${(row.weekly_return * 100).toFixed(2)}%, 本年收益率=${(row.yearly_return * 100).toFixed(2)}%, 集中度=${(row.concentration * 100).toFixed(2)}%, 成本=${row.cost.toFixed(0)}, 状态=${row.status}`);
              });
            }

            db.close();
          });
        });
      }, 3000);

    });

  } catch (error) {
    console.error('❌ 处理数据失败:', error.message);
  }
}

// 运行多表格数据合并插入
insertMultiTableData();