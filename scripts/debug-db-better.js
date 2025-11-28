const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/funds.db');
const db = new Database(dbPath, { readonly: true });

const fundName = '世纪前沿量化对冲9号';

try {
    const row = db.prepare('SELECT name, latest_nav_date FROM funds WHERE name = ?').get(fundName);
    console.log('Fund Record:', row);

    const history = db.prepare('SELECT nav_date FROM fund_nav_history WHERE fund_id = ? ORDER BY nav_date DESC LIMIT 3').all(fundName);
    console.log('History Records:', history);
} catch (err) {
    console.error(err);
}

db.close();
