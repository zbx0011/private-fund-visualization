const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    console.log('--- Checking daily_pnl in funds table ---');

    // Check for non-zero daily_pnl
    db.all("SELECT count(*) as count FROM funds WHERE daily_pnl != 0", (err, rows) => {
        if (err) console.error(err);
        else console.log(`Funds with non-zero daily_pnl: ${rows[0].count}`);
    });

    // Sample data
    db.all("SELECT name, daily_pnl, source_table FROM funds WHERE daily_pnl != 0 LIMIT 5", (err, rows) => {
        if (err) console.error(err);
        else {
            console.log('\n--- Sample Data with daily_pnl ---');
            rows.forEach(row => {
                console.log(`Name: ${row.name}, Daily PnL: ${row.daily_pnl}, Source: ${row.source_table}`);
            });
        }
    });

    // Check total daily_pnl
    db.all("SELECT sum(daily_pnl) as total_pnl FROM funds WHERE source_table = 'main'", (err, rows) => {
        if (err) console.error(err);
        else console.log(`\nTotal Daily PnL (Main): ${rows[0].total_pnl}`);
    });
});

db.close();
