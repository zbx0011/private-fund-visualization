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
    console.log('   企业预警通爬虫 - 智能配置模式');
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
    
    console.log('\n 请在浏览器中操作： ');
    console.log('--------------------------------------------------');
    console.log('  1. 请手动登录');
    console.log('  2. 登录后，请点击【最新动态】标签');
    console.log('  3. 等待数据表格出现');
    console.log('--------------------------------------------------');
    console.log(' 脚本正在自动监视页面状态，一旦检测到数据会自动保存...\n');

    // 循环检测，直到发现数据
    let checks = 0;
    const maxChecks = 180; // 3分钟超时
    
    while (checks < maxChecks) {
        checks++;
        process.stdout.write(`\r 正在等待数据出现... (${checks}/${maxChecks})`);
        
        try {
            // 检测是否有数据行
            const hasData = await page.evaluate(() => {
                // 检查表格行
                const rows = document.querySelectorAll('table tbody tr');
                if (rows.length > 0) return true;
                
                // 检查Element UI表格行
                const elRows = document.querySelectorAll('.el-table__row');
                if (elRows.length > 0) return true;
                
                return false;
            });

            if (hasData) {
                console.log('\n\n 检测到数据表格！');
                
                // 保存Cookies
                console.log('3. 正在保存登录状态...');
                const cookies = await page.cookies();
                fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
                console.log('    Cookies 已保存');
                
                // 抓取数据
                console.log('4. 正在提取数据...');
                const data = await page.evaluate(() => {
                    const results = [];
                    let rows = Array.from(document.querySelectorAll('table tbody tr'));
                    if (rows.length === 0) rows = Array.from(document.querySelectorAll('.el-table__row'));
                    
                    for (const row of rows) {
                        const cells = Array.from(row.querySelectorAll('td'));
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
                            if (record.title && !record.title.includes('标题')) {
                                results.push(record);
                            }
                        }
                    }
                    return results;
                });
                
                console.log(`    成功提取到 ${data.length} 条数据`);
                
                // 保存到数据库
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
                    console.log(`    已保存 ${count} 条记录到数据库`);
                    console.log(`   [预览] ${data[0].date} - ${data[0].title}`);
                }
                
                console.log('\n 配置成功！浏览器将在3秒后关闭。');
                await new Promise(r => setTimeout(r, 3000));
                await browser.close();
                db.close();
                process.exit(0);
            }
        } catch (e) {
            // 忽略检测过程中的错误
        }
        
        // 等待1秒再次检测
        await new Promise(r => setTimeout(r, 1000));
    }
    
    console.log('\n 超时：未检测到数据。请重试。');
    await browser.close();
    db.close();
}

autoDetectLogin();
