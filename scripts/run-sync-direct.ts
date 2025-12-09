import { LarkSyncService } from '../src/lib/lark-sync';
import { getDatabase } from '../src/lib/database-server';
import { config } from 'dotenv';
config();

async function main() {
    console.log('Starting direct sync...');
    const db = getDatabase();

    // Check before
    const countBefore = await new Promise<number>((resolve) => {
        (db as any).db.get('SELECT count(*) as c FROM fund_nav_history', (err: any, row: any) => resolve(row ? row.c : 0));
    });
    console.log('Records before sync:', countBefore);

    const service = new LarkSyncService();
    try {
        const config = {
            appToken: process.env.LARK_APP_TOKEN!,
            tables: [
                { id: 'tblcXqDbfgA0x533', type: 'main' as const }, // 私募取数表
                { id: 'tblXwpq4lQzfymME', type: 'fof' as const },  // 第一创业FOF表
                { id: 'tblcK2mWFtgob3Dg', type: 'main' as const }  // 私募盈亏一览表
            ]
        };
        const result = await service.syncFromBitable(config);
        console.log('Sync result:', JSON.stringify(result, null, 2));

        // Check after
        const countAfter = await new Promise<number>((resolve) => {
            (db as any).db.get('SELECT count(*) as c FROM fund_nav_history', (err: any, row: any) => resolve(row ? row.c : 0));
        });
        console.log('Records after sync:', countAfter);

        // Check Pingfang
        const pingfang = await new Promise<any[]>((resolve) => {
            (db as any).db.all("SELECT * FROM fund_nav_history WHERE fund_id LIKE '%平方和衡盛36号%' AND nav_date >= '2025-01-01'", (err: any, rows: any[]) => resolve(rows || []));
        });
        console.log('Pingfang 2025 data:', pingfang);

    } catch (error) {
        console.error('Sync failed:', error);
    }
}

main();
