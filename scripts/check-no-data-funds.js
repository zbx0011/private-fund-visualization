const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking for funds with no historical data...\n');

// Query to find funds with no history
db.all(`
    SELECT f.id, f.name, f.strategy, f.manager, f.cost
    FROM funds f
    LEFT JOIN fund_nav_history h ON f.id = h.fund_id
    WHERE h.fund_id IS NULL
    ORDER BY f.name
`, [], (err, funds) => {
    if (err) {
        console.error('Error:', err);
        db.close();
        return;
    }

    console.log(`Found ${funds.length} funds with no historical data:\n`);
    console.log('ID\tName\t\t\t\tStrategy\tManager\t\t\tCost');
    console.log('='.repeat(120));

    funds.forEach(fund => {
        console.log(`${fund.id}\t${fund.name.padEnd(30)}\t${(fund.strategy || 'N/A').padEnd(10)}\t${(fund.manager || 'N/A').padEnd(20)}\t${fund.cost || 0}`);
    });

    console.log('\n' + '='.repeat(120));
    console.log(`\nTotal: ${funds.length} funds`);

    if (funds.length > 0) {
        console.log('\nTo delete these funds, run:');
        console.log('node scripts/delete-no-data-funds.js');
    }

    db.close();
});
