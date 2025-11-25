const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.all("SELECT DISTINCT fund_id FROM fund_nav_history LIMIT 10", (err, rows) => {
        if (err) console.error(err);
        else {
            console.log("Distinct fund_ids in history:", rows);
        }
        db.close();
    });
});
