const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Checking Sync Progress ===\n');

db.all(`
  SELECT 
    source_table,
    COUNT(*) as count,
    SUM(cost) as total_cost,
    SUM(daily_pnl) as total_daily_pnl
  FROM funds 
  GROUP BY source_table
`, (err, rows) => {
    if (err) {
        console.error('Error:', err);
        db.close();
        return;
    }

    console.log('Funds by Source Table:');
    console.table(rows);

    db.get(`SELECT COUNT(*) as total FROM funds`, (err, row) => {
        if (err) {
            console.error('Error:', err);
            db.close();
            return;
        }
        console.log(`\nTotal funds in database: ${row.total}`);

        if (row.total > 0) {
            db.all(`
        SELECT name, status, cost, daily_pnl, weekly_return, yearly_return, source_table
        FROM funds 
        LIMIT 5
      `, (err, rows) => {
                if (err) {
                    console.error('Error:', err);
                } else {
                    console.log('\nSample Records:');
                    console.table(rows);
                }
                db.close();
            });
        } else {
            console.log('\n⏳ No data yet - sync still in progress...');
            db.close();
        }
    });
});
