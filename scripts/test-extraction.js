require('dotenv').config();
const { DataConverter } = require('../src/lib/data-converter');
const axios = require('axios');

async function testExtraction() {
    try {
        const tokenResponse = await axios.post(
            'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
            {
                app_id: process.env.LARK_APP_ID,
                app_secret: process.env.LARK_APP_SECRET
            }
        );
        const accessToken = tokenResponse.data.tenant_access_token;

        // Get one record
        const response = await axios.post(
            `https://open.feishu.cn/open-apis/bitable/v1/apps/${process.env.LARK_APP_TOKEN}/tables/tblcXqDbfgA0x533/records/search`,
            { page_size: 1 },
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        if (response.data.data.items?.length > 0) {
            const record = response.data.data.items[0];

            console.log('=== Source Record ===');
            console.log('基金名称:', record.fields['基金名称']);
            console.log('本周收益率:', record.fields['本周收益率']);
            console.log('本年收益率:', record.fields['本年收益率']);
            console.log('集中度:', record.fields['集中度']);

            // Try to convert
            const converted = await DataConverter.convertBitableToFundDataWithOptions(
                [record],
                process.env.LARK_APP_TOKEN,
                'tblcXqDbfgA0x533'
            );

            console.log('\n=== Converted Data ===');
            if (converted[0]) {
                console.log('weeklyReturn:', converted[0].weeklyReturn);
                console.log('yearlyReturn:', converted[0].yearlyReturn);
                console.log('concentration:', converted[0].concentration);
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
    }
}

testExtraction();
