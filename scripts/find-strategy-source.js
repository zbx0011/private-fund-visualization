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

async function getBitableFields(accessToken, appToken, tableId) {
    const response = await axios.get(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/fields`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }
    );
    return response.data.data.items;
}

async function inspectStrategyField() {
    try {
        const appId = process.env.LARK_APP_ID;
        const appSecret = process.env.LARK_APP_SECRET;
        const appToken = process.env.LARK_APP_TOKEN;

        console.log('获取访问令牌...');
        const accessToken = await getLarkAccessToken(appId, appSecret);

        // 查询所有相关表格的策略字段
        const tables = [
            { id: 'tblcXqDbfgA0x533', name: '私募取数表' },
            { id: 'tblXwpq4lQzfymME', name: '第一创业FOF' },
            // 我们需要找到策略字段的源表
        ];

        console.log('\n查询各表格的字段定义...\n');

        for (const table of tables) {
            console.log(`\n=== ${table.name} (${table.id}) ===`);
            const fields = await getBitableFields(accessToken, appToken, table.id);

            const strategyField = fields.find(f => f.field_name === '策略' || f.field_name === '策略类型' || f.field_name === '投资策略');

            if (strategyField) {
                console.log(`字段名: ${strategyField.field_name}`);
                console.log(`字段ID: ${strategyField.field_id}`);
                console.log(`类型: ${strategyField.type}`);
                console.log(`UI类型: ${strategyField.ui_type || 'N/A'}`);

                if (strategyField.type === 19) {
                    // Lookup field
                    console.log('这是一个查找字段 (Lookup)');
                    console.log('属性:', JSON.stringify(strategyField.property, null, 2));
                } else if (strategyField.property?.options) {
                    console.log('\n选项列表:');
                    strategyField.property.options.forEach(opt => {
                        console.log(`  - ID: ${opt.id || opt.option_id}, Name: ${opt.name}`);
                    });
                }
            }
        }

        // 检查其他可能的表格
        console.log('\n\n查询所有表格列表...');
        const tablesResponse = await axios.get(
            `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        console.log('\n所有表格:');
        tablesResponse.data.data.items.forEach(t => {
            console.log(`  - ${t.name} (${t.table_id})`);
        });

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

inspectStrategyField();
