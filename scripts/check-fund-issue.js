const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

const fundName = '因诺信诺天问16号';

db.serialize(() => {
    db.get('SELECT * FROM funds WHERE name = ?', [fundName], (err, fund) => {
        if (err) console.error(err);
        else console.log('Fund Info:', fund);
    });

    db.all('SELECT * FROM fund_nav_history WHERE fund_id = ? ORDER BY nav_date ASC', [fundName], (err, rows) => {
        if (err) console.error(err);
        else {
            console.log(`History count: ${rows.length}`);
            if (rows.length > 0) {
                console.log('First:', rows[0]);
                console.log('Last:', rows[rows.length - 1]);
                // Show a few rows around June
                const juneRows = rows.filter(r => r.nav_date.includes('2025-06'));
                console.log('June Rows:', juneRows);
            }
        }
    });
});

setTimeout(() => db.close(), 2000);
