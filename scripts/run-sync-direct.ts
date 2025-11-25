
import { LarkSyncService } from '../src/lib/lark-sync';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file in root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function runSync() {
    const appId = process.env.LARK_APP_ID;
    const appSecret = process.env.LARK_APP_SECRET;
    const appToken = process.env.LARK_APP_TOKEN;

    if (!appId || !appSecret || !appToken) {
        console.error('Missing configuration in .env file');
        process.exit(1);
    }

    console.log('Starting sync with config:', { appId, appToken });

    const service = new LarkSyncService(appId, appSecret);

    try {
        const result = await service.syncFromBitable({
            appToken,
            autoDetectTable: true
        });

        console.log('Sync result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Sync failed:', error);
    }
}

runSync();
