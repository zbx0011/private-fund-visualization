const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/funds.db');

// 检查历史数据的日期格式和字段
db.all(`
  SELECT fund_id, nav_date, daily_return, cumulative_nav
  FROM fund_nav_history 
  WHERE fund_id LIKE '%世纪前沿%'
  AND nav_date >= '2025-01-01'
  ORDER BY nav_date DESC
  LIMIT 5
`, (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('历史数据样例:');
        rows.forEach(row => {
            console.log(JSON.stringify(row));
        });
    }
    db.close();
});
