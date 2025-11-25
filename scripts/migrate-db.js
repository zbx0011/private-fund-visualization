const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    console.log('Checking for source_table column...');

    db.run("ALTER TABLE funds ADD COLUMN source_table TEXT", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('Column source_table already exists.');
            } else {
                console.error('Error adding column:', err);
            }
        } else {
            console.log('Column source_table added successfully.');
        }
    });
});

db.close();
