const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

console.log('=== 数据库当前状态 ===\n');

db.get('SELECT COUNT(*) as total FROM funds', [], (err, r1) => {
    if (err) {
        console.error('Error:', err);
        db.close();
        return;
    }

    console.log(`funds 表: ${r1.total} 个基金`);

    db.get('SELECT COUNT(DISTINCT fund_id) as total FROM fund_nav_history', [], (err, r2) => {
        if (err) {
            console.error('Error:', err);
            db.close();
            return;
        }

        console.log(`fund_nav_history 表: ${r2.total} 个基金有历史数据\n`);

        if (r1.total > 0) {
            console.log('funds 表中的基金示例:');
            db.all('SELECT name, strategy, manager FROM funds LIMIT 10', [], (err, funds) => {
                if (err) {
                    console.error('Error:', err);
                } else {
                    funds.forEach(f => {
                        console.log(`  - ${f.name} (${f.strategy}, ${f.manager})`);
                    });
                }
                db.close();
            });
        } else {
            console.log('⚠️  funds 表是空的!');
            db.close();
        }
    });
});
