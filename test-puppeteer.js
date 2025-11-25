const puppeteer = require('puppeteer');
(async () => {
    try {
        console.log('Launching Puppeteer...');
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        console.log('Puppeteer launched successfully');
        const page = await browser.newPage();
        await page.goto('https://example.com');
        console.log('Page loaded');
        await browser.close();
    } catch (e) {
        console.error('Puppeteer failed:', e);
    }
})();
