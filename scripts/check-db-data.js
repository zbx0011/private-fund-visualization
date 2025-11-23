const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Checking Database Data ===\n');

// Check sample records
db.all(`
  SELECT name, status, cost, daily_pnl, weekly_return, yearly_return, scale
  FROM funds 
  WHERE source_table = '私募取数表' 
  LIMIT 10
`, (err, rows) => {
    if (err) {
        console.error('Error querying sample data:', err);
        return;
    }

    console.log('Sample Records:');
    console.table(rows);
});

// Check status distribution
db.all(`
  SELECT 
    status,
    COUNT(*) as count,
    SUM(cost) as total_cost,
    SUM(daily_pnl) as total_daily_pnl
  FROM funds 
  WHERE source_table = '私募取数表'
  GROUP BY status
`, (err, rows) => {
    if (err) {
        console.error('Error querying status distribution:', err);
        return;
    }

    console.log('\nStatus Distribution:');
    console.table(rows);
});

// Check if there are any non-zero daily_pnl values
db.get(`
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN daily_pnl != 0 THEN 1 END) as non_zero_pnl,
    MAX(daily_pnl) as max_pnl,
    MIN(daily_pnl) as min_pnl
  FROM funds 
  WHERE source_table = '私募取数表'
`, (err, row) => {
    if (err) {
        console.error('Error querying daily_pnl stats:', err);
        return;
    }

    console.log('\nDaily PnL Statistics:');
    console.log(row);

    db.close();
});
