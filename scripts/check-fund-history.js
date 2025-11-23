const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

const targetName = '因诺信诺天问16号';

db.all(`
    SELECT nav_date, cumulative_nav, unit_nav
    FROM fund_nav_history 
    WHERE fund_id = ?
    ORDER BY nav_date ASC
`, [targetName], (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(`History for ${targetName}:`);
    console.table(rows);
    db.close();
});
