const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'funds.db');
const db = new Database(dbPath);

const rows = db.prepare('SELECT date, title, summary, url FROM external_monitor ORDER BY created_at DESC LIMIT 5').all();

console.log('--- Last 5 Records ---');
rows.forEach(row => {
    console.log(`Date: ${row.date}`);
    console.log(`Title: ${row.title}`);
    console.log(`Summary: ${row.summary}`);
    console.log(`URL: ${row.url}`);
    console.log('-------------------');
});
