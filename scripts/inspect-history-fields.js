require('dotenv').config({ path: '.env' });
// const { LarkBitableAPI } = require('../src/lib/lark-api');

// Mock LarkBitableAPI if not available in JS context (since it's TS)
// Actually I can't easily require TS files in JS script without compilation.
// So I will use direct fetch or just write a simple JS version of the API call.

const APP_TOKEN = process.env.LARK_APP_TOKEN || 'S40Edb9GKoWl7UxR8VncwJ3mnWc';
const APP_ID = process.env.LARK_APP_ID;
const APP_SECRET = process.env.LARK_APP_SECRET;
const TABLE_ID = 'tblcXqDbfgA0x533';

async function getTenantAccessToken() {
    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "app_id": APP_ID,
            "app_secret": APP_SECRET
        })
    });
    const data = await response.json();
    return data.tenant_access_token;
}

async function inspectFields() {
    try {
        const token = await getTenantAccessToken();
        console.log('Got token');

        const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/fields`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (data.code !== 0) {
            console.error('Error fetching fields:', data);
            return;
        }

        console.log('Fields for table', TABLE_ID);
        data.data.items.forEach(field => {
            console.log(`${field.field_name} (${field.type})`);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

inspectFields();
