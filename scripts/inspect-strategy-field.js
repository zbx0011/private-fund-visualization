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

async function inspectRecord() {
    try {
        const appId = process.env.LARK_APP_ID;
        const appSecret = process.env.LARK_APP_SECRET;
        const appToken = process.env.LARK_APP_TOKEN;
        const tableId = 'tblcXqDbfgA0x533'; // 私募取数表

        console.log('获取访问令牌...');
        const accessToken = await getLarkAccessToken(appId, appSecret);

        console.log('获取表格记录...');
        const records = await getBitableRecords(accessToken, appToken, tableId);

        // 查找"世纪前沿量化优选18号"
        const targetRecord = records.find(r => r.fields['基金名称'] === '世纪前沿量化优选18号');

        if (targetRecord) {
            console.log('\n找到目标记录:');
            console.log('基金名称:', targetRecord.fields['基金名称']);
            console.log('\n投资策略原始数据:', JSON.stringify(targetRecord.fields['投资策略'], null, 2));
            console.log('\n策略类型原始数据:', JSON.stringify(targetRecord.fields['策略类型'], null, 2));
            console.log('\n策略原始数据:', JSON.stringify(targetRecord.fields['策略'], null, 2));
        } else {
            console.log('未找到目标记录');
            console.log('可用的基金名称 (前5个):');
            records.slice(0, 5).forEach(r => {
                console.log('- ', r.fields['基金名称']);
            });
        }

        // 获取字段信息
        console.log('\n\n获取字段定义...');
        const fields = await getBitableFields(accessToken, appToken, tableId);
        const strategyFields = fields.filter(f =>
            f.field_name.includes('策略') || f.field_name.includes('投资')
        );

        console.log('\n策略相关字段:');
        strategyFields.forEach(field => {
            console.log(`\n字段名: ${field.field_name}`);
            console.log(`类型: ${field.type}`);
            console.log(`UI类型: ${field.ui_type || 'N/A'}`);
            if (field.property?.options) {
                console.log('选项:');
                field.property.options.forEach(opt => {
                    console.log(`  - ID: ${opt.id || opt.option_id}, Name: ${opt.name}`);
                });
            }
        });
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

inspectRecord();
