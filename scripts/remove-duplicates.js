
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

const idsToDelete = [
    'recv2XOIANHKUB', // 兆信复合套利金手套九号 (manager: 未知)
    'recv2XOIANVE76'  // 敦和芝诺量化CTA1号 (manager: 未知)
];

db.serialize(() => {
    console.log(`Deleting ${idsToDelete.length} duplicate records...`);

    const placeholders = idsToDelete.map(() => '?').join(',');
    const sql = `DELETE FROM funds WHERE id IN (${placeholders})`;

    db.run(sql, idsToDelete, function (err) {
        if (err) {
            console.error('Error deleting records:', err);
        } else {
            console.log(`Successfully deleted ${this.changes} records.`);
        }
    });

    // Verify count
    db.get('SELECT COUNT(*) as total FROM funds', (err, row) => {
        if (err) console.error(err);
        else console.log(`Total records remaining in funds table: ${row.total}`);
    });
});

db.close();
