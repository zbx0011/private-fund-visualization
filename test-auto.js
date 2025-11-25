const puppeteer = require('puppeteer');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
console.log('=== 脚本开始执行 ===');
const db = new Database(path.join(__dirname, 'data', 'funds.db'));
const cookiesPath = path.join(__dirname, 'cookies.json');
console.log('数据库路径:', path.join(__dirname, 'data', 'funds.db'));
console.log('Cookies路径:', cookiesPath);
console.log('Cookies存在:', fs.existsSync(cookiesPath));
async function scrapeAuto() {
    console.log('\n🚀 自动爬虫启动\n');
    
    const browser = await puppeteer.launch({ 
        headless: false,  // 改为false便于调试
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        args: ['--no-sandbox']
    });
    
    const page = await browser.newPage();
    
    try {
        // 加载cookies
        if (fs.existsSync(cookiesPath)) {
            const cookiesString = fs.readFileSync(cookiesPath, 'utf8');
            const cookies = JSON.parse(cookiesString);
            console.log(`✓ 加载了 ${cookies.length} 个cookies`);
            await page.setCookie(...cookies);
        } else {
            console.log('❌ cookies.json 不存在！');
            console.log('请先运行: node save-cookies.js');
            await browser.close();
            return;
        }
        
        console.log('📄 访问数据页面...');
        await page.goto('https://www.qyyjt.cn/combination/20250603164207', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });
        await new Promise(r => setTimeout(r, 3000));
        
        const currentUrl = page.url();
        console.log('当前URL:', currentUrl);
        
        if (currentUrl.includes('login')) {
            console.log('❌ cookies已过期，需要重新登录');
            await browser.close();
            return;
        }
        
        console.log('✓ 已登录');
        
        // 点击"最新动态"
        console.log('📑 点击"最新动态"...');
        await page.evaluate(() => {
            const all = Array.from(document.querySelectorAll('*'));
            for (const el of all) {
                if (el.textContent === '最新动态') {
                    el.click();
                    return;
                }
            }
        });
        await new Promise(r => setTimeout(r, 5000));
        
        // 提取数据
        console.log('📊 提取数据...');
        const data = await page.evaluate(() => {
            const results = [];
            const rows = Array.from(document.querySelectorAll('table tbody tr'));
            console.log(`找到${rows.length}行`);
            
            for (const row of rows) {
                const cells = Array.from(row.querySelectorAll('td'));
                if (cells.length >= 8) {
                    results.push({
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
                    });
                }
            }
            return results;
        });
        
        console.log(`✅ 提取到 ${data.length} 条记录`);
        
        if (data.length > 0) {
            console.log('前3条:');
            data.slice(0, 3).forEach((item, i) => {
                console.log(`  ${i+1}. ${item.title.substring(0, 40)}`);
            });
        }
        
        console.log('\n浏览器将在20秒后关闭...');
        await new Promise(r => setTimeout(r, 20000));
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
        console.error(error.stack);
    } finally {
        await browser.close();
        db.close();
        console.log('\n=== 脚本结束 ===');
    }
}
scrapeAuto().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
