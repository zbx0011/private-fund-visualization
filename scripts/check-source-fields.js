require('dotenv').config();
const axios = require('axios');

async function checkFieldsInSource() {
    try {
        const tokenResponse = await axios.post(
            'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
            {
                app_id: process.env.LARK_APP_ID,
                app_secret: process.env.LARK_APP_SECRET
            }
        );
        const accessToken = tokenResponse.data.tenant_access_token;

        // Get sample records from 私募取数表
        const response = await axios.post(
            `https://open.feishu.cn/open-apis/bitable/v1/apps/${process.env.LARK_APP_TOKEN}/tables/tblcXqDbfgA0x533/records/search`,
            { page_size: 5 },
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        if (response.data.data.items) {
            response.data.data.items.forEach((item, i) => {
                console.log(`\n=== Record ${i + 1}: ${item.fields['基金名称']?.[0]?.text || 'Unknown'} ===`);
                console.log('本周收益率:', item.fields['本周收益率']);
                console.log('本年收益率:', item.fields['本年收益率']);
                console.log('集中度:', item.fields['集中度']);
                console.log('日均资金占用:', item.fields['日均资金占用']);
            });
        }

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

checkFieldsInSource();
