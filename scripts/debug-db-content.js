const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("Checking funds table distribution by source_table:");
    db.all("SELECT source_table, COUNT(*) as count FROM funds GROUP BY source_table", (err, rows) => {
        if (err) console.error(err);
        else console.log(rows);
    });

    console.log("\nChecking funds with history:");
    db.get("SELECT COUNT(*) as total_history FROM fund_nav_history", (err, row) => {
        if (err) console.error(err);
        else console.log("Total history records:", row.total_history);
    });

    console.log("\nChecking sample fund history:");
    db.get("SELECT * FROM funds LIMIT 1", (err, fund) => {
        if (err) console.error(err);
        else if (fund) {
            console.log("Sample Fund:", fund.name, fund.record_id);
            db.all("SELECT * FROM fund_nav_history WHERE fund_id = ? LIMIT 5", [fund.record_id], (err, history) => {
                if (err) console.error(err);
                else console.log("History for sample fund:", history);
            });
        } else {
            console.log("No funds found.");
        }
    });

    console.log("\nChecking strategy stats for 'main' vs 'merged':");
    db.all("SELECT strategy, COUNT(*) as count FROM funds WHERE source_table = 'main' GROUP BY strategy", (err, rows) => {
        if (err) console.error(err);
        else console.log("Main strategies:", rows);
    });
    db.all("SELECT strategy, COUNT(*) as count FROM funds WHERE source_table = 'merged' GROUP BY strategy", (err, rows) => {
        if (err) console.error(err);
        else console.log("Merged strategies:", rows);
    });
});

db.close();
