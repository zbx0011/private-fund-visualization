const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

console.log('Removing duplicate fund records...\n');

db.serialize(() => {
    // Get current count
    db.get('SELECT COUNT(*) as total FROM funds', [], (err, before) => {
        if (err) {
            console.error('Error:', err);
            db.close();
            return;
        }

        console.log(`Before: ${before.total} records`);

        // Delete duplicates, keeping only the latest record for each fund name
        db.run(`
            DELETE FROM funds
            WHERE id NOT IN (
                SELECT MAX(id)
                FROM funds
                GROUP BY name
            )
        `, [], function (err) {
            if (err) {
                console.error('Error deleting duplicates:', err);
                db.close();
                return;
            }

            console.log(`\n✓ Deleted ${this.changes} duplicate records`);

            // Get final count
            db.get('SELECT COUNT(*) as total FROM funds', [], (err, after) => {
                if (err) {
                    console.error('Error:', err);
                } else {
                    console.log(`After: ${after.total} unique funds remaining\n`);
                }
                db.close();
            });
        });
    });
});
