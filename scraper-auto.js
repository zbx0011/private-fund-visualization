const puppeteer = require('puppeteer');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data', 'funds.db');
const cookiesPath = path.join(__dirname, 'cookies.json');
const db = new Database(dbPath);

async function scrapeAuto() {
    console.log('🚀 启动自动爬虫 (v2.0 - 全量抓取)...');

    const browser = await puppeteer.launch({
        headless: false,
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        args: ['--no-sandbox', '--window-size=1920,1080']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        // 1. 加载Cookies
        if (fs.existsSync(cookiesPath)) {
            const cookies = JSON.parse(fs.readFileSync(cookiesPath));
            await page.setCookie(...cookies);
            console.log('✓ Cookies已加载');
        } else {
            console.error('❌ 未找到Cookies文件，请先运行 setup-smart.js');
            return;
        }

        // 2. 访问页面
        console.log('📄 正在访问数据页面...');
        await page.goto('https://www.qyyjt.cn/combination/20250603164207', {
            waitUntil: 'networkidle2'
        });
        console.log(`   当前URL: ${page.url()}`);
        console.log(`   页面标题: ${await page.title()}`);
        await new Promise(r => setTimeout(r, 5000));

        // 3. 点击"最新动态"
        console.log('📑 点击"最新动态"...');
        const clicked = await page.evaluate(() => {
            const all = Array.from(document.querySelectorAll('*'));
            for (const el of all) {
                if (el.textContent === '最新动态' && el.tagName === 'DIV') {
                    el.click();
                    return true;
                }
            }
            return false;
        });

        if (!clicked) {
            console.log('⚠️ 未找到"最新动态"标签，尝试直接抓取...');
        }

        await new Promise(r => setTimeout(r, 5000));

        // 截图验证
        await page.screenshot({ path: 'debug-scrape.png', fullPage: true });
        console.log('📸 已保存截图 debug-scrape.png');

        // 4. 提取数据
        console.log('📊 正在提取数据...');
        const data = await page.evaluate(() => {
            const results = [];
            // 尝试获取所有行
            let rows = Array.from(document.querySelectorAll('table tbody tr'));
            if (rows.length === 0) rows = Array.from(document.querySelectorAll('.el-table__row'));

            console.log(`找到 ${rows.length} 行数据`);

            for (const row of rows) {
                const cells = Array.from(row.querySelectorAll('td'));
                // 宽松模式：只要有足够的列就抓取
                if (cells.length >= 7) {
                    // 根据截图推断的列顺序：
                    // [0]日期 [1]标题 [2]关联企业 [3]分类 [4]重要性 [5]正负面 [6]来源
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

                    // 过滤掉无效行
                    if (record.title && !record.title.includes('标题') && record.date) {
                        results.push(record);
                    }
                }
            }
            return results;
        });

        console.log(`✅ 提取到 ${data.length} 条记录`);

        if (data.length > 0) {
            // 清空旧数据！确保前端显示完全一致
            db.prepare('DELETE FROM external_monitor').run();
            console.log('🗑️  已清空旧数据');

            const stmt = db.prepare(`
                INSERT INTO external_monitor 
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
            console.log(`💾 已保存 ${count} 条新记录`);

            // 打印预览
            console.log('\n数据预览:');
            data.forEach((item, i) => {
                console.log(`${i + 1}. [${item.date}] ${item.related_enterprise} - ${item.title.substring(0, 20)}...`);
            });
        } else {
            console.log('⚠️  未提取到数据，请检查 debug-scrape.png');
        }

    } catch (error) {
        console.error('❌ 错误:', error.message);
    } finally {
        await browser.close();
        db.close();
    }
}

scrapeAuto();
