const axios = require('axios');
require('dotenv').config();

async function fetchRecord() {
    const appId = process.env.LARK_APP_ID;
    const appSecret = process.env.LARK_APP_SECRET;
    const appToken = process.env.LARK_APP_TOKEN;
    const tableId = 'tblcXqDbfgA0x533'; // Main table

    console.log('Getting tenant access token...');
    const authResponse = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
        "app_id": appId,
        "app_secret": appSecret
    });
    const tenantToken = authResponse.data.tenant_access_token;

    console.log(`Fetching records for table ${tableId}...`);
    const response = await axios.get(`https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records?filter=CurrentValue.[产品名称]="紫荆恒宇CTA-T8号"`, {
        headers: {
            'Authorization': `Bearer ${tenantToken}`
        }
    });

    const records = response.data.data.items;
    if (records.length > 0) {
        const record = records[0];
        console.log('Record ID:', record.record_id);
        const fields = record.fields;
        Object.keys(fields).forEach(key => {
            if (['集中度', '夏普', '波动率', '回撤', '成本'].some(k => key.includes(k))) {
                console.log(`Field: ${key}`);
                console.log(JSON.stringify(fields[key], null, 2));
            }
        });
    } else {
        console.log('No records found.');
    }
}

fetchRecord().catch(console.error);
