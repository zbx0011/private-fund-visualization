const puppeteer = require('puppeteer');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 数据库和Cookie文件路径
const dbPath = path.join(__dirname, 'data', 'funds.db');
const cookiesPath = path.join(__dirname, 'cookies.json');
const db = new Database(dbPath);

// 初始化数据库
db.exec(`
    CREATE TABLE IF NOT EXISTS external_monitor (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT,
        source TEXT,
        related_enterprise TEXT,
        importance TEXT,
        sentiment TEXT,
        level1_category TEXT,
        level2_category TEXT,
        url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, title, related_enterprise)
    )
`);

async function setupAndScrape() {
    console.log('\n==================================================');
    console.log('   企业预警通爬虫 - 初始化配置');
    console.log('==================================================\n');

    // 1. 启动浏览器
    console.log('1. 正在启动浏览器...');
    const browser = await puppeteer.launch({
        headless: false, // 显示浏览器界面
        defaultViewport: null, // 使用默认分辨率
        args: ['--start-maximized'] // 最大化窗口
    });

    const page = await browser.newPage();

    // 2. 打开网站
    console.log('2. 正在打开网站...');
    await page.goto('https://www.qyyjt.cn/combination/20250603164207');

    // 3. 等待用户手动操作
    console.log('\n🔴🔴🔴 请在弹出的浏览器中进行以下操作： 🔴🔴🔴');
    console.log('--------------------------------------------------');
    console.log('  1. 如果没登录，请【手动登录】（扫码或密码都可以）');
    console.log('  2. 登录后，确保能看到【数据表格】');
    console.log('  3. 确保已经点击了【最新动态】标签（如果需要）');
    console.log('--------------------------------------------------');
    console.log('\n✅ 确认页面显示正常后，请在【这里（黑框框）】按【回车键】继续...');

    // 等待用户按回车
    await new Promise(resolve => {
        process.stdin.once('data', () => resolve());
    });

    console.log('\n3. 正在保存登录状态(Cookies)...');
    const cookies = await page.cookies();
    fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
    console.log('   ✅ 登录状态已保存到 cookies.json');
    console.log('   (以后运行 scraper-auto.js 就可以自动登录了)');

    // 4. 开始抓取当前页面数据
    console.log('\n4. 正在抓取当前页面数据...');

    // 再次确保点击了"最新动态"（双重保险）
    try {
        await page.evaluate(() => {
            const all = Array.from(document.querySelectorAll('*'));
            for (const el of all) {
                if (el.textContent === '最新动态' && el.tagName === 'DIV') {
                    el.click();
                    return;
                }
            }
        });
        await new Promise(r => setTimeout(r, 2000)); // 等待刷新
    } catch (e) { }

    const data = await page.evaluate(() => {
        const results = [];
        // 尝试多种表格选择器
        let rows = Array.from(document.querySelectorAll('table tbody tr'));
        if (rows.length === 0) rows = Array.from(document.querySelectorAll('.el-table__row'));

        for (const row of rows) {
            const cells = Array.from(row.querySelectorAll('td'));
            // 确保是有效的数据行（至少有8列）
            if (cells.length >= 8) {
                const record = {
                    date: cells[1]?.textContent?.trim() || '',
                    title: cells[3]?.textContent?.trim() || '',
                    summary: '查看',
                    source: cells[7]?.textContent?.trim() || '',
                    related_enterprise: cells[2]?.textContent?.trim() || '',
                    importance: cells[5]?.textContent?.trim() || '',
                    sentiment: cells[6]?.textContent?.trim() || '',
                    level1_category: cells[4]?.textContent?.trim() || '',
                    level2_category: '',
                    url: ''
                };

                // 过滤掉表头或无效数据
                if (record.title && !record.title.includes('标题')) {
                    results.push(record);
                }
            }
        }
        return results;
    });

    console.log(`   ✅ 成功提取到 ${data.length} 条数据`);

    // 5. 保存数据
    if (data.length > 0) {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO external_monitor 
            (date, title, summary, source, related_enterprise, importance, sentiment, level1_category, level2_category, url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        let count = 0;
        for (const record of data) {
            stmt.run(
                record.date, record.title, record.summary, record.source,
                record.related_enterprise, record.importance, record.sentiment,
                record.level1_category, record.level2_category, record.url
            );
            count++;
        }
        console.log(`   💾 已保存 ${count} 条记录到数据库`);

        // 打印第一条数据给用户看
        console.log('\n   [数据预览] 第一条:');
        console.log(`   时间: ${data[0].date}`);
        console.log(`   标题: ${data[0].title}`);
        console.log(`   公司: ${data[0].related_enterprise}`);
    } else {
        console.log('   ⚠️  未提取到数据，请检查页面是否正确显示表格。');
    }

    console.log('\n==================================================');
    console.log('   🎉 配置完成！');
    console.log('==================================================');
    console.log('浏览器将在 5 秒后关闭...');

    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
    db.close();
    process.exit(0);
}

setupAndScrape().catch(err => {
    console.error('❌ 发生错误:', err);
});
