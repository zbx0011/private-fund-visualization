
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('Checking for duplicate fund names...');

    db.all(`
    SELECT name, COUNT(*) as count 
    FROM funds 
    GROUP BY name 
    HAVING count > 1
  `, (err, rows) => {
        if (err) {
            console.error('Error querying duplicates:', err);
            return;
        }

        if (rows.length === 0) {
            console.log('No duplicates found based on name.');
        } else {
            console.log(`Found ${rows.length} funds with duplicates:`);
            rows.forEach(row => {
                console.log(`- ${row.name} (${row.count} records)`);

                // Get details for these duplicates
                db.all(`SELECT id, name, manager, record_id FROM funds WHERE name = ?`, [row.name], (err, details) => {
                    if (err) console.error(err);
                    else {
                        console.log('  Details:', details);
                    }
                });
            });
        }
    });

    // Also count total records
    db.get('SELECT COUNT(*) as total FROM funds', (err, row) => {
        if (err) console.error(err);
        else console.log(`Total records in funds table: ${row.total}`);
    });
});

// db.close() will be called after queries finish due to event loop, but explicit close is better if serialized properly. 
// For this simple script, letting it exit is fine, but let's be clean.
setTimeout(() => db.close(), 2000);
