const axios = require('axios');
const fs = require('fs');
const path = require('path');


// Manually load .env.local
try {
    const envPath = path.resolve(__dirname, '../.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^['"]|['"]$/g, ''); // Remove quotes
            process.env[key] = value;
        }
    });
} catch (e) {
    console.error('Error loading .env.local:', e);
}

async function getTenantAccessToken(appId, appSecret) {
    const url = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal';
    const response = await axios.post(url, {
        app_id: appId,
        app_secret: appSecret
    });
    return response.data.tenant_access_token;
}

async function getBitableRecords(token, appToken, tableId) {
    let records = [];
    let pageToken = '';
    let hasMore = true;

    while (hasMore) {
        const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records?page_size=500${pageToken ? `&page_token=${pageToken}` : ''}`;
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
    }
    return records;
}

async function inspectSpecificFund() {
    const appId = process.env.LARK_APP_ID;
    const appSecret = process.env.LARK_APP_SECRET;
    const appToken = process.env.LARK_APP_TOKEN;
    const tableId = 'tblXwpq4lQzfymME'; // 第一创业FOF表

    if (!appId || !appSecret || !appToken) {
        console.error('Missing environment variables');
        return;
    }

    console.log('Getting access token...');
    try {
        const token = await getTenantAccessToken(appId, appSecret);
        console.log('Fetching records...');
        const records = await getBitableRecords(token, appToken, tableId);

        const targetFundName = "世纪前沿量化优选18号";
        const targetFund = records.find(r => {
            const nameField = r.fields['产品名称'] || r.fields['基金名称'];
            let name = '';
            if (typeof nameField === 'string') name = nameField;
            else if (Array.isArray(nameField) && nameField[0]?.text) name = nameField[0].text;
            return name === targetFundName;
        });

        if (targetFund) {
            console.log(`\n=== Found Fund: ${targetFundName} ===`);
            console.log('Record ID:', targetFund.record_id);
            console.log('Strategy Field Raw Value:', JSON.stringify(targetFund.fields['策略'], null, 2));
            console.log('Strategy Type Field Raw Value:', JSON.stringify(targetFund.fields['策略类型'], null, 2));
        } else {
            console.log(`Fund "${targetFundName}" not found.`);
        }

        // Check for T0 funds
        console.log('\n=== Checking for T0 funds ===');
        // Look for any record that might be T0
        const t0Funds = records.filter(r => {
            const s1 = JSON.stringify(r.fields['策略'] || '');
            const s2 = JSON.stringify(r.fields['策略类型'] || '');
            return s1.includes('T0') || s2.includes('T0');
        });

        console.log(`Found ${t0Funds.length} potential T0 funds.`);
        if (t0Funds.length > 0) {
            console.log('First T0 Fund Name:', t0Funds[0].fields['产品名称'] || t0Funds[0].fields['基金名称']);
            console.log('First T0 Fund Raw Strategy:', JSON.stringify(t0Funds[0].fields['策略'], null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

inspectSpecificFund();
