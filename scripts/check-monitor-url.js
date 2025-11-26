const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'funds.db');
const db = new Database(dbPath);

console.log('Checking external_monitor URL field:\n');

const rows = db.prepare('SELECT id, title, url FROM external_monitor LIMIT 5').all();

console.table(rows);

db.close();
