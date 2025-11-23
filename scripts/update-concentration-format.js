require('dotenv').config();

const sqlite3 = require('sqlite3').verbose();
const { join } = require('path');

function updateConcentrationFormat() {
  console.log('🔄 更新集中度格式（转换为百分比）...\n');

  const dbPath = join(process.cwd(), 'data', 'funds.db');
  const db = new sqlite3.Database(dbPath);

  // 查看当前集中度数据
  db.all('SELECT name, concentration FROM funds WHERE concentration IS NOT NULL AND concentration != 0 LIMIT 10', (err, rows) => {
    if (err) {
      console.error('❌ 查询集中度数据失败:', err.message);
      db.close();
      return;
    }

    console.log('📊 当前集中度数据（前10条）:');
    rows.forEach(row => {
      console.log(`- ${row.name}: ${row.concentration} (原始值)`);
    });

    // 更新集中度：将小数形式转换为百分比形式（除以100）
    db.run('UPDATE funds SET concentration = concentration / 100 WHERE concentration > 1', (err) => {
      if (err) {
        console.error('❌ 更新集中度失败:', err.message);
        db.close();
        return;
      }

      console.log(`\n✅ 已更新 ${this.changes} 条记录的集中度格式`);

      // 验证更新结果
      db.all('SELECT name, concentration FROM funds WHERE concentration IS NOT NULL AND concentration != 0 LIMIT 10', (err, updatedRows) => {
        if (err) {
          console.error('❌ 查询更新后数据失败:', err.message);
          db.close();
          return;
        }

        console.log('\n📋 更新后的集中度数据（前10条）:');
        updatedRows.forEach(row => {
          console.log(`- ${row.name}: ${(row.concentration * 100).toFixed(1)}%`);
        });

        db.close();
      });
    });
  });
}

// 运行更新
updateConcentrationFormat();