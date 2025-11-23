const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

const targetName = '黑翼恒享CTA-T8号';

db.serialize(() => {
    // Check funds table
    db.get(`SELECT id, name, record_id, length(name) as len FROM funds WHERE name LIKE ?`, [`%${targetName}%`], (err, row) => {
        console.log('Funds Table Match:', row);
    });

    // Check history table
    db.all(`SELECT id, fund_id, length(fund_id) as len, nav_date FROM fund_nav_history WHERE fund_id LIKE ? LIMIT 5`, [`%${targetName}%`], (err, rows) => {
        console.log('History Table Match:', rows);
    });
});

db.close();
