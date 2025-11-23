require('dotenv').config();
const axios = require('axios');

async function findT0OptionId() {
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

        // 获取所有记录
        const recordsResponse = await axios.post(
            `https://open.feishu.cn/open-apis/bitable/v1/apps/${process.env.LARK_APP_TOKEN}/tables/tblcXqDbfgA0x533/records/search`,
            {
                page_size: 500
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // 统计策略选项ID
        const strategyMap = new Map();

        recordsResponse.data.data.items.forEach(record => {
            const strategy = record.fields['策略'];
            if (strategy && Array.isArray(strategy) && strategy.length > 0) {
                const optionId = strategy[0];
                if (!strategyMap.has(optionId)) {
                    strategyMap.set(optionId, []);
                }
                strategyMap.get(optionId).push(record.fields['基金名称']);
            }
        });

        console.log('策略选项ID映射:');
        strategyMap.forEach((funds, optionId) => {
            console.log(`\n${optionId}: ${funds.length}个产品`);
            console.log('  示例产品:', funds.slice(0, 3).join(', '));
        });

        // 特别查找包含"序皇"的产品
        console.log('\n\n查找T0产品(序皇分形2号):');
        const t0Fund = recordsResponse.data.data.items.find(r =>
            r.fields['基金名称'] && r.fields['基金名称'].includes('序皇')
        );
        if (t0Fund) {
            console.log('基金名称:', t0Fund.fields['基金名称']);
            console.log('策略选项ID:', t0Fund.fields['策略']);
        }

    } catch (error) {
        console.error('错误:', error.response?.data || error.message);
    }
}

findT0OptionId();
