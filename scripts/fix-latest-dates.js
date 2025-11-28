const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('Fixing latest_nav_date in funds table...');

    // Update funds.latest_nav_date based on max(nav_date) from history
    db.run(`
        UPDATE funds
        SET latest_nav_date = (
            SELECT MAX(nav_date)
            FROM fund_nav_history
            WHERE fund_nav_history.fund_id = funds.name OR fund_nav_history.fund_id = funds.record_id
        )
        WHERE EXISTS (
            SELECT 1
            FROM fund_nav_history
            WHERE fund_nav_history.fund_id = funds.name OR fund_nav_history.fund_id = funds.record_id
        )
    `, function (err) {
        if (err) {
            console.error('Failed to update dates:', err);
        } else {
            console.log(`Updated ${this.changes} funds with correct latest_nav_date.`);
        }
    });

    // Verify specific fund
    db.get("SELECT name, latest_nav_date FROM funds WHERE name = '世纪前沿量化对冲9号'", (err, row) => {
        console.log('Verification:', row);
    });
});

db.close();
