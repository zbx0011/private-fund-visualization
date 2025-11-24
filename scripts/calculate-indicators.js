const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Import financial utils - we need to read the file and eval it or copy the logic since it's TS
// For simplicity in this script, I'll duplicate the logic or require a compiled JS version.
// Given the environment, I'll inline the logic to avoid TS compilation issues for this script.

function calculateMaxDrawdown(navs) {
    if (!navs || navs.length === 0) return 0;
    let maxNav = navs[0];
    let maxDrawdown = 0;
    for (const nav of navs) {
        if (nav > maxNav) maxNav = nav;
        const drawdown = (maxNav - nav) / maxNav;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    return maxDrawdown;
}

function calculateVolatility(returns, periodsPerYear = 252) {
    if (!returns || returns.length < 2) return 0;
    const n = returns.length;
    const mean = returns.reduce((sum, r) => sum + r, 0) / n;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (n - 1);
    const stdDev = Math.sqrt(variance);
    return stdDev * Math.sqrt(periodsPerYear);
}

function calculateSharpeRatio(returns, riskFreeRate = 0.02, periodsPerYear = 252) {
    if (!returns || returns.length < 2) return 0;
    const volatility = calculateVolatility(returns, periodsPerYear);
    if (volatility === 0) return 0;
    const n = returns.length;
    const meanDailyReturn = returns.reduce((sum, r) => sum + r, 0) / n;
    const annualizedReturn = meanDailyReturn * periodsPerYear;
    return (annualizedReturn - riskFreeRate) / volatility;
}

const dbPath = path.join(process.cwd(), 'data', 'funds.db');
const db = new Database(dbPath);

console.log('Starting performance indicators calculation...');

try {
    // Get all funds
    const funds = db.prepare('SELECT id, record_id, name FROM funds').all();
    console.log(`Found ${funds.length} funds.`);

    let updatedCount = 0;

    const updateStmt = db.prepare(`
        UPDATE funds 
        SET max_drawdown = ?, sharpe_ratio = ?, volatility = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);

    for (const fund of funds) {
        // Get history sorted by date
        const history = db.prepare(`
            SELECT cumulative_nav, daily_return 
            FROM fund_nav_history 
            WHERE fund_id = ? 
            ORDER BY nav_date ASC
        `).all(fund.name);

        if (history.length < 2) {
            console.log(`Skipping ${fund.name} (insufficient history: ${history.length})`);
            continue;
        }

        const navs = history.map(h => h.cumulative_nav);
        // Filter out null/undefined daily returns
        const returns = history.map(h => h.daily_return).filter(r => r !== null && r !== undefined);

        const maxDrawdown = calculateMaxDrawdown(navs);
        const sharpeRatio = calculateSharpeRatio(returns);
        const volatility = calculateVolatility(returns);

        updateStmt.run(maxDrawdown, sharpeRatio, volatility, fund.id);
        updatedCount++;

        if (updatedCount % 10 === 0) {
            console.log(`Updated ${updatedCount} funds...`);
        }
    }

    console.log(`Calculation complete. Updated ${updatedCount} funds.`);

} catch (error) {
    console.error('Error during calculation:', error);
}
