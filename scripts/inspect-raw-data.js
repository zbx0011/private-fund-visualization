require('dotenv').config({ path: '.env' });

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

async function inspectRawData() {
    try {
        const token = await getTenantAccessToken();
        console.log('Got token');

        const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records?page_size=3`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (data.code !== 0) {
            console.error('Error fetching records:', data);
            return;
        }

        console.log('\nSample raw records:');
        data.data.items.forEach((record, i) => {
            console.log(`\nRecord ${i + 1}:`);
            console.log('基金名称:', record.fields['基金名称']);
            console.log('净值日期 (raw):', record.fields['净值日期']);
            console.log('净值日期 (type):', typeof record.fields['净值日期']);
            console.log('虚拟净值:', record.fields['虚拟净值']);

            // Try to parse the date
            const dateValue = record.fields['净值日期'];
            if (typeof dateValue === 'number') {
                const date = new Date(dateValue);
                console.log('Parsed as Date:', date.toISOString());
                console.log('Date only:', date.toISOString().split('T')[0]);
            }
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

inspectRawData();
