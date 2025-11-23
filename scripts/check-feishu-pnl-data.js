require('dotenv').config({ path: '.env' });
const axios = require('axios');

class SimpleLarkClient {
    constructor(appId, appSecret) {
        this.appId = appId;
        this.appSecret = appSecret;
    }

    async getTenantAccessToken() {
        const res = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
            app_id: this.appId,
            app_secret: this.appSecret
        });
        return res.data.tenant_access_token;
    }

    async getBitableRecords(appToken, tableId, pageSize = 10) {
        const token = await this.getTenantAccessToken();
        const res = await axios.get(`https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { page_size: pageSize }
        });
        return res.data.data.items;
    }
}

async function run() {
    const client = new SimpleLarkClient(process.env.LARK_APP_ID, process.env.LARK_APP_SECRET);
    const appToken = process.env.LARK_APP_TOKEN;
    const tableId = 'tblcK2mWFtgob3Dg'; // 私募盈亏一览表

    const records = await client.getBitableRecords(appToken, tableId, 5);

    console.log('=== 私募盈亏一览表 Sample Records ===');
    records.forEach((r, i) => {
        console.log(`\nRecord ${i + 1}:`);
        console.log('基金名称:', r.fields['基金名称']);
        console.log('本日盈亏:', r.fields['本日盈亏']);
        console.log('本周收益:', r.fields['本周收益']);
        console.log('本年收益:', r.fields['本年收益']);
        console.log('日均资金占用:', r.fields['日均资金占用']);
    });
}

run().catch(console.error);
