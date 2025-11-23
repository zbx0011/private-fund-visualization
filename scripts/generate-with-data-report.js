const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

db.all(`
    SELECT h.fund_id as name,
           COUNT(h.id) as data_points,
           MIN(h.nav_date) as first_date,
           MAX(h.nav_date) as last_date,
           MAX(h.cumulative_nav) as latest_nav
    FROM fund_nav_history h
    GROUP BY h.fund_id
    ORDER BY data_points DESC
`, [], (err, funds) => {
    if (err) {
        console.error('Error:', err);
        db.close();
        return;
    }

    let report = '# 有历史数据的基金列表\n\n';
    report += `**总计:** ${funds.length} 个基金\n\n`;

    report += '| 序号 | 基金名称 | 数据点数 | 起始日期 | 最新日期 | 最新净值 |\n';
    report += '|------|---------|----------|----------|----------|----------|\n';

    funds.forEach((f, i) => {
        const num = i + 1;
        const name = f.name;
        const dataPoints = f.data_points;
        const firstDate = f.first_date ? f.first_date.split('T')[0] : 'N/A';
        const lastDate = f.last_date ? f.last_date.split('T')[0] : 'N/A';
        const latestNav = f.latest_nav ? f.latest_nav.toFixed(4) : 'N/A';

        report += `| ${num} | ${name} | ${dataPoints} | ${firstDate} | ${lastDate} | ${latestNav} |\n`;
    });

    // Save to file
    const reportPath = path.resolve(__dirname, '../有数据基金列表.md');
    fs.writeFileSync(reportPath, report, 'utf8');

    console.log(`报告已生成: ${reportPath}`);
    console.log(`\n总计: ${funds.length} 个基金`);
    console.log(`平均数据点数: ${Math.round(funds.reduce((sum, f) => sum + f.data_points, 0) / funds.length)}`);

    db.close();
});
