const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

function getYieldCurveData(startDate = '2025-01-01') {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT 
                h.nav_date as date,
                h.cumulative_nav,
                h.fund_id,
                f.strategy,
                f.name
            FROM fund_nav_history h
            JOIN funds f ON (h.fund_id = f.record_id OR h.fund_id = f.name)
            WHERE h.nav_date >= ? AND f.status != '已赎回'
            ORDER BY h.nav_date ASC
        `, [startDate], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function main() {
    try {
        const rawData = await getYieldCurveData('2025-01-01');

        const fundBaseNavs = new Map();
        const fundFirstRows = new Map();

        rawData.forEach(row => {
            if (!fundBaseNavs.has(row.fund_id)) {
                fundBaseNavs.set(row.fund_id, row.cumulative_nav);
                fundFirstRows.set(row.fund_id, row);
            }
        });

        console.log('Checking Base NAVs...');
        let zeroBaseCount = 0;
        fundBaseNavs.forEach((nav, id) => {
            if (nav <= 0 || nav === null) {
                console.log(`Fund ${id} has invalid base NAV: ${nav}`);
                console.log('First Row:', fundFirstRows.get(id));
                zeroBaseCount++;
            }
        });

        if (zeroBaseCount === 0) {
            console.log('All funds have valid positive base NAVs.');
        } else {
            console.log(`Found ${zeroBaseCount} funds with invalid base NAVs.`);
        }

        // Check 世纪前沿量化对冲9号 specifically
        const targetId = '世纪前沿量化对冲9号'; // Or record_id if that's what's used
        // My previous script output showed fund_id as name for this fund.
        const targetBase = fundBaseNavs.get(targetId);
        console.log(`Base NAV for ${targetId}: ${targetBase}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        db.close();
    }
}

main();
