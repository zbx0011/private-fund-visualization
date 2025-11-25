require('dotenv').config();
const axios = require('axios');

async function listAllFields() {
    try {
        const tokenResponse = await axios.post(
            'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
            {
                app_id: process.env.LARK_APP_ID,
                app_secret: process.env.LARK_APP_SECRET
            }
        );
        const accessToken = tokenResponse.data.tenant_access_token;

        console.log('=== Fields in 私募盈亏一览表 (tblcK2mWFtgob3Dg) ===\n');
        const fieldsResponse = await axios.get(
            `https://open.feishu.cn/open-apis/bitable/v1/apps/${process.env.LARK_APP_TOKEN}/tables/tblcK2mWFtgob3Dg/fields`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        if (fieldsResponse.data.data.items) {
            fieldsResponse.data.data.items.forEach((field, i) => {
                console.log(`${i + 1}. ${field.field_name} (Type: ${field.type}, UI: ${field.ui_type || 'N/A'})`);
            });
        }

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

listAllFields();
