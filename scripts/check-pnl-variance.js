
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT fund_id, nav_date, daily_pnl FROM fund_nav_history WHERE fund_id IN (SELECT fund_id FROM fund_nav_history GROUP BY fund_id ORDER BY COUNT(*) DESC LIMIT 1) ORDER BY nav_date DESC LIMIT 10", (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('Daily PnL for a sample fund:');
    console.table(rows);
});
