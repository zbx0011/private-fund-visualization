const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Checking Fund Data Columns ===');

db.all("SELECT name, concentration, cost, max_drawdown, sharpe_ratio, volatility FROM funds LIMIT 5", [], (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.table(rows);
});
