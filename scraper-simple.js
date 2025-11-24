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
async function scrapeCurrentPage() {
    console.log('🚀 连接到已打开的浏览器...\n');
    console.log('⚠️  请确保:');
    console.log('   1. 已经登录');
    console.log('   2. 已经打开数据页面');  
    console.log('   3. 已经点击了"最新动态"标签');
    console.log('   4. 看到了数据表格\n');
    console.log('按回车继续...');
    
    // 简单暂停，让用户准备
    await new Promise(resolve => {
        process.stdin.once('data', () => resolve());
    });
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null
    });
    const page = await browser.newPage();
    
    try {
        await page.goto('https://www.qyyjt.cn/combination/20250603164207');
        await new Promise(r => setTimeout(r, 3000));
        
        console.log('\n📸 截图当前页面...');
        await page.screenshot({ path: 'current-page.png', fullPage: true });
        
        console.log('📊 提取数据...');
        const data = await page.evaluate(() => {
            const results = [];
            
            // 尝试多种选择器
            let rows = Array.from(document.querySelectorAll('table tbody tr'));
            if (rows.length === 0) {
                rows = Array.from(document.querySelectorAll('.el-table__row'));
            }
            
            console.log(`找到 ${rows.length} 行`);
            
            for (const row of rows) {
                const cells = Array.from(row.querySelectorAll('td'));
                console.log(`行有 ${cells.length} 个单元格`);
                
                if (cells.length >= 7) {
                    // 根据截图：序号|更新日期|企业名称|标题|类型|重要性|正负面|来源
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
                        console.log(`提取: ${record.title.substring(0, 30)}...`);
                        results.push(record);
                    }
                }
            }
            return results;
        });
        
        console.log(`\n✅ 提取到 ${data.length} 条记录`);
        
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
            console.log('前5条数据:');
            data.slice(0, 5).forEach((item, i) => {
                console.log(`${i+1}. [${item.date}] ${item.title}`);
            });
        } else {
            console.log('⚠️  未找到数据');
            console.log('   请手动在浏览器中:');
            console.log('   1. 确认已登录');
            console.log('   2. 点击"最新动态"标签');
            console.log('   3. 等待数据加载');
            console.log('   然后重新运行脚本');
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
scrapeCurrentPage();
