const db = require('better-sqlite3')('data/funds.db');
const newRecs = db.prepare("SELECT count(*) as c FROM external_monitor WHERE created_at > datetime('now', '-20 minutes')").get();
console.log('New records:', newRecs.c);
const total = db.prepare('SELECT count(*) as c FROM external_monitor').get();
console.log('Total records:', total.c);
