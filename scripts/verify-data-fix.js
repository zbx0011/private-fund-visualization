const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    const query = `
    SELECT f.*, h.daily_return 
    FROM funds f
    LEFT JOIN fund_nav_history h ON f.id = h.fund_id AND f.latest_nav_date = h.nav_date
    WHERE f.name NOT LIKE '%第一创业%' OR f.strategy != 'FOF'
  `;

    db.all(query, (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }

        console.log(`Total funds (excluded-fof): ${rows.length}`);

        let totalAssets = 0;
        let weightedReturnSum = 0;
        let weightedDailyReturnSum = 0;

        rows.forEach(row => {
            const assets = row.total_assets || 0;
            const cumReturn = row.cumulative_return || 0;
            const dailyReturn = row.daily_return || 0;

            totalAssets += assets;
            weightedReturnSum += cumReturn * assets;
            weightedDailyReturnSum += dailyReturn * assets;
        });

        const weightedAvgReturn = totalAssets > 0 ? weightedReturnSum / totalAssets : 0;
        const weightedAvgDailyReturn = totalAssets > 0 ? weightedDailyReturnSum / totalAssets : 0;

        console.log(`Total Assets: ${totalAssets}`);
        console.log(`Weighted Average Return (Cumulative): ${weightedAvgReturn.toFixed(4)}%`);
        console.log(`Weighted Average Daily Return: ${weightedAvgDailyReturn.toFixed(4)}%`);
    });
});

db.close();
