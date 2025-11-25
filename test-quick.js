const puppeteer = require('puppeteer');
async function test() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://www.qyyjt.cn/combination/20250603164207', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: 'test.png' });
    console.log('URL:', page.url());
    console.log('Screenshot saved');
    await new Promise(r => setTimeout(r, 10000));
    await browser.close();
}
test();
