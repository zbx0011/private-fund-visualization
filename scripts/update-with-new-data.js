require('dotenv').config();

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
      return '已赎回'; // 确认optFl1SLci对应已赎回
    }
  }

  return '正常';
}

function updateWithNewData() {
  console.log('🔄 使用新数据更新数据库...\n');

  try {
    // 加载新的私募盈亏一览表数据
    const fs = require('fs');
    const dataPath = join(process.cwd(), 'data', 'lark-profit-data.json');

    if (!fs.existsSync(dataPath)) {
      console.error('❌ 未找到新的数据文件 lark-profit-data.json，请先运行同步脚本');
      return;
    }

    const rawData = fs.readFileSync(dataPath, 'utf8');
    const larkData = JSON.parse(rawData);

    console.log(`📊 加载了 ${larkData.records.length} 条新记录`);

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

      larkData.records.forEach((record, index) => {
        try {
          const fields = record.fields;

          // 计算收益率
          const weeklyIncome = parseNumber(fields['本周收益']);
          const yearlyIncome = parseNumber(fields['本年收益']);
          const dailyIncome = parseNumber(fields['本日盈亏']);
          const cost = parseNumber(fields['日均资金占用']);

          const weeklyReturn = cost !== 0 ? weeklyIncome / cost : 0;
          const dailyReturn = cost !== 0 ? dailyIncome / cost : 0;
          const yearlyReturn = parseNumber(fields['本年收益率']);

          const concentration = parseNumber(fields['集中度']);

          // 处理策略类型
          let strategy = '';
          if (fields['策略类型'] && Array.isArray(fields['策略类型']) && fields['策略类型'].length > 0) {
            const optionId = fields['策略类型'][0];
            if (typeof optionId === 'string' && strategyOptionMapping[optionId]) {
              strategy = strategyOptionMapping[optionId];
            }
          }

          // 确保所有数值都是有限的
          const safeWeeklyReturn = isFinite(weeklyReturn) ? weeklyReturn : 0;
          const safeDailyReturn = isFinite(dailyReturn) ? dailyReturn : 0;
          const safeYearlyReturn = isFinite(yearlyReturn) ? yearlyReturn : 0;
          const safeConcentration = isFinite(concentration) ? concentration : 0;
          const safeCost = isFinite(cost) ? cost : 0;

          const data = [
            record.record_id,
            extractTextValue(fields['基金名称']) || extractTextValue(fields['产品名称']) || '',
            strategy,
            extractTextValue(fields['投资经理']) || '',
            parseDate(fields['最新净值日期']),
            safeWeeklyReturn * 100, // 转换为百分比
            safeDailyReturn * 100,  // 转换为百分比
            safeYearlyReturn * 100,  // 转换为百分比
            safeConcentration * 100, // 转换为百分比
            safeCost,
            determineStatus(fields['状态']),
            0, // max_drawdown
            0, // sharpe_ratio
            0, // volatility
            null, // establishment_date
            0, // scale
            'main'
          ];

          stmt.run(data, (err) => {
            if (err) {
              console.error(`❌ 插入记录失败:`, err.message);
            } else {
              insertedCount++;
            }
          });

        } catch (error) {
          console.error(`❌ 处理记录 ${index} 失败:`, error.message);
        }
      });

      stmt.finalize();

      setTimeout(() => {
        console.log(`\n✅ 完成！插入了 ${insertedCount} 条记录`);

        // 验证更新结果
        db.all('SELECT name, status FROM funds WHERE status != "正常" LIMIT 10', (err, rows) => {
          if (err) {
            console.error('❌ 验证失败:', err.message);
          } else {
            console.log('\n📋 非正常状态的基金:');
            rows.forEach(row => {
              console.log(`- ${row.name}: ${row.status}`);
            });
          }

          db.close();
        });
      }, 2000);

    });

  } catch (error) {
    console.error('❌ 处理数据失败:', error.message);
  }
}

updateWithNewData();