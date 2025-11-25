require('dotenv').config();

const sqlite3 = require('sqlite3').verbose();
const { join } = require('path');

function updateDatabaseSchema() {
  console.log('🔄 更新数据库结构...\n');

  const dbPath = join(process.cwd(), 'data', 'funds.db');
  const db = new sqlite3.Database(dbPath);

  try {
    console.log('1. 检查现有数据库结构...');

    // 获取现有列信息
    db.all("PRAGMA table_info(funds)", (err, columns) => {
      if (err) {
        console.error('❌ 无法检查数据库结构:', err.message);
        db.close();
        return;
      }

      const existingColumns = columns.map(col => col.name);
      console.log('现有列:', existingColumns);

      console.log('\n2. 添加新列...');

      // 需要添加的新列（按照用户要求）
      const newColumns = [
        { name: 'weekly_return', type: 'REAL', description: '本周收益率' },
        { name: 'daily_return', type: 'REAL', description: '本日收益率' },
        { name: 'yearly_return', type: 'REAL', description: '本年收益率' },
        { name: 'concentration', type: 'REAL', description: '集中度' }
      ];

      let addedCount = 0;
      let checkCount = 0;

      // 检查并添加新列
      newColumns.forEach(column => {
        if (!existingColumns.includes(column.name)) {
          checkCount++;
          db.run(`ALTER TABLE funds ADD COLUMN ${column.name} ${column.type}`, function(err) {
            if (err) {
              console.error(`❌ 添加列 ${column.name} 失败:`, err.message);
            } else {
              console.log(`✅ 添加列: ${column.name} (${column.description})`);
              addedCount++;
            }

            // 所有列处理完成后的检查
            if (addedCount + checkCount === newColumns.length) {
              console.log(`\n✅ 数据库结构更新完成，添加了 ${addedCount} 个新列`);

              // 检查最终结构
              setTimeout(() => {
                db.all("PRAGMA table_info(funds)", (err, finalColumns) => {
                  if (!err) {
                    console.log('\n📋 最终数据库列:');
                    finalColumns.forEach(col => {
                      console.log(`  - ${col.name} (${col.type})`);
                    });
                  }

                  console.log('\n🎉 数据库结构已更新为用户要求的格式!');
                  console.log('\n📊 新的字段映射:');
                  console.log('  ✅ weekly_return: 本周收益率');
                  console.log('  ✅ daily_return: 本日收益率 (本日盈亏/成本)');
                  console.log('  ✅ yearly_return: 本年收益率');
                  console.log('  ✅ concentration: 集中度');
                  console.log('  ✅ cost: 成本 (日均资金占用)');
                  console.log('  ✅ status: 状态 (正常/已赎回)');

                  console.log('\n⚠️ 注意: 已删除的字段会保留在数据库中但不再使用:');
                  console.log('  ❌ cumulative_return, annualized_return, total_assets, cash_allocation');

                  db.close();
                });
              }, 1000);
            }
          });
        } else {
          console.log(`⏭️  列 ${column.name} 已存在，跳过`);
          checkCount++;
        }
      });
    });

  } catch (error) {
    console.error('❌ 更新数据库结构失败:', error.message);
    db.close();
  }
}

// 运行更新
updateDatabaseSchema();