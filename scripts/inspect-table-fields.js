require('dotenv').config({ path: '.env' });
// const { LarkClient } = require('./src/lib/lark-api-client');

async function inspectTable() {
    const client = new LarkClient(process.env.LARK_APP_ID, process.env.LARK_APP_SECRET);
    const appToken = process.env.LARK_APP_TOKEN;
    const tableId = 'tblcK2mWFtgob3Dg'; // 私募盈亏一览表

    try {
        console.log(`Inspecting table: ${tableId}`);
        const fields = await client.getBitableTableFields(appToken, tableId);
        console.log('Fields:');
        fields.forEach(f => {
            console.log(`${f.field_name} (${f.type}): ${f.field_id}`);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

// Mock LarkClient for script usage since the original is in TS and might have dependencies
// Actually, I should try to use the existing LarkClient if possible, but it's in TS.
// Let's write a minimal client here to avoid TS compilation issues.

const axios = require('axios');

class SimpleLarkClient {
    constructor(appId, appSecret) {
        this.appId = appId;
        this.appSecret = appSecret;
        this.tenantAccessToken = null;
    }

    async getTenantAccessToken() {
        console.log('App ID:', this.appId ? 'Set' : 'Missing');
        console.log('App Secret:', this.appSecret ? 'Set' : 'Missing');
        try {
            const res = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
                app_id: this.appId,
                app_secret: this.appSecret
            });
            console.log('Token received:', res.data.tenant_access_token ? 'Yes' : 'No');
            if (!res.data.tenant_access_token) {
                console.error('Token response:', res.data);
            }
            return res.data.tenant_access_token;
        } catch (e) {
            console.error('Token error:', e.response ? e.response.data : e.message);
            throw e;
        }
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
    const tableId = 'tblcK2mWFtgob3Dg';

    try {
        const fields = await client.getBitableTableFields(appToken, tableId);
        console.table(fields.map(f => ({ name: f.field_name, id: f.field_id, type: f.type })));
    } catch (e) {
        console.error(e.response ? e.response.data : e.message);
    }
}

run();
