const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

const columnsToAdd = [
    { name: 'daily_capital_usage', type: 'REAL' },
    { name: 'weekly_pnl', type: 'REAL' },
    { name: 'yearly_pnl', type: 'REAL' }
];

db.serialize(() => {
    columnsToAdd.forEach(col => {
        db.run(`ALTER TABLE funds ADD COLUMN ${col.name} ${col.type}`, (err) => {
            if (err) {
                if (err.message.includes('duplicate column name')) {
                    console.log(`Column ${col.name} already exists.`);
                } else {
                    console.error(`Error adding column ${col.name}:`, err);
                }
            } else {
                console.log(`Added column ${col.name}.`);
            }
        });
    });
});

db.close();
