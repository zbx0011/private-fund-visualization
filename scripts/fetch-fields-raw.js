const axios = require('axios');
require('dotenv').config();

async function fetchFields() {
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

    console.log(`Fetching fields for table ${tableId}...`);
    const response = await axios.get(`https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/fields`, {
        headers: {
            'Authorization': `Bearer ${tenantToken}`
        }
    });

    const fields = response.data.data.items;
    console.log(`Found ${fields.length} fields.`);

    fields.forEach(field => {
        if (['集中度', '夏普', '波动率', '回撤', '成本'].some(k => field.field_name.includes(k))) {
            console.log(`Field: ${field.field_name}, Type: ${field.type}, ID: ${field.field_id}`);
            console.log(JSON.stringify(field, null, 2));
        }
    });
}

fetchFields().catch(console.error);
