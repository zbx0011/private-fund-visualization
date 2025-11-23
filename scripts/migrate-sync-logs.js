const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    console.log('Checking for records_inserted column in sync_logs...');

    db.run("ALTER TABLE sync_logs ADD COLUMN records_inserted INTEGER DEFAULT 0", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('Column records_inserted already exists.');
            } else {
                console.error('Error adding column:', err);
            }
        } else {
            console.log('Column records_inserted added successfully.');
        }
    });
});

db.close();
