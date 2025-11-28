import { LarkSyncService } from '../src/lib/lark-sync';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function run() {
    console.log('Starting direct sync...');
    const appToken = process.env.LARK_APP_TOKEN;
    if (!appToken) {
        console.error('No LARK_APP_TOKEN found');
        process.exit(1);
    }

    const service = new LarkSyncService();
    const result = await service.syncFromBitable({
        appToken: appToken,
        tables: [{ id: 'tblcXqDbfgA0x533', type: 'main' }]
    });

    console.log('Sync result:', result);
}

run().catch(console.error);
