const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve('e:/项目/私募可视化/private-fund-visualization/data/funds.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Check if there are any records in fund_nav_history where fund_id is NOT in funds.record_id
    // but IS in funds.name
    const query = `
        SELECT count(*) as count
        FROM fund_nav_history h
        WHERE h.fund_id NOT IN (SELECT record_id FROM funds)
        AND h.fund_id IN (SELECT name FROM funds)
    `;

    db.get(query, (err, row) => {
        if (err) {
            console.error(err);
        } else {
            console.log('Records using Name as ID:', row.count);
        }
    });

    // Also check total records
    db.get("SELECT count(*) as count FROM fund_nav_history", (err, row) => {
        console.log('Total History Records:', row.count);
    });
});

db.close();
