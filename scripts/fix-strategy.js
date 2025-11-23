const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

const targetFundName = '世纪前沿量化优选18号';
const correctStrategy = '指增';

db.serialize(() => {
    // Check current value
    db.get('SELECT name, strategy FROM funds WHERE name = ?', [targetFundName], (err, row) => {
        if (err) {
            console.error('Error querying fund:', err);
            return;
        }
        if (!row) {
            console.log(`Fund "${targetFundName}" not found in database.`);
            return;
        }
        console.log(`Current state: Name=${row.name}, Strategy=${row.strategy}`);

        // Update
        if (row.strategy !== correctStrategy) {
            console.log(`Updating strategy to "${correctStrategy}"...`);
            db.run('UPDATE funds SET strategy = ? WHERE name = ?', [correctStrategy, targetFundName], function (err) {
                if (err) {
                    console.error('Error updating strategy:', err);
                    return;
                }
                console.log(`Updated ${this.changes} record(s).`);

                // Verify update
                db.get('SELECT name, strategy FROM funds WHERE name = ?', [targetFundName], (err, row) => {
                    console.log(`New state: Name=${row.name}, Strategy=${row.strategy}`);
                    db.close();
                });
            });
        } else {
            console.log('Strategy is already correct.');
            db.close();
        }
    });
});
