const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

db.all(`
    SELECT 
        cost, 
        daily_capital_usage, 
        daily_pnl, 
        weekly_pnl, 
        yearly_pnl 
    FROM funds 
    WHERE source_table IN ('main', 'merged')
`, (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }

    // 1. 总规模: 产品数据的成本列的总和
    const totalAssets = rows.reduce((sum, f) => sum + (f.cost || 0), 0);

    // 2. 总日均资金占用: 日均资金占用列的总和
    const totalDailyCapitalUsage = rows.reduce((sum, f) => sum + (f.daily_capital_usage || 0), 0);

    // 3. 今日收益: 本日收益列的总和
    const todayReturn = rows.reduce((sum, f) => sum + (f.daily_pnl || 0), 0);

    // 4. 本周收益率: 本周收益列的总和 / 总规模 * 100%
    const totalWeeklyPnl = rows.reduce((sum, f) => sum + (f.weekly_pnl || 0), 0);
    const weeklyReturn = totalAssets ? (totalWeeklyPnl / totalAssets) : 0;

    // 5. 本年收益率: 本年收益列的总和 / 总日均资金占用 * 100%
    const totalYearlyPnl = rows.reduce((sum, f) => sum + (f.yearly_pnl || 0), 0);
    const annualReturn = totalDailyCapitalUsage ? (totalYearlyPnl / totalDailyCapitalUsage) : 0;

    console.log('=== Verified Metrics ===');
    console.log(`Total Scale (Cost Sum): ${totalAssets.toLocaleString()}`);
    console.log(`Total Daily Capital Usage: ${totalDailyCapitalUsage.toLocaleString()}`);
    console.log(`Today Return (Daily PnL Sum): ${todayReturn.toLocaleString()}`);
    console.log(`Weekly Return: ${(weeklyReturn * 100).toFixed(2)}%`);
    console.log(`Yearly Return: ${(annualReturn * 100).toFixed(2)}%`);

    db.close();
});
