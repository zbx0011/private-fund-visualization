const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

db.all('SELECT * FROM external_monitor LIMIT 1', (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Monitor Data Sample:', rows[0]);
    }
    db.close();
});
