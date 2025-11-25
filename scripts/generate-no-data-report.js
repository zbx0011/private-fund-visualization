const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

db.all(`
    SELECT f.id, f.name, f.strategy, f.manager, f.cost
    FROM funds f
    LEFT JOIN fund_nav_history h ON f.id = h.fund_id
    WHERE h.fund_id IS NULL
    ORDER BY f.cost DESC
`, [], (err, funds) => {
    if (err) {
        console.error('Error:', err);
        db.close();
        return;
    }

    let report = '# 无历史数据的基金列表\n\n';
    report += `**总计:** ${funds.length} 个基金\n`;

    const totalCost = funds.reduce((sum, f) => sum + (f.cost || 0), 0);
    report += `**总规模:** ¥${totalCost.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}\n\n`;

    report += '| 序号 | 基金名称 | 策略 | 管理人 | 规模 (¥) |\n';
    report += '|------|---------|------|--------|----------|\n';

    funds.forEach((f, i) => {
        const num = i + 1;
        const name = f.name;
        const strategy = f.strategy || 'N/A';
        const manager = f.manager || 'N/A';
        const cost = (f.cost || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 });

        report += `| ${num} | ${name} | ${strategy} | ${manager} | ${cost} |\n`;
    });

    // Save to file
    const reportPath = path.resolve(__dirname, '../无数据基金列表.md');
    fs.writeFileSync(reportPath, report, 'utf8');

    console.log(`报告已生成: ${reportPath}`);
    console.log(`\n总计: ${funds.length} 个基金`);
    console.log(`总规模: ¥${totalCost.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`);

    db.close();
});
