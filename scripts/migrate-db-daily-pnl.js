const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    console.log('Checking for daily_pnl column...');

    db.run("ALTER TABLE funds ADD COLUMN daily_pnl REAL DEFAULT 0", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('Column daily_pnl already exists.');
            } else {
                console.error('Error adding column:', err);
            }
        } else {
            console.log('Column daily_pnl added successfully.');
        }
    });
});

db.close();
