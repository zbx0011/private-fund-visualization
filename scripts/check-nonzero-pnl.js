
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

db.get("SELECT COUNT(*) as count FROM fund_nav_history WHERE daily_pnl != 0", (err, row) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('Count of non-zero daily_pnl records:', row.count);
});

db.all("SELECT * FROM fund_nav_history WHERE daily_pnl != 0 LIMIT 5", (err, rows) => {
    if (err) return;
    console.log('Sample non-zero records:', rows);
});
