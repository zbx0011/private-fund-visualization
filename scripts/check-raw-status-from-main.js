require('dotenv').config();
const axios = require('axios');

async function checkRawStatus() {
    try {
        const tokenResponse = await axios.post(
            'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
            {
                app_id: process.env.LARK_APP_ID,
                app_secret: process.env.LARK_APP_SECRET
            }
        );
        const accessToken = tokenResponse.data.tenant_access_token;

        // Get the first record from '私募取数表' and inspect the '状态' field
        const response = await axios.post(
            `https://open.feishu.cn/open-apis/bitable/v1/apps/${process.env.LARK_APP_TOKEN}/tables/tblcXqDbfgA0x533/records/search`,
            { page_size: 3, filter: { conjunction: "and", conditions: [] } },
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        if (response.data.data.items) {
            response.data.data.items.forEach((item, i) => {
                console.log(`\n=== Record ${i + 1} ===`);
                console.log('Fund Name:', item.fields['基金名称']);
                console.log('状态 Raw Value:', JSON.stringify(item.fields['状态'], null, 2));
                console.log('本日盈亏:', JSON.stringify(item.fields['本日盈亏'], null, 2));
                console.log('本年收益率:', JSON.stringify(item.fields['本年收益率'], null, 2));
                console.log('集中度:', JSON.stringify(item.fields['集中度'], null, 2));
            });
        }

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

checkRawStatus();
