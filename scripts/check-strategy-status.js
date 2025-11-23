require('dotenv').config();

const sqlite3 = require('sqlite3').verbose();
const { join } = require('path');

function checkStrategyAndStatus() {
  console.log('🔍 检查基金策略和状态数据...\n');

  const dbPath = join(process.cwd(), 'data', 'funds.db');
  const db = new sqlite3.Database(dbPath);

  db.all('SELECT name, strategy, status FROM funds WHERE status IS NOT NULL ORDER BY strategy', (err, rows) => {
    if (err) {
      console.error('❌ 查询失败:', err.message);
      db.close();
      return;
    }

    console.log(`📊 找到 ${rows.length} 条有状态信息的记录:\n`);

    // 按策略分组显示
    const strategyGroups = {};
    rows.forEach(row => {
      const strategy = row.strategy || '未分类';
      if (!strategyGroups[strategy]) {
        strategyGroups[strategy] = [];
      }
      strategyGroups[strategy].push(row);
    });

    Object.keys(strategyGroups).sort().forEach(strategy => {
      console.log(`\n📈 ${strategy}:`);
      strategyGroups[strategy].forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.name} - 状态: ${row.status}`);
      });
    });

    // 统计状态分布
    const statusCounts = {};
    rows.forEach(row => {
      const status = row.status || '未知';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('\n📋 状态统计:');
    Object.keys(statusCounts).forEach(status => {
      console.log(`  ${status}: ${statusCounts[status]} 只基金`);
    });

    db.close();
  });
}

checkStrategyAndStatus();