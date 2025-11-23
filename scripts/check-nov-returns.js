const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/funds.db');

// 检查某个基金在不同日期的本年收益率
db.all(`
  SELECT nav_date, daily_return, cumulative_nav
  FROM fund_nav_history
  WHERE fund_id LIKE '%量化%'
  AND nav_date >= '2025-11-01'
  ORDER BY nav_date DESC
  LIMIT 10
`, (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('11月份的本年收益率数据:');
        rows.forEach(row => {
            console.log(`${row.nav_date}: 本年收益率=${(row.daily_return * 100).toFixed(2)}%, 累计净值=${row.cumulative_nav}`);
        });
    }
    db.close();
});
