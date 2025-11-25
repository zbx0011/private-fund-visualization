const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    console.log('正在打开页面...');
    await page.goto('https://www.qyyjt.cn/combination/20250603164207');
    await new Promise(r => setTimeout(r, 5000));
    const url = page.url();
    console.log('当前URL:', url);
    if (url.includes('login')) {
        console.log('需要登录！');
    } else {
        console.log('无需登录，页面已加载');
    }
    await page.screenshot({ path: 'debug.png', fullPage: true });
    console.log('截图已保存到 debug.png');
    
    // 分析页面结构
    const pageInfo = await page.evaluate(() => {
        return {
            tables: document.querySelectorAll('table').length,
            elTables: document.querySelectorAll('.el-table').length,
            rows: document.querySelectorAll('tr').length,
            hasData: document.body.innerText.includes('企业预警通')
        };
    });
    console.log('页面信息:', pageInfo);
    
    console.log('浏览器将在10秒后关闭...');
    await new Promise(r => setTimeout(r, 10000));
    await browser.close();
})();
