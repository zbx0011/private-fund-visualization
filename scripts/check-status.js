const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Checking Fund Status ===\n');

db.all(`
  SELECT status, COUNT(*) as count, SUM(daily_pnl) as total_pnl
  FROM funds 
  GROUP BY status
`, (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.table(rows);
    }
    db.close();
});
