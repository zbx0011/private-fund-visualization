const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/funds.db');

console.log('Adding annualized_return column to funds table...\n');

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    // Check if column exists
    db.all("PRAGMA table_info(funds)", (err, columns) => {
        if (err) {
            console.error('Error checking table schema:', err);
            db.close();
            return;
        }

        const hasColumn = columns.some(col => col.name === 'annualized_return');

        if (hasColumn) {
            console.log('✓ Column annualized_return already exists');
            db.close();
        } else {
            console.log('Adding annualized_return column...');
            db.run('ALTER TABLE funds ADD COLUMN annualized_return REAL DEFAULT 0', (err) => {
                if (err) {
                    console.error('Error adding column:', err);
                } else {
                    console.log('✓ Column added successfully');
                }
                db.close();
            });
        }
    });
});
