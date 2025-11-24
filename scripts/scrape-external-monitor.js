/**
 * Web Scraper for External Information Monitoring
 * 
 * This script scrapes enterprise monitoring information from specified websites
 * and stores the data in the database.
 * 
 * Usage: node scripts/scrape-external-monitor.js
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

/**
 * Parse date string to ISO format
 */
function parseDate(dateStr) {
    // Handle formats like "11-22", "2024-12-14"
    if (dateStr.match(/^\d{2}-\d{2}$/)) {
        const year = new Date().getFullYear();
        return `${year}-${dateStr}`;
    }
    return dateStr;
}

/**
 * Scrape data from target website
 * @param {string} url - Target URL
 */
async function scrapeData(url) {
    console.log(`🚀 Starting scraper for: ${url}`);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Set user agent to avoid being blocked
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

        console.log(`📄 Loading page...`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        console.log(`📊 Extracting data...`);

        // Wait for table to load
        await page.waitForSelector('table', { timeout: 10000 });

        // Extract data from table
        const data = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('table tr'));
            const results = [];

            // Skip header row
            for (let i = 1; i < rows.length; i++) {
                const cells = rows[i].querySelectorAll('td');
                if (cells.length < 9) continue;

                results.push({
                    date: cells[0]?.textContent.trim() || '',
                    title: cells[1]?.textContent.trim() || '',
                    summary: cells[2]?.querySelector('a')?.textContent.trim() || '查看',
                    source: cells[3]?.textContent.trim() || '',
                    related_enterprise: cells[4]?.textContent.trim() || '',
                    importance: cells[5]?.textContent.trim() || '',
                    sentiment: cells[6]?.textContent.trim() || '',
                    level1_category: cells[7]?.textContent.trim() || '',
                    level2_category: cells[8]?.textContent.trim() || '',
                    url: cells[2]?.querySelector('a')?.href || ''
                });
            }

            return results;
        });

        console.log(`✅ Extracted ${data.length} records`);

        return data;

    } catch (error) {
        console.error(`❌ Error scraping data:`, error);
        return [];
    } finally {
        await browser.close();
    }
}

/**
 * Save records to database
 */
function saveRecords(records) {
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

            if (result.changes > 0) {
                insertedCount++;
            }
        } catch (error) {
            console.error(`Error inserting record:`, error.message);
        }
    }

    console.log(`💾 Inserted ${insertedCount} new records into database`);
    return insertedCount;
}

/**
 * Main function
 */
async function main() {
    // TODO: Replace with actual target URL
    const targetUrl = process.argv[2] || 'https://example.com';

    if (targetUrl === 'https://example.com') {
        console.log('⚠️  Please provide a target URL as argument:');
        console.log('   node scripts/scrape-external-monitor.js <URL>');
        console.log('');
        console.log('Example:');
        console.log('   node scripts/scrape-external-monitor.js "https://example.com/monitor"');
        return;
    }

    try {
        const records = await scrapeData(targetUrl);

        if (records.length > 0) {
            const inserted = saveRecords(records);
            console.log(`✅ Scraping completed. ${inserted} records inserted.`);
        } else {
            console.log('⚠️  No records found. Please check the URL and selectors.');
        }
    } catch (error) {
        console.error('❌ Scraping failed:', error);
    } finally {
        db.close();
    }
}

// Run main function
if (require.main === module) {
    main();
}

module.exports = { scrapeData, saveRecords };
