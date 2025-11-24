const schedule = require('node-schedule');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const APP_ID = process.env.LARK_APP_ID;
const APP_SECRET = process.env.LARK_APP_SECRET;
const APP_TOKEN = process.env.LARK_APP_TOKEN;
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

if (!APP_ID || !APP_SECRET || !APP_TOKEN) {
    console.error('❌ 缺少必要的环境变量: LARK_APP_ID, LARK_APP_SECRET, LARK_APP_TOKEN');
    process.exit(1);
}

console.log('🚀 飞书数据同步调度服务已启动');
console.log('⏰ 计划任务: 每个工作日 (周一至周五) 中午 12:00 执行同步');

// Cron expression: 0 12 * * 1-5 (At 12:00 on every day-of-week from Monday through Friday)
const job = schedule.scheduleJob('0 12 * * 1-5', async function () {
    console.log(`\n[${new Date().toISOString()}] ⏰ 触发定时同步任务...`);

    try {
        const response = await fetch(`${API_URL}/api/lark-sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                appId: APP_ID,
                appSecret: APP_SECRET,
                appToken: APP_TOKEN,
                autoDetectTable: true
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log(`[${new Date().toISOString()}] ✅ 同步成功!`);
            console.log(`   - 处理记录: ${result.result.recordsProcessed}`);
            console.log(`   - 更新记录: ${result.result.recordsUpdated}`);
            console.log(`   - 插入记录: ${result.result.recordsInserted}`);
        } else {
            console.error(`[${new Date().toISOString()}] ❌ 同步失败:`, result.error);
        }

    } catch (error) {
        console.error(`[${new Date().toISOString()}] ❌ 请求失败:`, error.message);
    }
});

// Keep the process alive
process.on('SIGINT', function () {
    console.log('\n🛑 停止调度服务');
    schedule.gracefulShutdown()
        .then(() => process.exit(0));
});
