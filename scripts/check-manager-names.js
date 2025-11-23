const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Checking Manager Names ===');

db.all("SELECT manager, COUNT(*) as count FROM funds GROUP BY manager", [], (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.table(rows);

    // Also check total count
    db.get("SELECT COUNT(*) as total FROM funds", [], (err, row) => {
        if (err) console.error(err);
        else console.log(`Total funds: ${row.total}`);
    });
});
