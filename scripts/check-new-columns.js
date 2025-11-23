const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

db.all(`
    SELECT 
        name, 
        daily_capital_usage, 
        weekly_pnl, 
        yearly_pnl 
    FROM funds 
    WHERE source_table = 'main' 
    LIMIT 10
`, (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('Sample Data (New Columns):');
    console.table(rows);

    // Check sums
    db.get(`
        SELECT 
            SUM(daily_capital_usage) as total_daily_capital_usage,
            SUM(weekly_pnl) as total_weekly_pnl,
            SUM(yearly_pnl) as total_yearly_pnl
        FROM funds
        WHERE source_table = 'main'
    `, (err, result) => {
        console.log('Sums (Main):', result);
        db.close();
    });
});
