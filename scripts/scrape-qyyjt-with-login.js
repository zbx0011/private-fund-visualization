/**
 * Web Scraper for qyyjt.cn with Login Support
 * 
 * Usage: 
 *   node scripts/scrape-qyyjt-with-login.js <URL> <username> <password>
 *   OR set QYYJT_USERNAME and QYYJT_PASSWORD in .env
 */

const puppeteer = require('puppeteer');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');
const db = new Database(dbPath);

// Initialize table
db.exec(`
    CREATE TABLE IF NOT EXISTS external_monitor (
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

async function login(page, username, password) {
    console.log(`🔑 Logging in as ${username}...`);

    try {
        // Wait for inputs
        const usernameSelector = 'input[placeholder*="手机"], input[placeholder*="账号"], input[type="text"]';
        const passwordSelector = 'input[placeholder*="密码"], input[type="password"]';
        const submitSelector = '.login-btn, button[type="submit"], .submit';

        await page.waitForSelector(usernameSelector, { timeout: 10000 });

        await page.type(usernameSelector, username);
        await page.type(passwordSelector, password);

        await page.click(submitSelector);

        console.log('   ✓ Submitted login form');

        // Wait for navigation after login
        await page.waitForNavigation({
            waitUntil: 'networkidle2',
            timeout: 15000
        }).catch(() => {
            console.log('   ⚠️  Navigation timeout, checking if login succeeded...');
        });

        console.log(`✅ Login successful (assumed)!\n`);
        return true;

    } catch (error) {
        console.error(`❌ Login failed: `, error.message);
    }
}

/**
 * Scrape data from qyyjt.cn (with login)
 */
async function scrapeQyyjt(url, username, password) {
    console.log(`🚀 Starting scraper for: ${url}`);

    const browser = await puppeteer.launch({
        headless: false, // Show browser for manual interaction
        defaultViewport: null, // Use full window size
        userDataDir: './user_data', // PERSIST SESSION
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', // USE EDGE
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--start-maximized'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Monitor network responses to find the data API
        const capturedData = [];
        page.on('response', async response => {
            const request = response.request();
            if (request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
                try {
                    const contentType = response.headers()['content-type'];
                    if (contentType && contentType.includes('application/json')) {
                        const json = await response.json();
                        // Check if this JSON looks like our data
                        // Look for known keywords or structure
                        const str = JSON.stringify(json);
                        if (str.includes('新闻') || str.includes('公告') || str.includes('list')) {
                            console.log(`📡 Captured API response from: ${request.url()}`);
                            // console.log('   Data preview:', str.substring(0, 200));
                            capturedData.push({ url: request.url(), data: json });
                        }
                    }
                } catch (e) {
                    // Ignore errors (e.g. 304 Not Modified, empty body)
                }
            }
        });

        console.log(`📄 Navigating to target page: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait a bit for potential redirects
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Check if we need to log in
        let needsLogin = await page.evaluate(() => {
            return location.href.includes('login') || !!document.querySelector('input[type="password"]') || document.title.includes('登录');
        });

        if (needsLogin) {
            console.log('\n🛑 Authentication required!');

            if (username && password) {
                console.log('🔄 Attempting automatic login...');
                await login(page, username, password);
            } else {
                // Check if fields are already filled (e.g. by autofill or user)
                const hasFilledInputs = await page.evaluate(() => {
                    const user = document.querySelector('input[placeholder*="手机"], input[placeholder*="账号"], input[type="text"]');
                    const pass = document.querySelector('input[placeholder*="密码"], input[type="password"]');
                    return user && user.value && pass && pass.value;
                });

                if (hasFilledInputs) {
                    console.log('👀 Detected filled login fields. Attempting to click login...');
                    const submitSelector = '.login-btn, button[type="submit"], .submit';
                    await page.click(submitSelector);
                    await new Promise(r => setTimeout(r, 3000)); // Wait for click to register
                }
            }

            // Re-check login status
            needsLogin = await page.evaluate(() => {
                return location.href.includes('login') || !!document.querySelector('input[type="password"]') || document.title.includes('登录');
            });

            if (needsLogin) {
                console.log('⚠️  Automatic login failed or not configured.');
                console.log('👉 Please manually log in to the website in the opened browser window.');
                console.log('⏳ Waiting for you to log in and navigate to the data page...');

                // Wait until we are on the target page and table exists
                await page.waitForFunction(() => {
                    return !location.href.includes('login') && !document.title.includes('登录') && document.querySelector('table, .el-table, .table-container, .ant-table');
                }, { timeout: 300000 }); // Wait up to 5 minutes

                console.log('✅ Login detected! Proceeding with scraping...');
            } else {
                console.log('✅ Login successful!');
            }
        } else {
            console.log('✅ Already logged in (session restored).');
        }

        // Wait for content to load
        console.log(`⏳ Waiting for table content (checking for "日期")...`);
        try {
            await page.waitForFunction(() => {
                return document.body.innerText.includes('日期');
            }, { timeout: 30000 });
            console.log('✅ Table content detected!');
        } catch (e) {
            console.log('⚠️  Table content "日期" not found. Checking if we are on login page...');
            // Double check if we got redirected to login page
            needsLogin = await page.evaluate(() => {
                return location.href.includes('login') || !!document.querySelector('input[type="password"]') || document.title.includes('登录');
            });

            if (needsLogin) {
                console.log('\n🛑 Redirected to login page!');
                console.log('👉 Please manually log in to the website in the opened browser window.');
                console.log('⏳ Waiting for you to log in and navigate to the data page...');

                await page.waitForFunction(() => {
                    return !location.href.includes('login') && !document.title.includes('登录') && document.body.innerText.includes('日期');
                }, { timeout: 300000 });
                console.log('✅ Login detected! Proceeding...');
            } else {
                console.log('⚠️  Still not found "日期", waiting a bit more...');
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }

        // Additional wait for dynamic content to settle
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Scroll to load more data (infinite scroll)
        console.log(`📜 Scrolling to load more data...`);
        let previousCount = 0;
        let unchangedCount = 0;
        const maxScrollAttempts = 10;

        for (let i = 0; i < maxScrollAttempts; i++) {
            // Check current API data count
            const currentApiData = capturedData.filter(item => item.url.includes('getInfoList'));
            const currentCount = currentApiData.reduce((sum, item) => {
                return sum + (item.data?.data?.items?.length || 0);
            }, 0);

            console.log(`   Scroll ${i + 1}: Captured ${currentCount} items from ${currentApiData.length} API calls`);

            // If no new data in last 2 scrolls, stop
            if (currentCount === previousCount) {
                unchangedCount++;
                if (unchangedCount >= 2) {
                    console.log('   No more new data, stopping scroll');
                    break;
                }
            } else {
                unchangedCount = 0;
            }
            previousCount = currentCount;

            // Scroll to bottom
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });

            // Wait for new data to load
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log(`✅ Finished scrolling, total API calls captured: ${capturedData.filter(item => item.url.includes('getInfoList')).length}`);

        // Save HTML for debugging
        const html = await page.content();
        fs.writeFileSync('page_debug.html', html);
        console.log(`   📄 Saved page HTML to page_debug.html (Length: ${html.length})`);

        // Process captured API data
        const data = [];
        const getInfoListResponses = capturedData.filter(item =>
            item.url.includes('/information/riskMonitor/getInfoList')
        );

        console.log(`📊 Processing ${getInfoListResponses.length} API responses...`);

        getInfoListResponses.forEach(response => {
            if (response.data && response.data.data && response.data.data.items) {
                const items = response.data.data.items;
                items.forEach(item => {
                    const mainRelated = item.related && item.related.length > 0 ? item.related[0] : {};

                    data.push({
                        date: item.date ? item.date.replace(/(\d{4})(\d{2})(\d{2}).*/, '$1-$2-$3') : '',
                        title: item.title || '',
                        summary: mainRelated.shortCompanyName || mainRelated.companyName || '查看',
                        source: item.originalSource || '',
                        related_enterprise: mainRelated.shortCompanyName || mainRelated.companyName || '',
                        importance: mainRelated.importanceABS || '',
                        sentiment: mainRelated.negative === '-1' ? '负面' : (mainRelated.negative === '1' ? '正面' : '中性'),
                        level1_category: item.firstLevelName || '',
                        level2_category: mainRelated.lastLevelName || '',
                        url: item.originalUrl || ''
                    });
                });
            }
        });

        console.log(`✅ Extracted ${data.length} records from API data`);
        return data;

    } catch (error) {
        console.error(`❌ Error scraping data: `, error.message);
        throw error;
    } finally {
        await browser.close();
    }
}

/**
 * Parse date string
 */
function parseDate(dateStr) {
    if (dateStr.match(/^\d{2}-\d{2}$/)) {
        const year = new Date().getFullYear();
        return `${year}-${dateStr}`;
    }
    return dateStr;
}

/**
 * Save records to database
 */
function saveRecords(records) {
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO external_monitor(
            date, title, summary, source, related_enterprise,
            importance, sentiment, level1_category, level2_category, url
        ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let insertedCount = 0;

    for (const record of records) {
        try {
            const result = stmt.run(
                parseDate(record.date),
                record.title,
                record.summary,
                record.source,
                record.related_enterprise,
                record.importance,
                record.sentiment,
                record.level1_category,
                record.level2_category,
                record.url
            );

            if (result.changes > 0) {
                insertedCount++;
            }
        } catch (error) {
            console.error(`Error inserting record: `, error.message);
        }
    }

    console.log(`💾 Inserted / Updated ${insertedCount} records in database`);
    return insertedCount;
}

/**
 * Main function
 */
async function main() {
    const targetUrl = process.argv[2] || 'https://www.qyyjt.cn/combination/20250603164207';
    const username = process.argv[3] || process.env.QYYJT_USERNAME;
    const password = process.argv[4] || process.env.QYYJT_PASSWORD;

    try {
        console.log(`\n========================================`);
        console.log(`  企业预警通 Data Scraper (with Login)`);
        console.log(`========================================\n`);

        if (!username || !password) {
            console.log('⚠️  WARNING: No login credentials provided!');
            console.log('   Usage: node scrape-qyyjt-with-login.js <URL> <username> <password>');
            console.log('   Or set QYYJT_USERNAME and QYYJT_PASSWORD in .env\n');
        }

        const records = await scrapeQyyjt(targetUrl, username, password);

        if (records.length > 0) {
            const inserted = saveRecords(records);
            console.log(`\n✅ Scraping completed successfully!`);
            console.log(`   Total records: ${records.length}`);
            console.log(`   Saved to database: ${inserted}`);
        } else {
            console.log('\n⚠️  No records found.');
            console.log('   Check page-screenshot.png to debug');
        }
    } catch (error) {
        console.error('\n❌ Scraping failed:', error.message);
    } finally {
        db.close();
    }
}

// Run main function
if (require.main === module) {
    main();
}

module.exports = { scrapeQyyjt, saveRecords };
