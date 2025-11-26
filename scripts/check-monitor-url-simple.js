const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'funds.db');
const db = new Database(dbPath);

console.log('Checking external_monitor URL field (raw output):');

const rows = db.prepare('SELECT id, title, url FROM external_monitor LIMIT 5').all();

rows.forEach(row => {
    console.log(`ID: ${row.id}`);
    console.log(`Title: ${row.title}`);
    console.log(`URL: ${row.url}`);
    console.log('---');
});

db.close();
