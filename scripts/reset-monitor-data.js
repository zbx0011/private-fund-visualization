/**
 * Reset External Monitor Data
 * 
 * 1. Backs up data created in the last hour.
 * 2. Clears the entire table.
 * 3. Resets the ID counter.
 * 4. Restores the backed-up data.
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new Database(dbPath);

function resetData() {
    console.log('🔄 Starting data reset...');

    // 1. Get recent records (last 1 hour to be safe)
    const recentRecords = db.prepare(`
        SELECT * FROM external_monitor 
        WHERE created_at > datetime('now', '-1 hour')
        ORDER BY id ASC
    `).all();

    if (recentRecords.length === 0) {
        console.log('⚠️  No recent records found to restore! Aborting reset to prevent data loss.');
        return;
    }

    console.log(`📦 Found ${recentRecords.length} recent records to preserve.`);

    // 2. Clear table
    const deleteResult = db.prepare('DELETE FROM external_monitor').run();
    console.log(`🗑️  Deleted ${deleteResult.changes} total records.`);

    // 3. Reset ID sequence
    try {
        db.prepare("DELETE FROM sqlite_sequence WHERE name='external_monitor'").run();
        console.log('🔢 Reset auto-increment ID counter.');
    } catch (e) {
        console.log('⚠️  Could not reset sequence (might not exist yet):', e.message);
    }

    // 4. Restore records
    const insertStmt = db.prepare(`
        INSERT INTO external_monitor (
            date, title, summary, source, related_enterprise,
            importance, sentiment, level1_category, level2_category, url, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let restoredCount = 0;
    const insertMany = db.transaction((records) => {
        for (const record of records) {
            insertStmt.run(
                record.date,
                record.title,
                record.summary,
                record.source,
                record.related_enterprise,
                record.importance,
                record.sentiment,
                record.level1_category,
                record.level2_category,
                record.url,
                record.created_at
            );
            restoredCount++;
        }
    });

    insertMany(recentRecords);
    console.log(`✅ Successfully restored ${restoredCount} records.`);
}

try {
    resetData();
} catch (error) {
    console.error('❌ Error during reset:', error);
} finally {
    db.close();
}
