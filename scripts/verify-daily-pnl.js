
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT * FROM fund_nav_history WHERE daily_pnl IS NOT NULL LIMIT 5", (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('Records with daily_pnl:');
    console.table(rows);
});

db.all("SELECT COUNT(*) as count FROM fund_nav_history WHERE daily_pnl IS NOT NULL", (err, rows) => {
    if (err) console.error(err);
    else console.log('Total records with daily_pnl:', rows[0].count);
});
