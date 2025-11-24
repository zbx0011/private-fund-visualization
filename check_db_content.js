const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'funds.db');
const db = new Database(dbPath);

console.log('--- Funds Table Sample ---');
const funds = db.prepare('SELECT id, record_id, name FROM funds LIMIT 5').all();
console.log(funds);

console.log('\n--- History Table Sample ---');
const history = db.prepare('SELECT fund_id, nav_date FROM fund_nav_history LIMIT 5').all();
console.log(history);

console.log('\n--- Join Check ---');
const joinCheck = db.prepare(`
    SELECT f.name, f.record_id, h.fund_id, COUNT(h.id) as history_count
    FROM funds f
    LEFT JOIN fund_nav_history h ON f.name = h.fund_id
    GROUP BY f.id
    HAVING history_count > 0
    LIMIT 5
`).all();
console.log(joinCheck);
