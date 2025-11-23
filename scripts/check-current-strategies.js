const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

const fundsToCheck = [
    '赫富灵活对冲一号', // Should be 择时对冲
    '优美利金安长牛2号', // Should be 可转债
    '大道崔苇', // Should be 量选
    '君宜共达', // Should be 期权
    '因诺信诺天问16号', // Should be 混合
    '世纪前沿量化优选18号', // Should be 指增
    '致同添利套利多策略', // Should be 套利
    '平方和衡盛36号' // Should be 中性
];

db.serialize(() => {
    console.log('Checking current strategy values in DB:');
    fundsToCheck.forEach(name => {
        db.get('SELECT name, strategy FROM funds WHERE name = ?', [name], (err, row) => {
            if (err) {
                console.error(err);
                return;
            }
            if (row) {
                console.log(`${row.name}: ${row.strategy}`);
            } else {
                console.log(`${name}: NOT FOUND`);
            }
        });
    });
});

setTimeout(() => {
    db.close();
}, 2000);
