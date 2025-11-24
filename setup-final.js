const puppeteer = require('puppeteer');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

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

async function autoDetectLogin() {
    console.log('\n==================================================');
    console.log('   企业预警通爬虫 - 最终修复版');
    console.log('==================================================\n');

    console.log('1. 正在启动浏览器...');
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    console.log('2. 正在打开网站...');
    await page.goto('https://www.qyyjt.cn/combination/20250603164207');

    console.log('\n🔴🔴🔴 请在浏览器中操作： 🔴🔴🔴');
    console.log('--------------------------------------------------');
    console.log('  1. 请手动登录');
    console.log('  2. 登录后，请点击【最新动态】标签');
    console.log('  3. 等待数据表格出现');
    console.log('--------------------------------------------------');
    console.log('🤖 脚本正在自动监视页面状态...\n');

    let checks = 0;
    const maxChecks = 300; // 5分钟

    while (checks < maxChecks) {
        checks++;
        process.stdout.write(`\r⏳ 正在等待数据... (${checks}/${maxChecks})`);

        try {
            const result = await page.evaluate(() => {
                // 查找表格行
                const rows = Array.from(document.querySelectorAll('table tbody tr'));
                if (rows.length === 0) return null;

                const data = [];
                for (const row of rows) {
                    const cells = Array.from(row.querySelectorAll('td'));
                    // 截图显示有7列：日期|标题|相关企业|分类|重要性|正负面|来源
                    if (cells.length >= 7) {
                        const record = {
                            date: cells[0]?.textContent?.trim() || '',
                            title: cells[1]?.textContent?.trim() || '',
                            related_enterprise: cells[2]?.textContent?.trim() || '',
                            level1_category: cells[3]?.textContent?.trim() || '',
                            importance: cells[4]?.textContent?.trim() || '',
                            sentiment: cells[5]?.textContent?.trim() || '',
                            source: cells[6]?.textContent?.trim() || '',
                            summary: '查看',
                            level2_category: '',
                            url: ''
                        };

                        // 简单的有效性检查
                        if (record.title && !record.title.includes('标题') && record.date) {
                            data.push(record);
                        }
                    }
                }
                return data.length > 0 ? data : null;
            });

            if (result && result.length > 0) {
                console.log('\n\n✅ 检测到数据表格！');

                // 保存Cookies
                console.log('3. 正在保存登录状态...');
                const cookies = await page.cookies();
                fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
                console.log('   ✅ Cookies 已保存');

                // 保存数据
                console.log(`4. 正在保存 ${result.length} 条数据...`);
                const stmt = db.prepare(`
                    INSERT OR REPLACE INTO external_monitor 
                    (date, title, summary, source, related_enterprise, importance, sentiment, level1_category, level2_category, url)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);

                let count = 0;
                for (const record of result) {
                    stmt.run(
                        record.date, record.title, record.summary, record.source,
                        record.related_enterprise, record.importance, record.sentiment,
                        record.level1_category, record.level2_category, record.url
                    );
                    count++;
                }
                console.log(`   💾 已保存 ${count} 条记录到数据库`);
                console.log(`   [预览] ${result[0].date} - ${result[0].title}`);

                console.log('\n🎉 全部完成！浏览器将在3秒后关闭。');
                await new Promise(r => setTimeout(r, 3000));
                await browser.close();
                db.close();
                process.exit(0);
            }
        } catch (e) {
            // ignore
        }

        await new Promise(r => setTimeout(r, 1000));
    }

    console.log('\n❌ 超时。');
    await browser.close();
    db.close();
}

autoDetectLogin();
