const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

// Mock getDatabase methods
const mockDb = {
    getAllFunds: () => {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT f.*, h.daily_return as history_daily_return
                FROM funds f
                LEFT JOIN fund_nav_history h ON f.name = h.fund_id AND f.latest_nav_date = h.nav_date
                WHERE f.source_table = 'main'
                ORDER BY f.yearly_return DESC
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },
    getYieldCurveData: (startDate) => {
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
};

async function main() {
    try {
        console.log('1. Fetching all funds...');
        const funds = await mockDb.getAllFunds();
        console.log(`Fetched ${funds.length} funds.`);

        if (funds.length > 0) {
            console.log('Sample fund:', funds[0].name, funds[0].strategy, funds[0].record_id);
        }

        console.log('2. Fetching raw yield curve data...');
        const rawData = await mockDb.getYieldCurveData('2025-01-01');
        console.log(`Fetched ${rawData.length} raw rows.`);

        console.log('3. Building Strategy Map...');
        const fundStrategyMap = new Map();
        funds.forEach(f => fundStrategyMap.set(f.record_id, f.strategy));
        console.log(`Map size: ${fundStrategyMap.size}`);

        // Check if map works for rawData funds
        let mappedCount = 0;
        let unmappedCount = 0;
        const unmappedExamples = new Set();

        rawData.forEach(row => {
            // In route.ts: const fundId = row.fund_id
            // In getYieldCurveData SQL: h.fund_id
            // h.fund_id usually stores the name or record_id?
            // Let's check what row.fund_id is.
            const strategy = fundStrategyMap.get(row.fund_id);
            if (strategy) {
                mappedCount++;
            } else {
                unmappedCount++;
                if (unmappedExamples.size < 5) unmappedExamples.add(row.fund_id);
            }
        });

        console.log(`Mapped rows: ${mappedCount}`);
        console.log(`Unmapped rows: ${unmappedCount}`);
        if (unmappedCount > 0) {
            console.log('Unmapped examples:', Array.from(unmappedExamples));
            console.log('Note: route.ts uses fundStrategyMap.get(row.fund_id). If row.fund_id is NAME but map uses RECORD_ID, it fails.');

            // Check what keys are in the map
            console.log('Sample keys in map:', Array.from(fundStrategyMap.keys()).slice(0, 3));
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        db.close();
    }
}

main();
