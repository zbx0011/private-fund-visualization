
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.get("SELECT COUNT(*) as total FROM funds", (err, row) => {
        console.log('Total funds in `funds` table:', row.total);
    });

    db.get("SELECT COUNT(DISTINCT fund_id) as history_funds FROM fund_nav_history", (err, row) => {
        console.log('Funds with history in `fund_nav_history`:', row.history_funds);
    });

    // Check for funds in funds table but NOT in history
    db.all("SELECT name FROM funds WHERE name NOT IN (SELECT DISTINCT fund_id FROM fund_nav_history) LIMIT 10", (err, rows) => {
        console.log('Sample funds MISSING from history:', rows.map(r => r.name));
    });
});

db.close();
