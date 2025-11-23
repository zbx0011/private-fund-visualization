require('dotenv').config();
const axios = require('axios');

async function syncDataViaCurl() {
    const appId = process.env.LARK_APP_ID;
    const appSecret = process.env.LARK_APP_SECRET;
    const appToken = process.env.LARK_APP_TOKEN;

    if (!appId || !appSecret || !appToken) {
        console.error('❌ 缺少环境变量: LARK_APP_ID, LARK_APP_SECRET, LARK_APP_TOKEN');
        process.exit(1);
    }

    console.log('🔄 通过API触发数据同步...\n');

    try {
        const response = await axios.post('http://localhost:3000/api/lark-sync', {
            appId,
            appSecret,
            appToken
        });

        console.log('✅ 同步完成!');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('❌ 同步失败:', error.response?.data || error.message);
        process.exit(1);
    }
}

syncDataViaCurl();
