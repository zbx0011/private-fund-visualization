const puppeteer = require('puppeteer');
const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'data', 'funds.db'));
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
async function scrapeWithLogin() {
    console.log('🚀 启动爬虫（支持登录）\n');
    
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    try {
        console.log('📄 访问目标页面...');
        await page.goto('https://www.qyyjt.cn/combination/20250603164207');
        await new Promise(r => setTimeout(r, 3000));
        
        const needLogin = page.url().includes('login');
        
        if (needLogin) {
            console.log('🔐 检测到登录页面，开始登录...');
            
            // 点击"账户密码登录"
            const tabs = await page.$$('div[role="tab"]');
            for (const tab of tabs) {
                const text = await page.evaluate(el => el.textContent, tab);
                if (text.includes('账户密码登录')) {
                    await tab.click();
                    break;
                }
            }
            await new Promise(r => setTimeout(r, 1000));
            
            console.log('   输入手机号...');
            const phoneInput = await page.$('input[placeholder*="手机"], input[type="text"]');
            await phoneInput.type('15622266864');
            await new Promise(r => setTimeout(r, 500));
            
            console.log('   输入密码...');
            const pwdInput = await page.$('input[type="password"]');
            await pwdInput.type('a511325678');
            await new Promise(r => setTimeout(r, 500));
            
            console.log('   点击登录...');
            const buttons = await page.$$('button');
            for (const button of buttons) {
                const text = await page.evaluate(el => el.textContent, button);
                if (text.includes('登录') || text.includes('登 录')) {
                    await button.click();
                    break;
                }
            }
            await new Promise(r => setTimeout(r, 5000));
            
            console.log('✅ 登录完成！\n');
            
            console.log('📄 访问数据页面...');
            await page.goto('https://www.qyyjt.cn/combination/20250603164207');
            await new Promise(r => setTimeout(r, 3000));
        }
        
        // 点击"最新动态"标签
        console.log('📑 查找并点击"最新动态"...');
        const allElements = await page.$$('*');
        for (const el of allElements) {
            const text = await page.evaluate(e => e.textContent, el);
            if (text && (text.includes('最新动态') || text.includes('预警动态'))) {
                console.log(`   找到: ${text.trim()}`);
                await el.click();
                await new Promise(r => setTimeout(r, 2000));
                break;
            }
        }
        
        console.log('⏳ 等待数据加载...');
        await new Promise(r => setTimeout(r, 3000));
        
        // 提取数据
        console.log('📊 开始提取数据...');
        await page.screenshot({ path: 'data-page.png', fullPage: true });
        console.log('   截图已保存到 data-page.png');
        
        const data = await page.evaluate(() => {
            const results = [];
            const rows = Array.from(document.querySelectorAll('table tr, .el-table__row'));
            
            for (const row of rows) {
                const cells = Array.from(row.querySelectorAll('td'));
                if (cells.length >= 7) {
                    const record = {
                        date: cells[0]?.textContent?.trim() || '',
                        title: cells[1]?.textContent?.trim() || '',
                        summary: '查看',
                        source: cells[2]?.textContent?.trim() || '',
                        related_enterprise: cells[3]?.textContent?.trim() || '',
                        importance: cells[4]?.textContent?.trim() || '',
                        sentiment: cells[5]?.textContent?.trim() || '',
                        level1_category: cells[6]?.textContent?.trim() || '',
                        level2_category: cells[7]?.textContent?.trim() || '',
                        url: ''
                    };
                    if (record.title) {
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
            
            let count = 0;
            for (const record of data) {
                stmt.run(
                    record.date, record.title, record.summary, record.source,
                    record.related_enterprise, record.importance, record.sentiment,
                    record.level1_category, record.level2_category, record.url
                );
                count++;
            }
            console.log(`💾 已保存 ${count} 条记录到数据库\n`);
            console.log('✅ 爬取成功！数据已保存。');
        } else {
            console.log('⚠️  未找到数据表格');
            console.log('   请查看 data-page.png 截图，可能需要调整选择器');
        }
        
        console.log('\n浏览器将在15秒后关闭...');
        await new Promise(r => setTimeout(r, 15000));
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
        console.error(error.stack);
    } finally {
        await browser.close();
        db.close();
    }
}
scrapeWithLogin();
