
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

db.all("PRAGMA table_info(fund_nav_history)", (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('Schema for fund_nav_history:');
    console.table(rows);
});

db.all("SELECT * FROM fund_nav_history LIMIT 1", (err, rows) => {
    if (err) console.error(err);
    else console.log('Sample row:', rows[0]);
});
