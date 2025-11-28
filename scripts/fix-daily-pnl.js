const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

function runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function runUpdate(query, params = []) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

async function main() {
    console.log('Fixing daily_pnl in funds table...');

    try {
        const funds = await runQuery('SELECT id, name, total_assets, cost FROM funds');
        console.log(`Found ${funds.length} funds.`);

        let updatedCount = 0;

        for (const fund of funds) {
            const history = await runQuery(`
                SELECT nav_date, cumulative_nav 
                FROM fund_nav_history 
                WHERE fund_id = ? OR fund_id = ?
                ORDER BY nav_date DESC 
                LIMIT 2
            `, [fund.name, fund.id]);

            if (history.length === 2) {
                const current = history[0];
                const prev = history[1];

                const currentNav = parseFloat(current.cumulative_nav);
                const prevNav = parseFloat(prev.cumulative_nav);

                if (currentNav > 0 && prevNav > 0) {
                    let pnl = 0;
                    if (fund.total_assets > 0) {
                        const shares = fund.total_assets / currentNav;
                        pnl = shares * (currentNav - prevNav);
                    } else if (fund.cost > 0) {
                        pnl = fund.cost * ((currentNav - prevNav) / prevNav);
                    }

                    if (Math.abs(pnl) > 0.01) {
                        await runUpdate('UPDATE funds SET daily_pnl = ? WHERE id = ?', [pnl, fund.id]);
                        updatedCount++;
                        if (fund.name === '黑翼恒享CTA-T8号') {
                            console.log(`Fixed ${fund.name}: PnL = ${pnl.toFixed(2)} (NAV: ${prevNav} -> ${currentNav})`);
                        }
                    }
                }
            }
        }
        console.log(`Finished. Updated ${updatedCount} funds.`);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        db.close();
    }
}

main();
