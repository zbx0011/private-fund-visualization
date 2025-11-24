const puppeteer = require('puppeteer');
const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'data', 'funds.db'));
async function scrapeWithLogin() {
    console.log('🚀 启动爬虫（详细调试版）\n');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        slowMo: 100  // 减慢操作速度，便于观察
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    try {
        console.log('📄 访问目标页面...');
        await page.goto('https://www.qyyjt.cn/combination/20250603164207');
        await new Promise(r => setTimeout(r, 3000));
        await page.screenshot({ path: 'step1-initial.png' });
        
        const currentUrl = page.url();
        console.log(`   当前URL: ${currentUrl}`);
        
        if (currentUrl.includes('login')) {
            console.log('🔐 需要登录，开始登录流程...\n');
            
            // 等待页面完全加载
            await new Promise(r => setTimeout(r, 2000));
            await page.screenshot({ path: 'step2-login-page.png' });
            
            // 查找并点击"账户密码登录"标签
            console.log('步骤1: 查找"账户密码登录"标签...');
            const clicked = await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('*'));
                for (const el of elements) {
                    if (el.textContent && el.textContent.includes('账户密码登录')) {
                        el.click();
                        return true;
                    }
                }
                return false;
            });
            console.log(`   ${clicked ? '✓' : '✗'} 点击标签: ${clicked}`);
            await new Promise(r => setTimeout(r, 1500));
            await page.screenshot({ path: 'step3-after-tab-click.png' });
            
            // 填写手机号
            console.log('步骤2: 填写手机号...');
            await page.evaluate(() => {
                const inputs = Array.from(document.querySelectorAll('input'));
                for (const input of inputs) {
                    const placeholder = input.placeholder || '';
                    const type = input.type || '';
                    if (type !== 'password' && (placeholder.includes('手机') || placeholder.includes('账号'))) {
                        input.value = '15622266864';
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        return true;
                    }
                }
                return false;
            });
            console.log('   ✓ 已填写手机号');
            await new Promise(r => setTimeout(r, 1000));
            
            // 填写密码
            console.log('步骤3: 填写密码...');
            await page.evaluate(() => {
                const pwdInputs = document.querySelectorAll('input[type="password"]');
                if (pwdInputs.length > 0) {
                    pwdInputs[0].value = 'a511325678';
                    pwdInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                    return true;
                }
                return false;
            });
            console.log('   ✓ 已填写密码');
            await new Promise(r => setTimeout(r, 1000));
            await page.screenshot({ path: 'step4-filled-form.png' });
            
            // 点击登录按钮
            console.log('步骤4: 点击登录按钮...');
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                for (const btn of buttons) {
                    if (btn.textContent && btn.textContent.includes('登录')) {
                        btn.click();
                        return true;
                    }
                }
                return false;
            });
            console.log('   ✓ 已点击登录按钮');
            
            // 等待登录完成
            console.log('步骤5: 等待登录完成...');
            await new Promise(r => setTimeout(r, 8000));
            await page.screenshot({ path: 'step5-after-login.png' });
            
            const urlAfterLogin = page.url();
            console.log(`   登录后URL: ${urlAfterLogin}`);
            
            if (urlAfterLogin.includes('login')) {
                console.log('   ⚠️  似乎还在登录页，可能登录失败');
                console.log('   请查看 step5-after-login.png 截图');
            } else {
                console.log('   ✓ 登录成功！');
            }
        }
        
        console.log('\n📑 访问数据页面并点击"最新动态"...');
        await page.goto('https://www.qyyjt.cn/combination/20250603164207');
        await new Promise(r => setTimeout(r, 5000));
        await page.screenshot({ path: 'step6-data-page.png' });
        
        // 点击"最新动态"
        const foundTab = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('*'));
            for (const el of elements) {
                if (el.textContent && el.textContent.includes('最新动态')) {
                    el.click();
                    return true;
                }
            }
            return false;
        });
        console.log(`   ${foundTab ? '✓' : '✗'} 找到并点击"最新动态": ${foundTab}`);
        
        await new Promise(r => setTimeout(r, 5000));
        await page.screenshot({ path: 'step7-final-data.png' });
        
        console.log('\n📊 提取数据...');
        const data = await page.evaluate(() => {
            const results = [];
            const rows = Array.from(document.querySelectorAll('table tbody tr'));
            
            console.log(`找到 ${rows.length} 个表格行`);
            
            for (const row of rows) {
                const cells = Array.from(row.querySelectorAll('td'));
                console.log(`行有 ${cells.length} 个单元格`);
                
                if (cells.length >= 8) {
                    const record = {
                        date: cells[1]?.textContent?.trim(),
                        title: cells[3]?.textContent?.trim(),
                        source: cells[7]?.textContent?.trim(),
                        related_enterprise: cells[2]?.textContent?.trim(),
                        importance: cells[5]?.textContent?.trim(),
                        sentiment: cells[6]?.textContent?.trim(),
                        level1_category: cells[4]?.textContent?.trim()
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
            console.log('\n前3条数据预览:');
            data.slice(0, 3).forEach((item, i) => {
                console.log(`${i+1}. ${item.title}`);
            });
        } else {
            console.log('\n⚠️  未提取到数据');
            console.log('请检查截图文件:');
            console.log('  - step6-data-page.png (数据页面)');
            console.log('  - step7-final-data.png (点击最新动态后)');
        }
        
        console.log('\n浏览器将在30秒后关闭，请观察页面...');
        await new Promise(r => setTimeout(r, 30000));
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
        await page.screenshot({ path: 'error.png' });
    } finally {
        await browser.close();
        db.close();
    }
}
scrapeWithLogin();
