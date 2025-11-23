const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Adding All Missing Columns ===\n');

const missingColumns = [
    { name: 'total_assets', type: 'REAL' },
    { name: 'standing_assets', type: 'REAL' },
    { name: 'cash_allocation', type: 'REAL' }
];

db.serialize(() => {
    db.all("PRAGMA table_info(funds)", (err, columns) => {
        if (err) {
            console.error('Error:', err);
            db.close();
            return;
        }

        const existingColumns = columns.map(col => col.name);
        console.log('Existing columns:', existingColumns.join(', '));

        let added = 0;
        let toAdd = 0;

        missingColumns.forEach(col => {
            if (!existingColumns.includes(col.name)) {
                toAdd++;
                console.log(`\n✓ Adding ${col.name} (${col.type})...`);
                db.run(`ALTER TABLE funds ADD COLUMN ${col.name} ${col.type}`, (err) => {
                    if (err) {
                        console.error(`  Error adding ${col.name}:`, err);
                    } else {
                        console.log(`  ✓ ${col.name} added successfully`);
                        added++;

                        if (added === toAdd) {
                            console.log(`\n✓ All ${added} missing columns added`);
                            db.close();
                        }
                    }
                });
            } else {
                console.log(`✓ ${col.name} already exists`);
            }
        });

        if (toAdd === 0) {
            console.log('\n✓ All columns already exist');
            db.close();
        }
    });
});
