require('dotenv').config({ path: '.env' });
const https = require('https');

const APP_TOKEN = 'MKTubHkUKa13gbs9WdNcQNvsn3f';
const APP_ID = process.env.LARK_APP_ID;
const APP_SECRET = process.env.LARK_APP_SECRET;

// Table IDs provided by user
const TABLES = {
    '私募盈亏一览表': 'tblcK2mWFtgob3Dg',
    '私募取数表': 'tblcXqDbfgA0x533',
    '私募其他字段原始数据': 'tblS9iESdy9PTdJj',
    '第一创业FOF': 'tblXwpq4lQzfymME'
};

async function getTenantAccessToken() {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'open.feishu.cn',
            path: '/open-apis/auth/v3/tenant_access_token/internal',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const json = JSON.parse(data);
                if (json.code !== 0) reject(new Error(json.msg));
                else resolve(json.tenant_access_token);
            });
        });
        req.write(JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET }));
        req.end();
    });
}

async function getTableFields(token, tableId) {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'open.feishu.cn',
            path: `/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${tableId}/fields`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const json = JSON.parse(data);
                if (json.code !== 0) reject(new Error(json.msg));
                else resolve(json.data.items);
            });
        });
        req.end();
    });
}

async function main() {
    try {
        const token = await getTenantAccessToken();

        for (const [name, id] of Object.entries(TABLES)) {
            console.log(`\n--- Inspecting ${name} (${id}) ---`);
            try {
                const fields = await getTableFields(token, id);
                fields.forEach(f => {
                    console.log(`Field: ${f.field_name} (Type: ${f.type})`);
                });
            } catch (e) {
                console.error(`Error inspecting ${name}:`, e.message);
            }
        }
    } catch (err) {
        console.error('Main Error:', err);
    }
}

main();
