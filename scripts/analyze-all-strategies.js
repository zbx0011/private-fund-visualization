const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Manually load .env
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
    } else {
        console.error('.env file not found at', envPath);
    }
} catch (e) {
    console.error('Error loading .env:', e);
}

async function getTenantAccessToken(appId, appSecret) {
    const url = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal';
    const response = await axios.post(url, {
        app_id: appId,
        app_secret: appSecret
    });
    return response.data.tenant_access_token;
}

async function getAllRecords(token, appToken, tableId) {
    let records = [];
    let pageToken = '';
    let hasMore = true;

    console.log('Fetching all records...');
    while (hasMore) {
        const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records?page_size=500${pageToken ? `&page_token=${pageToken}` : ''}`;
        try {
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.code !== 0) {
                console.error('Error fetching records:', response.data.msg);
                break;
            }

            records = records.concat(response.data.data.items);
            hasMore = response.data.data.has_more;
            pageToken = response.data.data.page_token;
            process.stdout.write(`\rFetched ${records.length} records...`);
        } catch (e) {
            console.error('Request failed:', e.message);
            break;
        }
    }
    console.log('\nDone.');
    return records;
}

async function analyzeStrategies() {
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

        const targetNames = [
            '赫富灵活对冲一号',
            '优美利金安长牛2号',
            '大道崔苇'
        ];

        console.log('\n=== Finding Strategy IDs for Specific Funds ===');
        targetNames.forEach(name => {
            const fund = records.find(r => {
                const rName = r.fields['产品名称'] || r.fields['基金名称'];
                return rName === name;
            });
            if (fund) {
                console.log(`Fund: ${name}`);
                console.log(`Strategy Raw: ${JSON.stringify(fund.fields['策略'] || fund.fields['投资策略'])}`);
            } else {
                console.log(`Fund: ${name} NOT FOUND`);
            }
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

analyzeStrategies();
