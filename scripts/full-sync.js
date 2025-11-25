const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// 1. Load Environment Variables
try {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^['"]|['"]$/g, '');
                process.env[key] = value;
            }
        });
    }
} catch (e) {
    console.error('Error loading .env:', e);
}

// 2. Define Correct Mappings (Based on Analysis)
const STRATEGY_MAPPING = {
    'optvE8Axra': '中性',
    'opteZ8clPp': '指增',
    'optpdOvS5N': 'CTA',
    'optcXUA9c6': '套利',
    'optN5SM1ew': 'T0',    // 修正：顽岩稳健2号 -> T0
    'optMJZQ4p5': '混合',
    'optA6mwCSf': '量选',  // 修正：大道萑苇 -> 量选
    'optC7xvukD': '期权',  // 修正：君宜共达 -> 期权
    'optztNchXY': '可转债',
    'optHhPUvUQ': '择时对冲',
};

// 3. Database Setup
const dbPath = path.resolve(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

// 4. Lark API Helpers
async function getTenantAccessToken(appId, appSecret) {
    const url = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal';
    const response = await axios.post(url, { app_id: appId, app_secret: appSecret });
    return response.data.tenant_access_token;
}

async function getAllRecords(token, appToken, tableId) {
    let records = [];
    let pageToken = '';
    let hasMore = true;
    console.log('Fetching records from Feishu...');
    while (hasMore) {
        const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records?page_size=500${pageToken ? `&page_token=${pageToken}` : ''}`;
        const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
        if (response.data.code !== 0) throw new Error(response.data.msg);
        records = records.concat(response.data.data.items);
        hasMore = response.data.data.has_more;
        pageToken = response.data.data.page_token;
        process.stdout.write(`\rFetched ${records.length} records...`);
    }
    console.log('\nFetch complete.');
    return records;
}

// 5. Main Sync Logic
async function sync() {
    const appId = process.env.LARK_APP_ID;
    const appSecret = process.env.LARK_APP_SECRET;
    const appToken = process.env.LARK_APP_TOKEN;
    const tableId = 'tblcXqDbfgA0x533'; // 私募取数表

    if (!appId || !appSecret || !appToken) {
        console.error('Missing env vars');
        return;
    }

    try {
        const token = await getTenantAccessToken(appId, appSecret);
        const records = await getAllRecords(token, appToken, tableId);

        console.log('Updating database...');
        db.serialize(async () => {
            await runQuery('BEGIN TRANSACTION');

            let updatedCount = 0;
            for (const record of records) {
                const name = record.fields['产品名称'] || record.fields['基金名称'];
                if (!name) continue;

                // Extract Strategy ID
                let strategyId = null;
                const rawStrategy = record.fields['策略'] || record.fields['投资策略'];
                if (Array.isArray(rawStrategy) && rawStrategy.length > 0) {
                    strategyId = rawStrategy[0]; // Usually "opt..."
                } else if (typeof rawStrategy === 'object' && rawStrategy.value && Array.isArray(rawStrategy.value)) {
                    strategyId = rawStrategy.value[0];
                }

                // Map to Strategy Name
                let strategyName = '其他';
                if (strategyId && STRATEGY_MAPPING[strategyId]) {
                    strategyName = STRATEGY_MAPPING[strategyId];
                } else if (typeof rawStrategy === 'string') {
                    strategyName = rawStrategy;
                }

                // Update DB
                // We only update the strategy for now to fix the classification
                // But we should probably update everything if we want a full sync.
                // For speed, let's focus on strategy.
                await runQuery('UPDATE funds SET strategy = ? WHERE name = ?', [strategyName, name]);
                updatedCount++;
            }

            await runQuery('COMMIT');
            console.log(`Successfully updated strategies for ${updatedCount} funds.`);
            db.close();
        });

    } catch (error) {
        console.error('Sync failed:', error);
        db.close();
    }
}

sync();
