const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(DB_PATH);

console.log('Analyzing 世纪前沿量化对冲9号...\n');

db.all(`
    SELECT nav_date, cumulative_nav
    FROM fund_nav_history
    WHERE fund_id = '世纪前沿量化对冲9号'
    ORDER BY nav_date ASC
`, (err, rows) => {
    if (err) {
        console.error('Error:', err);
        db.close();
        return;
    }

    if (rows.length === 0) {
        console.log('No data found');
        db.close();
        return;
    }

    const firstNav = parseFloat(rows[0].cumulative_nav);
    const lastNav = parseFloat(rows[rows.length - 1].cumulative_nav);
    const firstDate = new Date(rows[0].nav_date);
    const lastDate = new Date(rows[rows.length - 1].nav_date);
    const days = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);

    const totalReturn = (lastNav / firstNav) - 1;
    const annualizedReturn = Math.pow(1 + totalReturn, 365 / days) - 1;

    console.log(`First NAV (${rows[0].nav_date}): ${firstNav}`);
    console.log(`Last NAV (${rows[rows.length - 1].nav_date}): ${lastNav}`);
    console.log(`Days: ${days}`);
    console.log(`Total Return: ${(totalReturn * 100).toFixed(4)}%`);
    console.log(`Annualized Return: ${(annualizedReturn * 100).toFixed(4)}%`);
    console.log(`\nWith risk-free rate of 2%:`);
    console.log(`Excess Return: ${((annualizedReturn - 0.02) * 100).toFixed(4)}%`);
    console.log(`\nIf annualized return < 2%, Sharpe ratio will be negative`);

    db.close();
});
