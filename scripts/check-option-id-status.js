const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Checking Funds with optFl1SLci Status ===\n');

db.all(`
  SELECT name, status, daily_pnl, yearly_return, concentration
  FROM funds
  WHERE status = 'optFl1SLci'
  LIMIT 15
`, (err, rows) => {
    if (err) {
        console.error('Error:', err);
        return;
    }

    console.table(rows);
    db.close();
});
