require('dotenv').config();
const axios = require('axios');

async function checkT0Strategy() {
    try {
        // 获取访问令牌
        const tokenResponse = await axios.post(
            'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
            {
                app_id: process.env.LARK_APP_ID,
                app_secret: process.env.LARK_APP_SECRET
            }
        );

        const accessToken = tokenResponse.data.tenant_access_token;

        // 获取记录，查找T0策略的产品
        const recordsResponse = await axios.post(
            `https://open.feishu.cn/open-apis/bitable/v1/apps/${process.env.LARK_APP_TOKEN}/tables/tblcXqDbfgA0x533/records/search`,
            {
                filter: {
                    conditions: [{
                        field_name: '策略类型',
                        operator: 'is',
                        value: ['T0']
                    }]
                },
                page_size: 10
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('T0策略的记录:');
        console.log(`找到 ${recordsResponse.data.data.items.length} 条记录`);

        if (recordsResponse.data.data.items.length > 0) {
            const firstRecord = recordsResponse.data.data.items[0];
            console.log('\n第一条记录:');
            console.log('基金名称:', firstRecord.fields['基金名称']);
            console.log('策略字段原始值:', JSON.stringify(firstRecord.fields['策略']));
            console.log('策略类型字段:', firstRecord.fields['策略类型']);
        }

    } catch (error) {
        console.error('错误:', error.response?.data || error.message);
    }
}

checkT0Strategy();
