const puppeteer = require('puppeteer');
const Database = require('better-sqlite3');
const path = require('path');
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
async function scrapeManualLogin() {
    console.log('🚀 启动爬虫（手动登录版）\n');
    console.log('⚠️  浏览器打开后，请手动完成登录操作');
    console.log('   登录完成后，脚本会自动继续...\n');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null
    });
    const page = await browser.newPage();
    
    try {
        console.log('📄 打开登录页面...');
        await page.goto('https://www.qyyjt.cn/login');
        
        console.log('\n🖱️  请在浏览器中手动登录:');
        console.log('   1. 点击"账户密码登录"');
        console.log('   2. 输入手机号: 15622266864');
        console.log('   3. 输入密码: a511325678');
        console.log('   4. 点击登录按钮');
        console.log('\n⏳ 等待您完成登录（60秒）...');
        
        // 等待60秒让用户手动登录
        await new Promise(r => setTimeout(r, 60000));
        
        console.log('\n📄 访问数据页面...');
        await page.goto('https://www.qyyjt.cn/combination/20250603164207');
        await new Promise(r => setTimeout(r, 3000));
        
        // 点击"最新动态"
        console.log('📑 点击"最新动态"...');
        await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('*'));
            for (const el of elements) {
                if (el.textContent && el.textContent.includes('最新动态')) {
                    el.click();
                    break;
                }
            }
        });
        
        await new Promise(r => setTimeout(r, 5000));
        await page.screenshot({ path: 'final-data.png' });
        
        console.log('📊 开始提取数据...');
        const data = await page.evaluate(() => {
            const results = [];
            const rows = Array.from(document.querySelectorAll('table tbody tr'));
            
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
            console.log(`💾 已保存 ${data.length} 条到数据库`);
            
            // 显示前3条
            console.log('\n前3条数据:');
            data.slice(0, 3).forEach((item, i) => {
                console.log(`${i+1}. [${item.date}] ${item.title}`);
            });
        } else {
            console.log('⚠️  未找到数据，查看 final-data.png');
        }
        
        console.log('\n浏览器将在10秒后关闭...');
        await new Promise(r => setTimeout(r, 10000));
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
    } finally {
        await browser.close();
        db.close();
    }
}
scrapeManualLogin();
