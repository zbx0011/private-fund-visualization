require('dotenv').config();

const sqlite3 = require('sqlite3').verbose();
const { join } = require('path');

function checkDatabaseColumns() {
  console.log('🔍 检查数据库列结构...\n');

  const dbPath = join(process.cwd(), 'data', 'funds.db');
  const db = new sqlite3.Database(dbPath);

  // 检查funds表的列结构
  db.all("PRAGMA table_info(funds)", (err, columns) => {
    if (err) {
      console.error('❌ 检查失败:', err.message);
      db.close();
      return;
    }

    console.log('📊 funds表的列结构:');
    columns.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} (默认值: ${col.default_value})`);
    });

    // 检查是否还有旧字段
    const columnNames = columns.map(col => col.name);
    const unwantedColumns = ['cumulative_return', 'annualized_return', 'total_assets', 'cash_allocation'];
    const foundUnwanted = unwantedColumns.filter(col => columnNames.includes(col));

    if (foundUnwanted.length > 0) {
      console.log('\n❌ 发现不需要的旧字段:', foundUnwanted);
    } else {
      console.log('\n✅ 没有发现不需要的旧字段');
    }

    // 检查新字段是否存在
    const requiredColumns = ['weekly_return', 'daily_return', 'yearly_return', 'concentration', 'cost'];
    const missingRequired = requiredColumns.filter(col => !columnNames.includes(col));

    if (missingRequired.length > 0) {
      console.log('❌ 缺少需要的新字段:', missingRequired);
    } else {
      console.log('✅ 所有需要的新字段都存在');
    }

    // 检查数据数量
    db.get('SELECT COUNT(*) as count FROM funds', (err, row) => {
      if (err) {
        console.error('❌ 统计数据失败:', err.message);
      } else {
        console.log(`\n📈 数据库中有 ${row.count} 条记录`);
      }

      // 检查一些示例数据
      db.all('SELECT name, weekly_return, daily_return, yearly_return, concentration, cost, status FROM funds LIMIT 3', (err, rows) => {
        if (err) {
          console.error('❌ 查询示例数据失败:', err.message);
        } else {
          console.log('\n📋 示例数据:');
          rows.forEach(row => {
            console.log(`- ${row.name}: weekly_return=${row.weekly_return}, daily_return=${row.daily_return}, yearly_return=${row.yearly_return}, concentration=${row.concentration}, cost=${row.cost}, status=${row.status}`);
          });
        }

        db.close();
      });
    });
  });
}

// 运行检查
checkDatabaseColumns();