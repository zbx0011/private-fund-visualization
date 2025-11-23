const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Checking All Metrics ===\n');

db.all(`
  SELECT 
    name,
    max_drawdown,
    volatility,
    sharpe_ratio,
    weekly_return,
    yearly_return,
    concentration
  FROM funds
  WHERE source_table = 'main'
  ORDER BY name
  LIMIT 5
`, (err, rows) => {
    if (err) {
        console.error('Error:', err);
        return;
    }

    console.log('Sample with all metrics:');
    console.table(rows);
    db.close();
});
