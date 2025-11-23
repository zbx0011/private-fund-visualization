const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

console.log('Removing funds without historical data...\n');

db.serialize(() => {
    // First, get the list of fund names that HAVE data
    db.all(`
        SELECT DISTINCT fund_id as name
        FROM fund_nav_history
    `, [], (err, fundsWithData) => {
        if (err) {
            console.error('Error getting funds with data:', err);
            db.close();
            return;
        }

        console.log(`Found ${fundsWithData.length} funds WITH historical data.`);

        const namesWithData = fundsWithData.map(f => f.name);

        // Count how many funds will be deleted
        db.get(`
            SELECT COUNT(*) as count
            FROM funds
            WHERE name NOT IN (${namesWithData.map(() => '?').join(',')})
        `, namesWithData, (err, result) => {
            if (err) {
                console.error('Error counting funds to delete:', err);
                db.close();
                return;
            }

            const toDelete = result.count;
            console.log(`Will delete ${toDelete} funds WITHOUT historical data.`);
            console.log(`Will keep ${fundsWithData.length} funds WITH historical data.\n`);

            if (toDelete === 0) {
                console.log('No funds to delete.');
                db.close();
                return;
            }

            // Delete funds that don't have historical data
            db.run(`
                DELETE FROM funds
                WHERE name NOT IN (${namesWithData.map(() => '?').join(',')})
            `, namesWithData, function (err) {
                if (err) {
                    console.error('Error deleting funds:', err);
                    db.close();
                    return;
                }

                console.log(`✓ Successfully deleted ${this.changes} funds without historical data.`);

                // Verify final count
                db.get('SELECT COUNT(*) as total FROM funds', [], (err, final) => {
                    if (err) {
                        console.error('Error getting final count:', err);
                    } else {
                        console.log(`\n✓ Final count: ${final.total} funds remaining in database.`);
                    }
                    db.close();
                });
            });
        });
    });
});
