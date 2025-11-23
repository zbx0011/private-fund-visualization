const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

console.log('完整的47个无历史数据基金列表:\n');
console.log('序号 | 基金名称                              | 策略         | 管理人          | 规模 (¥)');
console.log('='.repeat(120));

db.all(`
    SELECT f.id, f.name, f.strategy, f.manager, f.cost
    FROM funds f
    LEFT JOIN fund_nav_history h ON f.id = h.fund_id
    WHERE h.fund_id IS NULL
    ORDER BY f.name
`, [], (err, funds) => {
    if (err) {
        console.error('Error:', err);
        db.close();
        return;
    }

    funds.forEach((f, i) => {
        const num = (i + 1).toString().padStart(2);
        const name = f.name.padEnd(35);
        const strategy = (f.strategy || 'N/A').padEnd(12);
        const manager = (f.manager || 'N/A').padEnd(15);
        const cost = (f.cost || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        console.log(`${num}   | ${name} | ${strategy} | ${manager} | ${cost}`);
    });

    console.log('='.repeat(120));
    console.log(`\n总计: ${funds.length} 个基金`);

    const totalCost = funds.reduce((sum, f) => sum + (f.cost || 0), 0);
    console.log(`总规模: ¥${totalCost.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

    db.close();
});
