
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

const fundName = '量创全天候元语1号';

db.serialize(() => {
    console.log(`Checking dates for fund: ${fundName}`);

    // Check funds table
    db.get('SELECT id, name, latest_nav_date FROM funds WHERE name = ?', [fundName], (err, row) => {
        if (err) console.error('Error querying funds table:', err);
        else {
            console.log('Funds Table Record:', row);
        }
    });

    // Check fund_nav_history table
    db.all('SELECT nav_date, unit_nav, cumulative_nav FROM fund_nav_history WHERE fund_id = ? ORDER BY nav_date DESC LIMIT 5', [fundName], (err, rows) => {
        if (err) console.error('Error querying history table:', err);
        else {
            console.log('History Table Records (Top 5):');
            console.table(rows);
        }
    });
});

setTimeout(() => db.close(), 2000);
