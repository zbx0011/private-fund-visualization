const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'funds.db');
const db = new Database(dbPath);

const count = db.prepare('SELECT count(*) as count FROM fund_nav_history').get();
console.log('Total history records:', count.count);

const sample = db.prepare('SELECT * FROM fund_nav_history LIMIT 5').all();
console.log('Sample history:', sample);

const fundsWithHistory = db.prepare('SELECT DISTINCT fund_id FROM fund_nav_history LIMIT 5').all();
console.log('Funds with history:', fundsWithHistory);
