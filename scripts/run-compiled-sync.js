require('dotenv').config();
const { LarkSyncService } = require('../dist/lib/lark-sync');

async function syncData() {
    try {
        const sync = new LarkSyncService();
        const appToken = process.env.LARK_APP_TOKEN;

        if (!appToken) {
            console.error('❌ 请在.env文件中设置LARK_APP_TOKEN');
            process.exit(1);
        }

        console.log('开始同步飞书数据...');

        const result = await sync.syncFromBitable({
            appToken,
            tables: [
                { id: 'tblcXqDbfgA0x533', type: 'main' }, // 私募取数表
                { id: 'tblcK2mWFtgob3Dg', type: 'main' }, // 私募盈亏一览表
            ]
        });

        console.log('\n同步结果:');
        console.log('- 成功:', result.success);
        console.log('- 处理记录:', result.recordsProcessed);
        console.log('- 更新记录:', result.recordsUpdated);
        console.log('- 插入记录:', result.recordsInserted);

        if (result.errors.length > 0) {
            console.log('\n❌ 错误:');
            result.errors.forEach(err => console.log('  -', err));
        }

    } catch (error) {
        console.error('同步失败:', error);
        process.exit(1);
    }
}

syncData();
