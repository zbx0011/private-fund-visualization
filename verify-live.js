const puppeteer = require('puppeteer');

async function verifyLive() {
    console.log('🔍 Verifying live website...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        console.log('Go to http://172.245.53.67:3000/');
        await page.goto('http://172.245.53.67:3000/', { waitUntil: 'networkidle0', timeout: 30000 });

        await new Promise(r => setTimeout(r, 2000));

        await page.screenshot({ path: 'live-verify-home.png', fullPage: true });
        console.log('📸 Screenshot saved to live-verify-home.png');

        const content = await page.content();
        if (content.includes('概览') || content.includes('总资产')) {
            console.log('✅ SUCCESS: Found "概览" or "总资产" on the page!');
        } else {
            console.log('❌ FAILURE: Did NOT find "概览" or "总资产" on the page.');
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await browser.close();
    }
}

verifyLive();
