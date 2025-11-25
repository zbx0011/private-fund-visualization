import dotenv from 'dotenv';
import { LarkBitableAPI } from './src/lib/lark-api';

dotenv.config();

async function checkFields() {
    const api = new LarkBitableAPI({
        appId: process.env.LARK_APP_ID,
        appSecret: process.env.LARK_APP_SECRET
    });

    const appToken = process.env.LARK_APP_TOKEN;
    const tableId = 'tblcXqDbfgA0x533'; // 私募取数表

    console.log(`Checking fields for table ${tableId}...`);
    const fields = await api.getBitableFields(appToken, tableId);

    fields.forEach(field => {
        if (field.field_name.includes('经理')) {
            console.log('Found Manager Field:', JSON.stringify(field, null, 2));
        }
    });
}

checkFields().catch(console.error);
