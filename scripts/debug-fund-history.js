const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'data/funds.db');
const db = new sqlite3.Database(dbPath);

const targetName = '世纪前沿量化优选18号';

db.serialize(() => {
    // 1. Check funds table
    db.all("SELECT id, name, record_id FROM funds WHERE name LIKE ?", [`%${targetName}%`], (err, rows) => {
        if (err) {
            console.error("Error querying funds:", err);
            db.close();
            return;
        }
        console.log("Funds found:", rows);

        if (rows.length > 0) {
            const fundName = rows[0].name;
            console.log(`Checking history for fund name: '${fundName}'`);

            // 2. Test API query: Select by ID
            const id = rows[0].id;
            console.log(`Testing API query with ID: '${id}' (Type: ${typeof id}, Length: ${id.length})`);
            for (let i = 0; i < id.length; i++) {
                console.log(`Char ${i}: ${id.charCodeAt(i)} (${id[i]})`);
            }

            db.get("SELECT name FROM funds WHERE id = ?", [id], (err, row) => {
                if (err) console.error("Error querying by ID:", err);
                else console.log("Query by ID result:", row);

                // 3. Check history table with exact match
                db.all("SELECT count(*) as count FROM fund_nav_history WHERE fund_id = ?", [fundName], (err, historyRows) => {
                    if (err) console.error("Error querying history:", err);
                    else console.log("History count (Exact Match):", historyRows[0].count);
                    db.close();
                });
            });
        } else {
            console.log("Fund not found in funds table.");
            db.close();
        }
    });
});
