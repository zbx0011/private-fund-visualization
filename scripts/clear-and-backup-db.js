const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');

console.log('Creating backup of current database...');
const fs = require('fs');
const backupPath = path.join(__dirname, '..', 'data', `funds.db.backup.${Date.now()}`);
fs.copyFileSync(dbPath, backupPath);
console.log(`Backup created: ${backupPath}`);

const db = new sqlite3.Database(dbPath);

console.log('\n=== Clearing funds table ===');

db.serialize(() => {
    // Clear the funds table
    db.run('DELETE FROM funds', (err) => {
        if (err) {
            console.error('Error clearing funds table:', err);
            db.close();
            return;
        }
        console.log('✓ Funds table cleared');

        // Clear history table
        db.run('DELETE FROM fund_nav_history', (err) => {
            if (err) {
                console.error('Error clearing history table:', err);
                db.close();
                return;
            }
            console.log('✓ History table cleared');

            // Verify
            db.get('SELECT COUNT(*) as count FROM funds', (err, row) => {
                if (err) {
                    console.error('Error:', err);
                } else {
                    console.log(`\nFunds table now has ${row.count} records`);
                }

                db.close();
                console.log('\n✓ Database cleared and ready for re-sync');
                console.log('\nNext step: Run the sync to restore data from Feishu');
            });
        });
    });
});
