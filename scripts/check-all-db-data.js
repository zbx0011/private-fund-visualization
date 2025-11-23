const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Checking ALL Database Data ===\n');

// Check all source tables
db.all(`
  SELECT 
    source_table,
    COUNT(*) as count,
    SUM(cost) as total_cost
  FROM funds 
  GROUP BY source_table
`, (err, rows) => {
    if (err) {
        console.error('Error:', err);
        return;
    }

    console.log('Data by Source Table:');
    console.table(rows);

    // Check total count
    db.get(`SELECT COUNT(*) as total FROM funds`, (err, row) => {
        if (err) {
            console.error('Error:', err);
            return;
        }
        console.log('\nTotal records in database:', row.total);

        // Show sample from any table
        db.all(`SELECT name, status, cost, daily_pnl, source_table FROM funds LIMIT 10`, (err, rows) => {
            if (err) {
                console.error('Error:', err);
                return;
            }
            console.log('\nSample Records (any source):');
            console.table(rows);

            db.close();
        });
    });
});
