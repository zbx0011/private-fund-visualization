const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

console.log('Deleting funds with no historical data...\n');

db.serialize(() => {
    // First, get the count
    db.get(`
        SELECT COUNT(*) as count
        FROM funds f
        LEFT JOIN fund_nav_history h ON f.id = h.fund_id
        WHERE h.fund_id IS NULL
    `, [], (err, result) => {
        if (err) {
            console.error('Error counting funds:', err);
            db.close();
            return;
        }

        const count = result.count;
        console.log(`Found ${count} funds with no historical data.`);

        if (count === 0) {
            console.log('No funds to delete.');
            db.close();
            return;
        }

        // Delete the funds
        db.run(`
            DELETE FROM funds
            WHERE id IN (
                SELECT f.id
                FROM funds f
                LEFT JOIN fund_nav_history h ON f.id = h.fund_id
                WHERE h.fund_id IS NULL
            )
        `, [], function (err) {
            if (err) {
                console.error('Error deleting funds:', err);
                db.close();
                return;
            }

            console.log(`\n✓ Successfully deleted ${this.changes} funds with no historical data.`);
            db.close();
        });
    });
});
