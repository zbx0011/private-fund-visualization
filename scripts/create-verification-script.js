// This script will verify all fund strategies against Feishu
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

async function verify() {
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

        console.log('\n\n=== Strategy Verification ===\n');

        const strategyMap = {};
        records.forEach(record => {
            const name = record.fields['产品名称'] || record.fields['基金名称'];
            if (!name) return;

            const rawStrategy = record.fields['策略'] || record.fields['投资策略'];
            let strategyId = null;
            let strategyText = null;

            if (Array.isArray(rawStrategy) && rawStrategy.length > 0) {
                strategyId = rawStrategy[0];
            } else if (typeof rawStrategy === 'object' && rawStrategy.value && Array.isArray(rawStrategy.value)) {
                strategyId = rawStrategy.value[0];
            } else if (typeof rawStrategy === 'string') {
                strategyText = rawStrategy;
            }

            if (strategyId || strategyText) {
                if (!strategyMap[strategyId || strategyText]) {
                    strategyMap[strategyId || strategyText] = [];
                }
                strategyMap[strategyId || strategyText].push(name);
            }
        });

        console.log('Strategy ID -> Fund Names:');
        console.log('============================\n');
        Object.keys(strategyMap).sort().forEach(key => {
            console.log(`${key}:`);
            strategyMap[key].slice(0, 5).forEach(name => {
                console.log(`  - ${name}`);
            });
            if (strategyMap[key].length > 5) {
                console.log(`  ... and ${strategyMap[key].length - 5} more`);
            }
            console.log('');
        });

    } catch (error) {
        console.error('Verification failed:', error);
    }
}

verify();
