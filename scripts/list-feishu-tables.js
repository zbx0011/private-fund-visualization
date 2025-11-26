
import { config } from 'dotenv';
config({ path: '.env' });
import { LarkBitableAPI } from '../src/lib/lark-api';

async function listTables() {
    const appId = process.env.LARK_APP_ID;
    const appSecret = process.env.LARK_APP_SECRET;
    const appToken = process.env.LARK_APP_TOKEN;

    if (!appId || !appSecret || !appToken) {
        console.error('Missing env vars');
        return;
    }

    const client = new LarkBitableAPI({ appId, appSecret });

    try {
        const tables = await client.getBitableTables(appToken);
        console.log('Tables:');
        tables.forEach(t => {
            console.log(`${t.table_id}: ${t.name}`);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

listTables();
