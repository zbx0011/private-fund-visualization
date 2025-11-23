require('dotenv').config();
const axios = require('axios');

async function checkStatusField() {
    try {
        const tokenResponse = await axios.post(
            'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
            {
                app_id: process.env.LARK_APP_ID,
                app_secret: process.env.LARK_APP_SECRET
            }
        );
        const accessToken = tokenResponse.data.tenant_access_token;

        console.log('=== Fetching sample record from 私募盈亏一览表 ===\n');
        const response = await axios.post(
            `https://open.feishu.cn/open-apis/bitable/v1/apps/${process.env.LARK_APP_TOKEN}/tables/tblcK2mWFtgob3Dg/records/search`,
            { page_size: 2 },
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        if (response.data.data.items?.length > 0) {
            response.data.data.items.forEach((item, i) => {
                console.log(`\n=== Record ${i + 1} ===`);
                console.log('基金名称:', JSON.stringify(item.fields['基金名称'], null, 2));
                console.log('\n状态 field:', JSON.stringify(item.fields['状态'], null, 2));
                console.log('\n本年收益率:', JSON.stringify(item.fields['本年收益率'], null, 2));
                console.log('\n集中度:', JSON.stringify(item.fields['集中度'], null, 2));
                console.log('\n本日盈亏:', JSON.stringify(item.fields['本日盈亏'], null, 2));
                console.log('\n本周收益率:', JSON.stringify(item.fields['本周收益率'], null, 2));
            });
        }

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

checkStatusField();
