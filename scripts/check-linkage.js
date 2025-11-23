const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

db.all(`
    SELECT f.name, f.record_id, COUNT(h.id) as history_count
    FROM funds f
    LEFT JOIN fund_nav_history h ON f.name = h.fund_id
    WHERE f.status != '已赎回'
    GROUP BY f.name
    ORDER BY history_count ASC
    LIMIT 20
`, (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('Funds with lowest history count (joined by name):');
    console.table(rows);

    // Also check if joining by record_id works
    db.all(`
        SELECT f.name, f.record_id, COUNT(h.id) as history_count
        FROM funds f
        LEFT JOIN fund_nav_history h ON f.record_id = h.fund_id
        WHERE f.status != '已赎回'
        GROUP BY f.name
        ORDER BY history_count DESC
        LIMIT 5
    `, (err, rows2) => {
        console.log('Funds with highest history count (joined by record_id):');
        console.table(rows2);
        db.close();
    });
});
