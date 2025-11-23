const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/funds.db');

// 检查历史数据中有哪些字段
db.get(`
  SELECT * FROM fund_nav_history 
  WHERE fund_id LIKE '%世纪前沿量化优选18号%' 
  LIMIT 1
`, (err, row) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('历史数据字段:');
        console.log(JSON.stringify(row, null, 2));
    }
    db.close();
});
