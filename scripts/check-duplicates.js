
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT fund_id, nav_date, COUNT(*) as count FROM fund_nav_history GROUP BY fund_id, nav_date HAVING count > 1 ORDER BY count DESC LIMIT 20", (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('Duplicates in fund_nav_history:');
    console.table(rows);
});
