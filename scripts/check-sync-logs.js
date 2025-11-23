const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    db.all("SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 5", (err, rows) => {
        if (err) console.error(err);
        else {
            console.log('--- Recent Sync Logs ---');
            rows.forEach(row => {
                console.log(`Type: ${row.sync_type}, Status: ${row.status}, Time: ${row.created_at}`);
                if (row.error_message) console.log(`Error: ${row.error_message}`);
            });
        }
    });
});

db.close();
