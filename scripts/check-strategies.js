const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/funds.db');

db.all('SELECT name, strategy FROM funds LIMIT 20', (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log(JSON.stringify(rows, null, 2));
    }
    db.close();
});
