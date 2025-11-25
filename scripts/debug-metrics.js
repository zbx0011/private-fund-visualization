const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

db.all(`
    SELECT 
        name,
        cost,
        total_assets,
        scale,
        daily_pnl,
        daily_capital_usage,
        weekly_pnl,
        yearly_pnl,
        source_table,
        status
    FROM funds 
    WHERE source_table IN ('main', 'merged')
    ORDER BY cost DESC
    LIMIT 20
`, (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }

    console.log('Top 20 Funds by Cost:');
    console.table(rows);

    // Calculate sums
    db.all(`
        SELECT 
            SUM(cost) as sum_cost,
            SUM(total_assets) as sum_total_assets,
            SUM(scale) as sum_scale,
            SUM(daily_pnl) as sum_daily_pnl,
            COUNT(*) as count
        FROM funds 
        WHERE source_table IN ('main', 'merged')
    `, (err, result) => {
        console.log('\n=== Sums ===');
        console.table(result);

        // Check which field should be used for "总规模"
        console.log('\n=== Analysis ===');
        console.log('用户期望的总规模应该是 total_assets 或 scale 的总和，而不是 cost');
        console.log('cost 字段可能是日均资金占用，不应该用于总规模计算');

        db.close();
    });
});
