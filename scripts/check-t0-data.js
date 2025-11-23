const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/funds.db');

// 检查T0策略的产品
db.all(`
  SELECT name, strategy, latest_nav_date
  FROM funds 
  WHERE strategy = 'T0'
  ORDER BY name
`, (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('T0策略的产品:');
        console.log(`总共 ${rows.length} 个产品`);
        rows.forEach(row => {
            console.log(`- ${row.name}, 最新净值日期: ${row.latest_nav_date}`);
        });

        // 检查是否有历史数据
        if (rows.length > 0) {
            const fundName = rows[0].name;
            db.all(`
        SELECT nav_date, daily_return, cumulative_nav
        FROM fund_nav_history
        WHERE fund_id = ?
        ORDER BY nav_date DESC
        LIMIT 5
      `, [fundName], (err2, history) => {
                console.log(`\n${fundName} 的历史数据样例:`);
                if (history && history.length > 0) {
                    history.forEach(h => console.log(h));
                } else {
                    console.log('没有历史数据');
                }
                db.close();
            });
        } else {
            db.close();
        }
    }
});
