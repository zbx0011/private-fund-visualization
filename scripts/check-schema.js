const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'data/funds.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Get table schema
    console.log('=== FUNDS TABLE SCHEMA ===');
    db.all(`PRAGMA table_info(funds)`, [], (err, rows) => {
        if (err) console.error(err);
        else console.table(rows);
    });

    // Get data for永利6号
    console.log('\n=== 永利6号 RECORD ===');
    db.all(`SELECT * FROM funds WHERE name = '永利6号'`, [], (err, rows) => {
        if (err) console.error(err);
        else {
            console.table(rows);
            if (rows.length > 0) {
                console.log('\nColumn names:', Object.keys(rows[0]));
            }
        }
        db.close();
    });
});
