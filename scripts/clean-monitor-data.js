/**
 * Clean Monitor Data
 * 
 * Removes UI artifacts like "仅看此类型屏蔽此类型" from the database.
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new Database(dbPath);

function cleanData() {
    console.log('🧹 Starting data cleanup...');

    const records = db.prepare('SELECT * FROM external_monitor').all();
    let updatedCount = 0;

    const updateStmt = db.prepare(`
        UPDATE external_monitor 
        SET level1_category = ?, 
            level2_category = ?, 
            importance = ?,
            title = ?
        WHERE id = ?
    `);

    for (const record of records) {
        let changed = false;
        let { level1_category, level2_category, importance, title, id } = record;

        // Helper to remove garbage suffix
        const clean = (text) => {
            if (!text) return text;
            return text.replace(/仅看此类型屏蔽此类型/g, '').trim();
        };

        // Helper to remove title prefix
        const cleanTitle = (text) => {
            if (!text) return text;
            return text.replace(/^新闻\s*\|\s*/, '').trim();
        };

        const newL1 = clean(level1_category);
        const newL2 = clean(level2_category);
        const newImp = clean(importance);
        const newTitle = cleanTitle(title);

        if (newL1 !== level1_category || newL2 !== level2_category || newImp !== importance || newTitle !== title) {
            updateStmt.run(newL1, newL2, newImp, newTitle, id);
            updatedCount++;
        }
    }

    console.log(`✨ Cleaned ${updatedCount} records.`);
}

try {
    cleanData();
} catch (error) {
    console.error('❌ Error:', error.message);
} finally {
    db.close();
}
