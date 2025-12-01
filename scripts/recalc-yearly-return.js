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
    console.log('Recalculating yearly_return for all funds...');

    try {
        const funds = await runQuery('SELECT id, name, yearly_return FROM funds');
        console.log(`Found ${funds.length} funds.`);

        let updatedCount = 0;

        for (const fund of funds) {
            // Get all history for 2025
            const history = await runQuery(`
                SELECT nav_date, cumulative_nav 
                FROM fund_nav_history 
                WHERE (fund_id = ? OR fund_id = ?) AND nav_date >= '2025-01-01'
                ORDER BY nav_date ASC
            `, [fund.name, fund.id]);

            if (history.length > 0) {
                const start = history[0];
                const end = history[history.length - 1];

                const startNav = parseFloat(start.cumulative_nav);
                const endNav = parseFloat(end.cumulative_nav);

                if (startNav > 0) {
                    const calculatedReturn = (endNav - startNav) / startNav;

                    // Check if difference is significant (e.g., > 1% difference)
                    // Or just update everything to be consistent
                    const diff = Math.abs(calculatedReturn - (fund.yearly_return || 0));

                    if (diff > 0.0001) {
                        await runUpdate('UPDATE funds SET yearly_return = ? WHERE id = ?', [calculatedReturn, fund.id]);
                        updatedCount++;
                        if (fund.name === '因诺信诺天问16号') {
                            console.log(`Fixed ${fund.name}: Old=${fund.yearly_return}, New=${calculatedReturn.toFixed(4)} (Start: ${startNav} @ ${start.nav_date}, End: ${endNav} @ ${end.nav_date})`);
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
