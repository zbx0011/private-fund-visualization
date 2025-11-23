const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT name, strategy FROM funds WHERE name LIKE '%T0%' OR strategy LIKE '%T0%'", [], (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(JSON.stringify(rows, null, 2));
    db.close();
});
