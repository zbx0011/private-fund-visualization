const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(DB_PATH);

console.log('Checking if we have share count and cost data...\n');

// Check if there's a shares/holdings field in the original Feishu data
db.all(`
    SELECT fund_id, nav_date, unit_nav, cumulative_nav, cost, market_value, position_change
    FROM fund_nav_history
    WHERE fund_id = '黑翼恒享CTA-T8号'
    ORDER BY nav_date DESC
    LIMIT 5
`, (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Recent records with cost and market_value:');
        rows.forEach(row => {
            console.log(`Date: ${row.nav_date}`);
            console.log(`  Virtual NAV: ${row.cumulative_nav}`);
            console.log(`  Cost: ${row.cost}`);
            console.log(`  Market Value: ${row.market_value}`);
            console.log(`  Position Change: ${row.position_change}`);
            if (row.cumulative_nav && row.market_value) {
                // Try to reverse engineer shares: market_value / virtual_nav
                const shares = row.market_value / row.cumulative_nav;
                console.log(`  Calculated Shares: ${shares.toFixed(2)}`);
            }
            console.log('');
        });
    }

    // Also check the main funds table for cost
    db.get(`
        SELECT name, cost FROM funds WHERE name = '黑翼恒享CTA-T8号'
    `, (err, fund) => {
        if (err) {
            console.error('Error:', err);
        } else if (fund) {
            console.log('Main fund table:');
            console.log(`  Name: ${fund.name}`);
            console.log(`  Cost: ${fund.cost}`);
        }

        db.close();
    });
});
