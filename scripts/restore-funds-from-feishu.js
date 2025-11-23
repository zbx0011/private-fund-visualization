const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Load environment variables
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

const STRATEGY_MAPPING = {
    'opteZ8clPp': '指增',
    'optvE8Axra': '中性',
    'optpdOvS5N': 'CTA',
    'optcXUA9c6': '套利',
    'optN5SM1ew': 'T0',
    'optMJZQ4p5': '混合',
    'optA6mwCSf': '量选',  // 修正：大道萑苇 -> 量选
    'optC7xvukD': '期权',
    'optztNchXY': '可转债',
    'optHhPUvUQ': '择时对冲',
};

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

async function restoreDatabase() {
    const appId = process.env.LARK_APP_ID;
    const appSecret = process.env.LARK_APP_SECRET;
    const appToken = process.env.LARK_APP_TOKEN;
    const tableId = 'tblcXqDbfgA0x533'; // 私募取数表

    if (!appId || !appSecret || !appToken) {
        console.error('Missing environment variables');
        return;
    }

    try {
        const token = await getTenantAccessToken(appId, appSecret);
        const records = await getAllRecords(token, appToken, tableId);

        const dbPath = path.resolve(__dirname, '../data/funds.db');
        const db = new sqlite3.Database(dbPath);

        console.log('\nInserting funds into database...');

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            let insertedCount = 0;
            const stmt = db.prepare(`
                INSERT INTO funds (
                    record_id, name, strategy, manager, cost, 
                    weekly_return, yearly_return, daily_pnl,
                    source_table, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            `);

            records.forEach(record => {
                const name = record.fields['产品名称'] || record.fields['基金名称'];
                if (!name) return;

                // Extract Strategy
                let strategyId = null;
                const rawStrategy = record.fields['策略'] || record.fields['投资策略'];
                if (Array.isArray(rawStrategy) && rawStrategy.length > 0) {
                    strategyId = rawStrategy[0];
                } else if (typeof rawStrategy === 'object' && rawStrategy.value && Array.isArray(rawStrategy.value)) {
                    strategyId = rawStrategy.value[0];
                }

                let strategyName = '其他';
                if (strategyId && STRATEGY_MAPPING[strategyId]) {
                    strategyName = STRATEGY_MAPPING[strategyId];
                } else if (typeof rawStrategy === 'string') {
                    strategyName = rawStrategy;
                }

                const manager = record.fields['投资经理'] || record.fields['管理人'] || '';
                const cost = parseFloat(record.fields['成本'] || record.fields['规模'] || 0);
                const weeklyReturn = parseFloat(record.fields['本周收益率'] || 0);
                const yearlyReturn = parseFloat(record.fields['本年收益率'] || 0);
                const dailyPnl = parseFloat(record.fields['本日盈亏'] || 0);

                stmt.run([
                    record.record_id,
                    name,
                    strategyName,
                    manager,
                    cost,
                    weeklyReturn,
                    yearlyReturn,
                    dailyPnl,
                    '私募取数表'
                ]);

                insertedCount++;
            });

            stmt.finalize();
            db.run('COMMIT', (err) => {
                if (err) {
                    console.error('Commit error:', err);
                } else {
                    console.log(`\n✓ Successfully inserted ${insertedCount} funds into database.`);
                }
                db.close();
            });
        });

    } catch (error) {
        console.error('Restore failed:', error);
    }
}

restoreDatabase();
