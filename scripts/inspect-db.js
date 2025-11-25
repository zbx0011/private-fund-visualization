const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    db.all("SELECT * FROM funds", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }

        console.log(`Total funds: ${rows.length}`);

        let totalAssets = 0;
        let totalReturn = 0;

        rows.forEach(row => {
            totalAssets += row.total_assets || 0;
            totalReturn += row.cumulative_return || 0;
        });

        console.log(`Total Assets: ${totalAssets}`);
        console.log(`Average Return: ${rows.length > 0 ? totalReturn / rows.length : 0}`);

        console.log('--- Sample Data (First 5) ---');
        rows.slice(0, 5).forEach(row => {
            console.log(`Name: ${row.name}, Strategy: ${row.strategy}, Assets: ${row.total_assets}, Return: ${row.cumulative_return}`);
        });

        // Check fund_nav_history
        db.all("SELECT * FROM fund_nav_history ORDER BY nav_date DESC LIMIT 5", (err, historyRows) => {
            if (err) {
                console.error(err);
            } else {
                console.log('\n--- Latest NAV History ---');
                if (historyRows.length === 0) {
                    console.log('No history data found.');
                } else {
                    historyRows.forEach(row => {
                        console.log(`Date: ${row.nav_date}, FundID: ${row.fund_id}, DailyReturn: ${row.daily_return}`);
                    });
                }
            }
            db.close();
        });
    });
});
