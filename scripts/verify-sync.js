const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

const fundsToCheck = [
    '陆生生股票量化中性1号', // Should be 中性
    '世纪前沿量化优选18号', // Should be 指增
    '朱雀CTA2号', // Should be CTA
    '福瑞福元九号', // Should be 套利
    '顽岩稳健2号', // Should be T0
    '君宜共达' // Should be 期权
];

db.serialize(() => {
    fundsToCheck.forEach(name => {
        db.get('SELECT name, strategy FROM funds WHERE name = ?', [name], (err, row) => {
            if (err) console.error(err);
            else if (row) console.log(`${row.name}: ${row.strategy}`);
            else console.log(`${name}: Not Found`);
        });
    });
    db.get('SELECT COUNT(*) as c FROM funds', (err, row) => {
        console.log(`Total funds in DB: ${row.c}`);
    });
    db.all('SELECT name FROM funds WHERE strategy = "T0"', (err, rows) => {
        console.log('\nT0 Funds in DB:');
        rows.forEach(r => console.log(r.name));
    });
    db.all('SELECT strategy, COUNT(*) as count FROM funds GROUP BY strategy', (err, rows) => {
        console.log('\nStrategy Distribution:');
        rows.forEach(r => console.log(`${r.strategy}: ${r.count}`));
    });
});

db.close();
