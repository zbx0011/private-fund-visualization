const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

db.all(`SELECT source_table, COUNT(*) as count FROM funds GROUP BY source_table`, (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('Source Table Distribution:');
    console.table(rows);
    db.close();
});
