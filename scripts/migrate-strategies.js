const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'funds.db');
const db = new sqlite3.Database(dbPath);

const updates = [
    ["UPDATE funds SET strategy = '指增' WHERE strategy LIKE '%指数增强%' OR strategy LIKE '%index增强%'"],
    ["UPDATE funds SET strategy = '中性' WHERE strategy LIKE '%中性%'"],
    ["UPDATE funds SET strategy = 'CTA' WHERE strategy LIKE '%CTA%'"],
    ["UPDATE funds SET strategy = '套利' WHERE strategy LIKE '%套利%'"],
    ["UPDATE funds SET strategy = '量选' WHERE strategy LIKE '%股票多头%'"], // Mapping Stock Long to Quant Selection based on assumption, can be adjusted
    ["UPDATE funds SET strategy = '混合' WHERE strategy LIKE '%多策略%'"],
    ["UPDATE funds SET strategy = '债券' WHERE strategy LIKE '%债券%'"]
];

db.serialize(() => {
    updates.forEach(([sql]) => {
        db.run(sql, function (err) {
            if (err) console.error(err);
            else console.log(`Updated ${this.changes} rows: ${sql}`);
        });
    });
});

db.close();
