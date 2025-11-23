require('dotenv').config();

const sqlite3 = require('sqlite3').verbose();
const { join } = require('path');

function checkDataQuality() {
  console.log('🔍 检查数据质量...\n');

  const dbPath = join(process.cwd(), 'data', 'funds.db');
  const db = new sqlite3.Database(dbPath);

  try {
    // 检查投资经理数据
    console.log('=== 投资经理数据检查 ===');
    db.all("SELECT name, manager FROM funds WHERE manager IS NOT NULL AND manager != '未知' LIMIT 10", (err, results) => {
      if (err) {
        console.log('❌ 无法查询投资经理数据:', err.message);
      } else {
        if (results.length === 0) {
          console.log('⚠️  没有找到有效的投资经理数据');
        } else {
          results.forEach((fund, index) => {
            console.log(`${index + 1}. ${fund.name} - ${fund.manager}`);
          });
        }
      }

      // 检查财务数据
      console.log('\n=== 财务数据检查 ===');
      db.all("SELECT name, weekly_return, daily_return, annualized_return, cost FROM funds WHERE weekly_return IS NOT NULL OR daily_return IS NOT NULL OR annualized_return IS NOT NULL LIMIT 10", (err, results) => {
        if (err) {
          console.log('❌ 无法查询财务数据:', err.message);
        } else {
          if (results.length === 0) {
            console.log('⚠️  没有找到有效的财务数据');
          } else {
            results.forEach((fund, index) => {
              console.log(`${index + 1}. ${fund.name}`);
              console.log(`   本周收益率: ${fund.weekly_return || 'N/A'}`);
              console.log(`   日收益率: ${fund.daily_return || 'N/A'}`);
              console.log(`   年化收益率: ${fund.annualized_return || 'N/A'}`);
              console.log(`   成本: ${fund.cost || 'N/A'}`);
              console.log('');
            });
          }
        }

        // 检查数据源分布
        console.log('=== 数据源详细分布 ===');
        db.all(`SELECT source_table, COUNT(*) as count,
                       COUNT(CASE WHEN manager IS NOT NULL AND manager != '未知' THEN 1 END) as with_manager,
                       COUNT(CASE WHEN weekly_return IS NOT NULL THEN 1 END) as with_weekly_return,
                       COUNT(CASE WHEN daily_return IS NOT NULL THEN 1 END) as with_daily_return
                FROM funds GROUP BY source_table`, (err, results) => {
          if (err) {
            console.log('❌ 无法统计数据源:', err.message);
          } else {
            results.forEach(row => {
              const sourceName = row.source_table === 'main' ? '主数据源' :
                               row.source_table === 'fof' ? 'FOF数据源' :
                               row.source_table || '未知数据源';
              console.log(`- ${sourceName}: ${row.count} 条记录`);
              console.log(`  - 有投资经理: ${row.with_manager} 条`);
              console.log(`  - 有本周收益率: ${row.with_weekly_return} 条`);
              console.log(`  - 有日收益率: ${row.with_daily_return} 条`);
              console.log('');
            });
          }

          console.log('✅ 数据质量检查完成');
          db.close();
        });
      });
    });

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    db.close();
  }
}

// 运行检查
checkDataQuality();