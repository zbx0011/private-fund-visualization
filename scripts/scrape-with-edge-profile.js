/**
 * Web Scraper using User's Edge Profile
 * 
 * This script launches the local Microsoft Edge browser with the user's profile.
 * This allows the scraper to use existing login sessions and cookies.
 * 
 * NOTE: You must CLOSE all Edge windows before running this script.
 * 
 * Usage: node scripts/scrape-with-edge-profile.js <URL>
 */

const puppeteer = require('puppeteer');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Configuration
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const USER_DATA_DIR = path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Edge', 'User Data');

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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

function parseDate(dateStr) {
    if (!dateStr) return '';
    // Handle "11-24" -> "2024-11-24"
    if (dateStr.match(/^\d{2}-\d{2}$/)) {
        const year = new Date().getFullYear();
        return `${year}-${dateStr}`;
    }
    return dateStr;
}

// Helper to kill Edge processes
function killEdgeProcesses() {
    try {
        console.log('🔪 Killing running Edge processes...');
        execSync('taskkill /F /IM msedge.exe', { stdio: 'ignore' });
        console.log('✅ Edge processes killed.');
    } catch (e) {
        // Ignore error if no process found
    }
}

/**
 * Extract data from the current visible table
 */
async function extractTableData(page, tabName) {
    console.log(`📊 Extracting data for tab: ${tabName}...`);

    try {
        await page.waitForSelector('table', { timeout: 10000 });
    } catch (e) {
        console.log(`⚠️  Table not found for tab ${tabName}`);
        return [];
    }

    return await page.evaluate((currentTabName) => {
        const table = document.querySelector('table');
        if (!table) return [];

        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
        const rows = Array.from(table.querySelectorAll('tbody tr')); // Assuming tbody exists, or just tr

        // Helper to find index by header name (partial match)
        const getIndex = (name) => headers.findIndex(h => h.includes(name));

        const idxDate = getIndex('日期'); // Matches "日期" or "更新日期"
        const idxTitle = getIndex('标题');
        const idxRelated = getIndex('相关企业'); // For "Latest Updates"
        const idxCategory = getIndex('分类'); // For "Latest Updates"
        const idxType = getIndex('事件类型'); // For "Company Stats"
        const idxSubType = getIndex('事件子项'); // For "Company Stats"
        const idxImportance = getIndex('重要性');
        const idxSentiment = getIndex('正负面'); // Matches "正负面"
        const idxSource = getIndex('来源');

        const results = [];

        for (const row of rows) {
            const cells = row.querySelectorAll('td');
            if (cells.length < headers.length) continue;

            const getText = (idx) => idx !== -1 && cells[idx] ? cells[idx].textContent.trim() : '';
            const getLink = (idx) => idx !== -1 && cells[idx] ? cells[idx].querySelector('a')?.href : '';

            // Get title from A tag if possible, to avoid getting hidden tags/suffixes in the cell
            const getTitle = (idx) => {
                if (idx === -1 || !cells[idx]) return '';
                const link = cells[idx].querySelector('a');
                if (link) return link.textContent.trim();
                return cells[idx].textContent.trim();
            };

            // Helper to clean text
            const clean = (text) => {
                if (!text) return '';
                return text.replace(/仅看此类型屏蔽此类型/g, '').trim();
            };

            const cleanTitle = (text) => {
                if (!text) return '';
                return text.replace(/^新闻\s*\|\s*/, '').trim();
            };

            // Common fields
            let date = getText(idxDate);
            let title = cleanTitle(getTitle(idxTitle)); // Use getTitle instead of getText
            let url = getLink(idxTitle) || getLink(getIndex('summary')); // Fallback
            let importance = clean(getText(idxImportance));
            let sentiment = getText(idxSentiment); // Sentiment usually doesn't have the suffix
            let source = getText(idxSource);

            // DEBUG: Print info for the first few rows to debug URL extraction
            if (results.length < 3) {
                console.log(`\n🔍 DEBUG ROW ${results.length + 1}:`);
                console.log(`   Title: ${title}`);
                console.log(`   Extracted URL: ${url}`);
                if (idxTitle !== -1 && cells[idxTitle]) {
                    console.log(`   Title Cell HTML: ${cells[idxTitle].innerHTML.substring(0, 200)}...`);
                }
            }

            // Tab-specific fields
            let related_enterprise = '';
            let level1_category = '';
            let level2_category = '';

            if (currentTabName.includes('最新动态')) {
                related_enterprise = getText(idxRelated);
                level1_category = clean(getText(idxCategory));
            } else if (currentTabName.includes('按公司统计')) {
                level1_category = clean(getText(idxType));
                level2_category = clean(getText(idxSubType));
            }

            results.push({
                date,
                title,
                summary: title, // Use title as summary
                source,
                related_enterprise,
                importance,
                sentiment,
                level1_category,
                level2_category,
                url
            });
        }
        return results;
    }, tabName);
}

async function scrapeData(url) {
    // Kill Edge first
    killEdgeProcesses();

    console.log('⏳ Waiting 3 seconds for processes to exit...');
    await new Promise(r => setTimeout(r, 3000));

    console.log(`🚀 Starting Edge scraper for: ${url}`);
    console.log(`👤 Using User Data Dir: ${USER_DATA_DIR}`);
    console.log(`⚠️  IMPORTANT: Please ensure all Edge windows are CLOSED before proceeding.`);

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false,
            executablePath: EDGE_PATH,
            userDataDir: USER_DATA_DIR,
            defaultViewport: null,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
        });
    } catch (error) {
        console.error('\n❌ FAILED TO LAUNCH EDGE. Is it open?');
        throw error;
    }

    const allRecords = [];
    // Store records by date for fuzzy matching: Map<DateString, Set<TitleString>>
    const seenRecords = new Map();
    // Store captured API items to enrich DOM data
    let capturedApiItems = [];

    try {
        const pages = await browser.pages();
        const page = pages.length > 0 ? pages[0] : await browser.newPage();

        // Forward console logs from browser to terminal
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));

        // Intercept API responses to get raw data
        page.on('response', async response => {
            const request = response.request();
            if (request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
                try {
                    const url = response.url();

                    // Capture data from getInfoList
                    if (url.includes('getInfoList')) {
                        const json = await response.json();
                        let items = [];
                        if (json.data && Array.isArray(json.data.list)) items = json.data.list;
                        else if (json.data && Array.isArray(json.data)) items = json.data;
                        else if (Array.isArray(json)) items = json;

                        if (items.length > 0) {
                            console.log(`\n📥 Captured ${items.length} items from API: ${url}`);

                            // Debug: Print first item's keys and URL field
                            try {
                                console.log('   First item keys:', Object.keys(items[0]).join(', '));
                                const urlField = Object.keys(items[0]).find(k => k.toLowerCase().includes('url') || k.toLowerCase().includes('link'));
                                if (urlField && items[0][urlField]) {
                                    console.log(`   ✅ Possible URL field found: ${urlField} = ${items[0][urlField].substring(0, 150)}`);
                                }
                            } catch (err) {
                                console.log('   Error inspecting item:', err.message);
                            }

                            capturedApiItems = capturedApiItems.concat(items);
                        }
                    }
                } catch (e) {
                    // Ignore
                }
            }
        });

        console.log(`📄 Loading page...`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log(`✅ Page loaded (DOM Content Loaded)`);

        // Wait a bit more for dynamic content and API responses
        console.log('⏳ Waiting 5 seconds for data to load...');
        await new Promise(r => setTimeout(r, 5000));

        // Helper to click tab by text
        const clickTab = async (text) => {
            return page.evaluate((text) => {
                const tabs = Array.from(document.querySelectorAll('div, span, li, a'));
                const target = tabs.find(el => el.textContent.trim() === text && (el.className.includes('tab') || el.className.includes('item')));
                if (target) {
                    target.click();
                    return true;
                }
                return false;
            }, text);
        };

        // Helper to add unique records with fuzzy matching
        const addUniqueRecords = (newRecords, sourceTab) => {
            let count = 0;
            for (const rec of newRecords) {
                const date = rec.date;
                const title = rec.title;

                if (!seenRecords.has(date)) {
                    seenRecords.set(date, new Set());
                }
                const existingTitles = seenRecords.get(date);

                // Check for fuzzy match (substring)
                let isDuplicate = false;
                for (const existing of existingTitles) {
                    if (existing.includes(title) || title.includes(existing)) {
                        isDuplicate = true;
                        break;
                    }
                }

                if (!isDuplicate) {
                    existingTitles.add(title);
                    allRecords.push(rec);
                    count++;
                }
            }
            console.log(`✅ Found ${newRecords.length} records in ${sourceTab}, added ${count} unique.`);
        };

        // --- Scrape Tab 1: 最新动态 ---
        console.log('👉 Switching to "最新动态" (Latest Updates)...');
        const foundTab1 = await clickTab('最新动态');
        if (foundTab1) await new Promise(r => setTimeout(r, 2000));

        let records1 = await extractTableData(page, '最新动态');

        // Enrich with API data
        records1 = records1.map(rec => {
            const match = capturedApiItems.find(item => item.title && (item.title.includes(rec.title) || rec.title.includes(item.title)));
            if (match && match.originalUrl) {
                rec.url = match.originalUrl;
            }
            return rec;
        });

        addUniqueRecords(records1, 'Latest Updates');

        // --- Scrape Tab 2: 按公司统计 ---
        console.log('👉 Switching to "按公司统计" (Statistics by Company)...');
        const foundTab2 = await clickTab('按公司统计');

        if (foundTab2) {
            await new Promise(r => setTimeout(r, 3000));
            let records2 = await extractTableData(page, '按公司统计');

            // Enrich with API data
            records2 = records2.map(rec => {
                const match = capturedApiItems.find(item => item.title && (item.title.includes(rec.title) || rec.title.includes(item.title)));
                if (match && match.originalUrl) {
                    rec.url = match.originalUrl;
                }
                return rec;
            });

            addUniqueRecords(records2, 'Company Statistics');
        } else {
            console.log('⚠️  "按公司统计" tab not found.');
        }

        if (allRecords.length === 0) {
            console.log('⚠️  No records found in any tab. Saving debug info...');
            const html = await page.content();
            fs.writeFileSync('page_debug.html', html);
            await page.screenshot({ path: 'debug_failed_load.png' });
        }

        return allRecords;

    } catch (error) {
        console.error(`❌ Error scraping data:`, error);
        return [];
    } finally {
        console.log('ℹ️  Browser left open. Press Ctrl+C to exit.');
    }
}

function saveRecords(records) {
    // Check existing records count
    const existingCount = db.prepare('SELECT COUNT(*) as c FROM external_monitor').get().c;
    console.log(`📊 Current records in database: ${existingCount}`);

    // Use INSERT OR IGNORE - duplicates will be ignored based on unique constraint
    // First, let's add a unique index if not exists
    try {
        db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_monitor_date_title ON external_monitor(date, title)');
    } catch (e) {
        // Index may already exist
    }

    const stmt = db.prepare(`
        INSERT OR IGNORE INTO external_monitor (
            date, title, summary, source, related_enterprise,
            importance, sentiment, level1_category, level2_category, url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            if (result.changes > 0) insertedCount++;
        } catch (error) {
            console.error(`Error inserting record:`, error.message);
        }
    }

    const newTotal = db.prepare('SELECT COUNT(*) as c FROM external_monitor').get().c;
    console.log(`💾 Added ${insertedCount} new records (Total: ${newTotal})`);
    return insertedCount;
}

async function main() {
    const targetUrl = process.argv[2];
    if (!targetUrl) {
        console.log('Usage: node scripts/scrape-with-edge-profile.js <URL>');
        return;
    }

    try {
        const records = await scrapeData(targetUrl);
        if (records.length > 0) {
            saveRecords(records);
        }
    } catch (error) {
        console.error('❌ Script failed:', error.message);
    }
}

if (require.main === module) {
    main();
}
