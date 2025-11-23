const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/funds.db');

// 检查所有策略的分布
db.all(`
  SELECT strategy, COUNT(*) as count
  FROM funds 
  WHERE source_table = 'main'
  GROUP BY strategy
  ORDER BY count DESC
`, (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('策略分布:');
        rows.forEach(row => {
            console.log(`${row.strategy || '(null)'}: ${row.count} 个产品`);
        });
    }
    db.close();
});
