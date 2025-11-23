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

    async getBitableRecords(appToken, tableId, pageSize = 50) {
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

    // Get names from main table
    const mainRecords = await client.getBitableRecords(appToken, 'tblcXqDbfgA0x533', 50);
    const mainNames = mainRecords.map(r => r.fields['基金名称']).filter(Boolean);

    // Get names from PnL table
    const pnlRecords = await client.getBitableRecords(appToken, 'tblcK2mWFtgob3Dg', 50);
    const pnlNames = pnlRecords.map(r => r.fields['基金名称']).filter(Boolean);

    console.log('=== Main Table Names (first 10) ===');
    console.log(mainNames.slice(0, 10));

    console.log('\n=== PnL Table Names (first 10) ===');
    console.log(pnlNames.slice(0, 10));

    // Check for matches
    const matches = pnlNames.filter(name => mainNames.includes(name));
    console.log(`\n=== Matching Names: ${matches.length} / ${pnlNames.length} ===`);

    // Check for non-matches
    const nonMatches = pnlNames.filter(name => !mainNames.includes(name));
    if (nonMatches.length > 0) {
        console.log('\n=== Non-matching names in PnL table (first 10) ===');
        console.log(nonMatches.slice(0, 10));
    }
}

run().catch(console.error);
