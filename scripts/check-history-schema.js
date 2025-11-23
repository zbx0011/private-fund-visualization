const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(DB_PATH);

console.log('Checking available fields in fund_nav_history...\n');

db.all("PRAGMA table_info(fund_nav_history)", (err, columns) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Columns in fund_nav_history:');
        columns.forEach(col => {
            console.log(`  ${col.name} (${col.type})`);
        });
    }

    // Also get a sample record
    db.all(`
        SELECT * FROM fund_nav_history
        WHERE fund_id = '黑翼恒享CTA-T8号'
        LIMIT 1
    `, (err, rows) => {
        if (err) {
            console.error('Error:', err);
        } else if (rows.length > 0) {
            console.log('\nSample record:');
            console.log(JSON.stringify(rows[0], null, 2));
        }

        db.close();
    });
});
