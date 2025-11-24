/**
 * Web Scraper for qyyjt.cn - Enterprise Monitoring
 * 
 * Customized scraper for https://www.qyyjt.cn
 * 
 * Usage: node scripts/scrape-qyyjt.js <combination_url>
 */

const puppeteer = require('puppeteer');
const Database = require('better-sqlite3');
const path = require('path');

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

/**
 * Scrape data from qyyjt.cn
 */
async function scrapeQyyjt(url) {
    console.log(`🚀 Starting scraper for: ${url}`);

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    try {
        const page = await browser.newPage();

        // Set realistic viewport and user agent
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log(`📄 Loading page...`);
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // Wait for content to load
        console.log(`⏳ Waiting for table to load...`);
        await page.waitForSelector('table, .el-table, .table-container', {
            timeout: 30000
        }).catch(() => {
            console.log('⚠️  Table selector not found, trying alternative selectors...');
        });

        // Additional wait for dynamic content
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log(`📊 Extracting data...`);

        // Extract data - trying multiple possible selectors
        const data = await page.evaluate(() => {
            const results = [];

            // Try different table selectors
            let rows = [];
            const tableEl = document.querySelector('table tbody');
            if (tableEl) {
                rows = Array.from(tableEl.querySelectorAll('tr'));
            } else {
                // Try alternative selectors for Vue/Element UI tables
                rows = Array.from(document.querySelectorAll('.el-table__row'));
                if (rows.length === 0) {
                    rows = Array.from(document.querySelectorAll('tr[data-row]'));
                }
            }

            console.log(`Found ${rows.length} rows`);

            for (const row of rows) {
                const cells = Array.from(row.querySelectorAll('td'));

                if (cells.length >= 9) {
                    const result = {
                        date: cells[0]?.textContent?.trim() || '',
                        title: cells[1]?.textContent?.trim() || '',
                        summary: cells[2]?.textContent?.trim() || '查看',
                        source: cells[3]?.textContent?.trim() || '',
                        related_enterprise: cells[4]?.textContent?.trim() || '',
                        importance: cells[5]?.textContent?.trim() || '',
                        sentiment: cells[6]?.textContent?.trim() || '',
                        level1_category: cells[7]?.textContent?.trim() || '',
                        level2_category: cells[8]?.textContent?.trim() || '',
                        url: cells[1]?.querySelector('a')?.href || cells[2]?.querySelector('a')?.href || ''
                    };

                    // Only add if we have meaningful data
                    if (result.title && result.date) {
                        results.push(result);
                    }
                }
            }

            return results;
        });

        console.log(`✅ Extracted ${data.length} records`);

        return data;

    } catch (error) {
        console.error(`❌ Error scraping data:`, error.message);
        throw error;
    } finally {
        await browser.close();
    }
}

/**
 * Parse date string to standard format
 */
function parseDate(dateStr) {
    // Handle formats like "11-21", "2024-12-14"
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
        INSERT OR REPLACE INTO external_monitor (
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

            if (result.changes > 0) {
                insertedCount++;
            }
        } catch (error) {
            console.error(`Error inserting record:`, error.message);
        }
    }

    console.log(`💾 Inserted/Updated ${insertedCount} records in database`);
    return insertedCount;
}

/**
 * Main function
 */
async function main() {
    const targetUrl = process.argv[2] || 'https://www.qyyjt.cn/combination/20250603164207';

    try {
        console.log(`\n========================================`);
        console.log(`  企业预警通 Data Scraper`);
        console.log(`========================================\n`);

        const records = await scrapeQyyjt(targetUrl);

        if (records.length > 0) {
            const inserted = saveRecords(records);
            console.log(`\n✅ Scraping completed successfully!`);
            console.log(`   Total records: ${records.length}`);
            console.log(`   Saved to database: ${inserted}`);
        } else {
            console.log('\n⚠️  No records found.');
            console.log('   Possible reasons:');
            console.log('   - Page structure might have changed');
            console.log('   - Login required');
            console.log('   - No data available');
            console.log('\n   Try opening the URL in a browser to verify.');
        }
    } catch (error) {
        console.error('\n❌ Scraping failed:', error.message);
        console.error('\nTroubleshooting:');
        console.error('1. Check if the URL is accessible');
        console.error('2. Verify you have internet connection');
        console.error('3. Try running with: DEBUG=puppeteer:* for more details');
    } finally {
        db.close();
    }
}

// Run main function
if (require.main === module) {
    main();
}

module.exports = { scrapeQyyjt, saveRecords };
