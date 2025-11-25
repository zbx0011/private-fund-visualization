require('dotenv').config();
const axios = require('axios');

async function listTables() {
    try {
        // 1. Get Tenant Access Token
        const tokenResponse = await axios.post(
            'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
            {
                app_id: process.env.LARK_APP_ID,
                app_secret: process.env.LARK_APP_SECRET
            }
        );
        const accessToken = tokenResponse.data.tenant_access_token;

        // 2. List Tables
        const tablesResponse = await axios.get(
            `https://open.feishu.cn/open-apis/bitable/v1/apps/${process.env.LARK_APP_TOKEN}/tables`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        // Search for "安诚数盈金福稳健一号" in "私募取数表" (tblcXqDbfgA0x533)
        console.log('\n=== Searching for 安诚数盈金福稳健一号 in 私募取数表 (tblcXqDbfgA0x533) ===');
        const searchResponse = await axios.post(
            `https://open.feishu.cn/open-apis/bitable/v1/apps/${process.env.LARK_APP_TOKEN}/tables/tblcXqDbfgA0x533/records/search`,
            {
                filter: {
                    conjunction: 'and',
                    conditions: [
                        {
                            field_name: '基金名称',
                            operator: 'contains',
                            value: ['安诚数盈金福稳健一号']
                        }
                    ]
                },
                page_size: 1
            },
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        if (searchResponse.data.data.items?.length > 0) {
            console.log(JSON.stringify(searchResponse.data.data.items[0].fields, null, 2));
        } else {
            console.log('Not found.');
        }

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

listTables();
