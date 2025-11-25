const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new Database(dbPath);

const fundName = "远澜藤枫宏观量化5号";
const managerToDelete = "未知";

console.log(`Deleting duplicate fund: ${fundName} with manager: ${managerToDelete}`);

const stmt = db.prepare('DELETE FROM funds WHERE name = ? AND manager = ?');
const result = stmt.run(fundName, managerToDelete);

console.log(`Deleted ${result.changes} records.`);

// Verify
const remaining = db.prepare('SELECT * FROM funds WHERE name = ?').all(fundName);
console.log(`Remaining records for ${fundName}:`);
remaining.forEach(r => console.log(`- ID: ${r.id}, Manager: ${r.manager}, Strategy: ${r.strategy}`));
