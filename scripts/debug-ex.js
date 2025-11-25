require('dotenv').config();
const axios = require('axios');

async function debugExtraction() {
    try {
        const tokenResponse = await axios.post(
            'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
            {
                app_id: process.env.LARK_APP_ID,
                app_secret: process.env.LARK_APP_SECRET
            }
        );
        const accessToken = tokenResponse.data.tenant_access_token;

        const response = await axios.post(
            `https://open.feishu.cn/open-apis/bitable/v1/apps/${process.env.LARK_APP_TOKEN}/tables/tblcXqDbfgA0x533/records/search`,
            { page_size: 1 },
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        if (response.data.data.items?.length > 0) {
            const record = response.data.data.items[0];

            console.log('=== Raw Field Values ===');
            console.log('基金名称:', JSON.stringify(record.fields['基金名称']));

            const weeklyValue = record.fields['本周收益率'];
            const yearlyValue = record.fields['本年收益率'];

            console.log('\n本周收益率:');
            console.log('  Raw:', JSON.stringify(weeklyValue));
            console.log('  First value:', weeklyValue?.value?.[0]);

            console.log('\n本年收益率:');
            console.log('  Raw:', JSON.stringify(yearlyValue));
            console.log('  First value:', yearlyValue?.value?.[0]);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

debugExtraction();
