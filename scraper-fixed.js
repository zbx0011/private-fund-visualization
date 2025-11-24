const puppeteer = require('puppeteer');
const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'data', 'funds.db'));
// 清空旧数据并重新创建表
db.exec(`DROP TABLE IF EXISTS external_monitor`);
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
    console.log('🚀 启动爬虫（支持登录 - 修复字段映射）\n');
    
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    try {
        console.log('📄 访问目标页面...');
        await page.goto('https://www.qyyjt.cn/combination/20250603164207');
        await new Promise(r => setTimeout(r, 3000));
        
        const needLogin = page.url().includes('login');
        
        if (needLogin) {
            console.log('🔐 开始登录...');
            const tabs = await page.$$('div[role="tab"]');
            for (const tab of tabs) {
                const text = await page.evaluate(el => el.textContent, tab);
                if (text.includes('账户密码登录')) {
                    await tab.click();
                    break;
                }
            }
            await new Promise(r => setTimeout(r, 1000));
            
            const phoneInput = await page.$('input[placeholder*="手机"], input[type="text"]');
            await phoneInput.type('15622266864');
            await new Promise(r => setTimeout(r, 500));
            
            const pwdInput = await page.$('input[type="password"]');
            await pwdInput.type('a511325678');
            await new Promise(r => setTimeout(r, 500));
            
            const buttons = await page.$$('button');
            for (const button of buttons) {
                const text = await page.evaluate(el => el.textContent, button);
                if (text.includes('登录')) {
                    await button.click();
                    break;
                }
            }
            await new Promise(r => setTimeout(r, 5000));
            
            await page.goto('https://www.qyyjt.cn/combination/20250603164207');
            await new Promise(r => setTimeout(r, 3000));
        }
        
        console.log('📑 点击"最新动态"...');
        const allElements = await page.$$('*');
        for (const el of allElements) {
            const text = await page.evaluate(e => e.textContent, el);
            if (text && text.includes('最新动态')) {
                await el.click();
                await new Promise(r => setTimeout(r, 2000));
                break;
            }
        }
        
        await new Promise(r => setTimeout(r, 3000));
        
        console.log('📊 提取数据（修复字段映射）...');
        await page.screenshot({ path: 'data-page.png', fullPage: true });
        
        const data = await page.evaluate(() => {
            const results = [];
            const rows = Array.from(document.querySelectorAll('table tr, .el-table__row'));
            
            for (const row of rows) {
                const cells = Array.from(row.querySelectorAll('td'));
                
                // 表格列: 序号|更新日期|企业名称|标题|类型|重要性|正负面|来源
                if (cells.length >= 8) {
                    const record = {
                        date: cells[1]?.textContent?.trim() || '',           // 更新日期
                        title: cells[3]?.textContent?.trim() || '',          // 标题
                        summary: '查看',
                        source: cells[7]?.textContent?.trim() || '',         // 来源
                        related_enterprise: cells[2]?.textContent?.trim() || '', // 企业名称
                        importance: cells[5]?.textContent?.trim() || '',     // 重要性
                        sentiment: cells[6]?.textContent?.trim() || '',      // 正负面
                        level1_category: cells[4]?.textContent?.trim() || '', // 类型（一级）
                        level2_category: '',
                        url: ''
                    };
                    
                    if (record.title && record.title !== '标题') {
                        results.push(record);
                    }
                }
            }
            return results;
        });
        
        console.log(`✅ 提取到 ${data.length} 条记录`);
        console.log('样例数据:', JSON.stringify(data[0], null, 2));
        
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
            console.log(`💾 已保存 ${data.length} 条到数据库\n`);
        }
        
        console.log('浏览器将在10秒后关闭...');
        await new Promise(r => setTimeout(r, 10000));
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
    } finally {
        await browser.close();
        db.close();
    }
}
scrapeWithLogin();
