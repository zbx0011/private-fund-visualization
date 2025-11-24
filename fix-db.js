const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data', 'funds.db'));

try {
    console.log('Fixing database records...');

    // Check current record
    const row = db.prepare('SELECT * FROM external_monitor WHERE id = 1').get();
    console.log('Before:', row);

    // Update
    const stmt = db.prepare(`
        UPDATE external_monitor 
        SET 
            date = title,
            title = level1_category,
            level1_category = importance,
            importance = sentiment,
            sentiment = source,
            source = '中国基金报'
        WHERE id = 1
    `);

    const info = stmt.run();
    console.log('Updated:', info.changes);

    // Check after
    const rowAfter = db.prepare('SELECT * FROM external_monitor WHERE id = 1').get();
    console.log('After:', rowAfter);

} catch (err) {
    console.error('Error:', err);
} finally {
    db.close();
}
