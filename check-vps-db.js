const Database = require('better-sqlite3');
const db = new Database('/root/private-fund-visualization/data/funds.db');
const count = db.prepare('SELECT count(*) as c FROM external_monitor').get();
console.log('VPS Database Records:', count.c);
db.close();
