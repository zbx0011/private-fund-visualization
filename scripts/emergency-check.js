const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

console.log('=== 紧急检查数据状态 ===\n');

// 检查历史数据
db.all(`SELECT COUNT(*) as count FROM fund_nav_history`, (err, result) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    console.log('fund_nav_history 记录数:', result[0].count);

    // 检查集中度
    db.all(`
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN concentration IS NOT NULL AND concentration != 0 THEN 1 END) as with_concentration
        FROM funds
        WHERE source_table = 'main'
    `, (err2, result2) => {
        if (err2) {
            console.error('Error:', err2);
            return;
        }
        console.log('\n集中度状态:', result2[0]);

        // 检查几个基金的集中度值
        db.all(`
            SELECT name, concentration, weekly_return, yearly_return
            FROM funds
            WHERE source_table = 'main'
            ORDER BY name
            LIMIT 10
        `, (err3, funds) => {
            if (err3) {
                console.error('Error:', err3);
                return;
            }
            console.log('\n样本数据:');
            console.table(funds);
            db.close();
        });
    });
});
