const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

db.all(`
    SELECT 
        name, 
        total_assets, 
        daily_pnl, 
        weekly_return, 
        yearly_return,
        status
    FROM funds 
    WHERE source_table = 'main' 
    LIMIT 10
`, (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('Sample Data (Main):');
    console.table(rows);

    // Check sums
    db.get(`
        SELECT 
            SUM(total_assets) as total_assets,
            SUM(daily_pnl) as total_daily_pnl
        FROM funds
        WHERE source_table = 'main' AND status = '正常'
    `, (err, result) => {
        console.log('Sums (Main, Normal Status):', result);
        db.close();
    });
});
