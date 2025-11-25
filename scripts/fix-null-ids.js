const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new Database(dbPath);

console.log('Fixing null IDs...');

const funds = db.prepare('SELECT rowid, record_id, name FROM funds WHERE id IS NULL').all();

console.log(`Found ${funds.length} funds with null ID.`);

const updateStmt = db.prepare('UPDATE funds SET id = ? WHERE rowid = ?');

let fixed = 0;
funds.forEach(fund => {
    if (fund.record_id) {
        try {
            updateStmt.run(fund.record_id, fund.rowid);
            console.log(`Fixed fund: ${fund.name} (rowid: ${fund.rowid}) -> id: ${fund.record_id}`);
            fixed++;
        } catch (e) {
            console.error(`Failed to fix ${fund.name}: ${e.message}`);
            // If duplicate id, maybe generate a new one?
            if (e.message.includes('UNIQUE constraint failed')) {
                const newId = fund.record_id + '_' + Date.now();
                updateStmt.run(newId, fund.rowid);
                console.log(`Fixed fund with new ID: ${fund.name} -> id: ${newId}`);
                fixed++;
            }
        }
    } else {
        console.log(`Skipping ${fund.name} (no record_id)`);
    }
});

console.log(`Fixed ${fixed} records.`);
