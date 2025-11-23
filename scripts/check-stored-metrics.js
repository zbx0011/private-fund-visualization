const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(DB_PATH);

console.log('Checking stored metrics vs calculated...\n');

// Check what's stored in the database
db.get(`
    SELECT name, max_drawdown, sharpe_ratio, volatility, annualized_return, cumulative_return
    FROM funds
    WHERE name = '世纪前沿量化对冲9号'
`, (err, row) => {
    if (err) {
        console.error('Error:', err);
    } else if (row) {
        console.log('Stored in database:');
        console.log(`  Max Drawdown: ${row.max_drawdown}%`);
        console.log(`  Sharpe Ratio: ${row.sharpe_ratio}`);
        console.log(`  Volatility: ${row.volatility}%`);
        console.log(`  Annualized Return: ${row.annualized_return}%`);
        console.log(`  Cumulative Return: ${row.cumulative_return}%`);

        // Calculate what Sharpe should be
        if (row.volatility && row.volatility > 0) {
            const expectedSharpe = (row.annualized_return - 2) / row.volatility;
            console.log(`\nExpected Sharpe (if annualized_return is correct): ${expectedSharpe}`);
        }
    } else {
        console.log('Fund not found');
    }

    db.close();
});
