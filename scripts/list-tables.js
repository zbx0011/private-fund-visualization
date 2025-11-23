require('dotenv').config({ path: '.env' });
// Standalone script to list tables

const https = require('https');

const APP_TOKEN = 'MKTubHkUKa13gbs9WdNcQNvsn3f'; // From chat_log
const APP_ID = process.env.LARK_APP_ID;
const APP_SECRET = process.env.LARK_APP_SECRET;

console.log('APP_ID:', APP_ID ? 'Set' : 'Not Set');
console.log('APP_SECRET:', APP_SECRET ? 'Set' : 'Not Set');

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
                try {
                    console.log('Token response status:', res.statusCode);
                    if (res.statusCode !== 200) {
                        console.log('Token response body:', data);
                    }
                    const json = JSON.parse(data);
                    if (json.code !== 0) {
                        reject(new Error(`Token Error: ${json.msg}`));
                    } else {
                        resolve(json.tenant_access_token);
                    }
                } catch (e) {
                    console.log('Token parse error body:', data);
                    reject(e);
                }
            });
        });
        req.write(JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET }));
        req.end();
    });
}

async function listTables(token) {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'open.feishu.cn',
            path: `/open-apis/bitable/v1/apps/${APP_TOKEN}/tables`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    console.log('List tables response status:', res.statusCode);
                    if (res.statusCode !== 200) {
                        console.log('List tables response body:', data);
                    }
                    const json = JSON.parse(data);
                    if (json.code !== 0) {
                        reject(new Error(`List Tables Error: ${json.msg}`));
                    } else {
                        resolve(json.data.items);
                    }
                } catch (e) {
                    console.log('List tables parse error body:', data);
                    reject(e);
                }
            });
        });
        req.end();
    });
}

async function main() {
    try {
        if (!APP_ID || !APP_SECRET) {
            console.error('Error: LARK_APP_ID or LARK_APP_SECRET is missing in .env.local');
            return;
        }

        console.log('Getting access token...');
        const token = await getTenantAccessToken();
        console.log('Listing tables...');
        const tables = await listTables(token);
        console.log('\n--- Tables in Base ---');
        tables.forEach(t => {
            console.log(`Name: ${t.name}, ID: ${t.table_id}`);
        });
    } catch (err) {
        console.error('Error:', err);
    }
}

main();
