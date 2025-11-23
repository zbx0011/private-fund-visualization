require('dotenv').config();

const sqlite3 = require('sqlite3').verbose();
const { join } = require('path');

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

function fixReturnCalculations() {
  console.log('🔧 修复收益率计算逻辑...\n');

  try {
    // 加载当前数据
    const fs = require('fs');
    const dataPath = join(process.cwd(), 'data', 'lark-data.json');

    if (!fs.existsSync(dataPath)) {
      console.error('❌ 未找到数据文件 lark-data.json');
      return;
    }

    const rawData = fs.readFileSync(dataPath, 'utf8');
    const larkData = JSON.parse(rawData);
    console.log(`📊 加载了 ${larkData.records.length} 条数据记录`);

    const dbPath = join(process.cwd(), 'data', 'funds.db');
    const db = new sqlite3.Database(dbPath);

    // 创建基金名称到数据的映射
    const fundDataMap = {};
    larkData.records.forEach(record => {
      const fundName = record.fields['基金名称'] || record.fields['产品名称'] || '';
      if (fundName) {
        fundDataMap[fundName] = record.fields;
      }
    });

    console.log(`📋 创建了 ${Object.keys(fundDataMap).length} 个基金的数据映射`);

    // 获取数据库中的所有基金
    db.all('SELECT record_id, name, weekly_return, daily_return, yearly_return, concentration, cost FROM funds', (err, funds) => {
      if (err) {
        console.error('❌ 获取基金数据失败:', err.message);
        db.close();
        return;
      }

      console.log(`🔄 更新 ${funds.length} 只基金的收益率数据`);

      let updatedCount = 0;
      const stmt = db.prepare(`
        UPDATE funds SET
          weekly_return = ?,
          daily_return = ?,
          yearly_return = ?,
          concentration = ?,
          cost = ?
        WHERE record_id = ?
      `);

      funds.forEach((fund, index) => {
        const fundData = fundDataMap[fund.name];

        if (fundData) {
          // 从飞书数据获取正确值
          const weeklyIncome = parseNumber(fundData['本周收益']); // 本周收益
          const yearlyIncome = parseNumber(fundData['本年收益']); // 本年收益
          const dailyIncome = parseNumber(fundData['本日盈亏']);   // 本日盈亏
          const cost = parseNumber(fundData['日均资金占用']);      // 成本

          // 按照您的要求重新计算收益率
          const weeklyReturn = cost !== 0 ? weeklyIncome / cost : 0;  // 本周收益率 = 本周收益/成本
          const dailyReturn = cost !== 0 ? dailyIncome / cost : 0;    // 本日收益率 = 本日盈亏/成本
          const yearlyReturn = parseNumber(fundData['本年收益率']);   // 本年收益率直接使用

          const concentration = parseNumber(fundData['集中度']);      // 集中度直接使用

          console.log(`📈 ${fund.name}:`);
          console.log(`   本周收益: ${weeklyIncome.toFixed(2)}, 成本: ${cost.toFixed(2)}, 本周收益率: ${(weeklyReturn * 100).toFixed(3)}%`);
          console.log(`   本日盈亏: ${dailyIncome.toFixed(2)}, 成本: ${cost.toFixed(2)}, 本日收益率: ${(dailyReturn * 100).toFixed(3)}%`);
          console.log(`   本年收益率: ${(yearlyReturn * 100).toFixed(3)}%`);
          console.log(`   集中度: ${(concentration * 100).toFixed(3)}%`);

          // 确保所有数值都是有限的
          const safeWeeklyReturn = isFinite(weeklyReturn) ? weeklyReturn : 0;
          const safeDailyReturn = isFinite(dailyReturn) ? dailyReturn : 0;
          const safeYearlyReturn = isFinite(yearlyReturn) ? yearlyReturn : 0;
          const safeConcentration = isFinite(concentration) ? concentration : 0;
          const safeCost = isFinite(cost) ? cost : 0;

          stmt.run([
            safeWeeklyReturn,
            safeDailyReturn,
            safeYearlyReturn,
            safeConcentration,
            safeCost,
            fund.record_id
          ], (err) => {
            if (err) {
              console.error(`❌ 更新基金 ${fund.name} 失败:`, err.message);
            } else {
              updatedCount++;
            }

            // 最后一条记录处理完成
            if (index === funds.length - 1) {
              stmt.finalize();

              setTimeout(() => {
                console.log(`\n✅ 完成！更新了 ${updatedCount} 条基金的收益率数据`);

                // 验证更新结果
                db.all('SELECT name, weekly_return, daily_return, yearly_return, concentration, cost FROM funds WHERE cost > 0 LIMIT 10', (err, rows) => {
                  if (err) {
                    console.error('❌ 验证失败:', err.message);
                  } else {
                    console.log('\n📋 更新后的收益率数据（前10条）:');
                    rows.forEach(row => {
                      console.log(`- ${row.name}:`);
                      console.log(`  本周收益率: ${(row.weekly_return * 100).toFixed(3)}%, 本日收益率: ${(row.daily_return * 100).toFixed(3)}%, 本年收益率: ${(row.yearly_return * 100).toFixed(3)}%`);
                      console.log(`  集中度: ${(row.concentration * 100).toFixed(3)}%, 成本: ${row.cost.toFixed(2)}`);
                    });
                  }

                  db.close();
                });
              }, 100);
            }
          });
        } else {
          console.log(`⚠️  未找到基金 ${fund.name} 的源数据`);

          // 如果找不到源数据，也要继续处理下一只基金
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

// 运行修复
fixReturnCalculations();