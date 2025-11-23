const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Checking Status Values in DB ===\n');

db.all(`
  SELECT name, status, daily_pnl, weekly_return, yearly_return, cost, concentration
  FROM funds
  WHERE source_table = 'main'
  LIMIT 10
`, (err, rows) => {
    if (err) {
        console.error('Error:', err);
        return;
    }

    console.log('Sample Records:');
    console.table(rows);

    db.all(`
      SELECT status, COUNT(*) as count
      FROM funds
      WHERE source_table = 'main'
      GROUP BY status
    `, (err2, statusCounts) => {
        if (err2) {
            console.error('Error:', err2);
            return;
        }

        console.log('\nStatus Distribution:');
        console.table(statusCounts);

        db.close();
    });
});
