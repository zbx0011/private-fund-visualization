const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Fixing Database Schema ===\n');

db.serialize(() => {
    // Check current schema
    db.all("PRAGMA table_info(funds)", (err, columns) => {
        if (err) {
            console.error('Error getting table info:', err);
            db.close();
            return;
        }

        console.log('Current columns:');
        columns.forEach(col => console.log(`  - ${col.name} (${col.type})`));

        const hasColumn = columns.some(col => col.name === 'cumulative_return');

        if (!hasColumn) {
            console.log('\n✓ Adding missing cumulative_return column...');
            db.run('ALTER TABLE funds ADD COLUMN cumulative_return REAL', (err) => {
                if (err) {
                    console.error('Error adding column:', err);
                } else {
                    console.log('✓ cumulative_return column added successfully');
                }
                db.close();
            });
        } else {
            console.log('\n✓ cumulative_return column already exists');
            db.close();
        }
    });
});
