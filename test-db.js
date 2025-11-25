const Database = require('better-sqlite3');
try {
    const db = new Database('data/funds.db');
    console.log('Success: better-sqlite3 loaded and database opened');
    const row = db.prepare('SELECT 1').get();
    console.log('Query result:', row);
} catch (e) {
    console.error('Error:', e);
}
