const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Checking fund matching and metrics ===\n');

// Find funds that exist in both tables
db.all(`
  SELECT 
    f.name,
    f.max_drawdown,
    f.sharpe_ratio,
    f.volatility,
    COUNT(h.id) as history_count
  FROM funds f
  LEFT JOIN fund_nav_history h ON f.name = h.fund_id
  WHERE f.source_table = 'main'
  GROUP BY f.name
  ORDER BY history_count DESC
  LIMIT 15
`, (err, rows) => {
    if (err) {
        console.error('Error:', err);
        return;
    }

    console.log('Funds with their history count and metrics:');
    console.table(rows);

    db.close();
});
