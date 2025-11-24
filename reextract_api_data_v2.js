// Re-extract data from api_response.json with CORRECT mappings and filtering
const fs = require('fs');
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data', 'funds.db'));

// Read captured API data
const apiData = JSON.parse(fs.readFileSync('api_response.json', 'utf8'));

// Find ALL getInfoList responses
const getInfoListResponses = apiData.filter(item =>
    item.url.includes('/information/riskMonitor/getInfoList')
);

console.log(`Found ${getInfoListResponses.length} API responses`);

// Combine items from all responses
const allItems = [];
getInfoListResponses.forEach(response => {
    if (response.data.data && response.data.data.items) {
        allItems.push(...response.data.data.items);
    }
});

console.log(`Total items found: ${allItems.length}`);

// Extract and insert into database
const stmt = db.prepare(`
    INSERT OR REPLACE INTO external_monitor(
        date, title, summary, source, related_enterprise,
        importance, sentiment, level1_category, level2_category, url
    ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let inserted = 0;
let skipped = 0;

const IGNORED_COMPANIES = ['恒立实业', '锦富技术'];

allItems.forEach(item => {
    const mainRelated = item.related && item.related.length > 0 ? item.related[0] : {};
    const companyName = mainRelated.shortCompanyName || mainRelated.companyName || '';

    // Filter out ignored companies
    if (IGNORED_COMPANIES.some(ignored => companyName.includes(ignored))) {
        skipped++;
        return;
    }

    const record = {
        date: item.date ? item.date.replace(/(\d{4})(\d{2})(\d{2}).*/, '$1-$2-$3') : '',
        title: item.title || '',
        summary: companyName || '查看',
        source: item.originalSource || '',
        related_enterprise: companyName,
        importance: mainRelated.importanceABS || '',
        sentiment: mainRelated.negative === '-1' ? '负面' : (mainRelated.negative === '1' ? '正面' : '中性'),
        // FIX: Get firstLevelName from related object
        level1_category: mainRelated.firstLevelName || '',
        level2_category: mainRelated.lastLevelName || '',
        url: item.originalUrl || ''
    };

    try {
        stmt.run(
            record.date,
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
        inserted++;
    } catch (e) {
        console.error('Error inserting:', e.message);
    }
});

// Explicitly delete ignored companies from DB in case they were already there
const deleteStmt = db.prepare(`DELETE FROM external_monitor WHERE related_enterprise LIKE ? OR related_enterprise LIKE ?`);
const deleteResult = deleteStmt.run('%恒立实业%', '%锦富技术%');

console.log(`✅ Inserted/Updated ${inserted} records`);
console.log(`🚫 Skipped ${skipped} ignored records`);
console.log(`🗑️ Deleted ${deleteResult.changes} existing ignored records from DB`);

db.close();
