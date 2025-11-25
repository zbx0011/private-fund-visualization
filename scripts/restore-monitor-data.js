const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new Database(dbPath);
const backupPath = path.join(__dirname, '..', 'data', 'monitor_backup.json');

try {
    if (!fs.existsSync(backupPath)) {
        console.log('❌ No backup file found.');
        process.exit(1);
    }

    const records = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    console.log(`📦 Found ${records.length} records in backup.`);

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

    insertMany(records);
    console.log(`✅ Successfully restored ${restoredCount} records.`);

} catch (error) {
    console.error('❌ Error:', error.message);
} finally {
    db.close();
}
