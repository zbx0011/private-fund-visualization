const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Checking Data Field Population ===\n');

// Check how many funds have non-null/non-zero values for these fields
db.all(`
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN weekly_return IS NOT NULL AND weekly_return != 0 THEN 1 END) as weekly_populated,
    COUNT(CASE WHEN yearly_return IS NOT NULL AND yearly_return != 0 THEN 1 END) as yearly_populated,
    COUNT(CASE WHEN concentration IS NOT NULL AND concentration != 0 THEN 1 END) as concentration_populated
  FROM funds
  WHERE source_table = 'main'
`, (err, counts) => {
    if (err) {
        console.error('Error:', err);
        return;
    }

    console.log('Data Population Summary:');
    console.table(counts);

    // Show sample records
    db.all(`
      SELECT name, weekly_return, yearly_return, concentration, daily_pnl
      FROM funds
      WHERE source_table = 'main'
      ORDER BY name
      LIMIT 10
    `, (err2, samples) => {
        if (err2) {
            console.error('Error:', err2);
            return;
        }

        console.log('\nSample Records:');
        console.table(samples);

        db.close();
    });
});
