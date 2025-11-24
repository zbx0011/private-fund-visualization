const schedule = require('node-schedule');
const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const APP_ID = process.env.LARK_APP_ID;
const APP_SECRET = process.env.LARK_APP_SECRET;
const APP_TOKEN = process.env.LARK_APP_TOKEN;
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const QYYJT_USERNAME = process.env.QYYJT_USERNAME;
const QYYJT_PASSWORD = process.env.QYYJT_PASSWORD;
const QYYJT_URL = 'https://www.qyyjt.cn/combination/20250603164207';

if (!APP_ID || !APP_SECRET || !APP_TOKEN) {
    console.error('❌ 缺少必要的环境变量: LARK_APP_ID, LARK_APP_SECRET, LARK_APP_TOKEN');
    process.exit(1);
}

if (!QYYJT_USERNAME || !QYYJT_PASSWORD) {
    console.error('❌ 缺少必要的环境变量: QYYJT_USERNAME, QYYJT_PASSWORD');
    process.exit(1);
}

console.log('🚀 飞书数据同步调度服务已启动');
console.log('⏰ 计划任务:');
console.log('   - 每个工作日 12:00 同步飞书数据');
console.log('   - 每个工作日 12:30 抓取外部监控信息\n');

// Task 1: Lark Data Sync - Every weekday at 12:00
const larkSyncJob = schedule.scheduleJob('0 12 * * 1-5', async function () {
    console.log(`\n[${new Date().toISOString()}] ⏰ 触发飞书数据同步任务...`);

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
            console.log(`[${new Date().toISOString()}] ✅ 飞书同步成功!`);
            console.log(`   - 处理记录: ${result.result.recordsProcessed}`);
            console.log(`   - 更新记录: ${result.result.recordsUpdated}`);
            console.log(`   - 插入记录: ${result.result.recordsInserted}`);
        } else {
            console.error(`[${new Date().toISOString()}] ❌ 飞书同步失败:`, result.error);
        }

    } catch (error) {
        console.error(`[${new Date().toISOString()}] ❌ 飞书同步请求失败:`, error.message);
    }
});

// Task 2: External Monitor Scraper - Every weekday at 12:30
const monitorScrapeJob = schedule.scheduleJob('30 12 * * 1-5', async function () {
    console.log(`\n[${new Date().toISOString()}] ⏰ 触发外部监控爬虫任务...`);

    try {
        const scraper = spawn('node', [
            path.join(__dirname, 'scrape-qyyjt-with-login.js'),
            QYYJT_URL,
            QYYJT_USERNAME,
            QYYJT_PASSWORD
        ], {
            cwd: path.join(__dirname, '..'),
            env: { ...process.env }
        });

        let output = '';
        let errorOutput = '';

        scraper.stdout.on('data', (data) => {
            output += data.toString();
            console.log(data.toString().trim());
        });

        scraper.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.error(data.toString().trim());
        });

        scraper.on('close', (code) => {
            if (code === 0) {
                console.log(`[${new Date().toISOString()}] ✅ 外部监控爬虫执行成功!`);
            } else {
                console.error(`[${new Date().toISOString()}] ❌ 外部监控爬虫执行失败 (退出码: ${code})`);
            }
        });

    } catch (error) {
        console.error(`[${new Date().toISOString()}] ❌ 外部监控爬虫启动失败:`, error.message);
    }
});

// Keep the process alive
process.on('SIGINT', function () {
    console.log('\n🛑 停止调度服务');
    schedule.gracefulShutdown()
        .then(() => process.exit(0));
});

