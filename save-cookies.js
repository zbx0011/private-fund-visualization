const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
async function saveCookies() {
    console.log('🔐 登录并保存cookies\n');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    });
    
    const page = await browser.newPage();
    
    await page.goto('https://www.qyyjt.cn/login');
    
    console.log('请在浏览器中手动登录...');
    console.log('登录完成后按回车键保存cookies');
    
    await new Promise(resolve => {
        process.stdin.once('data', () => resolve());
    });
    
    const cookies = await page.cookies();
    fs.writeFileSync('cookies.json', JSON.stringify(cookies, null, 2));
    
    console.log('✅ cookies已保存到 cookies.json');
    console.log('现在可以运行: node scraper-auto.js');
    
    await browser.close();
}
saveCookies();
