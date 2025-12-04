const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/funds.db');

// Delete funds with garbled names (containing placeholder characters)
const garbledFunds = [
    '聚宽300指数增强一号私募证券投资基��',
    '世纪前沿金选沪深300指���增强1号私募证券投资基金',
    '世纪前���金选沪深300指数增强1号私募证券投资基金',
    '平方和鼎盛中���500指数增强9号私募证券投资基金',
    '世纪前沿指数增���2号私募证券投资基金',
    '世纪前沿指数增强2��私募证券投资基金',
    '聚宽全��场增强十一号私募证券投资基金',
    '聚宽全市场��强十一号私募证券投资基金',
    '平方和量化精选1号��募基金',
    '平方和���化精选1号私募基金'
];

console.log('Deleting garbled fund records...');

db.serialize(() => {
    garbledFunds.forEach(name => {
        // Delete from fund_nav_history
        db.run(`DELETE FROM fund_nav_history WHERE fund_id = ?`, [name], function (err) {
            if (err) {
                console.error(`Error deleting history for ${name}:`, err);
            } else {
                console.log(`Deleted ${this.changes} history records for: ${name}`);
            }
        });

        // Delete from funds
        db.run(`DELETE FROM funds WHERE record_id = ?`, [name], function (err) {
            if (err) {
                console.error(`Error deleting fund ${name}:`, err);
            } else {
                console.log(`Deleted ${this.changes} fund record for: ${name}`);
            }
        });
    });

    // Verify remaining funds
    db.all(`SELECT name, strategy FROM funds WHERE source_table = 'basic_pool'`, (err, rows) => {
        console.log('\n--- Remaining basic_pool funds ---');
        rows.forEach(r => console.log(`  ${r.name} | ${r.strategy}`));
        console.log(`\nTotal: ${rows.length} funds`);
        db.close();
    });
});
