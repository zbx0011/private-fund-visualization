const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.get("SELECT * FROM funds WHERE source_table = 'merged' LIMIT 1", (err, fund) => {
        if (err) {
            console.error(err);
            return;
        }
        if (fund) {
            console.log("Sample Merged Fund:", fund.name, "ID:", fund.record_id);
            db.all("SELECT * FROM fund_nav_history WHERE fund_id = ? LIMIT 5", [fund.record_id], (err, history) => {
                if (err) console.error(err);
                else {
                    console.log("History count for this fund:", history.length);
                    console.log("First history item:", history[0]);
                }
                db.close(); // Close inside callback
            });
        } else {
            console.log("No merged funds found.");
            db.close();
        }
    });
});
