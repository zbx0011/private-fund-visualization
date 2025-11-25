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

        await page.waitForSelector(usernameSelector, { timeout: 10000 });

        await page.type(usernameSelector, username);
        await page.type(passwordSelector, password);

        // Check for "User Agreement" checkbox and check it if needed
        await page.evaluate(() => {
            const checkbox = document.querySelector('input[type="checkbox"]');
            if (checkbox && !checkbox.checked) {
                checkbox.click();
                if (checkbox.parentElement) checkbox.parentElement.click();
            }
            const labels = Array.from(document.querySelectorAll('label, span, div'));
            const agreementLabel = labels.find(el => el.textContent.includes('阅读并同意') || el.textContent.includes('协议'));
            if (agreementLabel && !agreementLabel.querySelector('input:checked')) {
                agreementLabel.click();
            }
        });
        console.log('   ✓ Checked User Agreement (if present)');

        // Submit by pressing Enter in the password field
        console.log('   ⌨️  Pressing Enter to submit...');
        await page.keyboard.press('Enter');
        
        // Wait a bit to see if it works
        await new Promise(r => setTimeout(r, 2000));

        // If still here, try clicking the button
        const stillLogin = await page.evaluate(() => location.href.includes('login'));
        if (stillLogin) {
            console.log('   ⚠️  Enter key didn\'t work, trying to click login button...');
            
            const loginBtnHandle = await page.evaluateHandle(() => {
                // Find button specifically in the active form if possible, or just the main login button
                const buttons = Array.from(document.querySelectorAll('button, .btn, .submit, div[role="button"]'));
                // Filter for visible buttons with "登录" text
                return buttons.find(b => {
                    const style = window.getComputedStyle(b);
                    return b.textContent.includes('登录') && style.display !== 'none' && style.visibility !== 'hidden' && b.offsetParent !== null;
                });
            });

            if (loginBtnHandle.asElement()) {
                await loginBtnHandle.asElement().click();
                console.log('   🖱️  Clicked login button');
            } else {
                 // Fallback to standard selectors
                 await page.evaluate(() => {
                     const fallback = document.querySelector('.login-btn, button[type="submit"], .submit');
                     if (fallback) fallback.click();
                 });
                 console.log('   🖱️  Clicked login button (fallback)');
            }
        }

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

    const isLinux = process.platform === 'linux';
    const executablePath = isLinux
        ? '/usr/bin/chromium-browser'
        : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

    console.log(`   Running on ${process.platform}, using browser: ${executablePath}`);

    const browser = await puppeteer.launch({
        headless: isLinux ? 'new' : false,
        defaultViewport: null,
        userDataDir: './user_data',
        executablePath: executablePath,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--start-maximized',
            '--disable-dev-shm-usage',
            '--window-size=1920,1080'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        });
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
                        // Capture getInfoList (News) and any other list-like data
                        if (request.url().includes('getInfoList') || 
                            request.url().includes('statistics') || 
                            (json.data && json.data.items) ||
                            (json.items)) {
                            console.log(`📡 Captured API response from: ${request.url()}`);
                            capturedData.push({ url: request.url(), data: json });
                        }
                    }
                } catch (e) {
                    // Ignore errors
                }
            }
        });

        console.log(`📄 Navigating to target page: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait a bit for potential redirects
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Check if we need to log in
        let needsLogin = await page.evaluate(() => {
            return location.href.includes('login') ||
                !!document.querySelector('.login-container') ||
                document.title.includes('登录');
        });

        if (needsLogin) {
            console.log('\n🛑 Authentication required!');

            if (username && password) {
                console.log('🔄 Attempting automatic login...');

                // Try to find and click the "Account Password Login" tab
                console.log('   🔍 Looking for "Account Password Login" tab...');
                
                try {
                    // 1. Attempt to find and click the tab
                    const switchResult = await page.evaluate(() => {
                        // Find all elements containing the text
                        const targets = ['账户密码登录', '账号密码登录'];
                        const allElements = Array.from(document.querySelectorAll('*')); // Get ALL elements
                        
                        // Filter for elements that directly contain the text (leaf nodes or close to leaf)
                        const candidates = allElements.filter(el => {
                            const text = el.textContent.trim();
                            return targets.includes(text) && el.children.length === 0; // Prefer leaf nodes
                        });

                        if (candidates.length > 0) {
                            // Sort by visibility or position if needed, but taking the first visible one is usually good
                            const target = candidates[0];
                            
                            // Highlight for debug
                            target.style.border = '3px solid red';
                            target.style.backgroundColor = 'yellow';
                            
                            // Click the element
                            target.click();
                            
                            // Also try clicking parent (often the tab is an LI or DIV wrapping the text)
                            if (target.parentElement) {
                                target.parentElement.click();
                            }
                            
                            return { found: true, text: target.textContent, tag: target.tagName };
                        }
                        
                        return { found: false };
                    });

                    if (switchResult.found) {
                        console.log(`   🖱️  Clicked element "${switchResult.text}" (${switchResult.tag})`);
                        
                        // Wait for UI update
                        await new Promise(r => setTimeout(r, 1000));
                        
                        // Take a debug screenshot to see if it switched
                        await page.screenshot({ path: 'debug_tab_switch.png' });
                        console.log('   📸 Saved screenshot to debug_tab_switch.png');

                        // Check if password input is visible
                        const passwordInput = await page.$('input[type="password"]');
                        if (passwordInput) {
                            console.log('   ✅ Password input appeared!');
                        } else {
                            console.log('   ⚠️ Password input NOT found. Trying fallback click...');
                            
                            // Fallback: Try clicking by coordinates or using a broader selector
                            await page.evaluate(() => {
                                const el = document.querySelector('.login-tab-item:nth-child(2)'); // Guessing class
                                if (el) el.click();
                            });
                        }
                    } else {
                        console.log('   ⚠️ Could not find "Account Password Login" tab element');
                    }
                } catch (e) {
                    console.log('   ⚠️ Error handling login tab:', e.message);
                }

                // Wait a bit before typing
                await new Promise(r => setTimeout(r, 1000));

                // Enter credentials
                await login(page, username, password);

                // Wait for redirect
                await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => { });

            } else {
                console.log('👉 Please manually log in in the browser window.');
                console.log('⏳ Waiting for you to log in...');
            }

            // Re-check login status
            needsLogin = await page.evaluate(() => {
                return location.href.includes('login') || document.title.includes('登录');
            });

            if (needsLogin) {
                console.log('⚠️  Automatic login failed (still on login page).');

                // Check for error messages
                const errorMsg = await page.evaluate(() => {
                    const el = document.querySelector('.el-form-item__error, .error-msg, .login-error, .msg-error');
                    return el ? el.textContent.trim() : null;
                });

                if (errorMsg) {
                    console.log(`❌ Login Error Message Detected: "${errorMsg}"`);
                }

                // Check for captcha
                const captchaDetected = await page.evaluate(() => {
                    return !!document.querySelector('.geetest_widget') ||
                        !!document.querySelector('.geetest_radar_tip') ||
                        !!document.querySelector('iframe[src*="captcha"]');
                });
                if (captchaDetected) {
                    console.log('❌ Captcha detected! Automatic login cannot proceed.');
                }

                // Take screenshot
                await page.screenshot({ path: 'debug_login_failed.png' });
                console.log('   📸 Saved screenshot to debug_login_failed.png');

                console.log('👉 Please manually log in in the browser window.');
                // Wait for manual login
                await page.waitForFunction(() => {
                    return !location.href.includes('login') && !document.title.includes('登录');
                }, { timeout: 300000 });
                console.log('✅ Login detected!');
            } else {
                console.log('✅ Login successful!');
            }

            // Give it a moment to fully load
            await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
            console.log('✅ Already logged in (session restored).');
        }

        // Wait for content to load
        console.log(`⏳ Waiting for table content (checking for "日期")...`);
        try {
            // Wait for the table to actually appear
            await page.waitForFunction(() => {
                const text = document.body.innerText;
                return text.includes('日期') || text.includes('发布时间') || !!document.querySelector('.el-table__body');
            }, { timeout: 60000 });

            console.log('✅ Table content detected!');

            // Wait for network to be idle to ensure data is loaded
            await page.waitForNetworkIdle({ idleTime: 2000, timeout: 30000 }).catch(() => { });

        } catch (e) {
            console.log('⚠️  Table content not found or timeout.');
            console.log(`   Current URL: ${page.url()}`);
            const title = await page.title();
            console.log(`   Current Title: ${title}`);

            // Take screenshot for debug
            await page.screenshot({ path: 'debug_failed_load.png' });
            console.log('   📸 Saved screenshot to debug_failed_load.png');
        }

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

            // Scroll to bottom - try both window and specific table wrapper
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
                const tableWrapper = document.querySelector('.el-table__body-wrapper');
                if (tableWrapper) {
                    tableWrapper.scrollTop = tableWrapper.scrollHeight;
                }
            });

            // Wait for new data to load
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        console.log(`✅ Finished scrolling "Latest News".`);

        // --- PART 2: Switch to "Statistics by Company" (按公司统计) ---
        console.log('\n🔄 Switching to "Statistics by Company" (按公司统计)...');
        
        try {
            const switched = await page.evaluate(() => {
                const tabs = Array.from(document.querySelectorAll('div, span, li, a'));
                const companyTab = tabs.find(el => el.textContent.trim() === '按公司统计');
                if (companyTab) {
                    companyTab.click();
                    return true;
                }
                return false;
            });

            if (switched) {
                console.log('   ✅ Clicked "Statistics by Company" tab');
                await new Promise(r => setTimeout(r, 3000)); // Wait for tab switch
                
                // Select "近1月" (Recent 1 month) filter
                console.log('   🔽 Selecting "近1月" time filter...');
                try {
                    const filterSelected = await page.evaluate(() => {
                        // Find the dropdown/select for time filter
                        const dropdowns = Array.from(document.querySelectorAll('input, div, span'));
                        const timeFilter = dropdowns.find(el => 
                            el.textContent.includes('近1月') || 
                            el.textContent.includes('近1月')  ||
                            el.getAttribute('placeholder')?.includes('时间')
                        );
                        
                        if (timeFilter) {
                            timeFilter.click();
                            return { clicked: true, type: '找到下拉框' };
                        }
                        return { clicked: false };
                    });

                    if (filterSelected.clicked) {
                        console.log(`   ✅ Clicked time filter dropdown`);
                        await new Promise(r => setTimeout(r, 500));
                        
                        // Click "近1月" option
                        await page.evaluate(() => {
                            const options = Array.from(document.querySelectorAll('li, div, span'));
                            const oneMonth = options.find(el => el.textContent.trim() === '近1月');
                            if (oneMonth) {
                                oneMonth.click();
                            }
                        });
                        console.log('   ✅ Selected "近1月" filter');
                        await new Promise(r => setTimeout(r, 3000)); // Wait for data reload
                    } else {
                        console.log('   ⚠️ Time filter dropdown not found, continuing anyway...');
                    }
                } catch (e) {
                    console.log('   ⚠️ Error selecting time filter:', e.message);
                }
                
                // Scroll Company Statistics view
                console.log('   📜 Scrolling "Statistics by Company" view...');
                for (let i = 0; i < 5; i++) {
                    await page.evaluate(() => {
                        window.scrollTo(0, document.body.scrollHeight);
                        const tableWrapper = document.querySelector('.el-table__body-wrapper');
                        if (tableWrapper) {
                            tableWrapper.scrollTop = tableWrapper.scrollHeight;
                        }
                    });
                    console.log(`   Scroll ${i + 1}/5 on Company Statistics...`);
                    await new Promise(r => setTimeout(r, 2000));
                }
            } else {
                console.log('   ⚠️ Could not find "Statistics by Company" tab');
            }
        } catch (e) {
            console.log('   ⚠️ Error switching tabs:', e.message);
        }

        console.log(`✅ Finished scrolling all tabs, total API calls captured: ${capturedData.filter(item => item.url.includes('getInfoList')).length}`);

        // Save HTML for debugging
        const html = await page.content();
        fs.writeFileSync('page_debug.html', html);
        console.log(`   📄 Saved page HTML to page_debug.html (Length: ${html.length})`);

        // Process captured API data
        // We process ALL captured data that looks like it has items
        console.log(`📊 Processing ${capturedData.length} captured API responses...`);
        
        // Save captured data to file for debugging
        fs.writeFileSync('captured_data.json', JSON.stringify(capturedData, null, 2));
        console.log(`   📄 Saved captured API data to captured_data.json`);
        
        const data = []; // Initialize data array

        capturedData.forEach(response => {
            let items = [];
            
            // Format 1: data.data.items (Standard API)
            if (response.data && response.data.data && Array.isArray(response.data.data.items)) {
                items = response.data.data.items;
            } 
            // Format 2: data.items (Some APIs)
            else if (response.data && Array.isArray(response.data.items)) {
                items = response.data.items;
            }
            // Format 3: Direct array
            else if (Array.isArray(response.data)) {
                items = response.data;
            }

            if (items.length > 0) {
                console.log(`   Found ${items.length} items in ${response.url}`);
                
                items.forEach(item => {
                    // Try to extract fields based on common patterns
                    const mainRelated = item.related && item.related.length > 0 ? item.related[0] : {};
                    
                    // Determine fields based on available data
                    const date = item.date || item.publishDate || item.updateTime || '';
                    const title = item.title || item.companyName || ''; // Company stats might use companyName as title
                    const summary = item.summary || mainRelated.shortCompanyName || mainRelated.companyName || '查看';
                    const source = item.originalSource || item.source || '企业预警通';
                    const related = mainRelated.shortCompanyName || mainRelated.companyName || item.companyName || '';
                    
                    // Only add if we have at least a date and title/related
                    if (date && (title || related)) {
                        data.push({
                            date: date.replace(/(\d{4})(\d{2})(\d{2}).*/, '$1-$2-$3'),
                            title: title,
                            summary: summary,
                            source: source,
                            related_enterprise: related,
                            importance: mainRelated.importanceABS || item.importance || '一般',
                            sentiment: (mainRelated.negative === '-1' || item.negative === '-1') ? '负面' : 
                                      ((mainRelated.negative === '1' || item.negative === '1') ? '正面' : '中性'),
                            level1_category: item.firstLevelName || item.eventType || '',
                            level2_category: mainRelated.lastLevelName || item.subEventType || '',
                            url: item.originalUrl || ''
                        });
                    }
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
