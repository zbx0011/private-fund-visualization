// 直接同步脚本 - 不通过API
require('dotenv').config()
const { LarkSyncService } = require('../src/lib/lark-sync')

async function directSync() {
    console.log('=== 开始直接同步 ===\n')

    const syncService = new LarkSyncService()

    try {
        const result = await syncService.syncFromBitable({
            appToken: process.env.LARK_APP_TOKEN,
            tables: [
                { id: 'tblcXqDbfgA0x533', type: 'main' }, // 私募取数表
                { id: 'tblcK2mWFtgob3Dg', type: 'main' }, // 私募盈亏一览表 (集中度)
                { id: 'tblXwpq4lQzfymME', type: 'fof' }   // 第一创业FOF
            ]
        })

        console.log('\n=== 同步完成 ===')
        console.log('成功:', result.success)
        console.log('处理记录数:', result.recordsProcessed)
        console.log('更新记录数:', result.recordsUpdated)
        console.log('插入记录数:', result.recordsInserted)

        if (result.errors.length > 0) {
            console.log('\n错误:')
            result.errors.forEach(err => console.log('  -', err))
        }

        if (result.warnings.length > 0) {
            console.log('\n警告:')
            result.warnings.forEach(warn => console.log('  -', warn))
        }

    } catch (error) {
        console.error('\n同步失败:', error)
        process.exit(1)
    }
}

directSync()
