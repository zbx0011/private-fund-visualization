const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

db.all(`
    SELECT fund_id, nav_date, cumulative_nav 
    FROM fund_nav_history 
    LIMIT 5
`, (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('History Sample:');
    console.table(rows);
    db.close();
});
