const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'data/funds.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.all("PRAGMA table_info(funds)", (err, rows) => {
        if (err) {
            console.error("Error querying schema:", err);
            return;
        }
        console.log("Funds Table Schema (First 5 columns):", rows.slice(0, 5));
        db.close();
    });
});
