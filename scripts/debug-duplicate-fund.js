const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new Database(dbPath);

const fundName = "远澜藤枫宏观量化5号";

console.log(`Querying for fund: ${fundName}`);

const funds = db.prepare('SELECT * FROM funds WHERE name LIKE ?').all(`%${fundName}%`);

console.log(`Found ${funds.length} records:`);
funds.forEach(fund => {
    console.log(JSON.stringify(fund, null, 2));
});

if (funds.length > 0) {
    const fundIds = funds.map(f => f.fund_id);
    console.log('\nChecking history for these funds:');
    const history = db.prepare(`SELECT * FROM fund_nav_history WHERE fund_id IN (${fundIds.map(() => '?').join(',')}) ORDER BY date DESC`).all(...fundIds);
    console.log(`Found ${history.length} history records.`);
    if (history.length > 0) {
        console.log('Latest 5 history records:');
        console.log(history.slice(0, 5));
    }
}
