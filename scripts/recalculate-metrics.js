require('dotenv').config()
const { LarkSyncService } = require('../src/lib/lark-sync')

async function recalculateMetrics() {
    console.log('=== 重新计算基金指标 ===\n')

    const syncService = new LarkSyncService()

    try {
        // Call calculateFundMetrics to recalculate all fund metrics
        const result = await syncService.calculateFundMetrics()

        console.log('\n=== 计算完成 ===')
        console.log('更新基金数:', result.fundsUpdated)

    } catch (error) {
        console.error('\n计算失败:', error)
        process.exit(1)
    }
}

recalculateMetrics()
