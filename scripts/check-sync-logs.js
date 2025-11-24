const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'funds.db');
const db = new Database(dbPath);

try {
    const logs = db.prepare('SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 5').all();
    console.log('Recent Sync Logs:', logs);

    const successLog = db.prepare("SELECT sync_end FROM sync_logs WHERE status = 'success' ORDER BY sync_end DESC LIMIT 1").get();
    console.log('Latest Success Log:', successLog);
} catch (error) {
    console.error('Error querying sync_logs:', error);
}
