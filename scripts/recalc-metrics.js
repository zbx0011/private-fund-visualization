const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

function calculateMetrics(history) {
    if (!history || history.length < 2) {
        return { maxDrawdown: 0, volatility: 0, sharpeRatio: 0, annualizedReturn: 0 };
    }

    // Sort by date ASC
    history.sort((a, b) => new Date(a.nav_date) - new Date(b.nav_date));

    // Max Drawdown
    let maxDrawdown = 0;
    let peak = history[0].cumulative_nav;

    for (const point of history) {
        const nav = point.cumulative_nav;
        if (nav <= 0) continue;

        if (nav > peak) peak = nav;
        const dd = (peak - nav) / peak;
        if (dd > maxDrawdown) maxDrawdown = dd;
    }

    // Volatility & Annualized Return
    const returns = [];
    for (let i = 1; i < history.length; i++) {
        const prev = history[i - 1].cumulative_nav;
        const curr = history[i].cumulative_nav;
        if (prev > 0 && curr > 0) {
            returns.push((curr - prev) / prev);
        }
    }

    let volatility = 0;
    if (returns.length > 1) {
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
        volatility = Math.sqrt(variance) * Math.sqrt(252);
    }

    // Annualized Return
    const first = history[0];
    const last = history[history.length - 1];
    const days = (new Date(last.nav_date) - new Date(first.nav_date)) / (1000 * 60 * 60 * 24);

    let annualizedReturn = 0;
    if (days > 0 && first.cumulative_nav > 0 && last.cumulative_nav > 0) {
        const totalReturn = (last.cumulative_nav / first.cumulative_nav) - 1;
        annualizedReturn = Math.pow(1 + totalReturn, 365 / days) - 1;
    }

    // Sharpe
    const riskFreeRate = 0.02;
    const sharpeRatio = volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0;

    return { maxDrawdown, volatility, sharpeRatio, annualizedReturn };
}

db.serialize(() => {
    // Get all funds
    db.all('SELECT id, name, record_id FROM funds', (err, funds) => {
        if (err) {
            console.error('Failed to get funds:', err);
            return;
        }

        console.log(`Found ${funds.length} funds. Recalculating metrics...`);

        let updatedCount = 0;
        const stmt = db.prepare('UPDATE funds SET max_drawdown = ?, volatility = ?, sharpe_ratio = ?, annualized_return = ? WHERE id = ?');

        funds.forEach(fund => {
            // Get history for each fund
            // Try matching by record_id first, then name
            let query = 'SELECT nav_date, cumulative_nav FROM fund_nav_history WHERE fund_id = ? AND cumulative_nav > 0';
            let param = fund.record_id;

            // Check if we should use name (if record_id match fails, but here we just try one. 
            // In lark-sync it iterates distinct fund_id from history. 
            // Let's use name because sync uses name as fund_id in history)
            query = 'SELECT nav_date, cumulative_nav FROM fund_nav_history WHERE fund_id = ? AND cumulative_nav > 0';
            param = fund.name;

            db.all(query, [param], (err, history) => {
                if (err) {
                    console.error(`Failed to get history for ${fund.name}:`, err);
                    return;
                }

                if (history.length > 0) {
                    const metrics = calculateMetrics(history);

                    stmt.run([
                        metrics.maxDrawdown,
                        metrics.volatility,
                        metrics.sharpeRatio,
                        metrics.annualizedReturn,
                        fund.id
                    ], (err) => {
                        if (err) console.error(`Failed to update ${fund.name}:`, err);
                        else {
                            updatedCount++;
                            if (updatedCount % 10 === 0) console.log(`Updated ${updatedCount} funds...`);
                        }
                    });
                }
            });
        });

        // Wait a bit for async operations (simple script approach)
        setTimeout(() => {
            stmt.finalize();
            console.log('Finished updates.');

            // Verify one fund
            db.get("SELECT name, max_drawdown, volatility FROM funds WHERE name = '世纪前沿量化优选18号'", (err, row) => {
                console.log('Verification for 世纪前沿量化优选18号:', row);
            });
        }, 5000);
    });
});
