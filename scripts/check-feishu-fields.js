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

    async getBitableTableFields(appToken, tableId) {
        const token = await this.getTenantAccessToken();
        const res = await axios.get(`https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/fields`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data.data.items;
    }
}

async function run() {
    const client = new SimpleLarkClient(process.env.LARK_APP_ID, process.env.LARK_APP_SECRET);
    const appToken = process.env.LARK_APP_TOKEN;

    console.log('=== 私募取数表 (tblcXqDbfgA0x533) ===');
    const fields1 = await client.getBitableTableFields(appToken, 'tblcXqDbfgA0x533');
    console.table(fields1.filter(f =>
        f.field_name.includes('成本') ||
        f.field_name.includes('规模') ||
        f.field_name.includes('资产') ||
        f.field_name.includes('盈亏') ||
        f.field_name.includes('收益')
    ).map(f => ({ name: f.field_name, id: f.field_id, type: f.type })));

    console.log('\n=== 私募盈亏一览表 (tblcK2mWFtgob3Dg) ===');
    const fields2 = await client.getBitableTableFields(appToken, 'tblcK2mWFtgob3Dg');
    console.table(fields2.map(f => ({ name: f.field_name, id: f.field_id, type: f.type })));
}

run().catch(console.error);
