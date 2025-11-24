const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'funds.db');
const db = new Database(dbPath);

console.log('--- Funds with Calculated Indicators ---');
const funds = db.prepare(`
    SELECT name, max_drawdown, sharpe_ratio, volatility 
    FROM funds 
    WHERE max_drawdown > 0 OR sharpe_ratio != 0 OR volatility > 0
    LIMIT 10
`).all();
console.log(funds);

console.log(`\nTotal calculated funds: ${funds.length}`);
