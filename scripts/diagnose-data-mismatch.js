const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

console.log('检查数据库状态:\n');

// Check funds table
db.get('SELECT COUNT(*) as total FROM funds', [], (err, r1) => {
    if (err) {
        console.error('Error:', err);
        db.close();
        return;
    }

    console.log(`funds 表: ${r1.total} 个基金`);

    // Check fund_nav_history table
    db.get('SELECT COUNT(DISTINCT fund_id) as with_data FROM fund_nav_history', [], (err, r2) => {
        if (err) {
            console.error('Error:', err);
            db.close();
            return;
        }

        console.log(`fund_nav_history 表: ${r2.with_data} 个不同的 fund_id`);

        // Check matching
        db.get(`
            SELECT COUNT(DISTINCT h.fund_id) as matched
            FROM fund_nav_history h
            INNER JOIN funds f ON h.fund_id = f.id
        `, [], (err, r3) => {
            if (err) {
                console.error('Error:', err);
                db.close();
                return;
            }

            console.log(`匹配的基金: ${r3.matched} 个`);
            console.log(`\n问题: fund_nav_history 中有 ${r2.with_data - r3.matched} 个 fund_id 在 funds 表中不存在`);

            // Get sample of unmatched IDs
            db.all(`
                SELECT DISTINCT h.fund_id
                FROM fund_nav_history h
                LEFT JOIN funds f ON h.fund_id = f.id
                WHERE f.id IS NULL
                LIMIT 10
            `, [], (err, unmatched) => {
                if (err) {
                    console.error('Error:', err);
                } else if (unmatched.length > 0) {
                    console.log(`\n不匹配的 fund_id 示例:`);
                    unmatched.forEach(u => console.log(`  - ${u.fund_id}`));
                }

                db.close();
            });
        });
    });
});
