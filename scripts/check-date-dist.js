
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT nav_date, COUNT(*) as count, COUNT(daily_pnl) as pnl_count FROM fund_nav_history GROUP BY nav_date ORDER BY nav_date DESC LIMIT 20", (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('Date Distribution in fund_nav_history:');
    console.table(rows);
});
