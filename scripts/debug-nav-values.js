const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

const fundName = '世纪前沿量化优选18号';

db.serialize(() => {
    db.all(`
    SELECT nav_date, cumulative_nav 
    FROM fund_nav_history 
    WHERE fund_id = ? 
    ORDER BY nav_date ASC
  `, [fundName], (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(`Total records for ${fundName}: ${rows.length}`);

        if (rows.length > 0) {
            const navs = rows.map(r => r.cumulative_nav);
            const min = Math.min(...navs);
            const max = Math.max(...navs);
            console.log(`Min NAV: ${min}, Max NAV: ${max}`);

            // Find suspicious values
            const suspicious = rows.filter(r => r.cumulative_nav <= 0.1 || r.cumulative_nav > 10);
            if (suspicious.length > 0) {
                console.log('Suspicious records:');
                console.table(suspicious);
            }
        }
    });
});

db.close();
