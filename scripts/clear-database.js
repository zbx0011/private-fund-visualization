require('dotenv').config();

const sqlite3 = require('sqlite3').verbose();
const { join } = require('path');

function clearDatabase() {
  console.log('🗑️  清空数据库...\n');

  const dbPath = join(process.cwd(), 'data', 'funds.db');
  const db = new sqlite3.Database(dbPath);

  try {
    // 删除所有记录
    console.log('删除所有基金记录...');
    db.run('DELETE FROM funds', function(err) {
      if (err) {
        console.error('❌ 删除记录失败:', err.message);
        db.close();
        return;
      }

      console.log(`✅ 已删除 ${this.changes} 条记录`);

      // 重置自增ID
      console.log('重置自增ID...');
      db.run('DELETE FROM sqlite_sequence WHERE name = "funds"', function(err) {
        if (err) {
          console.error('❌ 重置ID失败:', err.message);
        } else {
          console.log('✅ 已重置自增ID');
        }

        // 检查剩余记录数
        db.get('SELECT COUNT(*) as count FROM funds', (err, row) => {
          if (err) {
            console.error('❌ 检查记录数失败:', err.message);
          } else {
            console.log(`\n当前数据库记录数: ${row.count}`);
          }

          console.log('\n✅ 数据库清空完成');
          db.close();
        });
      });
    });

  } catch (error) {
    console.error('❌ 清空数据库失败:', error.message);
    db.close();
  }
}

// 运行清空
clearDatabase();