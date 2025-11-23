require('dotenv').config();
const axios = require('axios');

async function checkPnLTable() {
    try {
        const tokenResponse = await axios.post(
            'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
            {
                app_id: process.env.LARK_APP_ID,
                app_secret: process.env.LARK_APP_SECRET
            }
        );
        const accessToken = tokenResponse.data.tenant_access_token;

        console.log('=== Fetching from 私募盈亏一览表 (tblcK2mWFtgob3Dg) ===\n');
        const response = await axios.post(
            `https://open.feishu.cn/open-apis/bitable/v1/apps/${process.env.LARK_APP_TOKEN}/tables/tblcK2mWFtgob3Dg/records/search`,
            { page_size: 5 },
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        console.log('Total records:', response.data.data.total);
        console.log('\nSample records:');

        if (response.data.data.items) {
            response.data.data.items.forEach((item, i) => {
                console.log(`\n${i + 1}. ${item.fields['基金名称']?.[0]?.text || '(no name)'}`);
                console.log('   集中度:', JSON.stringify(item.fields['集中度']));
            });
        }

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

checkPnLTable();
