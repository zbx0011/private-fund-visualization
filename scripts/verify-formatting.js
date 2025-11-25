const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(DB_PATH);

console.log('Sample fund metrics (formatted as they will appear):\n');

db.all(`
    SELECT name, max_drawdown, volatility, sharpe_ratio
    FROM funds
    WHERE max_drawdown > 0 OR volatility > 0
    LIMIT 5
`, (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        rows.forEach(row => {
            console.log(`${row.name}:`);
            console.log(`  最大回撤: ${row.max_drawdown.toFixed(2)}% (无+号)`);
            console.log(`  波动率: ${row.volatility.toFixed(2)}% (无+号)`);
            console.log(`  夏普比率: ${row.sharpe_ratio.toFixed(2)}`);
            console.log('');
        });
    }

    db.close();
});
