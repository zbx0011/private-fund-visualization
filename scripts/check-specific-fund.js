const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/funds.db');

// 查询"世纪前沿量化优选18号"的策略
db.get('SELECT name, strategy, record_id FROM funds WHERE name LIKE "%世纪前沿量化优选18号%"', (err, row) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('数据库中的记录:');
        console.log(JSON.stringify(row, null, 2));
    }
    db.close();
});
