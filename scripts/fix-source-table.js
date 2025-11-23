const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

console.log('更新 source_table 值...\n');

db.run(`
    UPDATE funds
    SET source_table = 'main'
    WHERE source_table = '私募取数表'
`, [], function (err) {
    if (err) {
        console.error('Error:', err);
        db.close();
        return;
    }

    console.log(`✓ 成功更新 ${this.changes} 个基金的 source_table 值`);
    console.log('  从 "私募取数表" -> "main"\n');

    // Verify
    db.all('SELECT DISTINCT source_table, COUNT(*) as count FROM funds GROUP BY source_table', [], (err, rows) => {
        if (err) {
            console.error('Error:', err);
        } else {
            console.log('更新后的 source_table 分布:');
            rows.forEach(row => {
                console.log(`  "${row.source_table}": ${row.count} 个基金`);
            });
        }
        db.close();
    });
});
