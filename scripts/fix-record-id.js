const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

db.run(`UPDATE funds SET record_id = id WHERE record_id IS NULL`, function (err) {
    if (err) {
        console.error(err);
        return;
    }
    console.log(`Updated ${this.changes} rows. record_id populated from id.`);

    // Verify
    db.all(`SELECT id, record_id, name FROM funds LIMIT 5`, (err, rows) => {
        console.log('Sample Data after fix:');
        console.table(rows);
        db.close();
    });
});
