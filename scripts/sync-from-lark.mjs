require('dotenv').config();
const path = require('path');

// 动态导入 ESM 模块
async function runSync() {
    try {
        // 使用动态 import 来加载 TypeScript/ESM 模块
        const { LarkSyncService } = await import(path.join(process.cwd(), 'src', 'lib', 'lark-sync.ts'));

        const sync = new LarkSyncService();
        const appToken = process.env.LARK_APP_TOKEN;

        if (!appToken) {
            console.error('❌ LARK_APP_TOKEN 未在.env中设置');
            process.exit(1);
        }

        console.log('🔄 开始从飞书同步数据...');
        console.log('📋 App Token:', appToken.substring(0, 10) + '...');

        const result = await sync.syncFromBitable({
            appToken,
            tables: [
                { id: 'tblcXqDbfgA0x533', type: 'main' }, // 私募取数表
            ]
        });

        console.log('\n✅ 同步完成!');
        console.log('📊 统计:');
        console.log(`  - 处理记录: ${result.recordsProcessed}`);
        console.log(`  - 更新记录: ${result.recordsUpdated}`);
        console.log(`  - 插入记录: ${result.recordsInserted}`);

        if (result.errors.length > 0) {
            console.log('\n❌ 错误:');
            result.errors.forEach(err => console.log(`  - ${err}`));
        }

        if (result.warnings.length > 0) {
            console.log('\n⚠️  警告:');
            result.warnings.forEach(warn => console.log(`  - ${warn}`));
        }

        process.exit(result.success ? 0 : 1);

    } catch (error) {
        console.error('❌ 同步失败:', error.message);
        console.error(error);
        process.exit(1);
    }
}

runSync();
