require('dotenv').config();

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// 根据用户要求重新定义的数据结构
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
}

// 状态判断：根据"私募盈亏一览表"的状态列，空白=正常，已赎回=已赎回
function determineStatus(statusField) {
  if (!statusField || statusField === null || statusField === '') {
    return '正常'
  }

  // 如果状态字段有内容，检查是否包含"已赎回"
  const statusText = extractTextValue(statusField).toLowerCase()
  if (statusText.includes('已赎回') || statusText.includes('赎回')) {
    return '已赎回'
  }

  return '正常'
}

function convertCorrectData() {
  console.log('🔄 按照用户要求重新转换数据...\n');

  try {
    // 加载真实飞书数据
    const dataPath = path.join(process.cwd(), 'data', 'lark-data.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const larkData = JSON.parse(rawData);

    console.log(`📊 加载了 ${larkData.records.length} 条真实记录`);

    // 清空数据库
    const dbPath = path.join(process.cwd(), 'data', 'funds.db');
    const db = new sqlite3.Database(dbPath);

    console.log('🗑️ 清空旧数据...');
    db.run('DELETE FROM funds', function(err) {
      if (err) {
        console.error('❌ 清空数据失败:', err.message);
        db.close();
        return;
      }

      console.log(`✅ 已删除 ${this.changes} 条旧记录`);
    });

    let processedCount = 0;
    let insertedCount = 0;

    // 处理每条记录
    larkData.records.forEach((record, index) => {
      try {
        const fields = record.fields;

        // 转换数据 - 按照用户要求
        const fundData = {
          id: record.record_id,
          name: extractTextValue(fields['基金名称']) || extractTextValue(fields['产品名称']) || '',
          strategy: extractTextValue(fields['策略类型']),
          manager: extractTextValue(fields['投资经理']) || '',
          latestNavDate: parseDate(fields['最新净值日期']),

          // 新增要求的字段
          weeklyReturn: parseNumber(fields['本周收益率']), // 本周收益率
          dailyReturn: (function() {
            const dailyProfit = parseNumber(fields['本日盈亏']);
            const cost = parseNumber(fields['日均资金占用']);
            return cost !== 0 ? dailyProfit / cost : 0;
          })(), // 本日收益率 = 本日盈亏/成本
          yearlyReturn: parseNumber(fields['本年收益率']), // 本年收益率

          concentration: parseNumber(fields['集中度']), // 集中度
          cost: parseNumber(fields['日均资金占用']), // 成本 (日均资金占用)

          status: determineStatus(fields['状态']), // 状态判断

          // 需要计算的字段（暂时设为0，后续需要从历史数据计算）
          maxDrawdown: 0, // 最大回撤 - 需要计算
          sharpeRatio: 0, // 夏普比率 - 需要计算
          volatility: 0,   // 波动率 - 需要计算

          // 保留字段
          establishmentDate: parseDate(fields['成立日期']),
          scale: parseNumber(fields['当前规模']),
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
        console.log(`  本日收益率: ${fundData.dailyReturn}`);
        console.log(`  本年收益率: ${fundData.yearlyReturn}`);
        console.log(`  集中度: ${fundData.concentration}`);
        console.log(`  成本: ${fundData.cost}`);
        console.log(`  状态: ${fundData.status}`);

        // 插入到数据库（使用新的字段结构）
        const stmt = db.prepare(`
          INSERT INTO funds (
            id, name, strategy, manager, latest_nav_date,
            weekly_return, daily_return, yearly_return,
            concentration, cost, status,
            max_drawdown, sharpe_ratio, volatility,
            establishment_date, scale, source_table
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        // 确保数据类型安全
        const safeData = [
          fundData.id,
          fundData.name,
          fundData.strategy,
          fundData.manager,
          fundData.latestNavDate instanceof Date ? fundData.latestNavDate.toISOString() : fundData.latestNavDate,
          // 确保数值是有限的，避免 Infinity 和 NaN
          isFinite(fundData.weeklyReturn) ? fundData.weeklyReturn : 0,
          isFinite(fundData.dailyReturn) ? fundData.dailyReturn : 0,
          isFinite(fundData.yearlyReturn) ? fundData.yearlyReturn : 0,
          isFinite(fundData.concentration) ? fundData.concentration : 0,
          isFinite(fundData.cost) ? fundData.cost : 0,
          fundData.status,
          isFinite(fundData.maxDrawdown) ? fundData.maxDrawdown : 0,
          isFinite(fundData.sharpeRatio) ? fundData.sharpeRatio : 0,
          isFinite(fundData.volatility) ? fundData.volatility : 0,
          fundData.establishmentDate instanceof Date ? fundData.establishmentDate.toISOString() : fundData.establishmentDate,
          isFinite(fundData.scale) ? fundData.scale : 0,
          fundData.source_table
        ];

        stmt.run(safeData, (err) => {
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

        console.log('\n🎉 重新设计的数据结构同步完成!');
        console.log('\n📋 字段变更总结:');
        console.log('✅ 去掉: 累计收益率、年化收益率、总规模、站岗资金');
        console.log('✅ 新增: 本日收益率、本周收益率、本年收益率');
        console.log('✅ 替换: 总规模→集中度, 站岗资金→成本');
        console.log('✅ 状态: 正常/已赎回 (基于状态列判断)');
        console.log('⏳ 待计算: 最大回撤、夏普比率、波动率');

        db.close();
      });
    }, 3000);

  } catch (error) {
    console.error('❌ 处理数据失败:', error.message);
  }
}

// 运行转换
convertCorrectData();