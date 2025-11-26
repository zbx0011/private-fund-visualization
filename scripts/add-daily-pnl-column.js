
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("ALTER TABLE fund_nav_history ADD COLUMN daily_pnl REAL", (err) => {
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
