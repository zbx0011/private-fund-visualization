const puppeteer = require('puppeteer');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data', 'funds.db');
const db = new Database(dbPath);

async function scrapeManualOnce() {
    console.log('\n==================================================');
    console.log('   企业预警通 - 手动辅助抓取 (一次性修复)');
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
    console.log('  1. 请手动登录 (如果需要)');
    console.log('  2. 登录后，请点击【最新动态】标签');
    console.log('  3. 确保能看到【多条】数据 (如鸣石基金、恒立实业等)');
    console.log('--------------------------------------------------');
    console.log('🤖 脚本正在自动监视页面状态...\n');

    let checks = 0;
    const maxChecks = 600; // 10分钟

    while (checks < maxChecks) {
        checks++;
        process.stdout.write(`\r⏳ 正在等待数据... (${checks}/${maxChecks})`);

        try {
            const result = await page.evaluate(() => {
                // 查找表格行
                let rows = Array.from(document.querySelectorAll('table tbody tr'));
                if (rows.length === 0) rows = Array.from(document.querySelectorAll('.el-table__row'));

                if (rows.length < 2) return null; // 至少要看到2条数据才算成功

                const data = [];
                for (const row of rows) {
                    const cells = Array.from(row.querySelectorAll('td'));
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

                        if (record.title && !record.title.includes('标题') && record.date) {
                            data.push(record);
                        }
                    }
                }
                return data.length > 0 ? data : null;
            });

            if (result && result.length > 0) {
                console.log(`\n\n✅ 检测到 ${result.length} 条数据！`);

                // 清空旧数据
                console.log('3. 正在清空旧数据...');
                db.prepare('DELETE FROM external_monitor').run();

                // 保存数据
                console.log(`4. 正在保存新数据...`);
                const stmt = db.prepare(`
                    INSERT INTO external_monitor 
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

                console.log('\n🎉 修复完成！浏览器将在3秒后关闭。');
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

scrapeManualOnce();
