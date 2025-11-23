const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

console.log('funds 表结构:\n');

db.all('PRAGMA table_info(funds)', [], (err, cols) => {
    if (err) {
        console.error('Error:', err);
        db.close();
        return;
    }

    console.log('列名:');
    cols.forEach(c => {
        console.log(`  - ${c.name} (${c.type})`);
    });

    db.close();
});
