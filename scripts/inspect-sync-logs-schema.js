const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    db.all("PRAGMA table_info(sync_logs)", (err, rows) => {
        if (err) console.error(err);
        else {
            console.log('--- sync_logs Schema ---');
            rows.forEach(row => {
                console.log(`Column: ${row.name}, Type: ${row.type}`);
            });
        }
    });
});

db.close();
