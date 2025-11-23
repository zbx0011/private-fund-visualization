const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.all(`PRAGMA table_info(fund_nav_history)`, (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log('Schema columns:', rows.map(r => r.name).join(', '));

        // Now we can query with the correct date column.
        const dateCol = rows.find(r => r.name.includes('date'))?.name || 'date';
        console.log(`Using date column: ${dateCol}`);

        const targetFundName = '世纪前沿正安量化对冲一号'; // Known Neutral fund
        console.log(`Looking for fund: ${targetFundName}`);

        db.get(`SELECT id FROM funds WHERE name = ?`, [targetFundName], (err, fundRow) => {
            if (err || !fundRow) {
                console.log(`Fund ${targetFundName} not found.`);
                db.close();
                return;
            }
            const fundId = fundRow.id;

            db.all(`
                SELECT h.${dateCol}, h.cumulative_nav, h.daily_return 
                FROM fund_nav_history h 
                WHERE h.fund_id = ? AND h.${dateCol} BETWEEN '2025-07-10' AND '2025-07-25'
                ORDER BY h.${dateCol} DESC
            `, [fundId], (err, dataRows) => {
                if (err) {
                    console.error('Query Error:', err);
                    return;
                }
                dataRows.forEach(row => {
                    console.log(`Date: ${row[dateCol]}, Nav: ${row.cumulative_nav}, DailyReturn: ${row.daily_return}`);
                });
                db.close();
            });
        });
    });
});
