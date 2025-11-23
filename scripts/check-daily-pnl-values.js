const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

db.all(`
    SELECT 
        name,
        daily_pnl,
        source_table
    FROM funds 
    WHERE source_table = 'main'
    ORDER BY ABS(daily_pnl) DESC
    LIMIT 10
`, (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }

    console.log('Top 10 Funds by Absolute Daily PnL:');
    console.table(rows);

    db.close();
});
