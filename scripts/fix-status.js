const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Fixing Fund Status ===\n');

db.serialize(() => {
    // Update optFl1SLci to 正常
    db.run(`UPDATE funds SET status = '正常' WHERE status = 'optFl1SLci'`, function (err) {
        if (err) console.error('Error updating optFl1SLci:', err);
        else console.log(`Updated ${this.changes} records from optFl1SLci to 正常`);
    });

    // Update 未知 to 正常
    db.run(`UPDATE funds SET status = '正常' WHERE status = '未知'`, function (err) {
        if (err) console.error('Error updating 未知:', err);
        else console.log(`Updated ${this.changes} records from 未知 to 正常`);
    });

    // Verify
    db.all(`SELECT status, COUNT(*) as count FROM funds GROUP BY status`, (err, rows) => {
        if (err) console.error('Error verifying:', err);
        else {
            console.log('\nNew Status Distribution:');
            console.table(rows);
        }
        db.close();
    });
});
