const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Checking fund_id matching ===\n');

// Check distinct fund_ids in nav_history
db.all(`SELECT DISTINCT fund_id FROM fund_nav_history LIMIT 10`, (err, navFunds) => {
    if (err) {
        console.error('Error:', err);
        return;
    }

    console.log('Sample fund_ids in fund_nav_history:');
    console.table(navFunds);

    // Check fund names in funds table
    db.all(`SELECT name FROM funds WHERE source_table = 'main' LIMIT 10`, (err2, funds) => {
        if (err2) {
            console.error('Error:', err2);
            return;
        }

        console.log('\nSample names in funds table:');
        console.table(funds);

        // Check if any fund_id matches any name
        const navIds = navFunds.map(f => f.fund_id);
        const fundNames = funds.map(f => f.name);

        console.log('\nMatching check:');
        console.log('Sample nav_history fund_id:', navIds[0]);
        console.log('Sample funds name:', fundNames[0]);
        console.log('Do they match?', navIds.includes(fundNames[0]));

        db.close();
    });
});
