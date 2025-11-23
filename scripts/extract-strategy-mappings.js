require('dotenv').config();
const axios = require('axios');

async function getLarkAccessToken(appId, appSecret) {
    const response = await axios.post(
        'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
        {
            app_id: appId,
            app_secret: appSecret
        }
    );
    return response.data.tenant_access_token;
}

async function getBitableRecords(accessToken, appToken, tableId) {
    const response = await axios.get(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            params: {
                page_size: 500
            }
        }
    );
    return response.data.data.items;
}

async function extractStrategyMappings() {
    try {
        const appId = process.env.LARK_APP_ID;
        const appSecret = process.env.LARK_APP_SECRET;
        const appToken = process.env.LARK_APP_TOKEN;
        const tableId = 'tblcXqDbfgA0x533'; // 私募取数表

        console.log('获取访问令牌...');
        const accessToken = await getLarkAccessToken(appId, appSecret);

        console.log('获取表格记录...');
        const records = await getBitableRecords(accessToken, appToken, tableId);

        // 提取所有策略选项ID及对应的产品名称
        const strategyMap = new Map();

        records.forEach(record => {
            const fundName = record.fields['基金名称'];
            const strategy = record.fields['策略'];
            const strategyType = record.fields['策略类型'];

            if (strategy && Array.isArray(strategy) && strategy.length > 0) {
                const optionId = strategy[0];
                if (!strategyMap.has(optionId)) {
                    strategyMap.set(optionId, []);
                }
                strategyMap.get(optionId).push(fundName);
            }
        });

        console.log('\n策略选项ID映射 (基于实际数据):');
        console.log('=====================================\n');

        for (const [optionId, funds] of strategyMap.entries()) {
            console.log(`选项ID: ${optionId}`);
            console.log(`产品数量: ${funds.length}`);
            console.log(`示例产品:`);
            funds.slice(0, 3).forEach(name => console.log(`  - ${name}`));
            console.log('');
        }

        // 现在让我们看看用户提供的截图中的产品，并从中推断
        console.log('=====================================');
        console.log('根据用户截图中的信息:');
        console.log('- 世纪前沿量化优选18号 -> 指增');

        const targetRecord = records.find(r => r.fields['基金名称'] === '世纪前沿量化优选18号');
        if (targetRecord) {
            const optionId = targetRecord.fields['策略'][0];
            console.log(`\n该产品的策略选项ID是: ${optionId}`);
            console.log(`因此，${optionId} 应该映射为 "指增"`);

            console.log('\n\n使用相同选项ID的其他产品:');
            strategyMap.get(optionId).forEach(name => {
                console.log(`  - ${name}`);
            });
        }

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

extractStrategyMappings();
