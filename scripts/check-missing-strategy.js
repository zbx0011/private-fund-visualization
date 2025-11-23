const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT DISTINCT strategy FROM funds", [], (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log("All Strategies:", JSON.stringify(rows.map(r => r.strategy), null, 2));

    // Check specifically for the one user mentioned
    const missing = rows.find(r => r.strategy && r.strategy.includes('择时'));
    console.log("Found '择时' related:", missing);

    db.close();
});
