const axios = require('axios');
require('dotenv').config({ path: '.env' });

async function getTenantAccessToken(appId, appSecret) {
    try {
        const response = await axios.post(
            'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
            {
                app_id: appId,
                app_secret: appSecret
            }
        );
        return response.data.tenant_access_token;
    } catch (error) {
        console.error('Error getting access token:', error.response?.data || error.message);
        throw error;
    }
}

async function inspectRecords() {
    const appId = process.env.LARK_APP_ID;
    const appSecret = process.env.LARK_APP_SECRET;
    const appToken = process.env.LARK_APP_TOKEN;
    const tableId = 'tblcXqDbfgA0x533'; // 私募取数表

    if (!appId || !appSecret || !appToken) {
        console.error('Missing env vars');
        return;
    }

    try {
        const accessToken = await getTenantAccessToken(appId, appSecret);
        console.log('Got access token');

        const response = await axios.get(
            `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                params: {
                    page_size: 20 // Get 20 records
                }
            }
        );

        const records = response.data.data.items;
        const total = response.data.data.total;
        console.log(`Total Records: ${total}`);
        console.log('First 5 Records Sample:');
        records.slice(0, 5).forEach(r => {
            console.log('---');
            console.log('Name:', r.fields['基金名称'] || r.fields['产品名称']);
            console.log('Date:', r.fields['净值日期']);
            console.log('Virtual NAV:', r.fields['虚拟净值']);
        });

    } catch (error) {
        console.error('Error inspecting records:', error.response?.data || error.message);
    }
}

inspectRecords();
