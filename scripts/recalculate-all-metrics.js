const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/funds.db');

console.log('Recalculating metrics for all funds...\n');

const db = new sqlite3.Database(DB_PATH);

// Get all funds with history
db.all(`
    SELECT DISTINCT fund_id FROM fund_nav_history
`, async (err, funds) => {
    if (err) {
        console.error('Error:', err);
        db.close();
        return;
    }

    console.log(`Found ${funds.length} funds with history data`);

    let processed = 0;

    for (const fund of funds) {
        try {
            const metrics = await calculateMetricsForFund(db, fund.fund_id);
            await updateFundMetrics(db, fund.fund_id, metrics);
            processed++;

            if (processed % 10 === 0) {
                console.log(`Processed ${processed}/${funds.length} funds...`);
            }
        } catch (error) {
            console.error(`Error calculating metrics for ${fund.fund_id}:`, error.message);
        }
    }

    console.log(`\n✓ Completed! Processed ${processed} funds`);
    db.close();
});

function calculateMetricsForFund(db, fundId) {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT nav_date, cumulative_nav
            FROM fund_nav_history
            WHERE fund_id = ? AND cumulative_nav > 0
            ORDER BY nav_date ASC
        `, [fundId], (err, history) => {
            if (err) {
                reject(err);
                return;
            }

            if (history.length < 2) {
                resolve({ maxDrawdown: 0, volatility: 0, sharpeRatio: 0, annualizedReturn: 0 });
                return;
            }

            try {
                // Calculate max drawdown
                let maxDrawdown = 0;
                let peak = parseFloat(history[0].cumulative_nav);

                for (const point of history) {
                    const nav = parseFloat(point.cumulative_nav);
                    if (isNaN(nav) || nav <= 0) continue;

                    if (nav > peak) peak = nav;
                    const drawdown = (peak - nav) / peak;
                    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
                }

                // Calculate daily returns
                const returns = [];
                for (let i = 1; i < history.length; i++) {
                    const prevNav = parseFloat(history[i - 1].cumulative_nav);
                    const currNav = parseFloat(history[i].cumulative_nav);
                    if (isNaN(prevNav) || isNaN(currNav) || prevNav <= 0 || currNav <= 0) continue;
                    returns.push((currNav - prevNav) / prevNav);
                }

                // Calculate volatility (annualized)
                let volatility = 0;
                if (returns.length > 1) {
                    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
                    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
                    volatility = Math.sqrt(variance) * Math.sqrt(252);
                }

                // Calculate annualized return
                const firstNav = parseFloat(history[0].cumulative_nav);
                const lastNav = parseFloat(history[history.length - 1].cumulative_nav);
                const firstDate = new Date(history[0].nav_date);
                const lastDate = new Date(history[history.length - 1].nav_date);
                const days = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);

                let annualizedReturn = 0;
                if (days > 0 && firstNav > 0 && lastNav > 0) {
                    const totalReturn = (lastNav / firstNav) - 1;
                    annualizedReturn = Math.pow(1 + totalReturn, 365 / days) - 1;
                }

                // Calculate Sharpe ratio
                const riskFreeRate = 0.02;
                const sharpeRatio = volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0;

                resolve({
                    maxDrawdown: maxDrawdown * 100,
                    volatility: volatility * 100,
                    sharpeRatio,
                    annualizedReturn: annualizedReturn * 100
                });
            } catch (error) {
                reject(error);
            }
        });
    });
}

function updateFundMetrics(db, fundId, metrics) {
    return new Promise((resolve, reject) => {
        db.run(`
            UPDATE funds
            SET max_drawdown = ?, sharpe_ratio = ?, volatility = ?, annualized_return = ?
            WHERE name = ?
        `, [
            metrics.maxDrawdown,
            metrics.sharpeRatio,
            metrics.volatility,
            metrics.annualizedReturn,
            fundId
        ], (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}
