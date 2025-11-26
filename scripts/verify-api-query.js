
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

const date = '2025-11-21'; // A date we know has some history

const query = `
      SELECT 
        f.name as fund_name,
        COALESCE(h.nav_date, ?) as latest_nav_date, 
        COALESCE(h.daily_pnl, 0) as daily_pnl, 
        COALESCE(h.daily_return, 0) as daily_return
      FROM funds f
      LEFT JOIN fund_nav_history h ON f.name = h.fund_id AND h.nav_date = ?
      WHERE f.status != '已赎回' OR f.status IS NULL
      ORDER BY daily_pnl DESC
    `;

db.all(query, [date, date], (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(`Total rows returned: ${rows.length}`);
    console.log('Sample rows (top 5):');
    console.table(rows.slice(0, 5));
    console.log('Sample rows (bottom 5 - likely 0s):');
    console.table(rows.slice(-5));
});
