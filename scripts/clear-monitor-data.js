const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new Database(dbPath);
const backupPath = path.join(__dirname, '..', 'data', 'monitor_backup.json');

try {
    // 1. Backup
    const rows = db.prepare('SELECT * FROM external_monitor').all();
    if (rows.length > 0) {
        fs.writeFileSync(backupPath, JSON.stringify(rows, null, 2));
        console.log(`📦 Backed up ${rows.length} records to ${backupPath}`);
    } else {
        console.log('⚠️  Table is already empty, nothing to backup.');
    }

    // 2. Clear
    db.prepare('DELETE FROM external_monitor').run();
    db.prepare("DELETE FROM sqlite_sequence WHERE name='external_monitor'").run();

    console.log('✅ Table `external_monitor` cleared. Count is now 0.');

} catch (error) {
    console.error('❌ Error:', error.message);
} finally {
    db.close();
}
