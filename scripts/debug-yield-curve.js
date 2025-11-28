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
        console.log('Fetching yield curve data...');
        const rawData = await getYieldCurveData('2025-01-01');
        console.log(`Fetched ${rawData.length} rows.`);

        if (rawData.length > 0) {
            console.log('Sample row:', rawData[0]);
            console.log('Last row:', rawData[rawData.length - 1]);

            // Check specific fund
            const fundRows = rawData.filter(r => r.name === '世纪前沿量化对冲9号');
            console.log(`Rows for 世纪前沿量化对冲9号: ${fundRows.length}`);
            if (fundRows.length > 0) {
                console.log('Last row for fund:', fundRows[fundRows.length - 1]);
            }
        } else {
            console.log('No data found! Checking funds table...');
            db.all('SELECT count(*) as count FROM funds', (err, rows) => console.log('Funds count:', rows));
            db.all('SELECT count(*) as count FROM fund_nav_history', (err, rows) => console.log('History count:', rows));
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        db.close();
    }
}

main();
