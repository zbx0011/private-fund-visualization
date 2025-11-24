const puppeteer = require('puppeteer');
const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');
const db = new Database(path.join(__dirname, 'data', 'funds.db'));
db.exec(`DROP TABLE IF EXISTS external_monitor`);
db.exec(`
    CREATE TABLE external_monitor (
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
async function scrapeWithUserData() {
    console.log('🚀 使用Edge用户数据启动（保持登录状态）\n');
    
    const userDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        userDataDir: userDataDir,
        defaultViewport: null,
        args: ['--no-first-run', '--no-default-browser-check']
    });
    
    const pages = await browser.pages();
    const page = pages[0] || await browser.newPage();
    
    try {
        console.log('📄 访问数据页面...');
        await page.goto('https://www.qyyjt.cn/combination/20250603164207');
        await new Promise(r => setTimeout(r, 5000));
        
        const currentUrl = page.url();
        if (currentUrl.includes('login')) {
            console.log('⚠️  需要登录，请手动登录后按回车继续...');
            await new Promise(resolve => {
                process.stdin.once('data', () => resolve());
            });
            await page.goto('https://www.qyyjt.cn/combination/20250603164207');
            await new Promise(r => setTimeout(r, 3000));
        } else {
            console.log('✓ 已登录状态');
        }
        
        console.log('\n📑 查找并点击"最新动态"标签...');
        
        // 多种方式尝试点击
        const clicked = await page.evaluate(() => {
            // 方法1: 查找包含"最新动态"的div
            const tabs = Array.from(document.querySelectorAll('div'));
            for (const tab of tabs) {
                if (tab.textContent === '最新动态' || tab.innerText === '最新动态') {
                    console.log('找到最新动态标签，点击中...');
                    tab.click();
                    return true;
                }
            }
            
            // 方法2: 查找特定class
            const tabElements = document.querySelectorAll('[class*="tab"]');
            for (const el of tabElements) {
                if (el.textContent.includes('最新动态')) {
                    el.click();
                    return true;
                }
            }
            
            return false;
        });
        
        console.log(clicked ? '   ✓ 已点击"最新动态"' : '   ✗ 未找到"最新动态"');
        
        console.log('⏳ 等待数据加载...');
        await new Promise(r => setTimeout(r, 5000));
        await page.screenshot({ path: 'final-page.png', fullPage: true });
        console.log('   📸 截图已保存到 final-page.png');
        
        console.log('\n📊 提取数据...');
        const data = await page.evaluate(() => {
            const results = [];
            const tables = document.querySelectorAll('table');
            
            console.log(`找到 ${tables.length} 个表格`);
            
            for (const table of tables) {
                const rows = Array.from(table.querySelectorAll('tbody tr'));
                console.log(`表格有 ${rows.length} 行`);
                
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
            }
            
            return results;
        });
        
        console.log(`✅ 提取到 ${data.length} 条记录`);
        
        if (data.length > 0) {
            const stmt = db.prepare(`
                INSERT OR REPLACE INTO external_monitor 
                (date, title, summary, source, related_enterprise, importance, sentiment, level1_category, level2_category, url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            for (const record of data) {
                stmt.run(
                    record.date, record.title, record.summary, record.source,
                    record.related_enterprise, record.importance, record.sentiment,
                    record.level1_category, record.level2_category, record.url
                );
            }
            
            console.log(`💾 已保存到数据库\n`);
            console.log('数据预览:');
            data.slice(0, 5).forEach((item, i) => {
                console.log(`${i+1}. [${item.date}] ${item.title.substring(0, 40)}...`);
            });
        } else {
            console.log('⚠️  未找到数据');
            console.log('   可能需要手动点击"最新动态"');
            console.log('   查看 final-page.png 确认页面状态');
        }
        
        console.log('\n浏览器将在20秒后关闭...');
        await new Promise(r => setTimeout(r, 20000));
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
    } finally {
        await browser.close();
        db.close();
    }
}
scrapeWithUserData();
