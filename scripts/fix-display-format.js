require('dotenv').config();

const sqlite3 = require('sqlite3').verbose();
const { join } = require('path');

function fixDisplayFormat() {
  console.log('🔧 修复显示格式（收益率数据乘以100）...\n');

  const dbPath = join(process.cwd(), 'data', 'funds.db');
  const db = new sqlite3.Database(dbPath);

  // 更新收益率数据，乘以100以显示正确的百分比
  db.run('UPDATE funds SET weekly_return = weekly_return * 100', (err) => {
    if (err) {
      console.error('❌ 更新本周收益率失败:', err.message);
      db.close();
      return;
    }

    console.log(`✅ 更新了 ${this.changes} 条记录的本周收益率`);

    db.run('UPDATE funds SET daily_return = daily_return * 100', (err) => {
      if (err) {
        console.error('❌ 更新本日收益率失败:', err.message);
        db.close();
        return;
      }

      console.log(`✅ 更新了 ${this.changes} 条记录的本日收益率`);

      db.run('UPDATE funds SET yearly_return = yearly_return * 100', (err) => {
        if (err) {
          console.error('❌ 更新本年收益率失败:', err.message);
          db.close();
          return;
        }

        console.log(`✅ 更新了 ${this.changes} 条记录的本年收益率`);

        db.run('UPDATE funds SET concentration = concentration * 100', (err) => {
          if (err) {
            console.error('❌ 更新集中度失败:', err.message);
            db.close();
            return;
          }

          console.log(`✅ 更新了 ${this.changes} 条记录的集中度`);

          console.log('\n🔍 验证更新结果:');

          // 验证更新结果
          db.all('SELECT name, weekly_return, daily_return, yearly_return, concentration, cost FROM funds WHERE cost > 0 LIMIT 10', (err, rows) => {
            if (err) {
              console.error('❌ 验证失败:', err.message);
              db.close();
              return;
            }

            console.log('\n📋 更新后的显示格式（前10条）:');
            rows.forEach(row => {
              console.log(`- ${row.name}:`);
              console.log(`  本周收益率: ${row.weekly_return.toFixed(3)}%, 本日收益率: ${row.daily_return.toFixed(3)}%, 本年收益率: ${row.yearly_return.toFixed(3)}%`);
              console.log(`  集中度: ${row.concentration.toFixed(3)}%, 成本: ${row.cost.toFixed(2)}`);
            });

            console.log('\n✅ 显示格式修复完成！现在收益率以百分比形式正确显示。');
            db.close();
          });
        });
      });
    });
  });
}

// 运行修复
fixDisplayFormat();