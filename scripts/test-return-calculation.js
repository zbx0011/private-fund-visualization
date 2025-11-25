const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(DB_PATH);

const fundName = '黑翼恒享CTA-T8号';

console.log(`Testing data for: ${fundName}\n`);

// Get fund cost
db.get(`SELECT name, cost FROM funds WHERE name = ?`, [fundName], (err, fund) => {
    if (err) {
        console.error('Error getting fund:', err);
    } else {
        console.log('Fund info:');
        console.log('  Name:', fund?.name);
        console.log('  Cost:', fund?.cost);
    }

    // Get history data
    db.all(`
        SELECT nav_date, cumulative_nav, market_value
        FROM fund_nav_history
        WHERE fund_id = ?
        ORDER BY nav_date ASC
        LIMIT 5
    `, [fundName], (err, history) => {
        if (err) {
            console.error('Error getting history:', err);
        } else {
            console.log('\nHistory data (first 5 records):');
            history.forEach((row, i) => {
                const virtualNav = parseFloat(row.cumulative_nav);
                const marketValue = parseFloat(row.market_value);
                const shares = marketValue / virtualNav;
                const cost = fund?.cost || 0;
                const returnRate = cost > 0 ? ((virtualNav * shares - cost) / cost) * 100 : 0;

                console.log(`\n${i + 1}. Date: ${row.nav_date}`);
                console.log(`   Virtual NAV: ${virtualNav}`);
                console.log(`   Market Value: ${marketValue}`);
                console.log(`   Shares: ${shares.toFixed(2)}`);
                console.log(`   Return Rate: ${returnRate.toFixed(4)}%`);
            });
        }

        db.close();
    });
});
