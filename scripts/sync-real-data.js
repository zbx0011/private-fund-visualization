require('dotenv').config();

const fs = require('fs');
const path = require('path');

// Since we can't import TypeScript modules directly, let's recreate the necessary logic here
function extractTextValue(value) {
  if (value === null || value === undefined) {
    return '未知'
  }

  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '未知'
    }

    const firstItem = value[0]
    if (firstItem && typeof firstItem === 'object' && firstItem.text) {
      return firstItem.text
    }

    if (typeof firstItem === 'string') {
      return firstItem
    }

    return String(firstItem)
  }

  if (typeof value === 'object') {
    if (value.text) {
      return value.text
    }
  }

  return String(value)
}

function parseNumber(value) {
  if (value === null || value === undefined || value === '') {
    return 0
  }

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const cleanValue = value.toString().replace(/[%,¥]/g, '').trim()
    const parsed = parseFloat(cleanValue)
    return isNaN(parsed) ? 0 : parsed
  }

  if (Array.isArray(value) && value.length > 0) {
    return parseNumber(value[0])
  }

  return 0
}

function parseCurrency(value) {
  if (value === null || value === undefined || value === '') {
    return 0
  }

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const cleanValue = value.toString().replace(/[¥,]/g, '').trim()
    const parsed = parseFloat(cleanValue)
    return isNaN(parsed) ? 0 : parsed
  }

  if (Array.isArray(value) && value.length > 0) {
    return parseCurrency(value[0])
  }

  return 0
}

function parseDate(value) {
  if (value === null || value === undefined || value === '') {
    return new Date()
  }

  if (value instanceof Date) {
    return value
  }

  if (typeof value === 'number') {
    if (value > 40000 && value < 60000) {
      const excelEpoch = new Date(1900, 0, 1)
      const daysOffset = value - 2
      const jsDate = new Date(excelEpoch.getTime() + daysOffset * 24 * 60 * 60 * 1000)
      return jsDate
    }
    return new Date(value)
  }

  if (typeof value === 'string') {
    const dateStr = value.toString().trim()
    if (dateStr.includes('T') || dateStr.includes('-')) {
      const parsed = new Date(dateStr)
      return isNaN(parsed.getTime()) ? new Date() : parsed
    }

    if (dateStr.includes('/')) {
      const parts = dateStr.split('/')
      if (parts.length === 3) {
        const year = parseInt(parts[0])
        const month = parseInt(parts[1]) - 1
        const day = parseInt(parts[2])
        const parsed = new Date(year, month, day)
        return isNaN(parsed.getTime()) ? new Date() : parsed
      }
    }
  }

  if (Array.isArray(value) && value.length > 0) {
    const firstItem = value[0]
    if (firstItem && typeof firstItem === 'object' && firstItem.text) {
      return parseDate(firstItem.text)
    }
    return parseDate(value[0])
  }

  return new Date()
}

// Strategy mapping
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
}

function convertRealData() {
  console.log('🔄 处理真实飞书数据...\n');

  try {
    // 加载真实飞书数据
    const dataPath = path.join(process.cwd(), 'data', 'lark-data.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const larkData = JSON.parse(rawData);

    console.log(`📊 加载了 ${larkData.records.length} 条真实记录`);

    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.join(process.cwd(), 'data', 'funds.db');
    const db = new sqlite3.Database(dbPath);

    let processedCount = 0;
    let insertedCount = 0;

    // 处理每条记录
    larkData.records.forEach((record, index) => {
      try {
        const fields = record.fields;

        // 转换数据
        const fundData = {
          id: record.record_id,
          name: extractTextValue(fields['基金名称']) || extractTextValue(fields['产品名称']) || '',
          strategy: extractTextValue(fields['策略类型']),
          manager: extractTextValue(fields['投资经理']) || '',
          latestNavDate: parseDate(fields['最新净值日期']),
          cumulativeReturn: parseNumber(fields['累计收益率']),
          annualizedReturn: parseNumber(fields['本年收益率']), // 注意：这里应该是本年收益率
          maxDrawdown: parseNumber(fields['最大回撤']),
          sharpeRatio: parseNumber(fields['夏普比率']),
          volatility: parseNumber(fields['波动率']),
          totalAssets: parseCurrency(fields['总规模']) || parseCurrency(fields['总份额']),
          standingAssets: parseCurrency(fields['存续规模']),
          cashAllocation: parseCurrency(fields['站岗资金']) || parseCurrency(fields['日均资金占用']),
          status: extractTextValue(fields['状态']) || '正常',
          establishmentDate: parseDate(fields['成立日期']),
          cost: parseCurrency(fields['成本']) || parseCurrency(fields['日均资金占用']),
          scale: parseCurrency(fields['当前规模']),
          weeklyReturn: parseNumber(fields['本周收益率']), // 本周收益率
          dailyReturn: parseNumber(fields['本日盈亏']), // 日收益/本日盈亏
          source_table: 'main' // 标记为主数据源
        };

        // 处理策略类型选项ID
        if (fields['策略类型'] && Array.isArray(fields['策略类型']) && fields['策略类型'].length > 0) {
          const optionId = fields['策略类型'][0];
          if (typeof optionId === 'string' && strategyOptionMapping[optionId]) {
            fundData.strategy = strategyOptionMapping[optionId];
          }
        }

        console.log(`\n处理记录 ${index + 1}: ${fundData.name}`);
        console.log(`  投资经理: ${fundData.manager}`);
        console.log(`  本周收益率: ${fundData.weeklyReturn}`);
        console.log(`  本年收益率: ${fundData.annualizedReturn}`);
        console.log(`  本日盈亏: ${fundData.dailyReturn}`);
        console.log(`  成本: ${fundData.cost}`);

        // 插入到数据库
        const stmt = db.prepare(`
          INSERT INTO funds (
            id, name, strategy, manager, latest_nav_date, cumulative_return,
            annualized_return, max_drawdown, sharpe_ratio, volatility,
            total_assets, standing_assets, cash_allocation, status,
            establishment_date, cost, scale, weekly_return, daily_return, source_table
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run([
          fundData.id,
          fundData.name,
          fundData.strategy,
          fundData.manager,
          fundData.latestNavDate.toISOString(),
          fundData.cumulativeReturn,
          fundData.annualizedReturn,
          fundData.maxDrawdown,
          fundData.sharpeRatio,
          fundData.volatility,
          fundData.totalAssets,
          fundData.standingAssets,
          fundData.cashAllocation,
          fundData.status,
          fundData.establishmentDate.toISOString(),
          fundData.cost,
          fundData.scale,
          fundData.weeklyReturn,
          fundData.dailyReturn,
          fundData.source_table
        ], (err) => {
          if (err) {
            console.error(`❌ 插入记录失败 ${fundData.name}:`, err.message);
          } else {
            insertedCount++;
          }
        });

        stmt.finalize();
        processedCount++;

      } catch (recordError) {
        console.error(`❌ 处理记录失败 ${index}:`, recordError.message);
      }
    });

    // 等待所有插入完成
    setTimeout(() => {
      db.get('SELECT COUNT(*) as count FROM funds', (err, row) => {
        if (err) {
          console.error('❌ 统计记录数失败:', err.message);
        } else {
          console.log(`\n✅ 数据处理完成:`);
          console.log(`   - 处理记录: ${processedCount}`);
          console.log(`   - 插入成功: ${insertedCount}`);
          console.log(`   - 数据库总记录数: ${row.count}`);
        }

        console.log('\n🎉 真实数据同步完成!');
        db.close();
      });
    }, 2000);

  } catch (error) {
    console.error('❌ 处理真实数据失败:', error.message);
  }
}

// 运行转换
convertRealData();