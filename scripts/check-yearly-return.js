const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

db.all(`SELECT name, yearly_return, latest_nav_date FROM funds WHERE name LIKE '%平方和%' LIMIT 5`, (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Sample Funds:', rows);
        if (rows.length > 0) {
            console.log('Type of yearly_return:', typeof rows[0].yearly_return);
        }
    }
    db.close();
});
