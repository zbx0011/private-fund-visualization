const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Checking Fund Metrics ===\n');

db.all(`
  SELECT 
    name,
    max_drawdown,
    sharpe_ratio,
    volatility,
    weekly_return,
    yearly_return
  FROM funds
  WHERE source_table = 'main'
  ORDER BY name
  LIMIT 10
`, (err, rows) => {
    if (err) {
        console.error('Error:', err);
        return;
    }

    console.log('Sample Records:');
    console.table(rows);

    // Count non-zero values
    db.all(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN max_drawdown IS NOT NULL AND max_drawdown != 0 THEN 1 END) as max_drawdown_populated,
        COUNT(CASE WHEN sharpe_ratio IS NOT NULL AND sharpe_ratio != 0 THEN 1 END) as sharpe_populated,
        COUNT(CASE WHEN volatility IS NOT NULL AND volatility != 0 THEN 1 END) as volatility_populated
      FROM funds
      WHERE source_table = 'main'
    `, (err2, counts) => {
        if (err2) {
            console.error('Error:', err2);
            return;
        }

        console.log('\nMetrics Population:');
        console.table(counts);
        db.close();
    });
});
